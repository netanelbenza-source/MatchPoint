const { MongoClient } = require('mongodb');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/matchpoint';

let client;
let db;

async function connectDb(uri = process.env.MONGODB_URI || DEFAULT_URI) {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  await ensureIndexes(db);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not connected. Call connectDb() before using repositories.');
  }
  return db;
}

async function closeDb() {
  if (!client) return;
  await client.close();
  client = undefined;
  db = undefined;
}

async function ensureIndexes(database) {
  await database.collection('users').createIndex({ email: 1 }, { unique: true });
  await database.collection('users').createIndex({ passwordResetToken: 1 }, { unique: true, sparse: true });
  await database.collection('pendingUsers').createIndex({ email: 1 }, { unique: true });
  await database.collection('pendingUsers').createIndex({ verificationToken: 1 }, { unique: true });
  await database.collection('profiles').createIndex({ userId: 1 }, { unique: true });
  await database.collection('preferences').createIndex({ userId: 1 }, { unique: true });
  await database.collection('matches').createIndex({ userId: 1, candidateId: 1 }, { unique: true });
  await database.collection('matchmakers').createIndex({ email: 1 }, { unique: true });
  await database.collection('matchConfirmations').createIndex({ token: 1 }, { unique: true });
  await database.collection('matchConfirmations').createIndex({ userId: 1, candidateId: 1, matchmakerId: 1, status: 1 });
}

module.exports = {
  connectDb,
  getDb,
  closeDb,
};
