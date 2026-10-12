const express = require('express');
const { register, login, refresh, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', authMiddleware, refresh);

module.exports = router;
