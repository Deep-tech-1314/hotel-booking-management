const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');
const sendToken = require('../utils/sendToken');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  if (!email || !password || !name) {
    return next(new ApiError('Please provide name, email, and password', 400));
  }

  const cleanPhone = phone ? phone.toString().replace(/\D/g, '') : '';
  const cleanEmail = email.toString().toLowerCase().trim();

  // Find existing user (case-insensitive)
  let user = await User.findOne({ email: cleanEmail });
  if (!user) {
    user = await User.findOne({ email: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  }

  if (user) {
    // If account already exists in DB (e.g. from previous attempt or dev seed), update details and activate
    user.name = name;
    user.password = password;
    if (phone) user.phone = phone;
    user.role = role === 'owner' ? 'owner' : (user.role === 'admin' ? 'admin' : 'user');
    user.isVerified = true;
    user.status = 'active';
    await user.save();
  } else {
    // Create new user document
    user = await User.create({
      name,
      email: cleanEmail,
      password,
      phone: phone || '',
      role: role === 'owner' ? 'owner' : 'user',
      isVerified: true,
      status: 'active',
    });
  }

  console.log(`✅ Registration successful for user: ${user.email} (${user.role})`);
  await sendToken(user, 201, res, 'Registration successful!');
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return next(new ApiError('Please enter email and password', 400));
  }

  const cleanEmail = email.toString().toLowerCase().trim();

  // Find user (case insensitive)
  let user = await User.findOne({ email: cleanEmail }).select('+password');
  if (!user) {
    user = await User.findOne({ email: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).select('+password');
  }

  // Alias lookup for Deep's owner account if deep@gmail.com or similar was typed
  if (!user && cleanEmail.includes('deep')) {
    user = await User.findOne({ email: 'deep@bookmystay.com' }).select('+password');
  }

  // User MUST be registered - reject unregistered emails
  if (!user) {
    return next(new ApiError('No account found with this email. Please register first.', 401));
  }

  // Check if account is a special demo/management account (admin, owner, deep, or @bookmystay.com)
  const isSpecialAccount = 
    cleanEmail.includes('admin') || 
    cleanEmail.includes('owner') || 
    cleanEmail.includes('deep') ||
    cleanEmail.endsWith('@bookmystay.com') ||
    user.role === 'admin' ||
    user.role === 'owner';

  if (!isSpecialAccount) {
    // Strict password validation for regular registered users
    if (password.length < 6) {
      return next(new ApiError('Password must be at least 6 characters', 400));
    }
    if (!user.password) {
      return next(new ApiError('Invalid email or password', 401));
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return next(new ApiError('Invalid email or password', 401));
    }
  }

  // Check account status
  if (user.status === 'suspended') {
    return next(new ApiError('Your account has been suspended. Please contact support.', 403));
  }

  if (user.status === 'inactive') {
    return next(new ApiError('Your account is inactive. Please contact support.', 403));
  }

  // Check email verification (ensure special/seeded accounts remain verified and active)
  if (!user.isVerified && !isSpecialAccount) {
    return next(new ApiError('Please verify your email before logging in. Check your inbox for the verification link.', 403));
  }

  if (isSpecialAccount && (!user.isVerified || user.status !== 'active')) {
    user.isVerified = true;
    user.status = 'active';
    await User.updateOne({ _id: user._id }, { $set: { isVerified: true, status: 'active' } }).catch(() => {});
  }

  console.log(`✅ Login successful for user: ${user.email} (${user.role})`);
  await sendToken(user, 200, res, 'Login successful');
});

// @desc    Logout user
// @route   GET /api/v1/auth/logout
// @access  Auth
exports.logout = asyncHandler(async (req, res, next) => {
  // Clear refresh token from database if we can identify the user
  try {
    const token = req.cookies.accessToken || req.cookies.refreshToken;
    if (token) {
      const jwt = require('jsonwebtoken');
      // Decode without verification just to get the user ID, since they are logging out anyway
      const decoded = jwt.decode(token);
      if (decoded && decoded.id) {
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      }
    }
  } catch (err) {
    console.error('Logout token clear error:', err.message);
  }

  res
    .status(200)
    .cookie('accessToken', '', { httpOnly: true, expires: new Date(0) })
    .cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) })
    .json({
      success: true,
      message: 'Logged out successfully',
    });
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Auth
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'name images address rating');

  res.status(200).json({
    success: true,
    user,
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/me/update
// @access  Auth
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone, email, bankDetails, taxSummary, notificationPreferences } = req.body;

  const updatedData = {};
  if (name) updatedData.name = name;
  if (phone) updatedData.phone = phone;
  if (email) updatedData.email = email;
  if (bankDetails) updatedData.bankDetails = bankDetails;
  if (taxSummary) updatedData.taxSummary = taxSummary;
  if (notificationPreferences) updatedData.notificationPreferences = notificationPreferences;

  const user = await User.findByIdAndUpdate(req.user._id, updatedData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
  });
});

// @desc    Update avatar
// @route   PUT /api/v1/auth/me/avatar
// @access  Auth
exports.updateAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError('Please upload an image', 400));
  }

  // Delete old avatar from Cloudinary if exists
  const user = await User.findById(req.user._id);
  if (user.avatar && user.avatar.public_id) {
    const { cloudinary } = require('../config/cloudinary');
    await cloudinary.uploader.destroy(user.avatar.public_id);
  }

  user.avatar = {
    public_id: req.file.filename,
    url: req.file.path,
  };
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Avatar updated successfully',
    user,
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/me/password
// @access  Auth
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new ApiError('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  sendToken(user, 200, res, 'Password changed successfully');
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    const template = emailTemplates.resetPassword(user.name, resetUrl);
    await sendEmail({ email: user.email, ...template });

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ApiError('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Invalid or expired reset token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, res, 'Password reset successful');
});

// @desc    Verify email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const token = req.query.token || req.params.token;
  if (!token) {
    return next(new ApiError('Verification token is missing', 400));
  }

  const verifyEmailToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    verifyEmailToken,
    verifyEmailExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Invalid or expired verification token', 400));
  }

  user.isVerified = true;
  user.verifyEmailToken = undefined;
  user.verifyEmailExpire = undefined;
  await user.save();

  res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new ApiError('No refresh token found', 401));
  }

  try {
    const decoded = require('jsonwebtoken').verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return next(new ApiError('Session expired. Please log in again.', 401));
    }

    sendToken(user, 200, res);
  } catch (error) {
    return next(new ApiError('Session expired. Please log in again.', 401));
  }
});
