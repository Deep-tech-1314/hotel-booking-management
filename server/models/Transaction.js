const mongoose = require('mongoose');

// One money-movement record per booking (and per refund). Created when a booking's
// payment is captured/confirmed; the source of truth for commission + owner earnings.
const transactionSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['booking', 'refund'],
    default: 'booking',
  },
  grossAmount: { type: Number, required: true, min: 0 },
  commissionRate: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  // Net to owner. Negative for refunds (clawback from owner earnings).
  netAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded'],
    default: 'completed',
  },
  gateway: {
    type: String,
    enum: ['stripe', 'razorpay', 'manual'],
    default: 'manual',
  },
  paymentId: String,
}, {
  timestamps: true,
});

transactionSchema.index({ booking: 1, type: 1 });
transactionSchema.index({ owner: 1, createdAt: -1 });
transactionSchema.index({ hotel: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
