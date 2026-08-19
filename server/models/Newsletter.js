const mongoose = require('mongoose');

/**
 * Newsletter – Email subscribers for marketing campaigns.
 */
const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
  },
  name: String,
  isSubscribed: {
    type: Boolean,
    default: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  unsubscribedAt: Date,
  source: {
    type: String,
    default: 'website_footer', // e.g., popup, checkout, footer
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
