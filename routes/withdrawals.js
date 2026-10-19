const express = require('express');
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/middleware');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const withdrawals = db
    .collection('withdrawals')
    .find((w) => w.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);
  res.json({ withdrawals });
});

router.post('/', requireAuth, (req, res) => {
  const amount = Number(req.body.amount);
  const phone = String(req.body.phone_number || '').trim();
  const method = req.body.method === 'Bank Transfer' ? 'Bank Transfer' : 'M-Pesa';
  const notes = String(req.body.notes || '').slice(0, 300);

  if (!Number.isFinite(amount) || amount < 100) {
    return res.status(400).json({ error: 'Minimum withdrawal amount is KES 100' });
  }
  if (amount > 500000) {
    return res.status(400).json({ error: 'Maximum withdrawal amount is KES 500,000' });
  }
  if (!/^\+?[\d\s-]{9,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Please enter a valid M-Pesa phone number' });
  }

  const mine = db.collection('submissions').find((s) => s.user_id === req.user.id);
  const earned = mine.reduce((sum, s) => sum + s.earnings, 0);
  const myWithdrawals = db.collection('withdrawals').find((w) => w.user_id === req.user.id);
  const approved = myWithdrawals.filter((w) => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);
  const pending = myWithdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);
  const available = Math.max(0, earned - approved - pending);

  if (amount > available) {
    return res.status(400).json({ error: `Insufficient balance. Available: KES ${available.toLocaleString()}` });
  }

  const withdrawal = db.collection('withdrawals').insert({
    user_id: req.user.id,
    amount: Math.round(amount * 100) / 100,
    phone_number: phone,
    method,
    notes,
    status: 'pending',
  });

  db.collection('notifications').insert({
    user_id: req.user.id,
    icon: '💸',
    title: 'Withdrawal requested',
    body: `Your withdrawal request of KES ${amount.toLocaleString()} via ${method} was received and is pending review.`,
    read: false,
  });

  res.status(201).json({ withdrawal });
});

module.exports = router;
