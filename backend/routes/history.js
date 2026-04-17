const router = require('express').Router();
const SearchHistory = require('../models/SearchHistory');
const ensureAuth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const { getCache, setCache, deleteCache } = require('../config/redis');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Search History Routes
 *
 * GET    /api/history      → Get user's search history (cached in Redis)
 * POST   /api/history      → Save a new search keyword
 * DELETE /api/history/:id  → Delete a history entry
 *
 * Redis caching: History list cached for 5 minutes per user.
 * Cache is invalidated on POST and DELETE operations.
 */

/**
 * Get the Redis cache key for a user's search history.
 * @param {string} userId
 * @returns {string}
 */
const getHistoryCacheKey = (userId) => `cache:history:${userId}`;

// @route   GET /api/history
// @desc    Get search history for current user
router.get('/', ensureAuth, async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = getHistoryCacheKey(userId);

    // ── Check Redis cache first ──
    const cachedHistory = await getCache(cacheKey);
    if (cachedHistory) {
      logger.debug(`History cache HIT (user: ${req.user.email})`);
      return ApiResponse.success(res, cachedHistory, 'Search history retrieved from cache', 200, {
        cached: true,
      });
    }

    // ── Fetch from MongoDB ──
    const history = await SearchHistory.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(30)
      .lean(); // .lean() for better performance (plain objects, no Mongoose overhead)

    // ── Cache in Redis (5 minutes) ──
    await setCache(cacheKey, history, 300);
    logger.debug(`History cache MISS → fetched ${history.length} entries (user: ${req.user.email})`);

    return ApiResponse.success(res, history, 'Search history retrieved', 200, { cached: false });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/history
// @desc    Save a search keyword to history
router.post(
  '/',
  ensureAuth,
  validate(schemas.historyKeyword, 'body'),
  async (req, res, next) => {
    try {
      const { keyword } = req.body;

      const entry = await SearchHistory.create({
        userId: req.user._id,
        keyword: keyword.trim(),
      });

      // ── Invalidate history cache so next GET is fresh ──
      const cacheKey = getHistoryCacheKey(req.user._id.toString());
      await deleteCache(cacheKey);

      logger.info(`Search saved: "${keyword}" (user: ${req.user.email})`);
      return ApiResponse.created(res, entry, 'Search keyword saved');
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/history/:id
// @desc    Delete a search history entry
router.delete(
  '/:id',
  ensureAuth,
  validate(schemas.objectId, 'params'),
  async (req, res, next) => {
    try {
      const entry = await SearchHistory.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!entry) {
        throw ApiError.notFound('History entry not found');
      }

      // ── Invalidate history cache ──
      const cacheKey = getHistoryCacheKey(req.user._id.toString());
      await deleteCache(cacheKey);

      logger.info(`History entry deleted: "${entry.keyword}" (user: ${req.user.email})`);
      return ApiResponse.success(res, null, 'Deleted successfully');
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
