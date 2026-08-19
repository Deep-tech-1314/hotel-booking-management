const ConciergeRequest = require('../models/ConciergeRequest');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');
const notificationService = require('../services/notificationService');

// @desc    Submit a concierge or special service request
// @route   POST /api/v1/concierge
// @access  User
exports.createRequest = asyncHandler(async (req, res, next) => {
  const { bookingId, requestType, title, details, flightDetails, preferredTime } = req.body;

  if (!bookingId || !requestType || !title || !details) {
    return next(new ApiError('Booking ID, request type, title, and details are required', 400));
  }

  const booking = await Booking.findById(bookingId).populate('hotel', 'name owner');
  if (!booking) {
    return next(new ApiError('Booking not found', 404));
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to make requests for this booking', 403));
  }

  const conciergeReq = await ConciergeRequest.create({
    booking: booking._id,
    user: req.user._id,
    hotel: booking.hotel._id,
    requestType,
    title: title.trim(),
    details: details.trim(),
    flightDetails: flightDetails || {},
    preferredTime: preferredTime || '',
    status: 'pending',
  });

  // Notify Hotel Owner
  if (booking.hotel.owner) {
    await notificationService.notify({
      recipient: booking.hotel.owner,
      recipientRole: 'owner',
      type: 'system',
      title: 'New Concierge Service Request',
      message: `${req.user.name} submitted a ${requestType.replace('_', ' ')} request for ${booking.hotel.name}.`,
      link: '/grand/requests',
      priority: 'high',
    });
  }

  // Notify User confirming submission
  await notificationService.notify({
    recipient: req.user._id,
    recipientRole: 'user',
    type: 'system',
    title: 'Concierge Request Received',
    message: `Your request "${title}" for ${booking.hotel.name} has been sent to hotel management.`,
    link: '/me/requests',
    priority: 'normal',
  });

  res.status(201).json({
    success: true,
    message: 'Concierge request submitted successfully',
    data: conciergeReq,
  });
});

// @desc    Get current user's concierge requests
// @route   GET /api/v1/concierge/me
// @access  User
exports.getMyRequests = asyncHandler(async (req, res) => {
  const requests = await ConciergeRequest.find({ user: req.user._id })
    .populate('hotel', 'name images address')
    .populate('booking', 'checkIn checkOut bookingStatus')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  });
});

// @desc    Get owner's hotel concierge requests
// @route   GET /api/v1/concierge/owner
// @access  Owner/Admin
exports.getOwnerRequests = asyncHandler(async (req, res) => {
  const hotels = await Hotel.find({ owner: req.user._id }).select('_id');
  const hotelIds = hotels.map((h) => h._id);

  const requests = await ConciergeRequest.find({ hotel: { $in: hotelIds } })
    .populate('user', 'name email phone avatar')
    .populate('hotel', 'name')
    .populate('booking', 'checkIn checkOut room')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  });
});

// @desc    Update concierge request status (Owner/Admin response)
// @route   PATCH /api/v1/concierge/:id/status
// @access  Owner/Admin
exports.updateRequestStatus = asyncHandler(async (req, res, next) => {
  const { status, responseMessage } = req.body;
  const conciergeReq = await ConciergeRequest.findById(req.params.id).populate('hotel', 'name');

  if (!conciergeReq) {
    return next(new ApiError('Request not found', 404));
  }

  if (status) conciergeReq.status = status;
  if (responseMessage !== undefined) conciergeReq.responseMessage = responseMessage;

  await conciergeReq.save();

  // Notify User of update
  await notificationService.notify({
    recipient: conciergeReq.user,
    recipientRole: 'user',
    type: 'system',
    title: `Concierge Request ${status.toUpperCase()}`,
    message: `Hotel management updated your "${conciergeReq.title}" request status to ${status}.${responseMessage ? ' Note: ' + responseMessage : ''}`,
    link: '/me/requests',
    priority: 'high',
  });

  res.status(200).json({
    success: true,
    message: 'Concierge request status updated',
    data: conciergeReq,
  });
});
