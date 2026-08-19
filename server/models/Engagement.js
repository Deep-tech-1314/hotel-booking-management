const mongoose = require('mongoose');

/**
 * Engagement – Aggregated engagement metrics for analytics dashboards.
 * Daily rollups for bookings, views, revenue, etc.
 */
const engagementSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  metrics: {
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    cancellations: { type: Number, default: 0 },
    wishlistAdds: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 }, // seconds
  },
}, {
  timestamps: true,
});

engagementSchema.index({ hotel: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Engagement', engagementSchema);
