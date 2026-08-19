const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    maxLength: [50, 'Name cannot exceed 50 characters'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password in queries by default
  },
  phone: {
    type: String,
    maxLength: [15, 'Phone number cannot exceed 15 characters'],
  },
  avatar: {
    public_id: String,
    url: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1/avatars/default-avatar.png',
    },
  },
  role: {
    type: String,
    enum: ['user', 'owner', 'admin'],
    default: 'user',
  },
  // Account status for admin activate/deactivate/suspend actions
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  // Owner-specific verification + suspension metadata (sparse; only set for owners)
  ownerProfile: {
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    suspendedAt: Date,
    suspendReason: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  verifyEmailToken: String,
  verifyEmailExpire: Date,
  refreshToken: String,
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    holderName: String,
  },
  taxSummary: {
    panNumber: String,
    gstNumber: String,
    TDS: { type: Number, default: 0 },
  },
  notificationPreferences: {
    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: false },
    inAppAlerts: { type: Boolean, default: true },
    bookingUpdates: { type: Boolean, default: true },
    hotelUpdates: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
});

// Indexes for performance
userSchema.index({ role: 1, createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) {
    return next();
  }
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT Access Token
userSchema.methods.getAccessToken = function () {
  const secret = process.env.JWT_SECRET || 'bookmystay_jwt_secret_key_change_in_production_2024';
  const expire = process.env.JWT_EXPIRE || '1d';
  return jwt.sign(
    { id: this._id, role: this.role },
    secret,
    { expiresIn: expire }
  );
};

// Generate Refresh Token
userSchema.methods.getRefreshToken = function () {
  const secret = process.env.REFRESH_TOKEN_SECRET || 'bookmystay_refresh_token_secret_change_in_production_2024';
  const expire = process.env.REFRESH_TOKEN_EXPIRE || '7d';
  return jwt.sign(
    { id: this._id },
    secret,
    { expiresIn: expire }
  );
};

// Generate Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

// Generate Email Verification Token
userSchema.methods.getVerifyEmailToken = function () {
  const verifyToken = crypto.randomBytes(20).toString('hex');
  this.verifyEmailToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
  this.verifyEmailExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verifyToken;
};

module.exports = mongoose.model('User', userSchema);
