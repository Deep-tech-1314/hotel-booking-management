const Video = require('../models/Video');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * @desc   Get all videos for a hotel
 * @route  GET /api/v1/hotels/:hotelId/videos
 * @access Public
 */
exports.getHotelVideos = asyncHandler(async (req, res, next) => {
  const videos = await Video.find({
    hotel: req.params.hotelId,
    isActive: true,
  }).sort({ order: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: videos.length,
    data: videos,
  });
});

/**
 * @desc   Get single video
 * @route  GET /api/v1/videos/:id
 * @access Public
 */
exports.getVideo = asyncHandler(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new ApiError('Video not found', 404));
  }

  // Increment view count
  video.views += 1;
  await video.save();

  res.status(200).json({
    success: true,
    data: video,
  });
});

/**
 * @desc   Create video for a hotel
 * @route  POST /api/v1/hotels/:hotelId/videos
 * @access Private/Hotel Owner
 */
exports.createVideo = asyncHandler(async (req, res, next) => {
  const { title, description, url, thumbnail, duration, type } = req.body;

  const video = await Video.create({
    hotel: req.params.hotelId,
    title,
    description,
    url,
    thumbnail,
    duration,
    type: type || 'tour',
  });

  res.status(201).json({
    success: true,
    data: video,
  });
});

/**
 * @desc   Update video
 * @route  PUT /api/v1/videos/:id
 * @access Private/Hotel Owner
 */
exports.updateVideo = asyncHandler(async (req, res, next) => {
  let video = await Video.findById(req.params.id);

  if (!video) {
    return next(new ApiError('Video not found', 404));
  }

  video = await Video.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: video,
  });
});

/**
 * @desc   Delete video
 * @route  DELETE /api/v1/videos/:id
 * @access Private/Hotel Owner
 */
exports.deleteVideo = asyncHandler(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new ApiError('Video not found', 404));
  }

  await video.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Video deleted',
  });
});
