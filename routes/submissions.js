const express = require('express');
const multer = require('multer');
const { insert, list, one, byId } = require('../lib/mongo');
const { requireAuth, route } = require('../lib/middleware');

const router = express.Router();

/* Screenshots are stored inline as data URLs: serverless instances share the
   database but not the disk, so a file path would break across cold starts. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  },
});

const RATE_PER_VIEW = 100;
const COOLDOWN_MS = 1000 * 60 * 60 * 24;

const newestSubmission = (userId) =>
  one('submissions', { user_id: userId }, { sort: { created_at: -1 } });

router.get('/', requireAuth, route(async (req, res) => {
  /* Screenshots travel as data URLs, so the list omits them; /:id loads one on demand. */
  const submissions = await list('submissions', { user_id: req.user.id },
    { sort: { created_at: -1 }, limit: 50, projection: { image_url: 0 } });
  const newest = submissions[0] || null;
  const cooldownRemaining = newest
    ? Math.max(0, COOLDOWN_MS - (Date.now() - new Date(newest.created_at).getTime()))
    : 0;
  res.json({ submissions, rate_per_view: RATE_PER_VIEW, cooldown_ms: cooldownRemaining });
}));

router.get('/:id', requireAuth, route(async (req, res) => {
  const submission = await byId('submissions', req.params.id);
  if (!submission || submission.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  res.json({ submission });
}));

router.post('/', requireAuth, upload.single('screenshot'), route(async (req, res) => {
  const phone = String(req.body.phone_number || '').trim();
  const views = Number(req.body.views);

  if (!/^\+?[\d\s-]{9,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Please enter a valid phone number' });
  }
  if (!Number.isInteger(views) || views < 1 || views > 10000) {
    return res.status(400).json({ error: 'Views must be a whole number between 1 and 10,000' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Please attach a screenshot proof of your ad views' });
  }

  const newest = await newestSubmission(req.user.id);
  if (newest) {
    const elapsed = Date.now() - new Date(newest.created_at).getTime();
    if (elapsed < COOLDOWN_MS) {
      const hoursRemaining = (COOLDOWN_MS - elapsed) / 3600000;
      return res.status(429).json({
        error: `You can submit once every 24 hours. ${hoursRemaining.toFixed(1)} hours remaining.`,
        cooldown_ms: COOLDOWN_MS - elapsed,
      });
    }
  }

  const submission = await insert('submissions', {
    user_id: req.user.id,
    phone_number: phone,
    views,
    earnings: views * RATE_PER_VIEW,
    image_url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
  });

  await insert('notifications', {
    user_id: req.user.id,
    icon: '✅',
    title: 'Views submitted',
    body: `Your submission of ${views} views was received. KES ${(views * RATE_PER_VIEW).toLocaleString()} added to your WhatsApp balance.`,
    read: false,
  });

  res.status(201).json({ submission });
}));

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Screenshot must be under 5MB' });
  }
  if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
  next();
});

module.exports = router;
