const mongoose = require('mongoose');

/**
 * RecentView – Tracks recently viewed hotels per user (or anonymous session).
 * Powers "Recently Viewed" widget and recommendation engine.
 */
const recentViewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  sessionId: {
    type: String,
    index: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  source: {
    type: String,
    default: 'search', // search, recommendation, direct, email
  },
}, {
  timestamps: true,
});

// Compound index: keep only the latest view per user+hotel
recentViewSchema.index({ user: 1, hotel: 1 }, { unique: true, partialFilterExpression: { user: { $exists: true } } });
recentViewSchema.index({ sessionId: 1, hotel: 1 }, { unique: true, partialFilterExpression: { sessionId: { $exists: true } } });

module.exports = mongoose.model('RecentView', recentViewSchema);
