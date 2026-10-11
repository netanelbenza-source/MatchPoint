const { profileCreateSchema, profileUpdateSchema } = require('../validations/profileValidation');
const { objectIdSchema } = require('../validations/objectId');
const profileRepo = require('../repositories/profileRepo');
const { isOwnerOrAdmin } = require('../middlewares/adminMiddleware');
const { sendValidationError, sendWriteError } = require('./errors');

async function createProfile(req, res) {
  const parsed = profileCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const profile = await profileRepo.insertProfile(parsed.data);
    return res.status(201).json(profile);
  } catch (error) {
    return sendWriteError(res, error, 'Profile already exists for this user');
  }
}

async function getProfile(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.id);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const profile = await profileRepo.getProfileById(parsed.data);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    return res.status(200).json(profile);
  } catch (error) {
    return sendWriteError(res, error, 'Profile already exists for this user');
  }
}

async function getProfileByUser(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.userId);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const profile = await profileRepo.getProfileByUserId(parsed.data);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    return res.status(200).json(profile);
  } catch (error) {
    return sendWriteError(res, error, 'Profile already exists for this user');
  }
}

async function updateProfile(req, res) {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) return sendValidationError(res, idParsed.error);

  const bodyParsed = profileUpdateSchema.safeParse(req.body);
  if (!bodyParsed.success) return sendValidationError(res, bodyParsed.error);

  try {
    const existing = await profileRepo.getProfileById(idParsed.data);
    if (!existing) return res.status(404).json({ message: 'Profile not found' });
    if (!isOwnerOrAdmin(req, existing.userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const profile = await profileRepo.updateProfile(idParsed.data, bodyParsed.data);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    return res.status(200).json(profile);
  } catch (error) {
    return sendWriteError(res, error, 'Profile already exists for this user');
  }
}

async function toggleAvailability(req, res) {
  const parsed = objectIdSchema.safeParse(req.user && req.user.id);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const profile = await profileRepo.getProfileByUserId(parsed.data);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const updated = await profileRepo.setAvailability(parsed.data, profile.isAvailable === false);
    return res.status(200).json(updated);
  } catch (error) {
    return sendWriteError(res, error, 'Profile already exists for this user');
  }
}

async function deleteProfile(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.id);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const deleted = await profileRepo.deleteProfile(parsed.data);
    if (!deleted) return res.status(404).json({ message: 'Profile not found' });
    return res.status(204).send();
  } catch (error) {
    return sendWriteError(res, error, 'Profile already exists for this user');
  }
}

module.exports = {
  createProfile,
  getProfile,
  getProfileByUser,
  updateProfile,
  toggleAvailability,
  deleteProfile,
};
