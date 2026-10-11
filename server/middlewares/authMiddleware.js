const jwt = require('jsonwebtoken');
const { normalizeRole } = require('../validations/userValidation');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Authentication is not configured' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.userId) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = {
      id: payload.userId,
      userId: payload.userId,
      role: normalizeRole(payload.role),
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = {
  authMiddleware,
};
