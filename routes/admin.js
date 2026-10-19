const express = require('express');
const { list, byId, insert, updateWhere } = require('../lib/mongo');
const { requireAdmin, publicUser, route } = require('../lib/middleware');

const router = express.Router();
router.use(requireAdmin);

async function withUser(records) {
  const ids = [...new Set(records.map((r) => r.user_id))];
  const users = ids.length ? await list('users', { id: { $in: ids } }) : [];
  const found = new Map(users.map((u) => [u.id, u]));
  return records.map((r) => ({ ...r, user: publicUser(found.get(r.user_id)) }));
}

router.get('/pending', route(async (req, res) => {
  const sort = { created_at: 1 };
  const [withdrawals, deposits] = await Promise.all([
    list('withdrawals', { status: 'pending' }, { sort }),
    list('deposits', { status: 'pending' }, { sort }),
  ]);
  res.json({
    withdrawals: await withUser(withdrawals),
    deposits: await withUser(deposits),
  });
}));

/* The status filter makes approve/reject a one-way transition: a second admin
   racing the same request gets null and sees "Already processed". */
router.post('/withdrawals/:id/:action', route(async (req, res) => {
  const { id, action } = req.params;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  const status = action === 'approve' ? 'approved' : 'rejected';
  const updated = await updateWhere('withdrawals', { id, status: 'pending' }, {
    status,
    reviewed_by: req.user.id,
    reviewed_at: new Date().toISOString(),
  });
  if (!updated) {
    if (!(await byId('withdrawals', id))) return res.status(404).json({ error: 'Withdrawal not found' });
    return res.status(409).json({ error: 'Already processed' });
  }

  await insert('notifications', {
    user_id: updated.user_id,
    icon: action === 'approve' ? '✅' : '❌',
    title: action === 'approve' ? 'Withdrawal processed' : 'Withdrawal rejected',
    body:
      action === 'approve'
        ? `Your withdrawal of KES ${updated.amount.toLocaleString()} via ${updated.method} has been approved and sent.`
        : `Your withdrawal of KES ${updated.amount.toLocaleString()} was rejected. Contact support for details.`,
    read: false,
  });
  res.json({ withdrawal: updated });
}));

router.post('/deposits/:id/:action', route(async (req, res) => {
  const { id, action } = req.params;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  const status = action === 'approve' ? 'approved' : 'rejected';
  const updated = await updateWhere('deposits', { id, status: 'pending' }, { status });
  if (!updated) {
    if (!(await byId('deposits', id))) return res.status(404).json({ error: 'Deposit not found' });
    return res.status(409).json({ error: 'Already processed' });
  }

  await insert('notifications', {
    user_id: updated.user_id,
    icon: action === 'approve' ? '💰' : '❌',
    title: action === 'approve' ? 'Deposit approved' : 'Deposit rejected',
    body:
      action === 'approve'
        ? `Transaction ${updated.transaction_code} confirmed. Your account is now active.`
        : `Transaction ${updated.transaction_code} could not be verified. Contact support.`,
    read: false,
  });
  res.json({ deposit: updated });
}));

module.exports = router;
