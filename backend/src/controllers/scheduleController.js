'use strict';

const dayjs = require('dayjs');
const Schedule = require('../models/Schedule');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendOk, sendCreated } = require('../utils/response');
const { DAY_STATUS, SLOT_STATUS } = require('../config/constants');
const scheduleService = require('../services/scheduleService');
const logger = require('../utils/logger');

const eachDate = (startDate, endDate) => {
  const dates = [];
  let cursor = dayjs(startDate);
  const end = dayjs(endDate);

  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }

  return dates;
};

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

  logger.info('schedule.day_blocked', {
    requestId: req.requestId,
    adminId: req.admin?._id?.toString(),
    date,
    dayStatus,
  });

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

  logger.info('schedule.slot_blocked', {
    requestId: req.requestId,
    adminId: req.admin?._id?.toString(),
    date,
    time,
    reason,
  });

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

  logger.info('schedule.slot_released', {
    requestId: req.requestId,
    adminId: req.admin?._id?.toString(),
    date,
    time,
  });

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

const applyOpeningWindow = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, openTime, closeTime, reason = 'Outside opening hours' } = req.body;

  if (dayjs(endDate).isBefore(dayjs(startDate))) {
    return next(new AppError('endDate must be on or after startDate', 400));
  }

  if (closeTime <= openTime) {
    return next(new AppError('closeTime must be after openTime', 400));
  }

  const dates = eachDate(startDate, endDate);
  if (dates.length > 120) {
    return next(new AppError('Opening window range cannot exceed 120 days', 400));
  }

  let updatedSlots = 0;
  let skippedBookedSlots = 0;
  const schedules = [];

  for (const date of dates) {
    const schedule = await scheduleService.getOrCreateSchedule(date);

    for (const slot of schedule.timeSlots) {
      if (slot.status === SLOT_STATUS.BOOKED) {
        skippedBookedSlots += 1;
        continue;
      }

      const shouldBeOpen = slot.time >= openTime && slot.time < closeTime;
      const nextStatus = shouldBeOpen ? SLOT_STATUS.AVAILABLE : SLOT_STATUS.CLOSED;

      if (slot.status !== nextStatus || (!shouldBeOpen && slot.reason !== reason)) {
        slot.status = nextStatus;
        slot.reason = shouldBeOpen ? null : reason;
        slot.bookingId = null;
        slot.holdExpiresAt = null;
        updatedSlots += 1;
      }
    }

    schedule.dayStatus = DAY_STATUS.OPEN;
    if (schedule.timeSlots.every((slot) => slot.status === SLOT_STATUS.CLOSED)) {
      schedule.dayStatus = DAY_STATUS.FULLY_CLOSED;
      schedule.closureReason = reason;
    } else if (schedule.timeSlots.some((slot) => slot.status === SLOT_STATUS.CLOSED)) {
      schedule.dayStatus = DAY_STATUS.PARTIALLY_CLOSED;
      schedule.closureReason = reason;
    } else {
      schedule.closureReason = null;
    }

    await schedule.save();
    schedules.push(schedule);
  }

  logger.info('schedule.opening_window_applied', {
    requestId: req.requestId,
    adminId: req.admin?._id?.toString(),
    startDate,
    endDate,
    openTime,
    closeTime,
    updatedSlots,
    skippedBookedSlots,
  });

  sendOk(
    res,
    {
      schedules,
      summary: {
        dates: dates.length,
        updatedSlots,
        skippedBookedSlots,
      },
    },
    'Opening hours applied'
  );
});

module.exports = {
  getAllSchedules,
  getScheduleByDate,
  blockDay,
  blockSlot,
  releaseSlot,
  overrideSlot,
  expireHolds,
  applyOpeningWindow,
};
