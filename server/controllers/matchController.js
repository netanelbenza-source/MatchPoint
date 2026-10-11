const { objectIdSchema } = require('../validations/objectId');
const { matchListSchema } = require('../validations/matchValidation');
const { getProfileByUserId, getAllProfiles } = require('../repositories/profileRepo');
const { getPreferencesByUserId, getAllPreferences } = require('../repositories/preferencesRepo');
const { getUserById } = require('../repositories/userRepo');
const { getMatchmakerById } = require('../repositories/matchmakerRepo');
const { saveMatches } = require('../repositories/matchRepo');
const { findMatches } = require('../services/matchService');
const { sendMatchmakerEmail } = require('../services/mailService');
const { sendValidationError, sendWriteError } = require('./errors');

async function getMatches(req, res) {
  const parsed = objectIdSchema.safeParse(req.user && req.user.id);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const userId = parsed.data;
    const [profile, preferences, profiles, allPreferences] = await Promise.all([
      getProfileByUserId(userId),
      getPreferencesByUserId(userId),
      getAllProfiles(),
      getAllPreferences(),
    ]);

    if (!profile || !preferences) {
      return res.status(400).json({
        message: 'A profile and preferences are required before matching',
      });
    }

    const matches = findMatches({
      userId,
      profile,
      preferences,
      profiles,
      allPreferences,
    });
    const parsedMatches = matchListSchema.safeParse(matches);
    if (!parsedMatches.success) {
      return sendValidationError(res, parsedMatches.error);
    }

    const savedMatches = await saveMatches(userId, parsedMatches.data);
    const profileByCandidateId = new Map(
      matches.map((match) => [String(match.candidateId), match.profile])
    );

    return res.status(200).json(
      savedMatches.map((match) => ({
        ...match,
        profile: profileByCandidateId.get(String(match.candidateId)) || null,
      }))
    );
  } catch (error) {
    return sendWriteError(res, error, 'Failed to load matches');
  }
}

async function contactMatchmaker(req, res) {
  const userId = objectIdSchema.safeParse(req.user && req.user.id);
  const candidateId = objectIdSchema.safeParse(req.params.candidateId);
  if (!userId.success) return sendValidationError(res, userId.error);
  if (!candidateId.success) return sendValidationError(res, candidateId.error);
  if (userId.data === candidateId.data) {
    return res.status(400).json({ message: 'לא ניתן לשלוח פרטים על עצמך' });
  }

  try {
    const [profile, user, candidate] = await Promise.all([
      getProfileByUserId(userId.data),
      getUserById(userId.data),
      getProfileByUserId(candidateId.data),
    ]);

    if (!profile || !user) {
      return res.status(400).json({ message: 'חסר פרופיל למשתמש המחובר' });
    }
    if (!candidate) {
      return res.status(404).json({ message: 'המועמד לא נמצא' });
    }

    const matchmakerId = candidate.matchmakerId || (candidate.matchmaker && candidate.matchmaker._id);
    if (!matchmakerId) {
      return res.status(404).json({ message: 'למועמד אין שדכן' });
    }

    const matchmaker = await getMatchmakerById(matchmakerId);
    if (!matchmaker || !matchmaker.email) {
      return res.status(404).json({ message: 'לשדכן אין כתובת אימייל' });
    }

    const result = await sendMatchmakerEmail({ matchmaker, candidate, user, profile });
    if (result.previewUrl) {
      console.log(`Matchmaker email preview: ${result.previewUrl}`);
    }
    return res.status(200).json({
      message: result.previewUrl
        ? 'המייל נשמר בתיבת הבדיקה. פתח את הקישור כדי לראות אותו.'
        : 'הפרטים נשלחו לשדכן',
      previewUrl: result.previewUrl,
    });
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(502).json({ message: 'שליחת האימייל נכשלה' });
  }
}

module.exports = {
  getMatches,
  contactMatchmaker,
};
