const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/middleware');

const router = express.Router();

const { UPLOAD_DIR } = require('../lib/paths');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  },
});

const RATE_PER_VIEW = 100;
const COOLDOWN_MS = 1000 * 60 * 60 * 24;

router.get('/', requireAuth, (req, res) => {
  const submissions = db
    .collection('submissions')
    .find((s) => s.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);
  const newest = submissions[0] || null;
  const cooldownRemaining = newest
    ? Math.max(0, COOLDOWN_MS - (Date.now() - new Date(newest.created_at).getTime()))
    : 0;
  res.json({ submissions, rate_per_view: RATE_PER_VIEW, cooldown_ms: cooldownRemaining });
});

router.post('/', requireAuth, upload.single('screenshot'), (req, res) => {
  const phone = String(req.body.phone_number || '').trim();
  const views = Number(req.body.views);

  if (!/^\+?[\d\s-]{9,15}$/.test(phone)) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Please enter a valid phone number' });
  }
  if (!Number.isInteger(views) || views < 1 || views > 10000) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Views must be a whole number between 1 and 10,000' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Please attach a screenshot proof of your ad views' });
  }

  const mine = db
    .collection('submissions')
    .find((s) => s.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const newest = mine[0];
  if (newest) {
    const elapsed = Date.now() - new Date(newest.created_at).getTime();
    if (elapsed < COOLDOWN_MS) {
      fs.unlink(req.file.path, () => {});
      const hoursRemaining = (COOLDOWN_MS - elapsed) / 3600000;
      return res.status(429).json({
        error: `You can submit once every 24 hours. ${hoursRemaining.toFixed(1)} hours remaining.`,
        cooldown_ms: COOLDOWN_MS - elapsed,
      });
    }
  }

  const submission = db.collection('submissions').insert({
    user_id: req.user.id,
    phone_number: phone,
    views,
    earnings: views * RATE_PER_VIEW,
    image_url: `/uploads/${req.file.filename}`,
  });

  db.collection('notifications').insert({
    user_id: req.user.id,
    icon: '✅',
    title: 'Views submitted',
    body: `Your submission of ${views} views was received. KES ${(views * RATE_PER_VIEW).toLocaleString()} added to your WhatsApp balance.`,
    read: false,
  });

  res.status(201).json({ submission });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Screenshot must be under 5MB' });
  }
  if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
  next();
});

module.exports = router;
