const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please enter coupon code'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: [true, 'Please select discount type'],
  },
  discountValue: {
    type: Number,
    required: [true, 'Please enter discount value'],
    min: [0, 'Discount value cannot be negative'],
  },
  maxDiscount: {
    type: Number, // Cap for percentage discounts
    min: 0,
  },
  minBookingAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: [true, 'Please enter coupon expiry date'],
  },
  usageLimit: {
    type: Number,
    min: 0,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  applicableHotels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  firstTimeUserOnly: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function (bookingAmount, hotelId) {
  const now = new Date();

  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now < this.validFrom) return { valid: false, message: 'Coupon is not yet active' };
  if (now > this.validUntil) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  if (bookingAmount < this.minBookingAmount) {
    return { valid: false, message: `Minimum booking amount is ₹${this.minBookingAmount}` };
  }
  if (this.applicableHotels.length > 0 && hotelId) {
    const isApplicable = this.applicableHotels.some(
      (id) => id.toString() === hotelId.toString()
    );
    if (!isApplicable) return { valid: false, message: 'Coupon not valid for this hotel' };
  }

  return { valid: true, message: 'Coupon is valid' };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (bookingAmount) {
  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (bookingAmount * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }

  return Math.min(discount, bookingAmount); // Discount can't exceed booking amount
};

module.exports = mongoose.model('Coupon', couponSchema);
