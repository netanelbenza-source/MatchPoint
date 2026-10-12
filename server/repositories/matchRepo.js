const { getDb } = require('../db');
const { toObjectId } = require('./objectId');

const COLLECTION = 'matches';

function matches() {
  return getDb().collection(COLLECTION);
}

async function saveMatches(userId, matchesArray) {
  const ownerId = toObjectId(userId);
  await matches().deleteMany({ userId: ownerId });
  if (matchesArray.length === 0) return [];

  const now = new Date();
  const docs = matchesArray.map((match) => ({
    userId: ownerId,
    candidateId: toObjectId(match.candidateId),
    score: match.score,
    criteriaResults: match.criteriaResults,
    createdAt: now,
    updatedAt: now,
  }));
  const result = await matches().insertMany(docs);

  return docs.map((doc, index) => ({
    _id: result.insertedIds[index],
    ...doc,
  }));
}

async function ensureMatch({ userId, candidateId }) {
  const now = new Date();
  const ownerId = toObjectId(userId);
  const otherId = toObjectId(candidateId);
  const existing = await matches().findOne({ userId: ownerId, candidateId: otherId });
  if (existing) {
    if (existing.status !== 'confirmed') {
      await matches().updateOne(
        { _id: existing._id },
        { $set: { status: 'pending', updatedAt: now } }
      );
      existing.status = 'pending';
    }
    return existing;
  }

  const doc = {
    userId: ownerId,
    candidateId: otherId,
    score: 0,
    criteriaResults: [],
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  const result = await matches().insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

async function setMatchStatusByPair(userId, candidateId, status) {
  const result = await matches().updateMany(
    { userId: toObjectId(userId), candidateId: toObjectId(candidateId) },
    { $set: { status, updatedAt: new Date() } }
  );
  return result.modifiedCount;
}

module.exports = {
  saveMatches,
  ensureMatch,
  setMatchStatusByPair,
};
