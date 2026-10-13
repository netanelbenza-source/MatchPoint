const {
  preferencesCreateSchema,
  preferencesUpdateSchema,
} = require('../validations/preferencesValidation');
const { objectIdSchema } = require('../validations/objectId');
const preferencesRepo = require('../repositories/preferencesRepo');
const { getProfileByUserId } = require('../repositories/profileRepo');
const { isOwnerOrAdmin } = require('../middlewares/adminMiddleware');
const { sendValidationError, sendWriteError } = require('./errors');

async function oppositeGenderError(userId, gender) {
  const profile = await getProfileByUserId(userId);
  if (!profile) return 'קודם ממלאים פרופיל.';
  const opposite = profile.gender === 'Male' ? 'Female' : 'Male';
  if (gender !== opposite) return 'המגדר המבוקש חייב להיות המגדר ההפוך מהפרופיל.';
  return '';
}

async function createPreferences(req, res) {
  const parsed = preferencesCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const genderError = await oppositeGenderError(parsed.data.userId, parsed.data.gender);
    if (genderError) return res.status(400).json({ message: genderError });

    const preferences = await preferencesRepo.insertPreferences(parsed.data);
    return res.status(201).json(preferences);
  } catch (error) {
    return sendWriteError(res, error, 'Preferences already exist for this user');
  }
}

async function getPreferences(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.id);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const preferences = await preferencesRepo.getPreferencesById(parsed.data);
    if (!preferences) return res.status(404).json({ message: 'Preferences not found' });
    return res.status(200).json(preferences);
  } catch (error) {
    return sendWriteError(res, error, 'Preferences already exist for this user');
  }
}

async function getPreferencesByUser(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.userId);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const preferences = await preferencesRepo.getPreferencesByUserId(parsed.data);
    if (!preferences) return res.status(404).json({ message: 'Preferences not found' });
    return res.status(200).json(preferences);
  } catch (error) {
    return sendWriteError(res, error, 'Preferences already exist for this user');
  }
}

async function updatePreferences(req, res) {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) return sendValidationError(res, idParsed.error);

  const bodyParsed = preferencesUpdateSchema.safeParse(req.body);
  if (!bodyParsed.success) return sendValidationError(res, bodyParsed.error);

  try {
    const existing = await preferencesRepo.getPreferencesById(idParsed.data);
    if (!existing) return res.status(404).json({ message: 'Preferences not found' });
    if (!isOwnerOrAdmin(req, existing.userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (bodyParsed.data.gender) {
      const genderError = await oppositeGenderError(existing.userId, bodyParsed.data.gender);
      if (genderError) return res.status(400).json({ message: genderError });
    }

    const preferences = await preferencesRepo.updatePreferences(idParsed.data, bodyParsed.data);
    if (!preferences) return res.status(404).json({ message: 'Preferences not found' });
    return res.status(200).json(preferences);
  } catch (error) {
    return sendWriteError(res, error, 'Preferences already exist for this user');
  }
}

async function deletePreferences(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.id);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const deleted = await preferencesRepo.deletePreferences(parsed.data);
    if (!deleted) return res.status(404).json({ message: 'Preferences not found' });
    return res.status(204).send();
  } catch (error) {
    return sendWriteError(res, error, 'Preferences already exist for this user');
  }
}

module.exports = {
  createPreferences,
  getPreferences,
  getPreferencesByUser,
  updatePreferences,
  deletePreferences,
};
