const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const { applySecret } = require('./auth');

const DB_NAME = process.env.MONGODB_DB || 'riamxo';
const SECRET_KEY = 'session_secret';

/* Per collection: a list of [keys, unique] pairs — only identity fields are unique. */
const INDEXES = {
  users: [[{ id: 1 }, true], [{ email: 1 }, true]],
  submissions: [[{ id: 1 }, true], [{ user_id: 1, created_at: -1 }, false]],
  withdrawals: [[{ id: 1 }, true], [{ user_id: 1, created_at: -1 }, false], [{ status: 1 }, false]],
  deposits: [[{ id: 1 }, true], [{ transaction_code: 1 }, true], [{ status: 1 }, false]],
  notifications: [[{ id: 1 }, true], [{ user_id: 1, created_at: -1 }, false]],
  sponsor_ads: [[{ id: 1 }, true], [{ active: 1, created_at: -1 }, false]],
  app_meta: [[{ key: 1 }, true]],
};

let pending = null;

function newId() {
  return crypto.randomBytes(12).toString('hex');
}

function now() {
  return new Date().toISOString();
}

/* Unique indexes reject duplicates with code 11000; routes translate that into 409s. */
function isDuplicate(error) {
  return Boolean(error && (error.code === 11000 || error.code === 11001));
}

function serializeAll(docs) {
  return docs.map(serialize);
}

/* Documents keep their own string id so API consumers never see Mongo internals. */
function serialize(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

/* Sessions are signed with a secret stored in the database. Serverless hosts give
   every cold instance its own filesystem and environment, so a per-instance
   secret makes requests that land elsewhere answer 401 "session expired".
   $setOnInsert means the first value written wins even when instances race. */
async function ensureSessionSecret(db) {
  const seed = String(process.env.RIAMXO_SECRET || process.env.AUTH_SECRET || '').trim()
    || crypto.randomBytes(32).toString('hex');
  const meta = db.collection('app_meta');
  await meta.updateOne(
    { key: SECRET_KEY },
    { $setOnInsert: { key: SECRET_KEY, value: seed, created_at: now() } },
    { upsert: true },
  );
  const doc = await meta.findOne({ key: SECRET_KEY });
  return (doc && doc.value) || seed;
}

function connect() {
  if (pending) return pending;
  const uri = process.env.MONGODB_URI;
  if (!uri) return Promise.reject(new Error('MONGODB_URI is not set'));

  pending = (async () => {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db(DB_NAME);
    for (const [name, specs] of Object.entries(INDEXES)) {
      for (const [keys, unique] of specs) {
        try {
          await db.collection(name).createIndex(keys, { unique, background: true });
        } catch (error) {
          /* Several cold instances can race to build the same index (code 86). */
          if (error.code !== 86 && !/already exists/i.test(error.message)) throw error;
        }
      }
    }
    applySecret(await ensureSessionSecret(db));
    return db;
  })().catch((error) => {
    pending = null;
    throw error;
  });

  return pending;
}

/* Also exported for one-off scripts (migration) that need the raw handle. */
async function collection(name) {
  return (await connect()).collection(name);
}

async function insert(name, record) {
  const doc = { id: newId(), created_at: now(), updated_at: now(), ...record };
  await (await collection(name)).insertOne(doc);
  return serialize(doc);
}

async function insertMany(name, records) {
  if (!records.length) return [];
  const docs = records.map((record) => ({ id: newId(), created_at: now(), updated_at: now(), ...record }));
  await (await collection(name)).insertMany(docs);
  return docs.map(serialize);
}

async function list(name, query = {}, { sort, limit, projection } = {}) {
  let cursor = (await collection(name)).find(query);
  if (projection) cursor = cursor.project(projection);
  if (sort) cursor = cursor.sort(sort);
  if (limit) cursor = cursor.limit(limit);
  return serializeAll(await cursor.toArray());
}

async function one(name, query, options = {}) {
  return serialize(await (await collection(name)).findOne(query, options));
}

async function byId(name, id) {
  return id ? one(name, { id }) : null;
}

async function countDocs(name, query = {}) {
  return (await collection(name)).countDocuments(query);
}

/* findOneAndUpdate keeps status transitions atomic: two admins cannot both
   approve the same pending request. */
async function updateWhere(name, query, patch) {
  const result = await (await collection(name)).findOneAndUpdate(
    query,
    { $set: { ...patch, updated_at: now() } },
    { returnDocument: 'after' },
  );
  return serialize(result);
}

async function updateById(name, id, patch) {
  return id ? updateWhere(name, { id }, patch) : null;
}

async function updateMany(name, query, patch) {
  const result = await (await collection(name)).updateMany(query, { $set: { ...patch, updated_at: now() } });
  return result.modifiedCount;
}

async function removeById(name, id) {
  if (!id) return false;
  const result = await (await collection(name)).deleteOne({ id });
  return result.deletedCount === 1;
}

module.exports = {
  DB_NAME,
  connect,
  collection,
  isDuplicate,
  insert,
  insertMany,
  list,
  one,
  byId,
  countDocs,
  updateWhere,
  updateById,
  updateMany,
  removeById,
};
