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

module.exports = {
  saveMatches,
};
