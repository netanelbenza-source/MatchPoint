const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { getMatches, contactMatchmaker } = require('../controllers/matchController');

const router = express.Router();

router.use(authMiddleware);
router.get('/', getMatches);
router.post('/:candidateId/contact-matchmaker', contactMatchmaker);

module.exports = router;
