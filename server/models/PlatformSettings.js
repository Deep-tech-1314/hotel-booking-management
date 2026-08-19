const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    commissionRate: {
      type: Number,
      required: true,
      default: 15,
      min: 0,
      max: 100,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    featuredHotels: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Hotel',
      },
    ],
    stripeEnabled: {
      type: Boolean,
      default: true,
    },
    razorpayEnabled: {
      type: Boolean,
      default: true,
    },
    contactEmail: {
      type: String,
      default: 'support@bookmystay.com',
    },
    // Default platform tax applied to bookings (percentage)
    taxPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    bookingRules: {
      minNights: { type: Number, default: 1, min: 1 },
      maxNights: { type: Number, default: 30, min: 1 },
      // 0 = disabled; otherwise auto-cancel unpaid bookings after N minutes
      autoCancelUnpaidMins: { type: Number, default: 0, min: 0 },
    },
    payoutSettings: {
      minPayout: { type: Number, default: 0, min: 0 },
      schedule: {
        type: String,
        enum: ['manual', 'weekly', 'monthly'],
        default: 'manual',
      },
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// We only need one settings document per platform
// Force an ID if we want to retrieve it easily without finding the first
module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
