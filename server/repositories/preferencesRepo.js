const { getDb } = require('../db');
const { toObjectId } = require('./objectId');

const COLLECTION = 'preferences';

function preferences() {
  return getDb().collection(COLLECTION);
}

async function insertPreferences(preferencesInput) {
  const now = new Date();
  const doc = {
    userId: toObjectId(preferencesInput.userId),
    gender: preferencesInput.gender,
    sector: preferencesInput.sector,
    ageRange: preferencesInput.ageRange,
    cities: preferencesInput.cities,
    languages: preferencesInput.languages,
    education: preferencesInput.education,
    lifestyle: preferencesInput.lifestyle,
    additionalCriteria: preferencesInput.additionalCriteria,
    createdAt: now,
    updatedAt: now,
  };
  const result = await preferences().insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

async function getPreferencesById(id) {
  return preferences().findOne({ _id: toObjectId(id) });
}

async function getPreferencesByUserId(userId) {
  return preferences().findOne({ userId: toObjectId(userId) });
}

async function getAllPreferences() {
  return preferences().find({}).toArray();
}

async function updatePreferences(id, changes) {
  const update = { ...changes, updatedAt: new Date() };
  if (update.userId != null) {
    update.userId = toObjectId(update.userId);
  }
  return preferences().findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: update },
    { returnDocument: 'after' }
  );
}

async function deletePreferences(id) {
  const result = await preferences().deleteOne({ _id: toObjectId(id) });
  return result.deletedCount === 1;
}

async function deletePreferencesByUserId(userId) {
  const result = await preferences().deleteOne({ userId: toObjectId(userId) });
  return result.deletedCount === 1;
}

module.exports = {
  insertPreferences,
  getPreferencesById,
  getPreferencesByUserId,
  getAllPreferences,
  updatePreferences,
  deletePreferences,
  deletePreferencesByUserId,
};
