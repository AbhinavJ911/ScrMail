const router = require('express').Router();
const crypto = require('crypto');
const { google } = require('googleapis');
const ensureAuth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const { searchLimiter } = require('../middleware/rateLimiter');
const { getCache, setCache, getRedisClient } = require('../config/redis');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Email Routes — Gmail API Search
 *
 * GET /api/email/search?q=keyword → Search user's Gmail inbox
 *
 * Features:
 * - Redis caching (10 min TTL per user+query combo)
 * - Rate limiting (30 searches/minute)
 * - Input validation via Joi
 * - Decrypted OAuth tokens for Gmail API
 * - Standardized API responses
 */

/**
 * Generate a cache key for email search results.
 * Uses a hash of the query to keep keys short and uniform.
 * @param {string} userId
 * @param {string} query
 * @returns {string}
 */
const getSearchCacheKey = (userId, query) => {
  const queryHash = crypto.createHash('md5').update(query.toLowerCase().trim()).digest('hex');
  return `cache:email:${userId}:${queryHash}`;
};

// @route   GET /api/email/search?q=keyword
// @desc    Search user's Gmail for emails matching keyword
router.get(
  '/search',
  ensureAuth,
  searchLimiter,
  validate(schemas.searchQuery, 'query'),
  async (req, res, next) => {
    try {
      const { q } = req.query;
      const userId = req.user._id.toString();

      // ── Check Redis cache (RediSearch) first ──
      const cacheKey = getSearchCacheKey(userId, q);
      const hasQueried = await getCache(cacheKey);
      const redisClient = getRedisClient();

      if (hasQueried && redisClient) {
        try {
          let searchQ = `@userId:{${userId}}`;
          if (q) searchQ += ` ${q.trim()}`;
          // Execute RediSearch
          const searchResult = await redisClient.call('FT.SEARCH', 'idx:emails', searchQ, 'LIMIT', '0', '50');
          
          if (searchResult && searchResult[0] > 0) {
            const count = searchResult[0];
            const emails = [];
            for (let i = 1; i < searchResult.length; i += 2) {
              const fields = searchResult[i + 1];
              const emailObj = { id: searchResult[i].replace(`email:${userId}:`, '') };
              for (let j = 0; j < fields.length; j += 2) {
                emailObj[fields[j]] = fields[j+1];
              }
              emails.push(emailObj);
            }
            logger.debug(`RediSearch HIT for search: "${q}" (user: ${req.user.email}), found ${count} emails`);
            return ApiResponse.success(res, { emails, total: emails.length }, 'Emails retrieved from RediSearch index', 200, {
              cached: true,
            });
          }
        } catch (err) {
          logger.error(`RediSearch error: ${err.message}`);
        }
      }

      logger.debug(`RediSearch MISS for search: "${q}" (user: ${req.user.email})`);

      // ── Get decrypted tokens ──
      const accessToken = req.user.getDecryptedAccessToken();
      const refreshToken = req.user.getDecryptedRefreshToken();

      if (!accessToken) {
        throw ApiError.unauthorized('No Gmail access token found. Please re-login.');
      }

      // ── Create OAuth2 client with decrypted tokens ──
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // ── Search for messages matching the query ──
      const messageList = await gmail.users.messages.list({
        userId: 'me',
        q: q.trim(),
        maxResults: 20,
      });

      if (!messageList.data.messages || messageList.data.messages.length === 0) {
        const emptyResult = { emails: [], total: 0 };
        await setCache(cacheKey, emptyResult, 300); // Cache empty results for 5 min
        return ApiResponse.success(res, emptyResult, 'No emails found', 200, { cached: false });
      }

      // ── Fetch details for each message ──
      const emailPromises = messageList.data.messages.map(async (msg) => {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        const headers = message.data.payload.headers;
        const fromHeader = headers.find((h) => h.name === 'From');
        const subjectHeader = headers.find((h) => h.name === 'Subject');
        const dateHeader = headers.find((h) => h.name === 'Date');

        // Extract email body
        let body = '';
        const payload = message.data.payload;

        if (payload.parts) {
          const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
          const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');

          if (htmlPart && htmlPart.body.data) {
            body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
          } else if (textPart && textPart.body.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          }
        } else if (payload.body && payload.body.data) {
          body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
        }

        return {
          id: msg.id,
          from: fromHeader ? fromHeader.value : 'Unknown',
          subject: subjectHeader ? subjectHeader.value : '(No Subject)',
          date: dateHeader ? dateHeader.value : '',
          snippet: message.data.snippet || '',
          body,
        };
      });

      const emails = await Promise.all(emailPromises);
      const result = {
        emails,
        total: messageList.data.resultSizeEstimate || emails.length,
      };

      // ── Cache the results using RediSearch (10 minutes) ──
      if (redisClient) {
        for (const email of emails) {
          const hashKey = `email:${userId}:${email.id}`;
          const flatObj = [
            'userId', userId,
            'subject', email.subject || '',
            'date', email.date || '',
            'snippet', email.snippet || '',
            'body', email.body || '',
            'from', email.from || ''
          ];
          const stringifiedFlatObj = flatObj.map((val) => String(val || ''));
          try {
            await redisClient.hset(hashKey, ...stringifiedFlatObj);
            await redisClient.expire(hashKey, 600);
          } catch (hashErr) {
            logger.error(`Failed to HSET email ${email.id}: ${hashErr.message}`);
          }
        }
        await setCache(cacheKey, true, 600); // Flag this keyword as cached
      }
      
      logger.info(`Email search completed: "${q}" → ${emails.length} results (user: ${req.user.email})`);

      return ApiResponse.success(res, result, `Found ${result.total} emails`, 200, {
        cached: false,
      });
    } catch (error) {
      // Handle Gmail-specific errors
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        return next(ApiError.unauthorized('Gmail access expired. Please log out and log in again.'));
      }

      next(error);
    }
  }
);

module.exports = router;
