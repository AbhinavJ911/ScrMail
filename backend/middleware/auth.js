const ApiError = require('../utils/ApiError');

/**
 * Authentication Middleware
 *
 * Ensures the user is authenticated via Passport.js session.
 * Throws a standardized ApiError if not authenticated.
 */

const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  throw ApiError.unauthorized('Not authenticated. Please log in.');
};

module.exports = ensureAuth;
