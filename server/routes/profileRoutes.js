const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  createProfile,
  getProfile,
  getProfileByUser,
  updateProfile,
  toggleAvailability,
  deleteProfile,
} = require('../controllers/profileController');

const router = express.Router();

router.use(authMiddleware);
router.post('/', createProfile);
router.patch('/me/availability', toggleAvailability);
router.get('/user/:userId', getProfileByUser);
router.get('/:id', getProfile);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);

module.exports = router;
