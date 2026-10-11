const { matchmakerSchema, matchmakerUpdateSchema } = require('../validations/matchmakerValidation');
const { objectIdSchema } = require('../validations/objectId');
const matchmakerRepo = require('../repositories/matchmakerRepo');
const { getUserById } = require('../repositories/userRepo');
const { promoteMatchmaker, signToken } = require('./authController');
const { sendValidationError, sendWriteError } = require('./errors');

async function createMatchmaker(req, res) {
  const parsed = matchmakerSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const matchmaker = await matchmakerRepo.insertMatchmaker(parsed.data);
    const actor = await getUserById(req.user.userId);
    if (actor && actor.email === matchmaker.email) {
      const account = await promoteMatchmaker(actor);
      if (account.role === 'matchmaker' && actor.role !== 'matchmaker') {
        return res.status(201).json({ ...matchmaker, token: signToken(account) });
      }
    }
    return res.status(201).json(matchmaker);
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function getMatchmakers(req, res) {
  try {
    const matchmakers = await matchmakerRepo.getAllMatchmakers();
    return res.status(200).json(matchmakers);
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function getMatchmaker(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.id);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const matchmaker = await matchmakerRepo.getMatchmakerById(parsed.data);
    if (!matchmaker) return res.status(404).json({ message: 'Matchmaker not found' });
    return res.status(200).json(matchmaker);
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function updateMatchmaker(req, res) {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) return sendValidationError(res, idParsed.error);

  const bodyParsed = matchmakerUpdateSchema.safeParse(req.body);
  if (!bodyParsed.success) return sendValidationError(res, bodyParsed.error);

  try {
    const matchmaker = await matchmakerRepo.updateMatchmaker(idParsed.data, bodyParsed.data);
    if (!matchmaker) return res.status(404).json({ message: 'Matchmaker not found' });
    return res.status(200).json(matchmaker);
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function getTopMatchmaker(req, res) {
  try {
    const matchmaker = await matchmakerRepo.getTopMatchmakerOfTheWeek();
    if (!matchmaker) return res.status(404).json({ message: 'No matchmaker found' });
    return res.status(200).json(matchmaker);
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function recordSuccess(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.id);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const matchmaker = await matchmakerRepo.incrementWeeklySuccess(parsed.data);
    if (!matchmaker) return res.status(404).json({ message: 'Matchmaker not found' });
    return res.status(200).json(matchmaker);
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

async function deleteMatchmaker(req, res) {
  const parsed = objectIdSchema.safeParse(req.params.id);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const deleted = await matchmakerRepo.deleteMatchmaker(parsed.data);
    if (!deleted) return res.status(404).json({ message: 'Matchmaker not found' });
    return res.status(204).send();
  } catch (error) {
    return sendWriteError(res, error, 'Email already exists');
  }
}

module.exports = {
  createMatchmaker,
  getMatchmakers,
  getMatchmaker,
  updateMatchmaker,
  deleteMatchmaker,
  getTopMatchmaker,
  recordSuccess,
};
