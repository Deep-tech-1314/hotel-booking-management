const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  checkIn: {
    type: Date,
    required: [true, 'Please provide check-in date'],
  },
  checkOut: {
    type: Date,
    required: [true, 'Please provide check-out date'],
  },
  guests: {
    adults: {
      type: Number,
      required: [true, 'Please specify number of adults'],
      min: 1,
    },
    children: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  numberOfRooms: {
    type: Number,
    default: 1,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  // Platform commission + owner net, computed when payment is captured/confirmed
  commissionAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  netAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  priceBreakdown: {
    roomCharges: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
  },
  coupon: {
    code: String,
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
    },
    discountValue: Number,
  },
  paymentInfo: {
    id: String,       // Stripe/Razorpay payment ID
    status: {
      type: String,
      enum: ['paid', 'pending', 'refunded', 'failed'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet'],
    },
    paidAt: Date,
  },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'paymentFailed'],
    default: 'pending',
  },
  // Actual front-desk timestamps (vs. scheduled checkIn/checkOut dates)
  actualCheckIn: Date,
  actualCheckOut: Date,
  specialRequests: {
    type: String,
    maxLength: [500, 'Special requests cannot exceed 500 characters'],
  },
  cancellation: {
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
    },
  },
}, {
  timestamps: true,
});

// Validate check-out date is after check-in date
bookingSchema.pre('validate', function (next) {
  if (this.checkOut <= this.checkIn) {
    next(new Error('Check-out date must be after check-in date'));
  }
  next();
});

// Indexes for performance (especially for admin/grand stats)
bookingSchema.index({ 'paymentInfo.status': 1, createdAt: -1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ hotel: 1, checkIn: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
