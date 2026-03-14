const router = require('express').Router();
const passport = require('passport');

// @route   GET /auth/google
// @desc    Initiate Google OAuth
router.get(
  '/google',
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
// @desc    Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.CLIENT_URL || 'http://localhost:5173',
  }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`);
  }
);

// @route   GET /auth/current-user
// @desc    Get current authenticated user
router.get('/current-user', (req, res) => {
  if (req.user) {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profilePicture: req.user.profilePicture,
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// @route   GET /auth/logout
// @desc    Logout user
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Session destruction failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

module.exports = router;
