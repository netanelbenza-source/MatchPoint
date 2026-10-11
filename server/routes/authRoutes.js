const express = require('express');
const { register, login, refresh } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', authMiddleware, refresh);

module.exports = router;
