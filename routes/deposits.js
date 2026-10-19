const express = require('express');
const { insert, list, isDuplicate } = require('../lib/mongo');
const { requireAuth, route } = require('../lib/middleware');

const router = express.Router();
const MPESA_PAYBILL = '0104074325';

router.get('/info', requireAuth, (req, res) => {
  res.json({ mpesa_number: MPESA_PAYBILL });
});

router.get('/mine', requireAuth, route(async (req, res) => {
  const deposits = await list('deposits', { user_id: req.user.id },
    { sort: { created_at: -1 }, limit: 20 });
  res.json({ deposits, mpesa_number: MPESA_PAYBILL });
}));

router.post('/', requireAuth, route(async (req, res) => {
  const code = String(req.body.transaction_code || '').trim().toUpperCase();
  const amount = req.body.amount !== undefined && req.body.amount !== '' ? Number(req.body.amount) : null;

  if (!/^[A-Z0-9]{6,20}$/.test(code)) {
    return res.status(400).json({ error: 'Enter a valid M-Pesa transaction code (e.g. QK12AB34CD)' });
  }
  if (amount !== null && (!Number.isFinite(amount) || amount < 1)) {
    return res.status(400).json({ error: 'Enter a valid amount sent' });
  }

  let deposit;
  try {
    deposit = await insert('deposits', {
      user_id: req.user.id,
      transaction_code: code,
      amount: amount || null,
      method: 'M-Pesa',
      status: 'pending',
    });
  } catch (error) {
    if (isDuplicate(error)) {
      return res.status(409).json({ error: 'This transaction code has already been used' });
    }
    throw error;
  }

  await insert('notifications', {
    user_id: req.user.id,
    icon: '💰',
    title: 'Activation request received',
    body: `Transaction ${code} received. Your account activation is pending confirmation.`,
    read: false,
  });

  res.status(201).json({ deposit });
}));

module.exports = router;
