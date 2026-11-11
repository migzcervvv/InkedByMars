const { param, query } = require('express-validator');
const { validDate } = require('../services/bookingPolicy');

const dateParamValidator = [param('date').custom(validDate).withMessage('Date must be a valid YYYY-MM-DD date')];
const rangeQueryValidators = [
  query('startDate').optional().custom(validDate).withMessage('Invalid start date'),
  query('endDate').optional().custom(validDate).withMessage('Invalid end date'),
];
const monthQueryValidators = [
  query('month').optional().matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('Month must be in YYYY-MM format'),
];

module.exports = { dateParamValidator, rangeQueryValidators, monthQueryValidators };
