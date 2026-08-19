const Review = require('../models/Review');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create review
// @route   POST /api/v1/reviews/hotel/:hotelId
// @access  User
exports.createReview = asyncHandler(async (req, res, next) => {
  const { rating, ratings, title, comment } = req.body;
  const hotelId = req.params.hotelId;

  // Check if user has a completed booking at this hotel
  const booking = await Booking.findOne({
    user: req.user._id,
    hotel: hotelId,
    bookingStatus: 'checked-out',
  });

  if (!booking) {
    return next(new ApiError('You can only review hotels where you have completed a stay', 400));
  }

  // Check if user already reviewed this booking
  const existingReview = await Review.findOne({
    user: req.user._id,
    booking: booking._id,
  });

  if (existingReview) {
    return next(new ApiError('You have already reviewed this booking', 400));
  }

  const review = await Review.create({
    user: req.user._id,
    hotel: hotelId,
    booking: booking._id,
    rating,
    ratings,
    title,
    comment,
  });

  const populatedReview = await Review.findById(review._id)
    .populate('user', 'name avatar');

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    review: populatedReview,
  });
});

// @desc    Get all reviews for hotel
// @route   GET /api/v1/reviews/hotel/:hotelId
// @access  Public
exports.getHotelReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ hotel: req.params.hotelId })
    .populate('user', 'name avatar')
    .sort('-createdAt');

  // Calculate rating breakdown
  const ratingBreakdown = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  res.status(200).json({
    success: true,
    count: reviews.length,
    ratingBreakdown,
    reviews,
  });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  User
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ApiError('Review not found', 404));
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to update this review', 403));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('user', 'name avatar');

  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    review,
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  User/Admin
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ApiError('Review not found', 404));
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to delete this review', 403));
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
});

// @desc    Reply to review (owner)
// @route   PUT /api/v1/reviews/:id/reply
// @access  Owner
exports.replyToReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate('hotel', 'owner');

  if (!review) {
    return next(new ApiError('Review not found', 404));
  }

  if (review.hotel.owner.toString() !== req.user._id.toString()) {
    return next(new ApiError('Only the hotel owner can reply to this review', 403));
  }

  review.ownerReply = {
    comment: req.body.comment,
    repliedAt: new Date(),
  };

  await review.save();

  res.status(200).json({
    success: true,
    message: 'Reply added successfully',
    review,
  });
});
