const { AppError, ValidationError } = require('../shared/errors');
const logger = require('../utils/logger');
const multer = require('multer');

function isInvalidMultipartRequest(err) {
  return typeof err?.message === 'string' && err.message.includes('Multipart: Boundary not found');
}

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

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: err.message,
      data: null,
    });
  }

  if (isInvalidMultipartRequest(err)) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid multipart/form-data request: missing boundary. Do not set Content-Type manually when uploading files.',
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
