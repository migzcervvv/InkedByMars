'use strict';

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Run after express-validator chains.
 * Collects all errors and returns 422 if any exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
      value: e.value,
    }));
    const error = new AppError(details.map((e) => e.message).join('. '), 422);
    error.details = details;
    return next(error);
  }
  next();
};

module.exports = validate;
