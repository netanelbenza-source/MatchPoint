const { getDb } = require('../db');
const { toObjectId } = require('./objectId');

const COLLECTION = 'profiles';

function profiles() {
  return getDb().collection(COLLECTION);
}

const matchmakerLookup = [
  {
    $lookup: {
      from: 'matchmakers',
      localField: 'matchmakerId',
      foreignField: '_id',
      as: 'matchmaker',
    },
  },
  {
    $unwind: {
      path: '$matchmaker',
      preserveNullAndEmptyArrays: true,
    },
  },
];

async function findProfiles(match) {
  return profiles().aggregate([{ $match: match }, ...matchmakerLookup]).toArray();
}

function toProfileDoc(profile, now) {
  return {
    userId: toObjectId(profile.userId),
    firstName: profile.firstName,
    age: profile.age,
    city: profile.city,
    gender: profile.gender,
    sector: profile.sector,
    matchmakerId: toObjectId(profile.matchmakerId),
    languages: profile.languages,
    education: profile.education,
    lifestyle: profile.lifestyle,
    description: profile.description,
    isAvailable: profile.isAvailable,
    createdAt: now,
    updatedAt: now,
  };
}

async function insertProfile(profile) {
  const doc = toProfileDoc(profile, new Date());
  const result = await profiles().insertOne(doc);
  return getProfileById(result.insertedId);
}

async function getProfileById(id) {
  const rows = await findProfiles({ _id: toObjectId(id) });
  return rows[0] || null;
}

async function getProfileByUserId(userId) {
  const rows = await findProfiles({ userId: toObjectId(userId) });
  return rows[0] || null;
}

async function getAllProfiles() {
  return profiles().aggregate(matchmakerLookup).toArray();
}

async function updateProfile(id, changes) {
  const update = { ...changes, updatedAt: new Date() };
  if (update.userId != null) {
    update.userId = toObjectId(update.userId);
  }
  if (update.matchmakerId != null) {
    update.matchmakerId = toObjectId(update.matchmakerId);
  }
  const updated = await profiles().findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: update },
    { returnDocument: 'after' }
  );
  if (!updated) return null;
  return getProfileById(id);
}

async function setAvailability(userId, isAvailable) {
  const updated = await profiles().findOneAndUpdate(
    { userId: toObjectId(userId) },
    { $set: { isAvailable, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!updated) return null;
  return getProfileById(updated._id);
}

async function getChatMatchCandidates({ userId, gender, sector }) {
  const oppositeGender = gender === 'Male' ? 'Female' : 'Male';
  const filter = {
    userId: { $ne: toObjectId(userId) },
    gender: oppositeGender,
    isAvailable: true,
  };

  // אחר and הכל accept every sector. Any other sector must match, or the candidate is open.
  if (sector !== 'אחר' && sector !== 'הכל') {
    filter.$or = [{ sector }, { sector: 'אחר' }, { sector: 'הכל' }];
  }

  return profiles()
    .find(filter, { projection: { _id: 1, firstName: 1, description: 1 } })
    .toArray();
}

async function deleteProfile(id) {
  const result = await profiles().deleteOne({ _id: toObjectId(id) });
  return result.deletedCount === 1;
}

async function deleteProfileByUserId(userId) {
  const result = await profiles().deleteOne({ userId: toObjectId(userId) });
  return result.deletedCount === 1;
}

async function getAvailableCandidates() {
  return profiles().aggregate([
    { $match: { isAvailable: true, gender: { $in: ['Male', 'Female'] } } },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.email': { $type: 'string', $ne: '' } } },
    { $project: { _id: 0, userId: 1, firstName: 1, lastName: 1, gender: 1, age: 1, city: 1 } },
  ]).toArray();
}

module.exports = {
  insertProfile,
  getProfileById,
  getProfileByUserId,
  getAllProfiles,
  updateProfile,
  setAvailability,
  getChatMatchCandidates,
  deleteProfile,
  deleteProfileByUserId,
  getAvailableCandidates,
};
