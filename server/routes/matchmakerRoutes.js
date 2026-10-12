const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  createMatchmaker,
  getMatchmakers,
  getMatchmaker,
  updateMatchmaker,
  deleteMatchmaker,
  getTopMatchmaker,
  getTopMatchmakerBySuccess,
  resetSuccess,
  recordSuccess,
} = require('../controllers/matchmakerController');

const router = express.Router();

router.get('/top', getTopMatchmakerBySuccess);
router.post('/reset-success', resetSuccess);
router.use(authMiddleware);
router.post('/', createMatchmaker);
router.get('/', getMatchmakers);
router.get('/top-weekly', getTopMatchmaker);
router.post('/:id/success', recordSuccess);
router.get('/:id', getMatchmaker);
router.put('/:id', updateMatchmaker);
router.delete('/:id', deleteMatchmaker);

module.exports = router;
