function sendValidationError(res, error) {
  return res.status(400).json({
    message: 'Validation failed',
    errors: error.flatten(),
  });
}

function sendWriteError(res, error, duplicateMessage) {
  if (error && error.code === 11000) {
    return res.status(409).json({ message: duplicateMessage });
  }
  if (error && error.statusCode === 400) {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: 'Database request failed' });
}

module.exports = {
  sendValidationError,
  sendWriteError,
};
