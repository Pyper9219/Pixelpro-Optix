const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { DATA_DIR } = require('./paths');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const COLLECTIONS = ['users', 'submissions', 'withdrawals', 'deposits', 'notifications', 'sponsor_ads'];

let db = null;
let writeQueue = Promise.resolve();

function load() {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch {
      db = {};
    }
  } else {
    db = {};
  }
  for (const c of COLLECTIONS) {
    if (!Array.isArray(db[c])) db[c] = [];
  }
  return db;
}

function persist() {
  writeQueue = writeQueue.then(() => {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, DB_FILE);
  });
  return writeQueue;
}

function id() {
  return crypto.randomBytes(12).toString('hex');
}

function now() {
  return new Date().toISOString();
}

const api = {
  collection(name) {
    load();
    return {
      all() {
        return db[name];
      },
      find(pred) {
        return db[name].filter(pred);
      },
      findOne(pred) {
        return db[name].find(pred) || null;
      },
      byId(recordId) {
        return db[name].find((r) => r.id === recordId) || null;
      },
      insert(record) {
        const rec = { id: id(), created_at: now(), updated_at: now(), ...record };
        db[name].push(rec);
        persist();
        return rec;
      },
      update(recordId, patch) {
        const rec = this.byId(recordId);
        if (!rec) return null;
        Object.assign(rec, patch, { updated_at: now() });
        persist();
        return rec;
      },
      remove(recordId) {
        const idx = db[name].findIndex((r) => r.id === recordId);
        if (idx === -1) return false;
        db[name].splice(idx, 1);
        persist();
        return true;
      },
      count(pred) {
        return pred ? db[name].filter(pred).length : db[name].length;
      },
    };
  },
};

module.exports = { db: api, load };
