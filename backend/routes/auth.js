const router = require('express').Router();
const passport = require('passport');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * Auth Routes — Google OAuth 2.0
 *
 * GET  /auth/google          → Initiate Google OAuth
 * GET  /auth/google/callback  → Handle OAuth callback
 * GET  /auth/current-user     → Get authenticated user info
 * GET  /auth/logout           → Logout and destroy session
 */

// @route   GET /auth/google
// @desc    Initiate Google OAuth login
router.get(
  '/google',
  authLimiter,
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
    accessType: 'offline',
    prompt: 'consent',
  })
);

// @route   GET /auth/google/callback
// @desc    Google OAuth callback — redirect to dashboard on success
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.CLIENT_URL || 'http://localhost:5173',
  }),
  (req, res) => {
    logger.info(`OAuth callback success for user: ${req.user?.email}`);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`);
  }
);

// @route   GET /auth/current-user
// @desc    Get current authenticated user (public info only)
router.get('/current-user', (req, res) => {
  if (req.user) {
    return ApiResponse.success(res, req.user.toPublicJSON(), 'User retrieved successfully');
  }
  return ApiResponse.error(res, 401, 'Not authenticated');
});

// @route   GET /auth/logout
// @desc    Logout user and destroy session
router.get('/logout', (req, res, next) => {
  const userEmail = req.user?.email || 'unknown';

  req.logout((err) => {
    if (err) {
      logger.error(`Logout error for ${userEmail}: ${err.message}`);
      return next(err);
    }

    req.session.destroy((err) => {
      if (err) {
        logger.error(`Session destroy error for ${userEmail}: ${err.message}`);
        return next(err);
      }

      res.clearCookie('connect.sid');
      logger.info(`User logged out: ${userEmail}`);
      return ApiResponse.success(res, null, 'Logged out successfully');
    });
  });
});

module.exports = router;
