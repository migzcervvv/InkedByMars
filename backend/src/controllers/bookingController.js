"use strict";

const Booking = require("../models/Booking");
const AppError = require("../utils/AppError");
const { fail } = require('../utils/honoResponse');
const { sendOk, sendCreated } = require("../utils/honoResponse");
const { BOOKING_STATUS, HOLD_EXPIRY_MINUTES } = require("../config/constants");
const scheduleService = require("../services/scheduleService");
const holdCleanupService = require("../services/holdCleanupService");
const { purgeBookingReferences } = require('../services/referenceRetentionService');
const notificationService = require("../services/notificationService");

const { transaction } = require('../bindings/runtime');
const { requireBookableDate } = require('../services/bookingPolicy');
const { isExpired, views, viewFilter, requireCurrentVersion } = require('../services/bookingReview');
const { mediaUrl, isMediaKey } = require('../services/mediaService');

const serializePublicBooking = (booking) => {
  const data = booking.toJSON ? booking.toJSON() : { ...booking };
  delete data.holdExpiresAt;
  return data;
};


/**
 * GET /api/bookings
 * Admin — list all bookings with optional filters
 */
const getAllBookings = async (c) => {
  const { query } = c.get('input');
  const now = new Date();
  const view = views.includes(query.view) ? query.view : 'all';
  const filter = {};
  if (query.status && !query.view) filter.status = query.status;
  if (query.date) filter.preferredDate = query.date;
  if (query.email) filter.email = query.email.toLowerCase();
  if (typeof query.search === 'string' && query.search.trim()) {
    const escaped = query.search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ clientName: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
  }

  const page = Math.max(1, Math.min(10000, Number.parseInt(query.page, 10) || 1));
  const limit = Math.max(1, Math.min(Number.parseInt(query.limit, 10) || 20, 100));
  const sort = view === 'review' ? { reviewPriority: 1, holdExpiresAt: 1, createdAt: 1, _id: 1 }
    : { preferredDate: -1, preferredTime: 1, _id: 1 };
  const [result] = await Booking.aggregate([
    { $match: filter },
    { $facet: {
      ...Object.fromEntries(views.map(key => [key, [{ $match: viewFilter(key, now) }, { $count: 'total' }]])),
      bookings: [
        { $match: viewFilter(view, now) },
        { $set: { reviewPriority: { $cond: [{ $eq: ['$status', BOOKING_STATUS.ON_HOLD] }, 0, 1] } } },
        { $sort: sort }, { $skip: (page - 1) * limit }, { $limit: limit },
        { $project: { reviewPriority: 0, submissionKey: 0, stripePaymentIntentId: 0 } },
      ],
    } },
  ]);
  const counts = Object.fromEntries(views.map(key => [key, result[key][0]?.total || 0]));
  const total = counts[view];
  const origin = c.env.PUBLIC_MEDIA_BASE_URL || new URL(c.req.url).origin;
  return sendOk(c, {
    bookings: result.bookings.map(booking => ({
      ...booking, isExpired: isExpired(booking, now),
      referenceImages: (booking.referenceImages || []).filter(isMediaKey).map(key => ({ key, url: mediaUrl(key, origin) })),
    })),
    counts,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};

/**
 * GET /api/bookings/:id
 * Admin — single booking
 */
const getBookingById = async (c) => {
  const req = c.get('input');
  const booking = await Booking.findById(req.params.id);
  if (!booking) return fail(new AppError("Booking not found", 404));

  return sendOk(c, { booking });
};

/**
 * POST /api/bookings
 * Public (website) or Admin
 * Validates slot availability and creates a temporary booking hold.
 */
const createBooking = async (c) => {
  const req = c.get('input');
  const { preferredDate, preferredTime, submissionKey } = req.body;
  const existing = submissionKey ? await Booking.findOne({ submissionKey }) : null;
  if (existing) {
    if (existing.email !== req.body.email || existing.clientName !== req.body.clientName ||
        (existing.requestedDate || existing.preferredDate) !== preferredDate ||
        (existing.requestedTime || existing.preferredTime) !== preferredTime) {
      throw new AppError('This submission was already used for another request.', 409);
    }
    return sendCreated(c, { booking: req.admin ? existing : serializePublicBooking(existing) }, 'Request already received.');
  }
  requireBookableDate(preferredDate);
  await holdCleanupService.expireStaleBookingHolds();

  const allowed = ['clientName','email','phone','instagramHandle','tattooPlacement','tattooSize','preferredDate','preferredTime','notes','referenceImages','submissionKey'];
  const bookingData = Object.fromEntries(allowed.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
  if (bookingData.referenceImages?.length) {
    const storage = require('../bindings/mediaStorage').createMediaStorage(c.env);
    const references = await Promise.all(bookingData.referenceImages.map(key => storage.head(key)));
    if (references.includes(false)) throw new AppError('A reference upload is missing. Upload it again.', 400);
  }

  const booking = await transaction(async () => {
    requireBookableDate(preferredDate);
    const record = new Booking({
      ...bookingData,
      requestedDate: preferredDate,
      requestedTime: preferredTime,
      createdByAdmin: Boolean(req.admin),
      createdByAdminId: req.admin?._id,
      status: BOOKING_STATUS.ON_HOLD,
      statusHistory: [{
        status: BOOKING_STATUS.ON_HOLD,
        changedBy: req.admin?._id,
        reason: req.admin ? 'Created by admin' : 'Client requested a temporary hold',
      }],
    });
    record.holdExpiresAt = await scheduleService.holdSlotAtomically({
      date: preferredDate, time: preferredTime, bookingId: record._id, expiryMinutes: HOLD_EXPIRY_MINUTES,
    });
    if (!record.holdExpiresAt) throw new AppError('This time is no longer available. Choose another slot.', 409);
    await record.save();
    return record;
  });

  c.executionCtx.waitUntil(notificationService.sendBookingPending(booking));
  c.executionCtx.waitUntil(notificationService.notifyAdminNewBooking(booking));
  return sendCreated(c, { booking: req.admin ? booking : serializePublicBooking(booking) }, 'Booking request received.');
};

const confirmBooking = async (c) => {
  const req = c.get('input');
  const { date, startTime, endTime, adminNotes, expectedUpdatedAt } = req.body;
  requireBookableDate(date);
  const { booking, blockedSlots } = await transaction(async () => {
    const record = await Booking.findById(req.params.id);
    if (!record) throw new AppError('Booking not found', 404);
    requireCurrentVersion(record, expectedUpdatedAt);
    if (isExpired(record)) throw new AppError('This hold has expired. A new booking request is required.', 409);
    if (![BOOKING_STATUS.ON_HOLD, BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(record.status)) {
      throw new AppError('This booking cannot be confirmed or rescheduled.', 409);
    }
    requireBookableDate(date);
    await scheduleService.releaseBookingSlots({ bookingId: record._id });
    const range = await scheduleService.blockConfirmedRange({ bookingId: record._id, date, startTime, endTime });
    if (!range.ok) throw new AppError(range.reason, 409, 'SCHEDULE_CONFLICT');
    if (isExpired(record)) throw new AppError('This hold expired while saving. A new booking request is required.', 409);

    record.requestedDate ||= record.preferredDate;
    record.requestedTime ||= record.preferredTime;
    record.preferredDate = date;
    record.preferredTime = startTime;
    record.appointmentEnd = endTime;
    record.status = BOOKING_STATUS.CONFIRMED;
    record.holdExpiresAt = null;
    if (adminNotes !== undefined) record.adminNotes = adminNotes;
    record.statusHistory.push({
      status: BOOKING_STATUS.CONFIRMED, changedBy: req.admin._id,
      reason: `Appointment set for ${date} ${startTime}–${endTime}`,
    });
    await record.save();
    return { booking: record, blockedSlots: range.slotTimes };
  });
  c.executionCtx.waitUntil(notificationService.sendBookingConfirmation(booking, { endTime }));
  return sendOk(c, { booking, blockedSlots }, 'Appointment saved.');
};

const updateBookingStatus = async (c) => {
  const req = c.get('input');
  const { status, reason, adminNotes, expectedUpdatedAt } = req.body;
  const booking = await transaction(async () => {
    const record = await Booking.findById(req.params.id);
    if (!record) throw new AppError('Booking not found', 404);
    requireCurrentVersion(record, expectedUpdatedAt);
    const canCancel = status === BOOKING_STATUS.CANCELLED &&
      [BOOKING_STATUS.ON_HOLD, BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(record.status) &&
      !isExpired(record);
    const canComplete = status === BOOKING_STATUS.COMPLETED && record.status === BOOKING_STATUS.CONFIRMED;
    if (!canCancel && !canComplete) throw new AppError('This booking no longer supports that action.', 409);
    if (canCancel && !reason) throw new AppError('Enter a reason for declining or cancelling the booking.', 400);
    if (canCancel) await scheduleService.releaseBookingSlots({ bookingId: record._id });
    if (canComplete) await scheduleService.closeBookingSlots({ bookingId: record._id, reason: 'Completed booking' });
    record.status = status;
    record.holdExpiresAt = null;
    if (adminNotes !== undefined) record.adminNotes = adminNotes;
    record.statusHistory.push({ status, changedBy: req.admin._id, reason: reason || 'Appointment completed' });
    await record.save();
    return record;
  });
  if (status === BOOKING_STATUS.CANCELLED) c.executionCtx.waitUntil(notificationService.sendBookingCancellation(booking));
  return sendOk(c, { booking }, 'Booking updated.');
};

/**
 * PUT /api/bookings/:id
 * Admin — update booking fields (not status — use /status endpoint)
 */
const updateBooking = async (c) => {
  const req = c.get('input');
  const current = await Booking.findById(req.params.id);
  if (!current) return fail(new AppError('Booking not found', 404));
  requireCurrentVersion(current, req.body.expectedUpdatedAt);
  const fields = ['clientName','email','phone','instagramHandle','tattooPlacement','tattooSize','notes','adminNotes'];
  const updates = Object.fromEntries(fields.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
  const booking = await Booking.findOneAndUpdate(
    { _id: current._id, updatedAt: current.updatedAt },
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!booking) throw new AppError('This booking changed. Reload it before saving.', 409, 'BOOKING_CHANGED');

  return sendOk(c, { booking }, "Booking updated");
};

/**
 * DELETE /api/bookings/:id
 * Admin — hard delete (prefer cancellation for audit trail)
 */
const deleteBooking = async (c) => {
  const req = c.get('input');
  const booking = await Booking.findById(req.params.id);
  if (!booking) return fail(new AppError("Booking not found", 404));

  if (booking.referenceImages?.length) {
    const storage = require('../bindings/mediaStorage').createMediaStorage(c.env);
    await purgeBookingReferences(booking, storage);
  }

  await transaction(async () => {
    if ([BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ON_HOLD].includes(booking.status)) {
      await scheduleService.releaseBookingSlots({ bookingId: booking._id });
    }
    await Booking.deleteOne({ _id: booking._id });
  });

  return sendOk(c, {}, "Booking deleted");
};

/**
 * GET /api/bookings/dashboard
 * Admin — aggregated stats for dashboard
 */
const getDashboardStats = async (c) => {
  const req = c.get('input');
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

  return sendOk(c, {
    stats: {
      total,
      ...stats,
    },
    recentBookings,
  });
};

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
