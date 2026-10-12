const crypto = require('crypto');
const { getDb } = require('../db');
const { toObjectId } = require('./objectId');

const COLLECTION = 'matchConfirmations';
const CONFIRM_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function confirmations() {
  return getDb().collection(COLLECTION);
}

async function issueConfirmation({ matchId, matchmakerId, userId, candidateId }) {
  const now = new Date();
  const pair = {
    userId: toObjectId(userId),
    candidateId: toObjectId(candidateId),
    matchmakerId: toObjectId(matchmakerId),
  };

  const confirmed = await confirmations().findOne({ ...pair, status: 'confirmed' });
  if (confirmed) {
    return { confirmation: confirmed, created: false, alreadyConfirmed: true };
  }

  const open = await confirmations().findOne({
    ...pair,
    status: 'pending',
    used: false,
    expiresAt: { $gt: now },
  });
  if (open) {
    return { confirmation: open, created: false, alreadyConfirmed: false };
  }

  const doc = {
    token: crypto.randomBytes(32).toString('hex'),
    matchId: toObjectId(matchId),
    ...pair,
    status: 'pending',
    used: false,
    expiresAt: new Date(now.getTime() + CONFIRM_TTL_MS),
    createdAt: now,
    updatedAt: now,
  };
  const result = await confirmations().insertOne(doc);
  return { confirmation: { _id: result.insertedId, ...doc }, created: true, alreadyConfirmed: false };
}

async function deleteConfirmation(id) {
  const result = await confirmations().deleteOne({ _id: toObjectId(id) });
  return result.deletedCount === 1;
}

// Returns the pending document only for the request that won the update.
async function claimConfirmation(token) {
  const now = new Date();
  return confirmations().findOneAndUpdate(
    { token, status: 'pending', used: false, expiresAt: { $gt: now } },
    { $set: { status: 'confirmed', used: true, confirmedAt: now, updatedAt: now } },
    { returnDocument: 'before' }
  );
}

async function getConfirmationByToken(token) {
  return confirmations().findOne({ token });
}

module.exports = {
  issueConfirmation,
  deleteConfirmation,
  claimConfirmation,
  getConfirmationByToken,
};
