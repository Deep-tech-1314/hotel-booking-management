const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get wishlist
// @route   GET /api/v1/wishlist
router.get('/', isAuthenticated, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'wishlist',
      select: 'name images address rating numReviews category priceRange',
    });

  res.status(200).json({
    success: true,
    count: user.wishlist.length,
    wishlist: user.wishlist,
  });
}));

// @desc    Add to wishlist
// @route   POST /api/v1/wishlist/:hotelId
router.post('/:hotelId', isAuthenticated, asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.hotelId);
  if (!hotel) return next(new ApiError('Hotel not found', 404));

  const user = await User.findById(req.user._id);

  if (user.wishlist.includes(req.params.hotelId)) {
    return next(new ApiError('Hotel already in wishlist', 400));
  }

  user.wishlist.push(req.params.hotelId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Hotel added to wishlist',
  });
}));

// @desc    Remove from wishlist
// @route   DELETE /api/v1/wishlist/:hotelId
router.delete('/:hotelId', isAuthenticated, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter(
    (id) => id.toString() !== req.params.hotelId
  );
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Hotel removed from wishlist',
  });
}));

module.exports = router;
