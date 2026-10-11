const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { chatMatch } = require('../controllers/aiController');

const router = express.Router();

router.use(authMiddleware);
router.post('/chat-match', chatMatch);

module.exports = router;
