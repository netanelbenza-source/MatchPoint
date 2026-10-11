const { objectIdSchema } = require('../validations/objectId');
const { chatMatchSchema } = require('../validations/aiValidation');
const { getProfileByUserId, getChatMatchCandidates } = require('../repositories/profileRepo');
const { rankCandidatesByChat } = require('../services/aiMatchService');
const { sendValidationError, sendWriteError } = require('./errors');

async function chatMatch(req, res) {
  const userParsed = objectIdSchema.safeParse(req.user && req.user.userId);
  if (!userParsed.success) return sendValidationError(res, userParsed.error);

  const bodyParsed = chatMatchSchema.safeParse(req.body);
  if (!bodyParsed.success) return sendValidationError(res, bodyParsed.error);

  try {
    const profile = await getProfileByUserId(userParsed.data);
    if (!profile) {
      return res.status(400).json({ message: 'A profile is required before using the assistant' });
    }

    const candidates = await getChatMatchCandidates({
      userId: userParsed.data,
      gender: profile.gender,
      sector: profile.sector,
    });

    if (candidates.length === 0) {
      return res.status(200).json({ matches: [] });
    }

    const result = await rankCandidatesByChat(bodyParsed.data.chatMessage, candidates);
    return res.status(200).json(result);
  } catch (error) {
    if (error && error.statusCode === 500) {
      return res.status(500).json({ message: error.message });
    }
    if (error && error.statusCode === 502) {
      return res.status(502).json({ message: error.message });
    }
    return sendWriteError(res, error, 'Failed to load candidates');
  }
}

module.exports = {
  chatMatch,
};
