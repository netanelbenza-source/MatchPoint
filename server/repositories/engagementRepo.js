const { getDb } = require('../db');
const { toObjectId } = require('./objectId');

const COLLECTION = 'engagements';

function engagements() {
  return getDb().collection(COLLECTION);
}

async function insertEngagement({ matchmakerId, maleId, femaleId }) {
  const now = new Date();
  const doc = {
    matchmakerId: toObjectId(matchmakerId),
    maleId: toObjectId(maleId),
    femaleId: toObjectId(femaleId),
    maleApproved: false,
    femaleApproved: false,
    maleStatus: 'pending',
    femaleStatus: 'pending',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  const result = await engagements().insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

async function deleteEngagement(id) {
  const result = await engagements().deleteOne({ _id: toObjectId(id) });
  return result.deletedCount === 1;
}

async function getEngagementById(id) {
  return engagements().findOne({ _id: toObjectId(id) });
}

async function findPendingEngagement(maleId, femaleId) {
  return engagements().findOne({
    maleId: toObjectId(maleId),
    femaleId: toObjectId(femaleId),
    status: 'pending',
  });
}

async function setPartyApproval(id, field) {
  return engagements().findOneAndUpdate(
    { _id: toObjectId(id), status: 'pending' },
    { $set: { [field]: true, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
}

// Only one request can move a fully approved engagement from pending to completed.
async function markCompleted(id) {
  return engagements().findOneAndUpdate(
    {
      _id: toObjectId(id),
      status: 'pending',
      maleApproved: true,
      femaleApproved: true,
    },
    { $set: { status: 'completed', updatedAt: new Date() } },
    { returnDocument: 'before' }
  );
}

module.exports = {
  insertEngagement,
  deleteEngagement,
  getEngagementById,
  findPendingEngagement,
  setPartyApproval,
  markCompleted,
};
