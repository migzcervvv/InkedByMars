'use strict';

const { body, param } = require('express-validator');
const { BOOKING_STATUS } = require('../config/constants');
const dayjs = require('dayjs');

const createBookingValidators = [
  body('clientName')
    .trim()
    .notEmpty()
    .withMessage('Client name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),

  body('email')
    .isEmail()
    .withMessage('Provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),

  body('tattooIdea')
    .trim()
    .notEmpty()
    .withMessage('Tattoo idea is required')
    .isLength({ max: 2000 })
    .withMessage('Tattoo idea cannot exceed 2000 characters'),

  body('tattooPlacement')
    .trim()
    .notEmpty()
    .withMessage('Tattoo placement is required'),

  body('tattooSize')
    .optional()
    .isIn(['tiny', 'small', 'medium', 'large', 'extra_large', 'custom'])
    .withMessage('Invalid tattoo size'),

  body('preferredDate')
    .notEmpty()
    .withMessage('Preferred date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      if (!dayjs(value, 'YYYY-MM-DD', true).isValid()) {
        throw new Error('Invalid date');
      }
      if (dayjs(value).isBefore(dayjs().startOf('day'))) {
        throw new Error('Preferred date cannot be in the past');
      }
      return true;
    }),

  body('preferredTime')
    .notEmpty()
    .withMessage('Preferred time is required')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Time must be in HH:MM 24h format'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
];

const updateBookingStatusValidators = [
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(BOOKING_STATUS))
    .withMessage(`Status must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

const mongoIdParam = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
];

module.exports = {
  createBookingValidators,
  updateBookingStatusValidators,
  mongoIdParam,
};
