const { userCreateSchema, userUpdateSchema } = require('../validations/userValidation');
const { objectIdSchema } = require('../validations/objectId');
const userRepo = require('../repositories/userRepo');
const { isOwnerOrAdmin } = require('../middlewares/adminMiddleware');
const { sendValidationError, sendWriteError } = require('./errors');

async function createUser(req, res) {
  const parsed = userCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const user = await userRepo.insertUser(parsed.data);
    delete user.passwordHash;
    return res.status(201).json(user);
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function getUsers(req, res) {
  try {
    const records = req.user.role === 'admin'
      ? await userRepo.getAllUsers()
      : await userRepo.getPublicUsers();
    return res.status(200).json(records);
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function getUser(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.id);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const user = await userRepo.getUserById(parsed.data);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(user);
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function updateUser(req, res) {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) return sendValidationError(res, idParsed.error);

  if (!isOwnerOrAdmin(req, idParsed.data)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const bodyParsed = userUpdateSchema.safeParse(req.body);
  if (!bodyParsed.success) return sendValidationError(res, bodyParsed.error);

  if (bodyParsed.data.role && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const user = await userRepo.updateUser(idParsed.data, bodyParsed.data);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(user);
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function deleteUser(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.id);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const deleted = await userRepo.deleteUser(parsed.data);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    return res.status(204).send();
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
