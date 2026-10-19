/* Resolves writable storage directories. Serverless hosts mount the project
   directory read-only, so fall back to the OS temp dir when it cannot be written. */
const fs = require('fs');
const os = require('os');
const path = require('path');

function resolveDir(envOverride, defaultDir) {
  const wanted = envOverride || defaultDir;
  try {
    fs.mkdirSync(wanted, { recursive: true });
    fs.accessSync(wanted, fs.constants.W_OK);
    return wanted;
  } catch {
    const dir = path.join(os.tmpdir(), 'riamxo', path.basename(wanted));
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
}

const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_DIR = resolveDir(process.env.DATA_DIR, path.join(PROJECT_ROOT, 'data'));

module.exports = { DATA_DIR };
