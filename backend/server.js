require('dotenv').config();
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const { connectRedis, getRedisClient, getRedisStatus, disconnectRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');
const historyRoutes = require('./routes/history');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ── Trust proxy for Render/Heroku (required for secure cookies behind reverse proxy) ──
if (isProduction) {
  app.set('trust proxy', 1);
}

// ── Connect to databases ──────────────────────────────────────────────
connectDB();
const redisClient = connectRedis();

// ── Security Middleware ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' }, // Required for OAuth popup flows
}));

// ── Request Logging ───────────────────────────────────────────────────
app.use(morgan(isProduction ? 'combined' : 'dev', { stream: logger.stream }));

// ── Body Parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── CORS Configuration ───────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Session Configuration (Redis-backed) ──────────────────────────────
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'scrmail-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  },
};

// Use Redis for session storage if available, otherwise fall back to memory
if (redisClient && getRedisStatus()) {
  sessionConfig.store = new RedisStore({
    client: redisClient,
    prefix: 'sess:',
    ttl: 86400, // 24 hours in seconds
  });
  logger.info('📦 Session store: Redis');
} else {
  // Fallback: connect-mongo (original behavior)
  const MongoStore = require('connect-mongo');
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60,
  });
  logger.info('📦 Session store: MongoDB (Redis not available)');
}

app.use(session(sessionConfig));

// ── Passport Middleware ───────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Rate Limiting ─────────────────────────────────────────────────────
app.use('/api/', generalLimiter);

// ── Routes ────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/history', historyRoutes);

// ── Health Check ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ScrMail API is running',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      redis: getRedisStatus() ? 'connected' : 'disconnected',
      mongodb: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
    },
    security: {
      encryption: 'AES-256-GCM',
      rateLimiting: 'enabled',
      helmet: 'enabled',
      cors: 'configured',
    },
    timestamp: new Date().toISOString(),
  });
});

// ── Global Error Handler (must be last middleware) ────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 ScrMail server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 Security: Helmet, CORS, Rate Limiting, AES-256-GCM Encryption`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await disconnectRedis();
      await require('mongoose').disconnect();
      logger.info('All connections closed. Exiting.');
      process.exit(0);
    } catch (error) {
      logger.error(`Shutdown error: ${error.message}`);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
