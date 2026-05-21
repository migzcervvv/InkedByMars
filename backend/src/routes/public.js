'use strict';

const express = require('express');
const router = express.Router();

const { getAvailability, getAvailabilityByDate } = require('../controllers/publicController');
const { createBooking } = require('../controllers/bookingController');
const { createBookingValidators } = require('../validators/bookingValidators');
const { dateParamValidator } = require('../validators/scheduleValidators');
const validate = require('../middlewares/validate');

// These routes are intentionally unauthenticated — for the public-facing website

router.get('/availability', getAvailability);
router.get('/availability/:date', dateParamValidator, validate, getAvailabilityByDate);

// Allow public booking submissions (website contact/booking form)
router.post('/bookings', createBookingValidators, validate, createBooking);

module.exports = router;
