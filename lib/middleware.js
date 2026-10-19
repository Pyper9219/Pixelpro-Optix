const { byId } = require('./mongo');
const { verify } = require('./auth');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/* Express 4 does not await handlers, so every async route needs this wrapper. */
function route(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function authenticate(req) {
  const payload = verify(extractToken(req));
  if (!payload || !payload.uid) return 'Your session has expired. Please sign in again.';
  const user = await byId('users', payload.uid);
  if (!user) return 'Account not found';
  req.user = user;
  return null;
}

const requireAuth = route(async (req, res, next) => {
  const error = await authenticate(req);
  if (error) return res.status(401).json({ error });
  next();
});

const requireAdmin = route(async (req, res, next) => {
  const error = await authenticate(req);
  if (error) return res.status(401).json({ error });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
});

function publicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

module.exports = { requireAuth, requireAdmin, publicUser, extractToken, route };
