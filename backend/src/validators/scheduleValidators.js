const { body, param, query } = require('express-validator');
const { validDate } = require('../services/bookingPolicy');

const dateParamValidator = [param('date').custom(validDate).withMessage('Date must be a valid YYYY-MM-DD date')];
const rangeQueryValidators = [
  query('startDate').optional().custom(validDate).withMessage('Invalid start date'),
  query('endDate').optional().custom(validDate).withMessage('Invalid end date'),
];
const monthQueryValidators = [
  query('month').optional().matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('Month must be in YYYY-MM format'),
];

const blockDaysValidators = [
  body('days').isArray({ min: 1, max: 31 }).withMessage('Choose between 1 and 31 dates.').bail()
    .custom(days => days.every(day => day && typeof day === 'object' && !Array.isArray(day))).withMessage('Choose valid calendar dates.').bail()
    .custom(days => new Set(days.map(day => day?.date)).size === days.length).withMessage('Choose each date once.'),
  body('days.*.date').custom(validDate).withMessage('Choose a valid calendar date.'),
  body('days.*.version').custom(value => value === null || (Number.isSafeInteger(value) && value >= 0)).withMessage('Reload the calendar and choose the date again.'),
  body('reason').optional().isString().trim().isLength({ max: 500 }),
];

module.exports = { blockDaysValidators, dateParamValidator, rangeQueryValidators, monthQueryValidators };
