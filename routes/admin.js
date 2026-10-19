const express = require('express');
const { db } = require('../lib/db');
const { requireAdmin, publicUser } = require('../lib/middleware');

const router = express.Router();
router.use(requireAdmin);

function withUser(records) {
  return records.map((r) => ({
    ...r,
    user: publicUser(db.collection('users').byId(r.user_id)),
  }));
}

router.get('/pending', (req, res) => {
  const withdrawals = db
    .collection('withdrawals')
    .find((w) => w.status === 'pending')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const deposits = db
    .collection('deposits')
    .find((d) => d.status === 'pending')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json({ withdrawals: withUser(withdrawals), deposits: withUser(deposits) });
});

router.post('/withdrawals/:id/:action', (req, res) => {
  const { id, action } = req.params;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  const w = db.collection('withdrawals').byId(id);
  if (!w) return res.status(404).json({ error: 'Withdrawal not found' });
  if (w.status !== 'pending') return res.status(409).json({ error: 'Already processed' });
  const status = action === 'approve' ? 'approved' : 'rejected';
  const updated = db.collection('withdrawals').update(id, {
    status,
    reviewed_by: req.user.id,
    reviewed_at: new Date().toISOString(),
  });
  db.collection('notifications').insert({
    user_id: w.user_id,
    icon: action === 'approve' ? '✅' : '❌',
    title: action === 'approve' ? 'Withdrawal processed' : 'Withdrawal rejected',
    body:
      action === 'approve'
        ? `Your withdrawal of KES ${w.amount.toLocaleString()} via ${w.method} has been approved and sent.`
        : `Your withdrawal of KES ${w.amount.toLocaleString()} was rejected. Contact support for details.`,
    read: false,
  });
  res.json({ withdrawal: updated });
});

router.post('/deposits/:id/:action', (req, res) => {
  const { id, action } = req.params;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  const d = db.collection('deposits').byId(id);
  if (!d) return res.status(404).json({ error: 'Deposit not found' });
  if (d.status !== 'pending') return res.status(409).json({ error: 'Already processed' });
  const status = action === 'approve' ? 'approved' : 'rejected';
  const updated = db.collection('deposits').update(id, { status });
  db.collection('notifications').insert({
    user_id: d.user_id,
    icon: action === 'approve' ? '💰' : '❌',
    title: action === 'approve' ? 'Deposit approved' : 'Deposit rejected',
    body:
      action === 'approve'
        ? `Transaction ${d.transaction_code} confirmed. Your account is now active.`
        : `Transaction ${d.transaction_code} could not be verified. Contact support.`,
    read: false,
  });
  res.json({ deposit: updated });
});

module.exports = router;
