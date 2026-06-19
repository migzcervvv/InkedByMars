'use strict';

const dayjs = require('dayjs');
const Schedule = require('../models/Schedule');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendOk } = require('../utils/response');
const scheduleService = require('../services/scheduleService');
const availabilitySettingsService = require('../services/availabilitySettingsService');
const {
  DAY_STATUS,
  DEFAULT_TIME_SLOTS,
  SLOT_STATUS,
} = require('../config/constants');

const openDayAvailability = (date) => ({
  date,
  dayStatus: DAY_STATUS.OPEN,
  isFullyClosed: false,
  isBlocked: false,
  isFullyBooked: false,
  isPartiallyBooked: false,
  availabilityStatus: 'open',
  closureReason: null,
  availableCount: DEFAULT_TIME_SLOTS.length,
  totalCount: DEFAULT_TIME_SLOTS.length,
});

const blockedDayAvailability = (date, closureReason = 'Blocked by admin') => ({
  date,
  dayStatus: DAY_STATUS.FULLY_CLOSED,
  isFullyClosed: true,
  isBlocked: true,
  isFullyBooked: false,
  isPartiallyBooked: false,
  availabilityStatus: 'blocked',
  closureReason,
  availableCount: 0,
  totalCount: DEFAULT_TIME_SLOTS.length,
});

const blockedDayDetails = (date, closureReason = 'Blocked by admin') => ({
  ...blockedDayAvailability(date, closureReason),
  slots: DEFAULT_TIME_SLOTS.map((time) => ({
    time,
    status: SLOT_STATUS.CLOSED,
    available: false,
  })),
});

/**
 * GET /api/public/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Public - returns availability summary for a date range
 * Safe for frontend consumption - no booking IDs or admin data
 */
const getAvailability = asyncHandler(async (req, res, next) => {
  const startDate = req.query.startDate || dayjs().format('YYYY-MM-DD');
  const endDate = req.query.endDate || dayjs().add(30, 'day').format('YYYY-MM-DD');

  if (dayjs(endDate).diff(dayjs(startDate), 'day') > 90) {
    return next(new AppError('Date range cannot exceed 90 days', 400));
  }

  const [schedules, blockedDateSet] = await Promise.all([
    Schedule.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .select('date dayStatus closureReason timeSlots')
      .lean(),
    availabilitySettingsService.getBlockedDateSet({ startDate, endDate }),
  ]);

  // Index existing schedules by date
  const scheduleMap = {};
  for (const s of schedules) {
    scheduleMap[s.date] = s;
  }

  // Build response for every day in range
  const availability = [];
  let cursor = dayjs(startDate);
  const end = dayjs(endDate);

  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    const dateStr = cursor.format('YYYY-MM-DD');
    const schedule = scheduleMap[dateStr];

    if (blockedDateSet.has(dateStr)) {
      availability.push(blockedDayAvailability(dateStr));
    } else if (!schedule) {
      availability.push(openDayAvailability(dateStr));
    } else {
      availability.push(scheduleService.toPublicAvailability(schedule));
    }

    cursor = cursor.add(1, 'day');
  }

  sendOk(res, { availability });
});

/**
 * GET /api/public/availability/:date
 * Public - returns full slot breakdown for a single date
 */
const getAvailabilityByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;

  // Past dates are not bookable
  if (dayjs(date).isBefore(dayjs().startOf('day'))) {
    return sendOk(res, blockedDayDetails(date, 'Date is in the past'));
  }

  if (await availabilitySettingsService.isDateBlocked(date)) {
    return sendOk(res, blockedDayDetails(date));
  }

  const schedule = await Schedule.findOne({ date })
    .select('date dayStatus closureReason timeSlots')
    .lean();

  if (!schedule) {
    // No document yet - return default open state
    return sendOk(res, {
      ...openDayAvailability(date),
      slots: DEFAULT_TIME_SLOTS.map((time) => ({
        time,
        status: SLOT_STATUS.AVAILABLE,
        available: true,
      })),
    });
  }

  const publicData = scheduleService.toPublicAvailability(schedule);

  sendOk(res, publicData);
});

module.exports = { getAvailability, getAvailabilityByDate };
