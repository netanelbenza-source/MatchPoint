const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validations/authValidation');
const { normalizeRole } = require('../validations/userValidation');
const { insertUser, getUserById, getUserByEmail, getUserByEmailWithPassword, updateUser, setPasswordReset, resetPasswordWithToken } = require('../repositories/userRepo');
const { replacePendingUser, claimPendingUser, claimPendingUserByCode, deletePendingUser } = require('../repositories/pendingUserRepo');
const { getMatchmakerByEmail } = require('../repositories/matchmakerRepo');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/mailService');
const { sendValidationError, sendWriteError } = require('./errors');

const SALT_ROUNDS = 10;
const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function promoteMatchmaker(user) {
  if (!user || user.role !== 'user') return user;
  const matchmaker = await getMatchmakerByEmail(user.email);
  if (!matchmaker) return user;
  const updated = await updateUser(user._id, { role: 'matchmaker' });
  return updated || { ...user, role: 'matchmaker' };
}

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    const error = new Error('Authentication is not configured');
    error.statusCode = 500;
    throw error;
  }
  return jwt.sign(
    { userId: String(user._id), role: normalizeRole(user.role) },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const existing = await getUserByEmail(parsed.data.email);
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationCode = String(crypto.randomInt(100000, 1000000));
    const pending = await replacePendingUser({
      email: parsed.data.email,
      passwordHash,
      role: 'user',
      status: 'active',
      verificationToken,
      verificationCode,
    });

    try {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      await sendVerificationEmail({
        to: pending.email,
        code: verificationCode,
        verifyUrl: `${clientUrl}/verify-email/${verificationToken}`,
      });
    } catch (error) {
      await deletePendingUser(pending._id);
      throw error;
    }

    return res.status(201).json({ message: 'Verification email sent' });
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const user = await getUserByEmailWithPassword(parsed.data.email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const account = await promoteMatchmaker(user);
    const token = signToken(account);
    return res.status(200).json({ token });
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Login failed' });
  }
}

async function refresh(req, res) {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(401).json({ message: 'Authentication required' });
    const account = await promoteMatchmaker(user);
    return res.status(200).json({ token: signToken(account) });
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Login failed' });
  }
}

async function forgotPassword(req, res) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const message = 'אם יש חשבון עם האימייל הזה, נשלח קישור לאיפוס הסיסמה.';
  try {
    const user = await getUserByEmail(parsed.data.email);
    if (!user || user.status !== 'active') {
      return res.status(200).json({ message });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await setPasswordReset(user._id, hashToken(token), new Date(Date.now() + RESET_TTL_MS));
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: `${clientUrl}/reset-password/${token}`,
    });
    return res.status(200).json({ message });
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Password reset failed' });
  }
}

async function resetPassword(req, res) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
    const updated = await resetPasswordWithToken(hashToken(parsed.data.token), passwordHash);
    if (!updated) {
      return res.status(400).json({ message: 'הקישור לא תקין או שפג תוקפו.' });
    }
    return res.status(200).json({ message: 'הסיסמה עודכנה. אפשר להתחבר.' });
  } catch (error) {
    return sendWriteError(res, error, 'Password reset failed');
  }
}

async function verifyEmail(req, res) {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const pending = parsed.data.token
      ? await claimPendingUser(parsed.data.token)
      : await claimPendingUserByCode(parsed.data.email, parsed.data.code);
    if (!pending) {
      return res.status(400).json({ message: 'הקוד או הקישור לא תקינים.' });
    }

    const snapshot = { ...pending };
    delete snapshot.verificationToken;
    delete snapshot.verificationCode;
    delete snapshot.createdAt;
    delete snapshot._id;

    try {
      await insertUser(snapshot);
    } catch (error) {
      await replacePendingUser(pending);
      throw error;
    }

    return res.status(200).json({ message: 'Your email has been verified!' });
  } catch (error) {
    return sendWriteError(res, error, 'Verification failed');
  }
}

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  verifyEmail,
  promoteMatchmaker,
  signToken,
};
