const PlatformSettings = require('../models/PlatformSettings');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

// Helper to get or create settings
const getOrCreateSettings = async () => {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({});
  }
  return settings;
};

// @desc    Get platform settings
// @route   GET /api/v1/settings
// @access  Public
exports.getSettings = asyncHandler(async (req, res, next) => {
  const settings = await getOrCreateSettings();

  res.status(200).json({
    success: true,
    data: settings,
  });
});

// @desc    Update platform settings
// @route   PUT /api/v1/settings
// @access  Admin
exports.updateSettings = asyncHandler(async (req, res, next) => {
  let settings = await getOrCreateSettings();

  settings = await PlatformSettings.findByIdAndUpdate(
    settings._id,
    { ...req.body, updatedBy: req.user._id },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: settings,
  });
});
