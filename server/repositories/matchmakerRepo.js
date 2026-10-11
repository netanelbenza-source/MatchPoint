const { getDb } = require('../db');
const { toObjectId } = require('./objectId');

const COLLECTION = 'matchmakers';

function matchmakers() {
  return getDb().collection(COLLECTION);
}

async function insertMatchmaker(matchmaker) {
  const now = new Date();
  const doc = {
    name: matchmaker.name,
    phone: matchmaker.phone,
    email: matchmaker.email,
    weeklySuccessCount: matchmaker.weeklySuccessCount,
    successfulMatches: matchmaker.successfulMatches ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  const result = await matchmakers().insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

async function getMatchmakerById(id) {
  return matchmakers().findOne({ _id: toObjectId(id) });
}

async function getMatchmakerByEmail(email) {
  return matchmakers().findOne({ email });
}

async function getAllMatchmakers() {
  return matchmakers().find({}).toArray();
}

async function updateMatchmaker(id, changes) {
  return matchmakers().findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { ...changes, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
}

async function deleteMatchmaker(id) {
  const result = await matchmakers().deleteOne({ _id: toObjectId(id) });
  return result.deletedCount === 1;
}

async function incrementSuccessfulMatches(matchmakerId) {
  return matchmakers().findOneAndUpdate(
    { _id: toObjectId(matchmakerId) },
    { $inc: { successfulMatches: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
}

async function incrementWeeklySuccess(matchmakerId) {
  return matchmakers().findOneAndUpdate(
    { _id: toObjectId(matchmakerId) },
    { $inc: { weeklySuccessCount: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
}

async function getTopMatchmakerOfTheWeek() {
  const rows = await matchmakers()
    .find({})
    .sort({ weeklySuccessCount: -1 })
    .limit(1)
    .toArray();
  return rows[0] || null;
}

async function resetWeeklyCounters() {
  const result = await matchmakers().updateMany(
    {},
    { $set: { weeklySuccessCount: 0, updatedAt: new Date() } }
  );
  return result.modifiedCount;
}

module.exports = {
  insertMatchmaker,
  getMatchmakerById,
  getMatchmakerByEmail,
  getAllMatchmakers,
  updateMatchmaker,
  deleteMatchmaker,
  incrementSuccessfulMatches,
  incrementWeeklySuccess,
  getTopMatchmakerOfTheWeek,
  resetWeeklyCounters,
};
