const { AppError, ValidationError } = require('../shared/errors');
const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  logger.error(err.message, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      data: null,
    });
  }

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      data: null,
    });
  }

  const statusCode = 500;
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    data: null,
  });
}

module.exports = errorHandler;
