const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Passport.js Configuration — Google OAuth 2.0 Strategy
 *
 * Tokens are automatically encrypted by the User model's pre-save hook
 * when stored in MongoDB. No manual encryption needed here.
 */

// ── Serialize / Deserialize ───────────────────────────────────────────

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    logger.error(`Passport deserialize error: ${error.message}`);
    done(error, null);
  }
});

// ── Google OAuth 2.0 Strategy ─────────────────────────────────────────

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update tokens on every login (pre-save hook encrypts automatically)
          user.accessToken = accessToken;
          if (refreshToken) {
            user.refreshToken = refreshToken;
          }
          user.lastLoginAt = new Date();
          await user.save();

          logger.info(`User logged in: ${user.email}`);
        } else {
          // Create new user (pre-save hook encrypts tokens automatically)
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value,
            accessToken,
            refreshToken,
          });

          logger.info(`New user registered: ${user.email}`);
        }

        done(null, user);
      } catch (error) {
        logger.error(`Google OAuth error: ${error.message}`);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
