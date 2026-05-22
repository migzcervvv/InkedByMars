'use strict';

const { body, param, query } = require('express-validator');
const { DAY_STATUS } = require('../config/constants');
const dayjs = require('dayjs');

const dateParamValidator = [
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      if (!dayjs(value, 'YYYY-MM-DD', true).isValid()) {
        throw new Error('Invalid date');
      }
      return true;
    }),
];

const blockDayValidators = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      if (!dayjs(value, 'YYYY-MM-DD', true).isValid()) {
        throw new Error('Invalid date');
      }
      return true;
    }),
  body('dayStatus')
    .notEmpty()
    .withMessage('dayStatus is required')
    .isIn(Object.values(DAY_STATUS))
    .withMessage(`dayStatus must be one of: ${Object.values(DAY_STATUS).join(', ')}`),
  body('closureReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Closure reason cannot exceed 500 characters'),
];

const blockSlotValidators = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Time must be in HH:MM 24h format'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

const releaseSlotValidators = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Time must be in HH:MM 24h format'),
];

const rangeQueryValidators = [
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('startDate must be in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('endDate must be in YYYY-MM-DD format'),
];

const applyOpeningWindowValidators = [
  body('scope')
    .optional()
    .isIn(['this_week', 'this_month', 'range', 'forever'])
    .withMessage('scope must be this_week, this_month, range, or forever'),
  body('startDate')
    .notEmpty()
    .withMessage('startDate is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('startDate must be in YYYY-MM-DD format'),
  body('endDate')
    .notEmpty()
    .withMessage('endDate is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('endDate must be in YYYY-MM-DD format'),
  body('openTime')
    .notEmpty()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('openTime must be in HH:MM format'),
  body('closeTime')
    .notEmpty()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('closeTime must be in HH:MM format'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

module.exports = {
  dateParamValidator,
  blockDayValidators,
  blockSlotValidators,
  releaseSlotValidators,
  rangeQueryValidators,
  applyOpeningWindowValidators,
};
