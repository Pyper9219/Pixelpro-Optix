const express = require('express');
const path = require('path');

const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');
const withdrawalRoutes = require('./routes/withdrawals');
const depositRoutes = require('./routes/deposits');
const notificationRoutes = require('./routes/notifications');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');
const { load } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

load();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Riamxo Motors app running at http://localhost:${PORT}`);
});
