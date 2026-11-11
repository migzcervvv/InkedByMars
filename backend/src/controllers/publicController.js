'use strict';

const dayjs = require('dayjs');
const Schedule = require('../models/Schedule');
const AppError = require('../utils/AppError');
const { fail } = require('../utils/honoResponse');
const { sendOk } = require('../utils/honoResponse');
const scheduleService = require('../services/scheduleService');
const availabilitySettingsService = require('../services/availabilitySettingsService');
const { bookingPolicy } = require('../services/bookingPolicy');
const {
  DAY_STATUS,
  DEFAULT_TIME_SLOTS,
  SLOT_STATUS,
} = require('../config/constants');

const openDayAvailability = (date, times = DEFAULT_TIME_SLOTS) => ({
  date,
  dayStatus: DAY_STATUS.OPEN,
  isFullyClosed: false,
  isBlocked: false,
  isFullyBooked: false,
  isPartiallyBooked: false,
  availabilityStatus: 'open',
  closureReason: null,
  availableCount: times.length,
  totalCount: times.length,
});

const blockedDayAvailability = (date, closureReason = 'Blocked by admin', times = DEFAULT_TIME_SLOTS) => ({
  date,
  dayStatus: DAY_STATUS.FULLY_CLOSED,
  isFullyClosed: true,
  isBlocked: true,
  isFullyBooked: false,
  isPartiallyBooked: false,
  availabilityStatus: 'blocked',
  closureReason,
  availableCount: 0,
  totalCount: times.length,
});

const blockedDayDetails = (date, closureReason, times = DEFAULT_TIME_SLOTS) => ({
  ...blockedDayAvailability(date, closureReason, times),
  slots: times.map((time) => ({
    time,
    status: SLOT_STATUS.CLOSED,
    available: false,
  })),
});

const policyDay = (date, policy) => ({
  ...blockedDayDetails(date, date === policy.studioDate ? 'Same-day booking is unavailable.' : 'This date has passed.'),
  bookable: false,
});

/**
 * GET /api/public/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Public - returns availability summary for a date range
 * Safe for frontend consumption - no booking IDs or admin data
 */
const getAvailability = async (c) => {
  const req = c.get('input');
  const policy = bookingPolicy();
  c.header('Cache-Control', 'no-store');
  const startDate = req.query.startDate || policy.earliestBookableDate;
  const endDate = req.query.endDate || dayjs(startDate).add(30, 'day').format('YYYY-MM-DD');

  if (endDate < startDate) return fail(new AppError('End date must be on or after the start date.', 400));
  if (dayjs(endDate).diff(dayjs(startDate), 'day') > 90) {
    return fail(new AppError('Date range cannot exceed 90 days', 400));
  }

  const eligibleStart = startDate < policy.earliestBookableDate ? policy.earliestBookableDate : startDate;
  const [schedules, blockedDateSet, defaults] = endDate < eligibleStart ? [[], new Set(), { times: DEFAULT_TIME_SLOTS }] : await Promise.all([
    Schedule.find({
      date: { $gte: eligibleStart, $lte: endDate },
    })
      .select('date dayStatus closureReason timeSlots')
      .lean(),
    availabilitySettingsService.getBlockedDateSet({ startDate: eligibleStart, endDate }),
    availabilitySettingsService.getDefaultSchedule(),
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

    if (dateStr < policy.earliestBookableDate) {
      const { slots, ...summary } = policyDay(dateStr, policy);
      availability.push(summary);
    } else if (blockedDateSet.has(dateStr)) {
      availability.push(blockedDayAvailability(dateStr, 'Unavailable', defaults.times));
    } else if (!schedule) {
      availability.push(openDayAvailability(dateStr, defaults.times));
    } else {
      availability.push(scheduleService.toPublicAvailability(schedule));
    }

    cursor = cursor.add(1, 'day');
  }

  return sendOk(c, { availability, policy });
};

/**
 * GET /api/public/availability/:date
 * Public - returns full slot breakdown for a single date
 */
const getAvailabilityByDate = async (c) => {
  const req = c.get('input');
  const { date } = req.params;
  const policy = bookingPolicy();
  c.header('Cache-Control', 'no-store');
  if (date < policy.earliestBookableDate) {
    return sendOk(c, { ...policyDay(date, policy), policy });
  }

  if (await availabilitySettingsService.isDateBlocked(date)) {
    const { times } = await availabilitySettingsService.getDefaultSchedule();
    return sendOk(c, { ...blockedDayDetails(date, 'Unavailable', times), policy });
  }

  const schedule = await Schedule.findOne({ date })
    .select('date dayStatus closureReason timeSlots')
    .lean();

  if (!schedule) {
    const { times } = await availabilitySettingsService.getDefaultSchedule();
    return sendOk(c, {
      ...openDayAvailability(date, times),
      policy,
      slots: times.map((time) => ({
        time,
        status: SLOT_STATUS.AVAILABLE,
        available: true,
      })),
    });
  }

  const publicData = scheduleService.toPublicAvailability(schedule);

  return sendOk(c, { ...publicData, policy });
};

module.exports = { getAvailability, getAvailabilityByDate };
