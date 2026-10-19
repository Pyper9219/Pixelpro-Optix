const express = require('express');
const multer = require('multer');
const { list, byId, insert, insertMany, countDocs, updateById, removeById } = require('../lib/mongo');
const { requireAuth, requireAdmin, route } = require('../lib/middleware');

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
const NEWEST_FIRST = { created_at: -1 };

const liveAds = () => list('sponsor_ads', { active: true }, { sort: NEWEST_FIRST });

async function present(ad) {
  const posted = await countDocs('submissions', { created_at: { $gte: ad.created_at } });
  return { ...ad, member_posts: posted };
}

router.get('/', requireAuth, route(async (req, res) => {
  const ads = await liveAds();
  res.json({ ads: await Promise.all(ads.slice(0, MAX_LIVE).map(present)) });
}));

router.get('/all', requireAdmin, route(async (req, res) => {
  res.json({ ads: await list('sponsor_ads', {}, { sort: NEWEST_FIRST }) });
}));

router.post('/', requireAdmin, upload.single('image'), route(async (req, res) => {
  const title = String(req.body.title || '').trim().slice(0, 90);
  const caption = String(req.body.caption || '').trim().slice(0, 300);
  if (!req.file) return res.status(400).json({ error: 'Please attach the product image' });
  if (!title) return res.status(400).json({ error: 'Give the campaign a title' });

  const ad = await insert('sponsor_ads', {
    title,
    caption: caption || 'Riamxo Motors — post it on your WhatsApp status for 24 hours to earn.',
    image_url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
    media_type: req.file.mimetype,
    active: true,
    created_by: req.user.id,
  });

  const others = await list('sponsor_ads', { active: true, id: { $ne: ad.id } },
    { sort: NEWEST_FIRST, projection: { id: 1 } });
  await Promise.all(others.slice(MAX_LIVE - 1).map((old) => updateById('sponsor_ads', old.id, { active: false })));

  const members = await list('users', { role: { $ne: 'admin' } }, { projection: { id: 1 } });
  await insertMany('notifications', members.map((u) => ({
    user_id: u.id,
    icon: '📣',
    title: 'New sponsor ad is live',
    body: `${title} is up on your Earn page. Post it on your WhatsApp status to keep earning.`,
    read: false,
  })));

  res.status(201).json({ ad: { ...ad, image_url: undefined } });
}));

router.post('/:id/toggle', requireAdmin, route(async (req, res) => {
  const ad = await byId('sponsor_ads', req.params.id);
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  const active = !ad.active;
  if (active && (await countDocs('sponsor_ads', { active: true })) >= MAX_LIVE) {
    return res.status(409).json({ error: `Only ${MAX_LIVE} live ads at a time — hide one first` });
  }
  res.json({ ad: await updateById('sponsor_ads', ad.id, { active }) });
}));

router.post('/:id/delete', requireAdmin, route(async (req, res) => {
  if (!(await removeById('sponsor_ads', req.params.id))) {
    return res.status(404).json({ error: 'Ad not found' });
  }
  res.json({ removed: true });
}));

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Product image must be under 2MB' });
  }
  if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
  next();
});

module.exports = router;
