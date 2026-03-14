const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  keyword: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
searchHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
