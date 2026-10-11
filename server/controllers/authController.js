const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../validations/authValidation');
const { normalizeRole } = require('../validations/userValidation');
const { insertUser, getUserById, getUserByEmailWithPassword, updateUser } = require('../repositories/userRepo');
const { getMatchmakerByEmail } = require('../repositories/matchmakerRepo');
const { sendValidationError, sendWriteError } = require('./errors');

const SALT_ROUNDS = 10;

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
    const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
    const user = await insertUser({
      email: parsed.data.email,
      passwordHash,
      role: 'user',
      status: 'active',
    });

    const account = await promoteMatchmaker(user);
    delete account.passwordHash;
    return res.status(201).json(account);
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

module.exports = {
  register,
  login,
  refresh,
  promoteMatchmaker,
  signToken,
};
