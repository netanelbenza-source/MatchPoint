function isOwnerOrAdmin(req, targetUserId) {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  return String(req.user.userId) === String(targetUserId);
}

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
}

module.exports = {
  adminMiddleware,
  isOwnerOrAdmin,
};
