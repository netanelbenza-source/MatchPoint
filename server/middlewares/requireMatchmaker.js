function requireMatchmaker(req, res, next) {
  if (!req.user || req.user.role !== 'matchmaker') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
}

module.exports = {
  requireMatchmaker,
};
