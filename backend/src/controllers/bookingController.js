"use strict";

const Booking = require("../models/Booking");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendOk, sendCreated } = require("../utils/response");
const { BOOKING_STATUS, HOLD_EXPIRY_MINUTES } = require("../config/constants");
const scheduleService = require("../services/scheduleService");
const holdCleanupService = require("../services/holdCleanupService");
const emailService = require("../services/emailService");
const logger = require("../utils/logger");

const getDefaultEndTime = async (date, startTime) => {
  const schedule = await scheduleService.getOrCreateSchedule(date);
  const boundaries = scheduleService.getSlotBoundaryTimes(schedule);
  const startIndex = boundaries.indexOf(startTime);
  return boundaries[startIndex + 1] || null;
};

const isExpiredHold = (booking) => {
  return (
    booking.status === BOOKING_STATUS.ON_HOLD &&
    booking.holdExpiresAt &&
    new Date(booking.holdExpiresAt) <= new Date()
  );
};

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
  if (!booking) return next(new AppError("Booking not found", 404));
  if (isExpiredHold(booking))
    return next(new AppError("This booking hold has expired.", 409));

  sendOk(res, { booking });
});

/**
 * POST /api/bookings
 * Public (website) or Admin
 * Validates slot availability and creates a temporary booking hold.
 */
const createBooking = asyncHandler(async (req, res, next) => {
  const { preferredDate, preferredTime, holdToken } = req.body;

  await holdCleanupService.expireStaleBookingHolds();
  const schedule = await scheduleService.getOrCreateSchedule(preferredDate);

  const bookingData = { ...req.body };
  delete bookingData.holdToken;
  if (req.admin) {
    bookingData.createdByAdmin = true;
    bookingData.createdByAdminId = req.admin._id;
  }
  bookingData.status = BOOKING_STATUS.ON_HOLD;

  bookingData.statusHistory = [
    {
      status: bookingData.status || BOOKING_STATUS.PENDING,
      changedBy: req.admin?._id,
      reason: req.admin
        ? "Created by admin"
        : "Client requested a temporary hold",
    },
  ];

  let booking;
  try {
    booking = await Booking.create(bookingData);
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new AppError(
          `The time slot ${preferredTime} on ${preferredDate} is already held.`,
          409,
        ),
      );
    }
    throw error;
  }

  const holdExpiresAt = holdToken
    ? await scheduleService.bindClientHoldToBooking({
        schedule,
        time: preferredTime,
        holdToken,
        bookingId: booking._id,
        expiryMinutes: HOLD_EXPIRY_MINUTES,
      })
    : await scheduleService.holdSlotAtomically({
        date: preferredDate,
        time: preferredTime,
        bookingId: booking._id,
        expiryMinutes: HOLD_EXPIRY_MINUTES,
      });

  if (!holdExpiresAt) {
    await booking.deleteOne();
    return next(
      new AppError(
        `The time slot ${preferredTime} on ${preferredDate} is no longer available.`,
        409,
      ),
    );
  }

  booking.status = BOOKING_STATUS.ON_HOLD;
  booking.holdExpiresAt = holdExpiresAt;
  await booking.save();

  logger.info("booking.created", {
    requestId: req.requestId,
    bookingId: booking._id.toString(),
    adminId: req.admin?._id?.toString() || null,
    preferredDate,
    preferredTime,
    createdByAdmin: Boolean(req.admin),
    holdExpiresAt,
  });

  // Fire-and-forget — do not block response
  emailService.sendBookingPending(booking).catch(console.error);
  emailService.sendAdminBookingHoldNotification(booking).catch(console.error);

  sendCreated(res, { booking }, "Booking hold submitted successfully");
});

const confirmBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) return next(new AppError("Booking not found", 404));

  if (booking.status === BOOKING_STATUS.CONFIRMED && isExpiredHold(booking)) {
    return next(new AppError("This booking hold has expired.", 409));
  }

  const date = req.body.date || booking.preferredDate;
  const { startTime, endTime, adminNotes, reason } = req.body;
  const previousHold = {
    date: booking.preferredDate,
    time: booking.preferredTime,
  };

  const rangeResult = await scheduleService.blockConfirmedRange({
    bookingId: booking._id,
    date,
    startTime,
    endTime,
    previousHold,
  });

  if (!rangeResult.ok) {
    return next(new AppError(rangeResult.reason, 409));
  }

  if (date !== booking.preferredDate) {
    await scheduleService.releaseBookingHolds({
      bookingId: booking._id,
      exceptDate: date,
    });
  }

  const previousStatus = booking.status;
  booking.preferredDate = date;
  booking.preferredTime = startTime;
  booking.status = BOOKING_STATUS.CONFIRMED;
  booking.holdExpiresAt = null;
  if (adminNotes !== undefined) booking.adminNotes = adminNotes;
  booking.statusHistory.push({
    status: BOOKING_STATUS.CONFIRMED,
    changedBy: req.admin._id,
    reason: reason || `Confirmed for ${date} ${startTime}-${endTime}`,
  });

  await booking.save();

  logger.info("booking.confirmed", {
    requestId: req.requestId,
    bookingId: booking._id.toString(),
    adminId: req.admin?._id?.toString() || null,
    previousStatus,
    date,
    startTime,
    endTime,
    blockedSlots: rangeResult.slotTimes,
  });

  emailService
    .sendBookingConfirmation(booking, { endTime })
    .catch(console.error);

  sendOk(
    res,
    { booking, blockedSlots: rangeResult.slotTimes },
    "Booking confirmed",
  );
});

/**
 * PUT /api/bookings/:id/status
 * Admin — update booking status with side effects
 */
const updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { status, reason, adminNotes } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new AppError("Booking not found", 404));

  const previousStatus = booking.status;

  if (
    status === BOOKING_STATUS.CONFIRMED &&
    previousStatus !== BOOKING_STATUS.CONFIRMED
  ) {
    const startTime = req.body.startTime || booking.preferredTime;
    const endTime =
      req.body.endTime ||
      (await getDefaultEndTime(booking.preferredDate, startTime));
    if (!endTime) {
      return next(
        new AppError("Unable to infer booking end time for confirmation.", 400),
      );
    }

    const rangeResult = await scheduleService.blockConfirmedRange({
      bookingId: booking._id,
      date: booking.preferredDate,
      startTime,
      endTime,
      previousHold: {
        date: booking.preferredDate,
        time: booking.preferredTime,
      },
    });

    if (!rangeResult.ok) {
      return next(new AppError(rangeResult.reason, 409));
    }

    booking.preferredTime = startTime;
    booking.holdExpiresAt = null;
    emailService
      .sendBookingConfirmation(booking, { endTime })
      .catch(console.error);
  }

  if (
    status === BOOKING_STATUS.ON_HOLD &&
    previousStatus !== BOOKING_STATUS.ON_HOLD
  ) {
    const holdExpiresAt = await scheduleService.holdSlotAtomically({
      date: booking.preferredDate,
      time: booking.preferredTime,
      bookingId: booking._id,
      expiryMinutes: HOLD_EXPIRY_MINUTES,
    });
    if (!holdExpiresAt) {
      return next(new AppError("Unable to hold requested slot.", 409));
    }
    booking.holdExpiresAt = holdExpiresAt;
  }

  booking.status = status;
  if (adminNotes !== undefined) booking.adminNotes = adminNotes;

  // Track status change history
  booking.statusHistory.push({
    status,
    changedBy: req.admin._id,
    reason: reason || "",
  });

  await booking.save();

  logger.info("booking.status_updated", {
    requestId: req.requestId,
    bookingId: booking._id.toString(),
    adminId: req.admin?._id?.toString() || null,
    previousStatus,
    status,
  });

  // Slot management based on new status
  if (status === BOOKING_STATUS.CANCELLED) {
    await scheduleService.releaseBookingSlots({ bookingId: booking._id });
    emailService.sendBookingCancellation(booking).catch(console.error);
  }

  if (status === BOOKING_STATUS.COMPLETED) {
    await scheduleService.closeBookingSlots({
      bookingId: booking._id,
      reason: "Completed booking",
    });
  }

  sendOk(res, { booking }, "Booking status updated");
});

/**
 * PUT /api/bookings/:id
 * Admin — update booking fields (not status — use /status endpoint)
 */
const updateBooking = asyncHandler(async (req, res, next) => {
  // Prevent status change through this endpoint
  delete req.body.status;
  delete req.body.statusHistory;

  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!booking) return next(new AppError("Booking not found", 404));

  sendOk(res, { booking }, "Booking updated");
});

/**
 * DELETE /api/bookings/:id
 * Admin — hard delete (prefer cancellation for audit trail)
 */
const deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new AppError("Booking not found", 404));

  // Release schedule slot before deleting
  if (
    [
      BOOKING_STATUS.PENDING,
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.ON_HOLD,
    ].includes(booking.status)
  ) {
    await scheduleService.releaseBookingSlots({ bookingId: booking._id });
  }

  await booking.deleteOne();

  sendOk(res, {}, "Booking deleted");
});

/**
 * GET /api/bookings/dashboard
 * Admin — aggregated stats for dashboard
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const [statusCounts, recentBookings] = await Promise.all([
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("clientName email preferredDate preferredTime status createdAt")
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
  confirmBooking,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  getDashboardStats,
};
