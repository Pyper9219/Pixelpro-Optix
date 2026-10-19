const express = require('express');
const { list, byId, countDocs, updateById, updateMany } = require('../lib/mongo');
const { requireAuth, route } = require('../lib/middleware');

const router = express.Router();

router.get('/', requireAuth, route(async (req, res) => {
  const notifications = await list('notifications', { user_id: req.user.id },
    { sort: { created_at: -1 }, limit: 30 });
  const unread = await countDocs('notifications', { user_id: req.user.id, read: false });
  res.json({ notifications, unread });
}));

router.post('/read', requireAuth, route(async (req, res) => {
  const id = String(req.body.id || '');
  const n = await byId('notifications', id);
  if (!n || n.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  await updateById('notifications', id, { read: true });
  res.json({ ok: true });
}));

router.post('/read-all', requireAuth, route(async (req, res) => {
  const query = { user_id: req.user.id, read: false };
  const updated = await countDocs('notifications', query);
  if (updated) await updateMany('notifications', query, { read: true });
  res.json({ ok: true, updated });
}));

module.exports = router;
