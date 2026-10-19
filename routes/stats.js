const express = require('express');
const { list } = require('../lib/mongo');
const { requireAuth, route } = require('../lib/middleware');

const router = express.Router();

async function computeStats(userId) {
  const earningsOnly = { projection: { views: 1, earnings: 1 } };
  const [submissions, withdrawals, deposits] = await Promise.all([
    list('submissions', { user_id: userId }, earningsOnly),
    list('withdrawals', { user_id: userId }),
    list('deposits', { user_id: userId }),
  ]);

  const whatsappEarned = submissions.reduce((sum, s) => sum + s.earnings, 0);
  const totalViews = submissions.reduce((sum, s) => sum + s.views, 0);
  const approved = withdrawals.filter((w) => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);
  const pending = withdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);
  const rejected = withdrawals.filter((w) => w.status === 'rejected').reduce((sum, w) => sum + w.amount, 0);
  const available = Math.max(0, whatsappEarned - approved - pending);

  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-KE', { weekday: 'short' }), approved: 0, pending: 0, rejected: 0 });
  }
  const dayIndex = Object.fromEntries(days.map((d, i) => [d.date, i]));
  for (const w of withdrawals) {
    const key = w.created_at.slice(0, 10);
    if (dayIndex[key] !== undefined && w.status in days[dayIndex[key]]) {
      days[dayIndex[key]][w.status] += w.amount;
    }
  }

  const activity = withdrawals
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)
    .map((w) => ({
      id: w.id,
      type: 'withdrawal',
      amount: w.amount,
      status: w.status,
      method: w.method,
      created_at: w.created_at,
    }));

  const depositStatus = deposits.some((d) => d.status === 'approved') ? 'active' : deposits.some((d) => d.status === 'pending') ? 'pending' : 'none';

  return {
    summary: {
      whatsapp_earned: whatsappEarned,
      total_views: totalViews,
      total_submissions: submissions.length,
      withdrawn_approved: approved,
      withdrawn_pending: pending,
      withdrawn_rejected: rejected,
      available_balance: available,
    },
    trend: days,
    status_totals: { approved, pending, rejected },
    activity,
    membership: { deposit_status: depositStatus, current_package: depositStatus === 'active' ? 'Gold Agent' : 'Starter' },
  };
}

router.get('/dashboard', requireAuth, route(async (req, res) => {
  res.json(await computeStats(req.user.id));
}));

module.exports = router;
