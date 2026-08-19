const mongoose = require('mongoose');

const conciergeRequestSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  requestType: {
    type: String,
    enum: ['airport_transfer', 'late_checkout', 'early_checkin', 'room_upgrade', 'dietary_preference', 'special_amenity', 'other'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  details: {
    type: String,
    required: true,
  },
  flightDetails: {
    airline: String,
    flightNumber: String,
    arrivalTime: String,
  },
  preferredTime: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'fulfilled', 'declined'],
    default: 'pending',
  },
  responseMessage: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

conciergeRequestSchema.index({ user: 1, createdAt: -1 });
conciergeRequestSchema.index({ hotel: 1, status: 1 });

module.exports = mongoose.model('ConciergeRequest', conciergeRequestSchema);
