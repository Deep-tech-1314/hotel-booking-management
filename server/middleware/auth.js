const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// Check if user is authenticated
exports.isAuthenticated = async (req, res, next) => {
  try {
    let token;

    // Check cookies first, then Authorization header
    if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError('Please login to access this resource', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bookmystay_jwt_secret_key_change_in_production_2024');
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ApiError('User not found. Please login again', 401));
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError('Token expired. Please login again', 401));
    }
    return next(new ApiError('Invalid token. Please login again', 401));
  }
};

// Authorize roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(`Role (${req.user.role}) is not allowed to access this resource`, 403)
      );
    }
    next();
  };
};

// Optional authentication – attaches user if token exists, otherwise continues as guest
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bookmystay_jwt_secret_key_change_in_production_2024');
      req.user = await User.findById(decoded.id);
    }

    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
};
