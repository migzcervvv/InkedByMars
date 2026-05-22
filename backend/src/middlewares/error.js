'use strict';

const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value for field '${field}': '${value}'. Please use a different value.`;
  return new AppError(message, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token expired. Please log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    requestId: res.req.requestId,
    error: err,
    message: err.message,
    details: err.details,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      requestId: res.req.requestId,
      message: err.message,
      details: err.details,
    });
  } else {
    logger.error('error.unhandled', {
      requestId: res.req.requestId,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      requestId: res.req.requestId,
      message: 'Something went wrong. Please try again later.',
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

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message, name: err.name };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = errorHandler;
