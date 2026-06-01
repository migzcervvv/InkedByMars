'use strict';

const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError('Route not found.', 404, 'ROUTE_NOT_FOUND'));
};

module.exports = notFound;
