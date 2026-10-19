const express = require('express');
const { insert, one, countDocs, updateById, isDuplicate } = require('../lib/mongo');
const { hashPassword, verifyPassword, sign } = require('../lib/auth');
const { requireAuth, publicUser, route } = require('../lib/middleware');

const router = express.Router();
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueToken(user) {
  return sign({ uid: user.id, role: user.role, exp: Date.now() + TOKEN_TTL_MS });
}

router.post('/register', route(async (req, res) => {
  const { full_name, email, password, phone } = req.body || {};
  const name = String(full_name || '').trim();
  const mail = String(email || '').trim().toLowerCase();
  const pass = String(password || '');
  const phoneNumber = String(phone || '').trim();

  if (!name || name.length < 2) return res.status(400).json({ error: 'Please enter your full name' });
  if (!EMAIL_RE.test(mail)) return res.status(400).json({ error: 'Please enter a valid email address' });
  if (pass.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const isFirst = (await countDocs('users')) === 0;
  let user;
  try {
    user = await insert('users', {
      full_name: name,
      email: mail,
      phone: phoneNumber,
      bio: '',
      password_hash: hashPassword(pass),
      role: isFirst ? 'admin' : 'user',
    });
  } catch (error) {
    if (isDuplicate(error)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    throw error;
  }

  await insert('notifications', {
    user_id: user.id,
    icon: '🎉',
    title: 'Welcome to Riamxo Motors!',
    body: 'Your account is ready. Submit your first ad views to start earning KES 100 per view.',
    read: false,
  });

  res.status(201).json({ token: issueToken(user), user: publicUser(user) });
}));

router.post('/login', route(async (req, res) => {
  const { email, password } = req.body || {};
  const mail = String(email || '').trim().toLowerCase();
  const user = await one('users', { email: mail });
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: issueToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put('/me', requireAuth, route(async (req, res) => {
  const { phone, bio, full_name } = req.body || {};
  const patch = {};
  if (phone !== undefined) {
    const p = String(phone).trim();
    if (p && !/^\+?[\d\s-]{9,15}$/.test(p)) return res.status(400).json({ error: 'Invalid phone number' });
    patch.phone = p;
  }
  if (bio !== undefined) patch.bio = String(bio).slice(0, 300);
  if (full_name !== undefined) {
    const n = String(full_name).trim();
    if (n.length < 2) return res.status(400).json({ error: 'Name too short' });
    patch.full_name = n;
  }
  const updated = await updateById('users', req.user.id, patch);
  res.json({ user: publicUser(updated) });
}));

module.exports = router;
