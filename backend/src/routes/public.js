'use strict';

const express = require('express');
const router = express.Router();

const {
  getAvailability,
  getAvailabilityByDate,
  createSlotHold,
  releaseSlotHold,
} = require('../controllers/publicController');
const { createBooking } = require('../controllers/bookingController');
const { createBookingValidators } = require('../validators/bookingValidators');
const { dateParamValidator, clientHoldValidators } = require('../validators/scheduleValidators');
const validate = require('../middlewares/validate');

// These routes are intentionally unauthenticated — for the public-facing website

router.get('/availability', getAvailability);
router.get('/availability/:date', dateParamValidator, validate, getAvailabilityByDate);
router.post('/holds', clientHoldValidators, validate, createSlotHold);
router.post('/holds/release', clientHoldValidators, validate, releaseSlotHold);

// Allow public booking submissions (website contact/booking form)
router.post('/bookings', createBookingValidators, validate, createBooking);

module.exports = router;
