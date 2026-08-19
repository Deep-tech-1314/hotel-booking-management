const mongoose = require('mongoose');

/**
 * Video – Hotel video tour metadata.
 * Videos themselves are stored externally (Cloudinary, AWS S3, etc.).
 */
const videoSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  url: {
    type: String, // CDN URL (Cloudinary, S3, etc.)
    required: true,
  },
  thumbnail: {
    public_id: String,
    url: String,
  },
  duration: Number, // seconds
  type: {
    type: String,
    enum: ['tour', 'room', 'amenity', 'promo'],
    default: 'tour',
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Video', videoSchema);
