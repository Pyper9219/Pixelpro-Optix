const express = require('express');
const path = require('path');

/* Local runs read .env; hosted runs already have the variables in the environment. */
if (!process.env.MONGODB_URI) { try { process.loadEnvFile(); } catch { /* host provides env */ } }

const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');
const withdrawalRoutes = require('./routes/withdrawals');
const depositRoutes = require('./routes/deposits');
const notificationRoutes = require('./routes/notifications');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');
const sponsorAdRoutes = require('./routes/sponsor-ads');
const { connect } = require('./lib/mongo');
const { route } = require('./lib/middleware');

const app = express();
const PORT = process.env.PORT || 3000;

/* On serverless hosts each invocation starts cold, so the connection is opened
   lazily on the first API request instead of at module load. */
app.use('/api', route(async (req, res, next) => {
  try {
    await connect();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return res.status(503).json({ error: 'Storage is unavailable right now. Please try again in a moment.' });
  }
  next();
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sponsor-ads', sponsorAdRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Riamxo Motors app running at http://localhost:${PORT}`);
  });
}

module.exports = app;
