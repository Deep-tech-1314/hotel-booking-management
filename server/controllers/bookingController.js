const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { publishBookingEvent, subscribeToBookingEvents } = require('../services/bookingEvents');
const notificationService = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const { recordBookingTransaction, recordRefundTransaction } = require('../services/payoutService');

// Authorize owner/admin/staff/user to act on a booking. `booking.hotel` must be populated
// (with owner). Throws ApiError(403) when not permitted.
const assertCanManageBooking = (booking, req) => {
  if (req.user.role === 'admin') return;
  if (booking.user && booking.user.toString() === req.user._id.toString()) return;
  const ownerId = booking.hotel?.owner?.toString();
  if (req.user.role === 'owner' && ownerId === req.user._id.toString()) return;
  // Staff (set by requirePermission): must belong to the booking's hotel/owner
  if (req.staff) {
    const sameHotel = req.staff.hotel && req.staff.hotel.toString() === (booking.hotel?._id || booking.hotel).toString();
    const sameOwner = req.staff.owner && req.staff.owner.toString() === ownerId;
    if (sameHotel || sameOwner) return;
  }
  throw new ApiError('Not authorized to manage this booking', 403);
};

const populateBookingForRealtime = (bookingId) => Booking.findById(bookingId)
  .populate('hotel', 'name address images owner policies')
  .populate('room', 'title roomType pricePerNight images amenities')
  .populate('user', 'name email phone avatar');

const normalizeBookingInput = (body) => {
  const guests = typeof body.guests === 'number'
    ? { adults: body.guests, children: 0 }
    : body.guests;

  return {
    ...body,
    checkIn: body.checkIn || body.checkInDate,
    checkOut: body.checkOut || body.checkOutDate,
    guests,
  };
};

const applyCouponToPricing = async ({ couponCode, bookingAmount, hotelId, userId }) => {
  if (!couponCode) {
    return { discount: 0, couponSnapshot: undefined };
  }

  const uppercaseCode = couponCode.toString().trim().toUpperCase();
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
    throw new ApiError('Invalid coupon code', 404);
  }

  // Check first-time user requirement
  if (userId && (coupon.firstTimeUserOnly || uppercaseCode === 'BOOKMYSTAY' || uppercaseCode === 'WELCOME10')) {
    const existingBookingsCount = await Booking.countDocuments({
      user: userId,
      bookingStatus: { $in: ['confirmed', 'checked-in', 'checked-out', 'completed'] },
    });

    if (existingBookingsCount > 0) {
      throw new ApiError('This coupon code is valid for first-time bookings only.', 400);
    }
  }

  const validation = coupon.isValid(bookingAmount, hotelId);
  if (!validation.valid) {
    throw new ApiError(validation.message, 400);
  }

  const discount = Math.round(coupon.calculateDiscount(bookingAmount));
  return {
    coupon,
    discount,
    couponSnapshot: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  };
};

// @desc    Create new booking
// @route   POST /api/v1/bookings
// @access  User
exports.createBooking = asyncHandler(async (req, res, next) => {
  const {
    room: roomId,
    hotel: hotelId,
    checkIn,
    checkOut,
    guests,
    numberOfRooms,
    specialRequests,
    couponCode,
  } = normalizeBookingInput(req.body);

  const room = await Room.findById(roomId);
  if (!room) return next(new ApiError('Room not found', 404));

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) return next(new ApiError('Hotel not found', 404));

  // Update user phone number if provided and valid during checkout
  const rawPhone = req.body.contact?.phone ? req.body.contact.phone.toString().replace(/\D/g, '') : '';
  if (rawPhone && rawPhone.length === 10 && !/^(\d)\1{9}$/.test(rawPhone)) {
    await User.findByIdAndUpdate(req.user._id, { phone: rawPhone }).catch(() => {});
  }

  if (!hotel.isApproved) return next(new ApiError('This hotel is not available for booking', 400));

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    return next(new ApiError('Please provide valid check-in and check-out dates', 400));
  }

  if (checkInDate >= checkOutDate) {
    return next(new ApiError('Check-out date must be after check-in date', 400));
  }

  if (checkInDate < new Date()) {
    return next(new ApiError('Check-in date cannot be in the past', 400));
  }

  // Delete any previous pending/unpaid bookings by this user for this room so they do not self-block
  await Booking.deleteMany({
    user: req.user._id,
    room: roomId,
    bookingStatus: 'pending',
  });

  // Count only confirmed and checked-in overlapping bookings
  const overlappingBookings = await Booking.countDocuments({
    room: roomId,
    bookingStatus: { $in: ['confirmed', 'checked-in'] },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  });

  const totalCapacity = room.totalRooms || 10;
  const availableRooms = Math.max(0, totalCapacity - overlappingBookings);
  const requestedRooms = Math.max(Number(numberOfRooms) || 1, 1);

  if (requestedRooms > availableRooms) {
    return next(new ApiError(`Not enough rooms available for selected dates (Only ${availableRooms} room(s) available)`, 400));
  }

  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const roomCharges = room.pricePerNight * nights * requestedRooms;
  const taxes = Math.round(roomCharges * 0.18);
  const serviceFee = Math.round(roomCharges * 0.05);
  const totalBeforeDiscount = roomCharges + taxes + serviceFee;

  let couponResult;
  try {
    couponResult = await applyCouponToPricing({
      couponCode,
      bookingAmount: totalBeforeDiscount,
      hotelId,
      userId: req.user._id,
    });
  } catch (error) {
    return next(error);
  }

  const totalPrice = Math.max(0, totalBeforeDiscount - couponResult.discount);

  const booking = await Booking.create({
    user: req.user._id,
    hotel: hotelId,
    room: roomId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: {
      adults: guests?.adults || 1,
      children: guests?.children || 0,
    },
    numberOfRooms: requestedRooms,
    totalPrice,
    priceBreakdown: {
      roomCharges,
      taxes,
      serviceFee,
      discount: couponResult.discount,
    },
    coupon: couponResult.couponSnapshot,
    specialRequests,
    bookingStatus: 'pending',
    paymentInfo: {
      status: 'pending',
    },
  });


  // 🔔 Send real-time notifications to User, Owner, and Admin
  try {
    // 1. User Notification
    await notificationService.notify({
      recipient: req.user._id,
      recipientRole: 'user',
      type: 'booking',
      title: 'Booking Initiated — Payment Pending 💳',
      message: `Your reservation at ${hotel.name} for ${nights} night(s) has been initiated. Complete payment to confirm your stay.`,
      link: `/booking/${booking._id}`,
      priority: 'high',
    });

    // 2. Owner Notification
    if (hotel.owner) {
      await notificationService.notify({
        recipient: hotel.owner,
        recipientRole: 'owner',
        type: 'booking',
        title: 'New Booking Initiated — Awaiting Payment',
        message: `${req.user.name || 'A guest'} initiated a booking for ${room.title} at ${hotel.name} (Total: ₹${totalPrice.toLocaleString('en-IN')}). Awaiting payment completion.`,
        link: '/grand/bookings',
        priority: 'high',
      });
    }

    // 3. Admin Notification
    await notificationService.notifyAdmins({
      type: 'booking',
      title: 'New Booking Initiated — Payment Pending 🏨',
      message: `New booking initiated for ${hotel.name} by ${req.user.name || 'Guest'} (Amount: ₹${totalPrice.toLocaleString('en-IN')}). Awaiting payment.`,
      link: '/admin/bookings',
    });
  } catch (notifErr) {
    console.error('Failed to send booking notifications:', notifErr.message);
  }

  // Apply coupon usage after successful booking creation
  if (couponResult.coupon) {
    couponResult.coupon.usedCount += 1;
    await couponResult.coupon.save({ validateBeforeSave: false });
  }

  const populatedBooking = await populateBookingForRealtime(booking._id);
  publishBookingEvent('booking.created', populatedBooking);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully. Please complete payment.',
    booking: populatedBooking,
  });
});


// @desc    Get user's bookings
// @route   GET /api/v1/bookings/me
// @access  User
exports.getMyBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.user._id };

  if (status) {
    filter.bookingStatus = status;
  }

  const bookings = await Booking.find(filter)
    .populate('hotel', 'name address images rating')
    .populate('room', 'title roomType pricePerNight')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: bookings.length,
    bookings,
  });
});

// @desc    Get booking details
// @route   GET /api/v1/bookings/:id
// @access  User/Owner
exports.getBookingDetails = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate('hotel', 'name address images policies owner')
    .populate('room', 'title roomType pricePerNight images amenities')
    .populate('user', 'name email phone avatar');

  if (!booking) {
    return next(new ApiError('Booking not found', 404));
  }

  const isOwner = booking.hotel.owner && booking.hotel.owner.toString() === req.user._id.toString();
  const isBookingUser = booking.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isBookingUser && !isOwner && !isAdmin) {
    return next(new ApiError('Not authorized to view this booking', 403));
  }

  res.status(200).json({
    success: true,
    booking,
  });
});

// @desc    Cancel booking
// @route   PUT /api/v1/bookings/:id/cancel
// @access  User
exports.cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).populate('hotel');
  if (!booking) return next(new ApiError('Booking not found', 404));

  assertCanManageBooking(booking, req);

  // Enforce 24h rule for users (admins and owners bypass)
  // Disabled for local testing so users can cancel any booking
  /*
  if (req.user.role === 'user') {
    const hoursUntilCheckIn = (new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilCheckIn < 24) {
      return next(new ApiError('Cancellations are only allowed up to 24 hours before check-in', 400));
    }
  }
  */

  if (['cancelled', 'checkedOut', 'noShow'].includes(booking.bookingStatus)) {
    return next(new ApiError(`Cannot cancel a booking that is ${booking.bookingStatus}`, 400));
  }

  if (['cancelled', 'checked-out'].includes(booking.bookingStatus)) {
    return next(new ApiError('This booking cannot be cancelled', 400));
  }

  const hoursBeforeCheckIn = (new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60);
  let refundPercentage = 0;

  const policy = booking.hotel?.policies?.cancellation || 'moderate';

  switch (policy) {
    case 'flexible':
      refundPercentage = hoursBeforeCheckIn >= 24 ? 100 : 50;
      break;
    case 'moderate':
      refundPercentage = hoursBeforeCheckIn >= 72 ? 100 : hoursBeforeCheckIn >= 24 ? 50 : 0;
      break;
    case 'strict':
      refundPercentage = hoursBeforeCheckIn >= 168 ? 50 : 0;
      break;
    default:
      refundPercentage = 0;
  }

  const refundAmount = Math.round((booking.totalPrice * refundPercentage) / 100);

  booking.bookingStatus = 'cancelled';
  booking.cancellation = {
    cancelledAt: new Date(),
    reason: req.body.reason || 'Cancelled by user',
    refundAmount,
    refundStatus: refundAmount > 0 ? 'pending' : undefined,
  };

  await booking.save();

  const populatedBooking = await populateBookingForRealtime(booking._id);
  publishBookingEvent('booking.cancelled', populatedBooking);

  res.status(200).json({
    success: true,
    message: `Booking cancelled. Refund amount: INR ${refundAmount} (${refundPercentage}%)`,
    booking: populatedBooking,
  });
});

// @desc    Update booking status (confirm/check-in/check-out)
// @route   PUT /api/v1/bookings/:id/status
// @access  Owner
exports.updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'checked-in', 'checked-out', 'cancelled', 'paymentFailed', 'pending'];

  if (!validStatuses.includes(status)) {
    return next(new ApiError('Invalid booking status', 400));
  }

  const booking = await Booking.findById(req.params.id)
    .populate('hotel', 'owner name')
    .populate('user', 'name email');

  if (!booking) {
    return next(new ApiError('Booking not found', 404));
  }

  if (booking.hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to update this booking', 403));
  }

  // Legal status transitions
  const legalTransitions = {
    'pending': ['confirmed', 'paymentFailed', 'cancelled'],
    'confirmed': ['checked-in', 'cancelled'],
    'checked-in': ['checked-out'],
    'paymentFailed': ['pending'],
    // Terminal states — no outgoing transitions
    'checked-out': [],
    'cancelled': [],
  };

  const currentStatus = booking.bookingStatus;
  const allowed = legalTransitions[currentStatus] || [];

  if (!allowed.includes(status)) {
    return next(new ApiError(`Invalid status transition from ${currentStatus} to ${status}`, 400));
  }

  // Date validation for check-in/check-out transitions
  const now = new Date();
  if (status === 'checked-in') {
    const checkInDate = new Date(booking.checkIn);
    // Allow check-in on or after the check-in date (with 1-day tolerance)
    const tolerance = new Date(checkInDate);
    tolerance.setDate(tolerance.getDate() - 1);
    if (now < tolerance) {
      return next(new ApiError('Cannot check in before the check-in date', 400));
    }
    booking.actualCheckIn = now;
  }

  if (status === 'checked-out') {
    booking.actualCheckOut = now;
  }

  booking.bookingStatus = status;

  if (status === 'confirmed' && booking.paymentInfo.status === 'paid') {
    try {
      const template = emailTemplates.bookingConfirmation(booking.user.name, booking);
      await sendEmail({ email: booking.user.email, ...template });
    } catch (error) {
      console.error('Confirmation email failed:', error.message);
    }
  }

  await booking.save();

  const populatedBooking = await populateBookingForRealtime(booking._id);
  publishBookingEvent('booking.status_updated', populatedBooking, { status });

  res.status(200).json({
    success: true,
    message: `Booking status updated to ${status}`,
    booking: populatedBooking,
  });
});

// @desc    Get bookings for a specific hotel
// @route   GET /api/v1/bookings/hotel/:hotelId
// @access  Owner
exports.getHotelBookings = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.hotelId);

  if (!hotel) {
    return next(new ApiError('Hotel not found', 404));
  }

  if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized', 403));
  }

  const { status } = req.query;
  const filter = { hotel: req.params.hotelId };
  if (status) filter.bookingStatus = status;

  const bookings = await Booking.find(filter)
    .populate('user', 'name email phone avatar')
    .populate('room', 'title roomType')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: bookings.length,
    bookings,
  });
});

// @desc    Get all bookings (automatically filtered by role)
// @route   GET /api/v1/bookings
// @access  Auth
exports.getAllBookings = asyncHandler(async (req, res) => {
  const filter = {};
  
  if (req.user.role === 'user') {
    filter.user = req.user._id;
  } else if (req.user.role === 'owner') {
    // Find all hotels owned by this owner
    const ownerHotels = await Hotel.find({ owner: req.user._id }).select('_id');
    filter.hotel = { $in: ownerHotels.map(h => h._id) };
  }
  // Admin sees all (filter remains empty)

  if (req.query.status) {
    filter.bookingStatus = req.query.status;
  }

  const bookings = await Booking.find(filter)
    .populate('user', 'name email phone avatar')
    .populate('hotel', 'name address images')
    .populate('room', 'title roomType pricePerNight')
    .sort('-createdAt');

  const totalRevenue = bookings
    .filter((b) => b.paymentInfo?.status === 'paid' || b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked-out')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  res.status(200).json({
    success: true,
    count: bookings.length,
    totalRevenue,
    bookings,
  });
});

// @desc    Stream real-time booking updates for the current user, owner, or admin
// @route   GET /api/v1/bookings/stream
// @access  Auth
exports.streamBookingUpdates = asyncHandler(async (req, res) => {
  subscribeToBookingEvents(req, res);
});
