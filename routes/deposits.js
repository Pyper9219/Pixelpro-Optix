const express = require('express');
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/middleware');

const router = express.Router();
const MPESA_PAYBILL = '0104074325';

router.get('/info', requireAuth, (req, res) => {
  res.json({ mpesa_number: MPESA_PAYBILL });
});

router.get('/mine', requireAuth, (req, res) => {
  const deposits = db
    .collection('deposits')
    .find((d) => d.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20);
  res.json({ deposits, mpesa_number: MPESA_PAYBILL });
});

router.post('/', requireAuth, (req, res) => {
  const code = String(req.body.transaction_code || '').trim().toUpperCase();
  const amount = req.body.amount !== undefined && req.body.amount !== '' ? Number(req.body.amount) : null;

  if (!/^[A-Z0-9]{6,20}$/.test(code)) {
    return res.status(400).json({ error: 'Enter a valid M-Pesa transaction code (e.g. QK12AB34CD)' });
  }
  if (amount !== null && (!Number.isFinite(amount) || amount < 1)) {
    return res.status(400).json({ error: 'Enter a valid amount sent' });
  }
  const dup = db.collection('deposits').findOne((d) => d.transaction_code === code);
  if (dup) {
    return res.status(409).json({ error: 'This transaction code has already been used' });
  }

  const deposit = db.collection('deposits').insert({
    user_id: req.user.id,
    transaction_code: code,
    amount: amount || null,
    method: 'M-Pesa',
    status: 'pending',
  });

  db.collection('notifications').insert({
    user_id: req.user.id,
    icon: '💰',
    title: 'Activation request received',
    body: `Transaction ${code} received. Your account activation is pending confirmation.`,
    read: false,
  });

  res.status(201).json({ deposit });
});

module.exports = router;
