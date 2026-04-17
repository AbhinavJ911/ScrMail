const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisConnected = false;

/**
 * Initialize Redis client.
 * Supports REDIS_URL (Upstash/Redis Cloud with TLS) and local Redis.
 * Falls back gracefully if Redis is unavailable — app still works without caching.
 */
const connectRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      // Production: connect via URL (Upstash, Redis Cloud, etc.)
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 5) {
            logger.warn('Redis: Max retries reached, stopping reconnection');
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000); // Exponential backoff, max 2s
        },
        tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      });
    } else {
      // Local development: connect to localhost
      redisClient = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) {
            logger.warn('Redis: Local Redis not available, disabling cache');
            return null;
          }
          return Math.min(times * 200, 1000);
        },
      });
    }

    redisClient.on('connect', () => {
      isRedisConnected = true;
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('ready', () => {
      isRedisConnected = true;
      logger.info('✅ Redis ready to accept commands');
      initEmailIndex();
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      logger.error(`❌ Redis error: ${err.message}`);
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
      logger.warn('⚠️ Redis connection closed');
    });

    return redisClient;
  } catch (error) {
    logger.error(`❌ Redis initialization failed: ${error.message}`);
    return null;
  }
};

/**
 * Get the Redis client instance.
 * @returns {Redis|null}
 */
const getRedisClient = () => redisClient;

/**
 * Check if Redis is currently connected.
 * @returns {boolean}
 */
const getRedisStatus = () => isRedisConnected;

/**
 * Gracefully disconnect Redis.
 */
const disconnectRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis disconnected gracefully');
    } catch (err) {
      logger.error(`Redis disconnect error: ${err.message}`);
    }
  }
};

/**
 * Initialize RediSearch index for emails.
 */
const initEmailIndex = async () => {
  if (!redisClient) return;
  try {
    await redisClient.call('FT.INFO', 'idx:emails');
    logger.debug('✅ RediSearch index "idx:emails" already exists.');
  } catch (error) {
    if (error.message.includes('Unknown Index name')) {
      logger.info('⚠️ RediSearch index "idx:emails" not found, creating...');
      try {
        await redisClient.call(
          'FT.CREATE', 'idx:emails',
          'ON', 'HASH',
          'PREFIX', '1', 'email:',
          'SCHEMA',
          'userId', 'TAG',
          'subject', 'TEXT',
          'snippet', 'TEXT', 'body', 'TEXT',
          'id', 'TAG',
          'date', 'TEXT'
        );
        logger.info('✅ RediSearch index "idx:emails" created successfully.');
      } catch (createErr) {
        logger.error(`❌ Failed to create RediSearch index: ${createErr.message}`);
      }
    } else {
      logger.error(`❌ Error checking RediSearch index: ${error.message}`);
    }
  }
};

// ── Cache helper utilities ──────────────────────────────────────────

/**
 * Get a cached value from Redis.
 * Returns null if Redis is down or key doesn't exist.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Redis getCache error for key "${key}": ${err.message}`);
    return null;
  }
};

/**
 * Set a cached value in Redis with TTL.
 * Silently fails if Redis is down.
 * @param {string} key
 * @param {any} value - Will be JSON.stringify'd
 * @param {number} ttlSeconds - Time to live in seconds
 */
const setCache = async (key, value, ttlSeconds = 600) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.error(`Redis setCache error for key "${key}": ${err.message}`);
  }
};

/**
 * Delete a cached key (or pattern of keys).
 * @param {string} key
 */
const deleteCache = async (key) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.error(`Redis deleteCache error for key "${key}": ${err.message}`);
  }
};

/**
 * Delete all keys matching a pattern.
 * Useful for invalidating user-specific caches.
 * @param {string} pattern - e.g., "cache:history:userId*"
 */
const deleteCachePattern = async (pattern) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err) {
    logger.error(`Redis deleteCachePattern error for "${pattern}": ${err.message}`);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  getRedisStatus,
  disconnectRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  initEmailIndex,
};
