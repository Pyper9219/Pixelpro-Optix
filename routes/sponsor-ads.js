const express = require('express');
const multer = require('multer');
const { db } = require('../lib/db');
const { requireAuth, requireAdmin } = require('../lib/middleware');

const router = express.Router();

/* The creative is stored inline as a data URL so members can still read it when
   the host serves the app from several stateless instances. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only PNG, JPG, WEBP or GIF images are allowed'), ok);
  },
});

const MAX_LIVE = 5;

function live() {
  return db
    .collection('sponsor_ads')
    .find((a) => a.active)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function present(ad) {
  const posted = db
    .collection('submissions')
    .find((s) => new Date(s.created_at).getTime() >= new Date(ad.created_at).getTime()).length;
  return { ...ad, member_posts: posted };
}

router.get('/', requireAuth, (req, res) => {
  res.json({ ads: live().slice(0, MAX_LIVE).map(present) });
});

router.get('/all', requireAdmin, (req, res) => {
  const ads = db
    .collection('sponsor_ads')
    .all()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ ads });
});

router.post('/', requireAdmin, upload.single('image'), (req, res) => {
  const title = String(req.body.title || '').trim().slice(0, 90);
  const caption = String(req.body.caption || '').trim().slice(0, 300);
  if (!req.file) return res.status(400).json({ error: 'Please attach the product image' });
  if (!title) return res.status(400).json({ error: 'Give the campaign a title' });

  const ad = db.collection('sponsor_ads').insert({
    title,
    caption: caption || 'Riamxo Motors — post it on your WhatsApp status for 24 hours to earn.',
    image_url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
    media_type: req.file.mimetype,
    active: true,
    created_by: req.user.id,
  });

  db.collection('sponsor_ads')
    .find((a) => a.active && a.id !== ad.id)
    .slice(MAX_LIVE)
    .forEach((old) => db.collection('sponsor_ads').update(old.id, { active: false }));

  db.collection('users')
    .find((u) => u.role !== 'admin')
    .forEach((u) =>
      db.collection('notifications').insert({
        user_id: u.id,
        icon: '📣',
        title: 'New sponsor ad is live',
        body: `${title} is up on your Earn page. Post it on your WhatsApp status to keep earning.`,
        read: false,
      }));

  res.status(201).json({ ad: { ...ad, image_url: undefined } });
});

router.post('/:id/toggle', requireAdmin, (req, res) => {
  const ad = db.collection('sponsor_ads').byId(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  const active = !ad.active;
  if (active && live().length >= MAX_LIVE) {
    return res.status(409).json({ error: `Only ${MAX_LIVE} live ads at a time — hide one first` });
  }
  res.json({ ad: db.collection('sponsor_ads').update(ad.id, { active }) });
});

router.post('/:id/delete', requireAdmin, (req, res) => {
  if (!db.collection('sponsor_ads').remove(req.params.id)) {
    return res.status(404).json({ error: 'Ad not found' });
  }
  res.json({ removed: true });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Product image must be under 2MB' });
  }
  if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
  next();
});

module.exports = router;
