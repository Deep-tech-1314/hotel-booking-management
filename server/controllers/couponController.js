const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create coupon
// @route   POST /api/v1/coupons
// @access  Owner/Admin
exports.createCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    coupon,
  });
});

// @desc    Get all coupons
// @route   GET /api/v1/coupons
// @access  Owner/Admin
exports.getCoupons = asyncHandler(async (req, res, next) => {
  let filter = {};

  // If owner, only show their coupons
  if (req.user.role === 'owner') {
    const Hotel = require('../models/Hotel');
    const ownerHotels = await Hotel.find({ owner: req.user._id }).select('_id');
    const hotelIds = ownerHotels.map((h) => h._id);
    filter = {
      $or: [
        { applicableHotels: { $in: hotelIds } },
        { applicableHotels: { $size: 0 } },
      ],
    };
  }

  const coupons = await Coupon.find(filter).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: coupons.length,
    coupons,
  });
});

// @desc    Update coupon
// @route   PUT /api/v1/coupons/:id
// @access  Owner/Admin
exports.updateCoupon = asyncHandler(async (req, res, next) => {
  let coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ApiError('Coupon not found', 404));
  }

  coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Coupon updated successfully',
    coupon,
  });
});

// @desc    Delete coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Owner/Admin
exports.deleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ApiError('Coupon not found', 404));
  }

  await coupon.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully',
  });
});

// @desc    Apply/validate coupon at checkout
// @route   POST /api/v1/coupons/apply
// @access  User
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { code, bookingAmount, hotelId } = req.body;

  if (!code) {
    return next(new ApiError('Please enter a coupon code', 400));
  }

  const uppercaseCode = code.toString().trim().toUpperCase();

  // Find coupon
  let coupon = await Coupon.findOne({ code: uppercaseCode });

  // Auto-seed BOOKMYSTAY and WELCOME10 if missing
  if (!coupon && (uppercaseCode === 'BOOKMYSTAY' || uppercaseCode === 'WELCOME10')) {
    coupon = await Coupon.create({
      code: uppercaseCode,
      discountType: 'percentage',
      discountValue: 15,
      maxDiscount: 3000,
      minBookingAmount: 500,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
      usedCount: 0,
      applicableHotels: [],
      isActive: true,
      firstTimeUserOnly: true,
    });
  }

  if (!coupon) {
    return next(new ApiError('Invalid coupon code', 404));
  }

  // Check if coupon is for first-time users only
  if (coupon.firstTimeUserOnly || uppercaseCode === 'BOOKMYSTAY' || uppercaseCode === 'WELCOME10') {
    const Booking = require('../models/Booking');
    const existingBookingsCount = await Booking.countDocuments({
      user: req.user._id,
      bookingStatus: { $in: ['confirmed', 'checked-in', 'checked-out', 'completed'] },
    });

    if (existingBookingsCount > 0) {
      return next(new ApiError('This coupon code is valid for first-time bookings only.', 400));
    }
  }

  const validation = coupon.isValid(bookingAmount, hotelId);
  if (!validation.valid) {
    return next(new ApiError(validation.message, 400));
  }

  const discount = coupon.calculateDiscount(bookingAmount);

  res.status(200).json({
    success: true,
    message: 'Coupon applied successfully',
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
    discount,
    finalAmount: Math.max(0, bookingAmount - discount),
  });
});
