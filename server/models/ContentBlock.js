const mongoose = require('mongoose');

/**
 * ContentBlock – CMS-style dynamic content blocks for home page sections.
 * Allows admin to update hero, destinations, featured deals, testimonials, etc.
 */
const contentBlockSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    enum: ['hero', 'destinations', 'featured_deals', 'testimonials', 'features', 'newsletter', 'video_tour'],
    unique: true, // one block per section for simplicity
  },
  title: String,
  subtitle: String,
  content: mongoose.Schema.Types.Mixed, // flexible structure per section
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ContentBlock', contentBlockSchema);
