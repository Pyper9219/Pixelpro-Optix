const { db } = require('./db');
const { verify } = require('./auth');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

function requireAuth(req, res, next) {
  const payload = verify(extractToken(req));
  if (!payload || !payload.uid) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
  const user = db.collection('users').byId(payload.uid);
  if (!user) {
    return res.status(401).json({ error: 'Account not found' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

function publicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

module.exports = { requireAuth, requireAdmin, publicUser, extractToken };
