'use strict';

const dayjs = require('dayjs');
const Schedule = require('../models/Schedule');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendOk, sendCreated } = require('../utils/response');
const { DAY_STATUS, SLOT_STATUS } = require('../config/constants');
const scheduleService = require('../services/scheduleService');

/**
 * GET /api/schedule
 * Admin — list schedules within optional date range
 */
const getAllSchedules = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) filter.date.$gte = req.query.startDate;
    if (req.query.endDate) filter.date.$lte = req.query.endDate;
  }

  const schedules = await Schedule.find(filter).sort({ date: 1 }).lean();

  sendOk(res, { schedules });
});

/**
 * GET /api/schedule/:date
 * Admin — full schedule for a specific date, creating if not exists
 */
const getScheduleByDate = asyncHandler(async (req, res, next) => {
  const schedule = await scheduleService.getOrCreateSchedule(req.params.date);
  sendOk(res, { schedule });
});

/**
 * POST /api/schedule/block-day
 * Admin — close an entire day (fully, partially, or holiday)
 */
const blockDay = asyncHandler(async (req, res, next) => {
  const { date, dayStatus, closureReason } = req.body;

  const schedule = await scheduleService.getOrCreateSchedule(date);

  schedule.dayStatus = dayStatus;
  if (closureReason) schedule.closureReason = closureReason;

  // If fully closing or holiday, mark all available slots as closed
  if (dayStatus === DAY_STATUS.FULLY_CLOSED || dayStatus === DAY_STATUS.HOLIDAY) {
    for (const slot of schedule.timeSlots) {
      if (slot.status === SLOT_STATUS.AVAILABLE) {
        slot.status = SLOT_STATUS.CLOSED;
        slot.reason = closureReason || dayStatus;
      }
    }
  }

  await schedule.save();

  sendOk(res, { schedule }, `Day ${date} marked as ${dayStatus}`);
});

/**
 * POST /api/schedule/block-slot
 * Admin — close a single time slot
 */
const blockSlot = asyncHandler(async (req, res, next) => {
  const { date, time, reason } = req.body;

  const schedule = await scheduleService.getOrCreateSchedule(date);

  const slot = scheduleService.findSlot(schedule, time);
  if (!slot) {
    return next(new AppError(`Time slot ${time} does not exist on ${date}`, 404));
  }

  if (slot.status === SLOT_STATUS.BOOKED) {
    return next(
      new AppError(
        `Slot ${time} is already booked. Cancel the booking first or use override.`,
        409
      )
    );
  }

  await scheduleService.closeSlot(schedule, time, reason);

  sendOk(res, { schedule }, `Slot ${time} on ${date} closed`);
});

/**
 * POST /api/schedule/release-slot
 * Admin — release a closed or held slot back to available
 */
const releaseSlot = asyncHandler(async (req, res, next) => {
  const { date, time } = req.body;

  const schedule = await scheduleService.getOrCreateSchedule(date);

  const slot = scheduleService.findSlot(schedule, time);
  if (!slot) {
    return next(new AppError(`Time slot ${time} does not exist on ${date}`, 404));
  }

  if (slot.status === SLOT_STATUS.BOOKED) {
    return next(
      new AppError(
        `Slot ${time} is booked. Cancel the associated booking to free it.`,
        409
      )
    );
  }

  await scheduleService.releaseSlot(schedule, time);

  sendOk(res, { schedule }, `Slot ${time} on ${date} released`);
});

/**
 * POST /api/schedule/override-slot
 * Admin — force-change a slot's status regardless of current state
 */
const overrideSlot = asyncHandler(async (req, res, next) => {
  const { date, time, status, reason } = req.body;

  const schedule = await scheduleService.getOrCreateSchedule(date);

  const slot = scheduleService.findSlot(schedule, time);
  if (!slot) {
    return next(new AppError(`Time slot ${time} does not exist on ${date}`, 404));
  }

  slot.status = status;
  slot.reason = reason || '';
  if (status !== SLOT_STATUS.BOOKED) {
    slot.bookingId = null;
    slot.holdExpiresAt = null;
  }

  await schedule.save();

  sendOk(res, { schedule }, `Slot ${time} on ${date} overridden to ${status}`);
});

/**
 * POST /api/schedule/expire-holds
 * Admin — manually trigger hold expiry (normally run by a job)
 */
const expireHolds = asyncHandler(async (req, res, next) => {
  await scheduleService.expireStaleHolds();
  sendOk(res, {}, 'Stale holds expired');
});

module.exports = {
  getAllSchedules,
  getScheduleByDate,
  blockDay,
  blockSlot,
  releaseSlot,
  overrideSlot,
  expireHolds,
};
