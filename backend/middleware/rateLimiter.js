const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getRedisClient, getRedisStatus } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Rate Limiting Middleware
 *
 * Uses Redis as the backing store in production (distributed, persistent).
 * Falls back to in-memory store if Redis is unavailable.
 */

/**
 * Create a rate limiter with optional Redis backing.
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @param {string} options.prefix - Redis key prefix
 * @returns {Function} Express middleware
 */
const createRateLimiter = ({ windowMs, max, message, prefix }) => {
  const config = {
    windowMs,
    max,
    message: {
      success: false,
      statusCode: 429,
      message: message || 'Too many requests, please try again later.',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use the IPv6-safe IP helper
      if (req.user?._id) {
        return req.user._id.toString();
      }
      return ipKeyGenerator(req);
    },
    validate: { xForwardedForHeader: false }, // Disable validation warnings for proxy setups
  };

  // Use Redis store if available
  const redisClient = getRedisClient();
  if (redisClient && getRedisStatus()) {
    try {
      config.store = new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: `rl:${prefix}:`,
      });
      logger.info(`Rate limiter "${prefix}" using Redis store`);
    } catch (err) {
      logger.warn(`Rate limiter "${prefix}" falling back to memory store: ${err.message}`);
    }
  } else {
    logger.info(`Rate limiter "${prefix}" using in-memory store (Redis not available)`);
  }

  return rateLimit(config);
};

// ── Pre-configured rate limiters ──────────────────────────────────────

/**
 * General API rate limiter: 100 requests per minute
 */
const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests. Please slow down.',
  prefix: 'general',
});

/**
 * Search-specific rate limiter: 30 searches per minute
 * Stricter limit since Gmail API calls are expensive
 */
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many search requests. Please wait a moment before searching again.',
  prefix: 'search',
});

/**
 * Auth rate limiter: 10 auth attempts per minute
 * Protects against brute force
 */
const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again later.',
  prefix: 'auth',
});

module.exports = {
  createRateLimiter,
  generalLimiter,
  searchLimiter,
  authLimiter,
};
