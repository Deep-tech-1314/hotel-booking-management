const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all rooms for a hotel
// @route   GET /api/v1/hotels/:hotelId/rooms
// @access  Public
exports.getRooms = asyncHandler(async (req, res, next) => {
  const rooms = await Room.find({ hotel: req.params.hotelId });

  res.status(200).json({
    success: true,
    count: rooms.length,
    rooms,
  });
});

// @desc    Get single room
// @route   GET /api/v1/hotels/:hotelId/rooms/:id
// @access  Public
exports.getRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id).populate('hotel', 'name address');

  if (!room) {
    return next(new ApiError('Room not found', 404));
  }

  res.status(200).json({
    success: true,
    room,
  });
});

// @desc    Create room for a hotel
// @route   POST /api/v1/hotels/:hotelId/rooms
// @access  Owner
exports.createRoom = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.hotelId);

  if (!hotel) {
    return next(new ApiError('Hotel not found', 404));
  }

  if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('You are not authorized to add rooms to this hotel', 403));
  }

  req.body.hotel = req.params.hotelId;

  // Handle images
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
  }

  if (typeof req.body.amenities === 'string') {
    req.body.amenities = req.body.amenities.split(',').map((a) => a.trim());
  }

  const room = await Room.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    room,
  });
});

// @desc    Update room
// @route   PUT /api/v1/hotels/:hotelId/rooms/:id
// @access  Owner
exports.updateRoom = asyncHandler(async (req, res, next) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    return next(new ApiError('Room not found', 404));
  }

  const hotel = await Hotel.findById(room.hotel);
  if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('You are not authorized to update this room', 403));
  }

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
    req.body.images = [...(room.images || []), ...newImages];
  }

  if (typeof req.body.amenities === 'string') {
    req.body.amenities = req.body.amenities.split(',').map((a) => a.trim());
  }

  room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Room updated successfully',
    room,
  });
});

// @desc    Delete room
// @route   DELETE /api/v1/hotels/:hotelId/rooms/:id
// @access  Owner
exports.deleteRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(new ApiError('Room not found', 404));
  }

  const hotel = await Hotel.findById(room.hotel);
  if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('You are not authorized to delete this room', 403));
  }

  // Delete images from Cloudinary (safely ignore if Cloudinary keys are unconfigured)
  if (room.images && room.images.length > 0) {
    const { cloudinary } = require('../config/cloudinary');
    for (const image of room.images) {
      if (image.public_id) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (cloudinaryErr) {
          console.warn(`Cloudinary image deletion notice for ${image.public_id}:`, cloudinaryErr.message);
        }
      }
    }
  }

  await room.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Room deleted successfully',
  });
});

// @desc    Check room availability for dates
// @route   GET /api/v1/hotels/:hotelId/rooms/:id/availability
// @access  Public
exports.checkAvailability = asyncHandler(async (req, res, next) => {
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return next(new ApiError('Please provide check-in and check-out dates', 400));
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkOutDate <= checkInDate) {
    return next(new ApiError('Check-out date must be after check-in date', 400));
  }

  const room = await Room.findById(req.params.id);
  if (!room) {
    return next(new ApiError('Room not found', 404));
  }

  // Count overlapping confirmed/checked-in bookings for this room
  const overlappingBookings = await Booking.find({
    room: req.params.id,
    bookingStatus: { $in: ['confirmed', 'checked-in'] },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  }).select('checkIn checkOut');

  const availableRooms = room.totalRooms - overlappingBookings.length;

  // Build blocked dates array
  const blockedDates = [];
  for (const booking of overlappingBookings) {
    const start = new Date(Math.max(booking.checkIn, checkInDate));
    const end = new Date(Math.min(booking.checkOut, checkOutDate));
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!blockedDates.includes(dateStr)) blockedDates.push(dateStr);
    }
  }

  // Server-side price breakdown
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const pricePerNight = room.pricePerNight;
  const subtotal = pricePerNight * nights;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  res.status(200).json({
    success: true,
    available: availableRooms > 0,
    room: room.title,
    totalRooms: room.totalRooms,
    bookedRooms: overlappingBookings.length,
    availableRooms: Math.max(0, availableRooms),
    isAvailable: availableRooms > 0,
    blockedDates,
    priceBreakdown: {
      pricePerNight,
      nights,
      subtotal,
      gst,
      total,
    },
  });
});
