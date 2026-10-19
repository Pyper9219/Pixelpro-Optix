/* One-off migration: data/db.json -> MongoDB.
   Idempotent (upserts by document id) and re-runnable after further local edits.
   Screenshots that lived under /uploads are inlined as data URLs so the files
   survive on read-only serverless hosts.

   usage: node scripts/migrate-to-mongo.js [--db=data/db.json] [--admin=email@example.co] [--dry-run]
*/
const fs = require('fs');
const os = require('os');
const path = require('path');

if (!process.env.MONGODB_URI) { try { process.loadEnvFile(); } catch { /* env provided by the shell */ } }

const { connect, collection, DB_NAME } = require('../lib/mongo');

const ROOT = path.join(__dirname, '..');
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const DRY = process.argv.includes('--dry-run');
const ADMIN_EMAIL = arg('admin', '');

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

/* Old uploads may sit in the project dir or in the temp fallback used at runtime. */
const UPLOAD_DIRS = [
  path.join(ROOT, 'public', 'uploads'),
  path.join(require('os').tmpdir(), 'riamxo', 'uploads'),
];

function inlineImage(url) {
  if (!url || !url.startsWith('/uploads/')) return url;
  const base = path.basename(url);
  const file = UPLOAD_DIRS.map((dir) => path.join(dir, base)).find((p) => fs.existsSync(p));
  if (!file) {
    console.warn(`  ! screenshot missing on disk, kept as-is: ${url}`);
    return url;
  }
  const mime = MIME[path.extname(file).toLowerCase()] || 'image/png';
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

async function upsertAll(name, docs) {
  const col = await collection(name);
  if (!docs.length) return 0;
  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { id: doc.id },
      update: { $set: doc },
      upsert: true,
    },
  }));
  const result = await col.bulkWrite(ops, { ordered: false });
  return result.upsertedCount + result.modifiedCount;
}

(async () => {
  const dbFile = path.resolve(ROOT, arg('db', path.join('data', 'db.json')));
  if (!fs.existsSync(dbFile)) throw new Error(`no such file: ${dbFile}`);
  const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

  for (const submission of data.submissions || []) {
    submission.image_url = inlineImage(submission.image_url);
  }

  let users = data.users || [];
  if (ADMIN_EMAIL) {
    const target = users.find((u) => u.email === ADMIN_EMAIL.toLowerCase());
    if (!target) throw new Error(`--admin address not found in ${dbFile}: ${ADMIN_EMAIL}`);
    target.role = 'admin';
    users = users.filter((u) => u.id !== target.id);
    users.unshift(target);
  }

  const collections = {
    users,
    submissions: data.submissions || [],
    withdrawals: data.withdrawals || [],
    deposits: data.deposits || [],
    notifications: data.notifications || [],
    sponsor_ads: data.sponsor_ads || [],
  };

  const counts = Object.entries(collections).map(([name, docs]) => `${name}=${docs.length}`).join('  ');
  console.log(`${DRY ? 'dry run' : 'migrating'} -> mongodb atlas db "${DB_NAME}"  ${counts}`);
  if (DRY) return;

  await connect();
  for (const [name, docs] of Object.entries(collections)) {
    const written = await upsertAll(name, docs);
    console.log(`  ${name}: ${written} written`);
  }
  console.log('done.');
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('MIGRATION FAILED:', error.message);
    process.exit(1);
  });
