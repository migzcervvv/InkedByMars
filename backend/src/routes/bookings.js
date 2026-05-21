'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  getDashboardStats,
} = require('../controllers/bookingController');

const {
  createBookingValidators,
  updateBookingStatusValidators,
  mongoIdParam,
} = require('../validators/bookingValidators');

const validate = require('../middlewares/validate');
const { requireAdmin } = require('../middlewares/auth');

// All booking routes require admin auth
router.use(requireAdmin);

router.get('/dashboard', getDashboardStats);

router
  .route('/')
  .get(getAllBookings)
  .post(createBookingValidators, validate, createBooking);

router
  .route('/:id')
  .get(mongoIdParam, validate, getBookingById)
  .put(mongoIdParam, validate, updateBooking)
  .delete(mongoIdParam, validate, deleteBooking);

router.put(
  '/:id/status',
  updateBookingStatusValidators,
  validate,
  updateBookingStatus
);

module.exports = router;
