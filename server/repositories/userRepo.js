const { getDb } = require('../db');
const { toObjectId } = require('./objectId');

const COLLECTION = 'users';

function users() {
  return getDb().collection(COLLECTION);
}

async function insertUser(user) {
  const now = new Date();
  const doc = {
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    status: user.status,
    createdAt: now,
    updatedAt: now,
  };
  const result = await users().insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

async function getUserById(id) {
  return users().findOne(
    { _id: toObjectId(id) },
    { projection: { passwordHash: 0 } }
  );
}

async function getUserByEmail(email) {
  return users().findOne(
    { email },
    { projection: { passwordHash: 0 } }
  );
}

async function getUserByEmailWithPassword(email) {
  return users().findOne({ email });
}

async function updateUser(id, changes) {
  return users().findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { ...changes, updatedAt: new Date() } },
    { returnDocument: 'after', projection: { passwordHash: 0 } }
  );
}

async function deleteUser(id) {
  const result = await users().deleteOne({ _id: toObjectId(id) });
  return result.deletedCount === 1;
}

function usersWithProfile(includeEmail) {
  const hidden = includeEmail ? { passwordHash: 0 } : { email: 0, passwordHash: 0 };
  const visible = {
    role: 1,
    status: 1,
    firstName: '$profile.firstName',
    lastName: '$profile.lastName',
    age: '$profile.age',
    city: '$profile.city',
    sector: '$profile.sector',
    gender: '$profile.gender',
  };
  if (includeEmail) visible.email = 1;

  return users().aggregate([
    { $project: hidden },
    {
      $lookup: {
        from: 'profiles',
        localField: '_id',
        foreignField: 'userId',
        as: 'profile',
      },
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
    { $project: visible },
  ]).toArray();
}

async function getAllUsers() {
  return usersWithProfile(true);
}

async function getPublicUsers() {
  return usersWithProfile(false);
}

module.exports = {
  insertUser,
  getUserById,
  getUserByEmail,
  getUserByEmailWithPassword,
  updateUser,
  deleteUser,
  getAllUsers,
  getPublicUsers,
};
