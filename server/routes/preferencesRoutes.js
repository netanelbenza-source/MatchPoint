const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  createPreferences,
  getPreferences,
  getPreferencesByUser,
  updatePreferences,
  deletePreferences,
} = require('../controllers/preferencesController');

const router = express.Router();

router.use(authMiddleware);
router.post('/', createPreferences);
router.get('/user/:userId', getPreferencesByUser);
router.get('/:id', getPreferences);
router.put('/:id', updatePreferences);
router.delete('/:id', deletePreferences);

module.exports = router;
