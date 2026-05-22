'use strict';

const AppError = require('../utils/AppError');

const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      next(new AppError('Request timed out. Please retry.', 408));
    });
    next();
  };
};

module.exports = requestTimeout;

