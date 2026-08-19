const mongoose = require('mongoose');

// In-app notification. One document per recipient per event.
const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Helps target/segment notifications without an extra lookup
  recipientRole: {
    type: String,
    enum: ['user', 'owner', 'admin'],
    required: true,
  },
  type: {
    type: String,
    default: 'system',
  },
  title: {
    type: String,
    required: true,
    maxLength: [120, 'Title cannot exceed 120 characters'],
  },
  message: {
    type: String,
    required: true,
    maxLength: [500, 'Message cannot exceed 500 characters'],
  },
  // In-app deep link (e.g. /owner/bookings or /admin/hotels)
  link: {
    type: String,
    default: '',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal',
  },
  // Free-form context (bookingId, hotelId, amount, etc.)
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
}, {
  timestamps: true,
});

// Fast unread lookups and recipient feeds
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// TTL Index: Auto-delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', notificationSchema);
