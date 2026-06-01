'use strict';

const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value for field '${field}': '${value}'. Please use a different value.`;
  return new AppError(message, 409, 'DUPLICATE_VALUE');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401, 'AUTH_INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Token expired. Please log in again.', 401, 'AUTH_TOKEN_EXPIRED');

const sendError = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    code: err.code || 'INTERNAL_ERROR',
    requestId: res.req.requestId,
    details: err.details,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    sendError(err, res);
  } else {
    logger.error('error.unhandled', {
      requestId: res.req.requestId,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: 'The server could not complete the request.',
      code: 'INTERNAL_ERROR',
      requestId: res.req.requestId,
    });
  }
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error('request.error', {
    requestId: req.requestId,
    method: req.method,
    endpoint: req.originalUrl,
    statusCode: err.statusCode,
    adminId: req.admin?._id?.toString() || null,
    message: err.message,
    stack: err.stack,
  });

  let error = err;

  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  sendErrorProd(error, res);
};

module.exports = errorHandler;
