const { engagementRequestSchema, engagementApproveSchema } = require('../validations/engagementValidation');
const { getUserById, deleteUser } = require('../repositories/userRepo');
const { getProfileByUserId, deleteProfileByUserId, getAvailableCandidates } = require('../repositories/profileRepo');
const { deletePreferencesByUserId } = require('../repositories/preferencesRepo');
const { getMatchmakerByEmail, incrementSuccessfulMatches } = require('../repositories/matchmakerRepo');
const {
  insertEngagement,
  deleteEngagement,
  getEngagementById,
  findPendingEngagement,
  setPartyApproval,
  markCompleted,
} = require('../repositories/engagementRepo');
const { sendEngagementApprovalEmail } = require('../services/mailService');
const { sendValidationError, sendWriteError } = require('./errors');

function approvalUrl(engagementId, userId) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${clientUrl}/approve-engagement/${engagementId}/${userId}`;
}

function presentEngagement(record) {
  return {
    _id: String(record._id),
    matchmakerId: String(record.matchmakerId),
    maleId: String(record.maleId),
    femaleId: String(record.femaleId),
    maleApproved: record.maleApproved === true,
    femaleApproved: record.femaleApproved === true,
    maleStatus: record.maleStatus || 'pending',
    femaleStatus: record.femaleStatus || 'pending',
    status: record.status,
  };
}

async function removeCandidate(userId) {
  await deleteProfileByUserId(userId);
  await deletePreferencesByUserId(userId);
  await deleteUser(userId);
}

async function listCandidates(req, res) {
  try {
    const records = await getAvailableCandidates();
    return res.status(200).json(records.map((record) => ({
      userId: String(record.userId),
      firstName: record.firstName,
      lastName: record.lastName || '',
      gender: record.gender,
      age: record.age,
      city: record.city,
    })));
  } catch (error) {
    return sendWriteError(res, error, 'Request failed');
  }
}

async function requestEngagement(req, res) {
  const parsed = engagementRequestSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const actor = await getUserById(req.user.userId);
    if (!actor) return res.status(401).json({ message: 'Authentication required' });

    const matchmaker = await getMatchmakerByEmail(actor.email);
    if (!matchmaker) {
      return res.status(400).json({ message: 'אין רשומת שדכן עם האימייל של החשבון הזה' });
    }

    const [maleProfile, femaleProfile, maleUser, femaleUser] = await Promise.all([
      getProfileByUserId(parsed.data.maleId),
      getProfileByUserId(parsed.data.femaleId),
      getUserById(parsed.data.maleId),
      getUserById(parsed.data.femaleId),
    ]);

    if (!maleProfile || maleProfile.gender !== 'Male' || maleProfile.isAvailable !== true || !maleUser?.email) {
      return res.status(400).json({ message: 'הבחור שנבחר לא זמין' });
    }
    if (!femaleProfile || femaleProfile.gender !== 'Female' || femaleProfile.isAvailable !== true || !femaleUser?.email) {
      return res.status(400).json({ message: 'הבחורה שנבחרה לא זמינה' });
    }

    const existing = await findPendingEngagement(parsed.data.maleId, parsed.data.femaleId);
    if (existing) {
      return res.status(409).json({ message: 'כבר נשלחה בקשת אישור פתוחה לזוג הזה' });
    }

    const engagement = await insertEngagement({
      matchmakerId: matchmaker._id,
      maleId: parsed.data.maleId,
      femaleId: parsed.data.femaleId,
    });

    const maleApprovalUrl = approvalUrl(engagement._id, maleUser._id);
    const femaleApprovalUrl = approvalUrl(engagement._id, femaleUser._id);
    if (maleApprovalUrl === femaleApprovalUrl) {
      await deleteEngagement(engagement._id);
      return res.status(500).json({ message: 'לא נוצרו שני קישורי אישור נפרדים' });
    }

    try {
      await sendEngagementApprovalEmail({
        to: maleUser.email,
        firstName: maleProfile.firstName,
        matchmakerName: matchmaker.name,
        approvalUrl: maleApprovalUrl,
      });
      await sendEngagementApprovalEmail({
        to: femaleUser.email,
        firstName: femaleProfile.firstName,
        matchmakerName: matchmaker.name,
        approvalUrl: femaleApprovalUrl,
      });
    } catch (error) {
      await deleteEngagement(engagement._id);
      throw error;
    }

    return res.status(201).json({
      emailsSent: 2,
      engagement: presentEngagement(engagement),
    });
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return sendWriteError(res, error, 'Request failed');
  }
}

async function approveEngagement(req, res) {
  const parsed = engagementApproveSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const current = await getEngagementById(parsed.data.engagementId);
    if (!current) return res.status(404).json({ message: 'הבקשה לא נמצאה' });

    const userId = parsed.data.userId;
    const isMale = String(current.maleId) === userId;
    const isFemale = String(current.femaleId) === userId;
    if (!isMale && !isFemale) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (current.status === 'completed') {
      return res.status(200).json({
        message: 'השידוך כבר נסגר',
        closed: true,
        engagement: presentEngagement(current),
      });
    }

    const field = isMale ? 'maleApproved' : 'femaleApproved';
    if (current[field] === true) {
      return res.status(200).json({
        message: 'האישור שלך כבר נקלט',
        closed: false,
        engagement: presentEngagement(current),
      });
    }

    const updated = await setPartyApproval(current._id, field);
    if (!updated) {
      const latest = await getEngagementById(current._id);
      return res.status(200).json({
        message: latest && latest.status === 'completed' ? 'השידוך כבר נסגר' : 'האישור שלך כבר נקלט',
        closed: Boolean(latest && latest.status === 'completed'),
        engagement: latest ? presentEngagement(latest) : presentEngagement(current),
      });
    }

    let closed = false;
    if (updated.maleApproved === true && updated.femaleApproved === true) {
      // Claim the pending row before counting and deleting, so a second click cannot double-count.
      const claimed = await markCompleted(updated._id);
      if (claimed) {
        await incrementSuccessfulMatches(updated.matchmakerId);
        await removeCandidate(updated.maleId);
        await removeCandidate(updated.femaleId);
        closed = true;
      }
    }

    const latest = await getEngagementById(updated._id);
    return res.status(200).json({
        message: closed ? 'שני הצדדים אישרו. השידוך נסגר.' : 'מחכים לאישור הצד השני.',
      closed,
      engagement: latest ? presentEngagement(latest) : presentEngagement(updated),
    });
  } catch (error) {
    return sendWriteError(res, error, 'Request failed');
  }
}

module.exports = {
  listCandidates,
  requestEngagement,
  approveEngagement,
};
