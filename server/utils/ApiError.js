class ApiError extends Error {
  constructor(message, statusCode, errors = [], code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
