const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const router = express.Router();

router.post('/', createUser);
router.get('/', authMiddleware, getUsers);
router.get('/:id', getUser);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
