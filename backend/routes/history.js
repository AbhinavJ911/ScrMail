const router = require('express').Router();
const SearchHistory = require('../models/SearchHistory');
const ensureAuth = require('../middleware/auth');

// @route   GET /api/history
// @desc    Get search history for current user
router.get('/', ensureAuth, async (req, res) => {
  try {
    const history = await SearchHistory.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(30);

    res.json(history);
  } catch (error) {
    console.error('Get history error:', error.message);
    res.status(500).json({ message: 'Failed to fetch search history' });
  }
});

// @route   POST /api/history
// @desc    Save a search keyword
router.post('/', ensureAuth, async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ message: 'Keyword is required' });
    }

    const entry = await SearchHistory.create({
      userId: req.user._id,
      keyword: keyword.trim(),
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Save history error:', error.message);
    res.status(500).json({ message: 'Failed to save search history' });
  }
});

// @route   DELETE /api/history/:id
// @desc    Delete a search history entry
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const entry = await SearchHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ message: 'History entry not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete history error:', error.message);
    res.status(500).json({ message: 'Failed to delete history entry' });
  }
});

module.exports = router;
