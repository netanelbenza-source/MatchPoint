const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { connectDb } = require('./db');
const { verifyMailTransport } = require('./services/mailService');
const { startWeeklyReset } = require('./jobs/weeklyReset');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const userRoutes = require('./routes/userRoutes');
const matchRoutes = require('./routes/matchRoutes');
const matchmakerRoutes = require('./routes/matchmakerRoutes');
const aiRoutes = require('./routes/aiRoutes');
const engagementRoutes = require('./routes/engagementRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;
  if (process.env.CLIENT_ORIGIN && origin === process.env.CLIENT_ORIGIN) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/matchmakers', matchmakerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/engagements', engagementRoutes);

async function start() {
  await connectDb();
  await verifyMailTransport();
  startWeeklyReset();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = app;
