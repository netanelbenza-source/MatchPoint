const { getDb } = require('../db');

const COLLECTION = 'pendingUsers';

function pendingUsers() {
  return getDb().collection(COLLECTION);
}

async function replacePendingUser(user) {
  const doc = {
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role || 'user',
    status: user.status || 'active',
    verificationToken: user.verificationToken,
    createdAt: new Date(),
  };
  await pendingUsers().deleteMany({ email: doc.email });
  const result = await pendingUsers().insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

async function claimPendingUser(token) {
  return pendingUsers().findOneAndDelete({ verificationToken: token });
}

async function deletePendingUser(id) {
  const result = await pendingUsers().deleteOne({ _id: id });
  return result.deletedCount === 1;
}

module.exports = {
  replacePendingUser,
  claimPendingUser,
  deletePendingUser,
};
