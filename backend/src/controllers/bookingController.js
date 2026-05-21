'use strict';

const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendOk, sendCreated } = require('../utils/response');
const { BOOKING_STATUS, SLOT_STATUS, HOLD_EXPIRY_MINUTES } = require('../config/constants');
const scheduleService = require('../services/scheduleService');
const emailService = require('../services/emailService');

/**
 * GET /api/bookings
 * Admin — list all bookings with optional filters
 */
const getAllBookings = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) filter.preferredDate = req.query.date;
  if (req.query.email) filter.email = req.query.email.toLowerCase();

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ preferredDate: 1, preferredTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  sendOk(res, {
    bookings,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/bookings/:id
 * Admin — single booking
 */
const getBookingById = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new AppError('Booking not found', 404));

  sendOk(res, { booking });
});

/**
 * POST /api/bookings
 * Public (website) or Admin
 * Validates slot availability, creates booking, marks slot.
 */
const createBooking = asyncHandler(async (req, res, next) => {
  const { preferredDate, preferredTime } = req.body;

  const schedule = await scheduleService.getOrCreateSchedule(preferredDate);

  if (!scheduleService.isSlotBookable(schedule, preferredTime)) {
    return next(
      new AppError(
        `The time slot ${preferredTime} on ${preferredDate} is not available.`,
        409
      )
    );
  }

  const bookingData = { ...req.body };
  if (req.admin) {
    bookingData.createdByAdmin = true;
    bookingData.createdByAdminId = req.admin._id;
  }

  const booking = await Booking.create(bookingData);

  await scheduleService.markSlotBooked(schedule, preferredTime, booking._id);

  // Fire-and-forget — do not block response
  emailService.sendBookingPending(booking).catch(console.error);

  sendCreated(res, { booking }, 'Booking submitted successfully');
});

/**
 * PUT /api/bookings/:id/status
 * Admin — update booking status with side effects
 */
const updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { status, reason, adminNotes } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new AppError('Booking not found', 404));

  const previousStatus = booking.status;

  booking.status = status;
  if (adminNotes !== undefined) booking.adminNotes = adminNotes;

  // Track status change history
  booking.statusHistory.push({
    status,
    changedBy: req.admin._id,
    reason: reason || '',
  });

  await booking.save();

  const schedule = await scheduleService.getOrCreateSchedule(booking.preferredDate);

  // Slot management based on new status
  if (status === BOOKING_STATUS.CANCELLED) {
    await scheduleService.releaseSlot(schedule, booking.preferredTime);
    emailService.sendBookingCancellation(booking).catch(console.error);
  }

  if (status === BOOKING_STATUS.CONFIRMED && previousStatus !== BOOKING_STATUS.CONFIRMED) {
    emailService.sendBookingConfirmation(booking).catch(console.error);
  }

  if (status === BOOKING_STATUS.ON_HOLD) {
    await scheduleService.holdSlot(
      schedule,
      booking.preferredTime,
      booking._id,
      HOLD_EXPIRY_MINUTES
    );
  }

  if (
    (status === BOOKING_STATUS.CONFIRMED || status === BOOKING_STATUS.COMPLETED) &&
    previousStatus === BOOKING_STATUS.ON_HOLD
  ) {
    // Slot was on-hold, mark as booked again
    await scheduleService.markSlotBooked(schedule, booking.preferredTime, booking._id);
  }

  sendOk(res, { booking }, 'Booking status updated');
});

/**
 * PUT /api/bookings/:id
 * Admin — update booking fields (not status — use /status endpoint)
 */
const updateBooking = asyncHandler(async (req, res, next) => {
  // Prevent status change through this endpoint
  delete req.body.status;
  delete req.body.statusHistory;

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!booking) return next(new AppError('Booking not found', 404));

  sendOk(res, { booking }, 'Booking updated');
});

/**
 * DELETE /api/bookings/:id
 * Admin — hard delete (prefer cancellation for audit trail)
 */
const deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new AppError('Booking not found', 404));

  // Release schedule slot before deleting
  if ([BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ON_HOLD].includes(booking.status)) {
    const schedule = await scheduleService.getOrCreateSchedule(booking.preferredDate);
    await scheduleService.releaseSlot(schedule, booking.preferredTime);
  }

  await booking.deleteOne();

  sendOk(res, {}, 'Booking deleted');
});

/**
 * GET /api/bookings/dashboard
 * Admin — aggregated stats for dashboard
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const [statusCounts, recentBookings] = await Promise.all([
    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('clientName email preferredDate preferredTime status createdAt')
      .lean(),
  ]);

  const stats = statusCounts.reduce((acc, cur) => {
    acc[cur._id] = cur.count;
    return acc;
  }, {});

  const total = await Booking.countDocuments();

  sendOk(res, {
    stats: {
      total,
      ...stats,
    },
    recentBookings,
  });
});

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  getDashboardStats,
};
