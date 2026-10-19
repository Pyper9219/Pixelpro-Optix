const express = require('express');
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/middleware');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const notifications = db
    .collection('notifications')
    .find((n) => n.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 30);
  const unread = notifications.filter((n) => !n.read).length;
  res.json({ notifications, unread });
});

router.post('/read', requireAuth, (req, res) => {
  const id = String(req.body.id || '');
  const n = db.collection('notifications').byId(id);
  if (!n || n.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  db.collection('notifications').update(id, { read: true });
  res.json({ ok: true });
});

router.post('/read-all', requireAuth, (req, res) => {
  const mine = db.collection('notifications').find((n) => n.user_id === req.user.id && !n.read);
  for (const n of mine) db.collection('notifications').update(n.id, { read: true });
  res.json({ ok: true, updated: mine.length });
});

module.exports = router;
