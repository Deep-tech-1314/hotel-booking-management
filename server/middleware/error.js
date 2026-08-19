const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.errors = err.errors || [];
  error.code = err.code || undefined;

  // Log error for development
  if (process.env.NODE_ENV === 'development') {
    if (!error.statusCode || error.statusCode === 500) {
      console.error('❌ Server Error:', err);
    } else {
      console.warn(`⚠️ API Error [${error.statusCode}]: ${err.message}`);
    }
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    error = new ApiError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ApiError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    const message = 'Validation Failed';
    error = new ApiError(message, 400, messages);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError('Invalid token. Please login again', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError('Token expired. Please login again', 401, [], 'TOKEN_EXPIRED');
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Too many files uploaded or invalid field name '${err.field || 'file'}'. Maximum 10 images allowed.`;
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size is too large. Maximum allowed size is 5MB per image.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded. Maximum 10 images allowed.';
    } else {
      message = err.message;
    }
    error = new ApiError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(error.code && { code: error.code }),
    errors: error.errors && error.errors.length > 0 ? error.errors : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
