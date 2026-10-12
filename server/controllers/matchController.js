const { objectIdSchema } = require('../validations/objectId');
const { matchListSchema } = require('../validations/matchValidation');
const { getProfileByUserId, getAllProfiles } = require('../repositories/profileRepo');
const { getPreferencesByUserId, getAllPreferences } = require('../repositories/preferencesRepo');
const { getUserById } = require('../repositories/userRepo');
const { getMatchmakerById, incrementSuccessfulMatches } = require('../repositories/matchmakerRepo');
const { saveMatches, setMatchStatusByPair } = require('../repositories/matchRepo');
const { claimConfirmation, getConfirmationByToken } = require('../repositories/matchConfirmationRepo');
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

    const preferences = await getPreferencesByUserId(userId.data);
    await sendMatchmakerEmail({ matchmaker, candidate, user, profile, preferences });
    return res.status(200).json({
      message: 'הפרטים נשלחו לשדכן',
    });
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(502).json({ message: 'שליחת האימייל נכשלה' });
  }
}

function confirmationPage({ title, text }) {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f6fb;font-family:Heebo,Segoe UI,sans-serif;color:#172033;">
  <main style="max-width:32rem;margin:2rem;background:#fff;border-radius:1.5rem;padding:2rem 1.75rem;box-shadow:0 24px 60px rgba(22,58,115,.12);text-align:center;">
    <p style="margin:0;font-weight:800;color:#ff5d78;">MatchPoint</p>
    <h1 style="margin:0.75rem 0 0;font-size:2rem;color:#163a73;">${title}</h1>
    <p style="margin:1rem 0 0;font-size:1.05rem;line-height:1.7;">${text}</p>
  </main>
</body>
</html>`;
}

function sendConfirmationPage(res, status, page) {
  return res.status(status).type('html').send(confirmationPage(page));
}

async function confirmMatch(req, res) {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return sendConfirmationPage(res, 400, {
      title: 'הקישור לא תקין',
      text: 'קישור האישור חסר או לא בפורמט הנכון.',
    });
  }

  try {
    const claimed = await claimConfirmation(token);
    if (claimed) {
      await incrementSuccessfulMatches(claimed.matchmakerId);
      await setMatchStatusByPair(claimed.userId, claimed.candidateId, 'confirmed');
      return sendConfirmationPage(res, 200, {
        title: 'השידוך אושר',
        text: 'האישור נקלט. השידוך נוסף למונה ההצלחות של השדכן.',
      });
    }

    const existing = await getConfirmationByToken(token);
    if (!existing) {
      return sendConfirmationPage(res, 404, {
        title: 'הקישור לא נמצא',
        text: 'לא מצאנו בקשת אישור עם הקישור הזה.',
      });
    }
    if (existing.status === 'confirmed' || existing.used) {
      return sendConfirmationPage(res, 200, {
        title: 'השידוך כבר אושר',
        text: 'הקישור הזה כבר נוצל. המונה לא עלה שוב.',
      });
    }
    return sendConfirmationPage(res, 410, {
      title: 'הקישור פג תוקף',
      text: 'עברו יותר מדי ימים מאז שנשלח המייל. צריך לבקש קישור חדש.',
    });
  } catch (error) {
    return sendConfirmationPage(res, 500, {
      title: 'לא הצלחנו לאשר',
      text: 'נסו שוב בעוד רגע.',
    });
  }
}

module.exports = {
  getMatches,
  contactMatchmaker,
  confirmMatch,
};
