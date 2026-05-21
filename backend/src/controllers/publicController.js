'use strict';

const dayjs = require('dayjs');
const Schedule = require('../models/Schedule');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendOk } = require('../utils/response');
const scheduleService = require('../services/scheduleService');
const { DAY_STATUS } = require('../config/constants');

/**
 * GET /api/public/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Public — returns availability summary for a date range
 * Safe for frontend consumption — no booking IDs or admin data
 */
const getAvailability = asyncHandler(async (req, res, next) => {
  const startDate = req.query.startDate || dayjs().format('YYYY-MM-DD');
  const endDate = req.query.endDate || dayjs().add(30, 'day').format('YYYY-MM-DD');

  if (dayjs(endDate).diff(dayjs(startDate), 'day') > 90) {
    return next(new AppError('Date range cannot exceed 90 days', 400));
  }

  const schedules = await Schedule.find({
    date: { $gte: startDate, $lte: endDate },
  })
    .select('date dayStatus closureReason timeSlots')
    .lean();

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

    if (!schedule) {
      // No schedule doc = open with default slots
      availability.push({
        date: dateStr,
        dayStatus: DAY_STATUS.OPEN,
        isFullyClosed: false,
        closureReason: null,
        availableCount: 10, // default slot count
      });
    } else {
      const pub = scheduleService.toPublicAvailability(schedule);
      availability.push({
        date: pub.date,
        dayStatus: pub.dayStatus,
        isFullyClosed: pub.isFullyClosed,
        closureReason: pub.closureReason,
        availableCount: pub.slots.filter((s) => s.available).length,
      });
    }

    cursor = cursor.add(1, 'day');
  }

  sendOk(res, { availability });
});

/**
 * GET /api/public/availability/:date
 * Public — returns full slot breakdown for a single date
 */
const getAvailabilityByDate = asyncHandler(async (req, res, next) => {
  const { date } = req.params;

  // Past dates are not bookable
  if (dayjs(date).isBefore(dayjs().startOf('day'))) {
    return sendOk(res, {
      date,
      dayStatus: DAY_STATUS.FULLY_CLOSED,
      isFullyClosed: true,
      closureReason: 'Date is in the past',
      slots: [],
    });
  }

  const schedule = await Schedule.findOne({ date })
    .select('date dayStatus closureReason timeSlots')
    .lean();

  if (!schedule) {
    // No document yet — return default open state
    const { DEFAULT_TIME_SLOTS } = require('../config/constants');
    return sendOk(res, {
      date,
      dayStatus: DAY_STATUS.OPEN,
      isFullyClosed: false,
      closureReason: null,
      slots: DEFAULT_TIME_SLOTS.map((time) => ({
        time,
        status: 'available',
        available: true,
      })),
    });
  }

  const publicData = scheduleService.toPublicAvailability(schedule);

  sendOk(res, publicData);
});

module.exports = { getAvailability, getAvailabilityByDate };
