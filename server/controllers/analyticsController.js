const RecentView = require('../models/RecentView');
const Engagement = require('../models/Engagement');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * @desc   Track a hotel view
 * @route  POST /api/v1/analytics/view
 * @access Public
 */
exports.trackView = asyncHandler(async (req, res, next) => {
  const { hotelId, sessionId, source } = req.body;

  if (!hotelId) {
    return next(new ApiError('Please provide hotelId', 400));
  }

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new ApiError('Hotel not found', 404));
  }

  const updateData = {
    hotel: hotelId,
    viewedAt: new Date(),
    source: source || 'direct',
  };

  if (req.user) {
    updateData.user = req.user.id;
  } else if (sessionId) {
    updateData.sessionId = sessionId;
  }

  // Upsert recent view
  const query = req.user ? { user: req.user.id, hotel: hotelId } : { sessionId, hotel: hotelId };
  await RecentView.findOneAndUpdate(query, updateData, { upsert: true, new: true });

  // Increment daily engagement rollup
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await Engagement.findOneAndUpdate(
    { hotel: hotelId, date: today },
    { $inc: { 'metrics.pageViews': 1 }, $setOnInsert: { hotel: hotelId, date: today } },
    { upsert: true }
  );

  res.status(200).json({
    success: true,
    message: 'View tracked',
  });
});

/**
 * @desc   Get recently viewed hotels for user/session
 * @route  GET /api/v1/analytics/recent
 * @access Public
 */
exports.getRecentViews = asyncHandler(async (req, res, next) => {
  const { sessionId, limit = 8 } = req.query;

  const query = req.user
    ? { user: req.user.id }
    : sessionId ? { sessionId } : {};

  const recentViews = await RecentView.find(query)
    .sort({ viewedAt: -1 })
    .limit(parseInt(limit))
    .populate({
      path: 'hotel',
      select: 'name images address rating category',
      match: { isApproved: true },
    });

  const validViews = recentViews.filter((rv) => rv.hotel !== null);

  const validViewsWithPrice = await Promise.all(validViews.map(async (rv) => {
    const rooms = await Room.find({ hotel: rv.hotel._id, isAvailable: true }).select('pricePerNight');
    const cheapestPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.pricePerNight)) : 150;
    const rvObj = rv.toObject();
    rvObj.hotel.cheapestPrice = cheapestPrice;
    rvObj.hotel.price = cheapestPrice;
    return rvObj;
  }));

  res.status(200).json({
    success: true,
    count: validViewsWithPrice.length,
    data: validViewsWithPrice,
  });
});

/**
 * @desc   Get engagement analytics for a hotel (owner/admin)
 * @route  GET /api/v1/analytics/hotel/:hotelId
 * @access Private
 */
exports.getHotelAnalytics = asyncHandler(async (req, res, next) => {
  const { hotelId } = req.params;
  const { days = 30 } = req.query;

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new ApiError('Hotel not found', 404));
  }

  // Authorization: owner or admin
  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to view these analytics', 403));
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  startDate.setHours(0, 0, 0, 0);

  const analytics = await Engagement.find({
    hotel: hotelId,
    date: { $gte: startDate },
  }).sort({ date: 1 });

  const totals = analytics.reduce(
    (acc, day) => ({
      pageViews: acc.pageViews + day.metrics.pageViews,
      bookings: acc.bookings + day.metrics.bookings,
      revenue: acc.revenue + day.metrics.revenue,
      cancellations: acc.cancellations + day.metrics.cancellations,
      wishlistAdds: acc.wishlistAdds + day.metrics.wishlistAdds,
    }),
    { pageViews: 0, bookings: 0, revenue: 0, cancellations: 0, wishlistAdds: 0 }
  );

  res.status(200).json({
    success: true,
    data: {
      daily: analytics,
      totals,
      period: days,
    },
  });
});

/**
 * @desc   Get recommendation suggestions based on recent views
 * @route  GET /api/v1/analytics/recommendations
 * @access Public
 */
exports.getRecommendations = asyncHandler(async (req, res, next) => {
  const { sessionId, limit = 6 } = req.query;

  const query = req.user
    ? { user: req.user.id }
    : sessionId ? { sessionId } : {};

  const recentViews = await RecentView.find(query)
    .sort({ viewedAt: -1 })
    .limit(5)
    .populate('hotel', 'address.city category amenities');

  if (recentViews.length === 0) {
    // Fallback: return featured hotels
    const rawFeatured = await Hotel.find({ isFeatured: true, isApproved: true })
      .limit(parseInt(limit))
      .select('name images address rating category');

    const featured = await Promise.all(rawFeatured.map(async (hotel) => {
      const rooms = await Room.find({ hotel: hotel._id, isAvailable: true }).select('pricePerNight');
      const cheapestPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.pricePerNight)) : 150;
      return { ...hotel.toObject(), cheapestPrice, price: cheapestPrice };
    }));

    return res.status(200).json({
      success: true,
      source: 'featured',
      data: featured,
    });
  }

  // Extract cities, categories, and amenities from recent views
  const cities = [...new Set(recentViews.map((rv) => rv.hotel?.address?.city).filter(Boolean))];
  const categories = [...new Set(recentViews.map((rv) => rv.hotel?.category).filter(Boolean))];
  const amenities = [...new Set(recentViews.flatMap((rv) => rv.hotel?.amenities || []))];

  // Build recommendation query
  const recQuery = {
    isApproved: true,
    _id: { $nin: recentViews.map((rv) => rv.hotel?._id).filter(Boolean) },
    $or: [
      ...(cities.length ? [{ 'address.city': { $in: cities } }] : []),
      ...(categories.length ? [{ category: { $in: categories } }] : []),
      ...(amenities.length ? [{ amenities: { $in: amenities.slice(0, 5) } }] : []),
    ],
  };

  // If no $or conditions, fetch trending
  if (recQuery.$or.length === 0) {
    delete recQuery.$or;
  }

  const rawRecommendations = await Hotel.find(recQuery)
    .limit(parseInt(limit))
    .select('name images address rating category amenities')
    .sort({ rating: -1, numReviews: -1 });

  const recommendations = await Promise.all(rawRecommendations.map(async (hotel) => {
    const rooms = await Room.find({ hotel: hotel._id, isAvailable: true }).select('pricePerNight');
    const cheapestPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.pricePerNight)) : 150;
    return { ...hotel.toObject(), cheapestPrice, price: cheapestPrice };
  }));

  res.status(200).json({
    success: true,
    source: 'personalized',
    data: recommendations,
  });
});
