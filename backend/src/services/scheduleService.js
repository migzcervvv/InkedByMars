'use strict';

const dayjs = require('dayjs');
const Schedule = require('../models/Schedule');
const { SLOT_STATUS, DAY_STATUS } = require('../config/constants');
const availabilitySettingsService = require('./availabilitySettingsService');
const { requireBookableDate } = require('./bookingPolicy');

/**
 * Fetch or create a schedule document for a given date string (YYYY-MM-DD).
 * Newly created schedules are populated with default available time slots.
 */
const getOrCreateSchedule = async (dateStr) => {
  const { times, endTime } = await availabilitySettingsService.getDefaultSchedule();
  const slots = times.map((time) => ({
    time,
    status: SLOT_STATUS.AVAILABLE,
    bookingId: null,
    reason: null,
    holdExpiresAt: null,
  }));

  return Schedule.findOneAndUpdate(
    { date: dateStr },
    {
      $setOnInsert: {
        date: dateStr,
        dayStatus: DAY_STATUS.OPEN,
        timeSlots: slots,
        endTime,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

const addMinutesToTime = (time, minutes) => {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  const nextHours = Math.floor(total / 60);
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const isActiveHold = (slot, now = new Date()) => {
  return (
    slot.status === SLOT_STATUS.ON_HOLD &&
    slot.holdExpiresAt &&
    new Date(slot.holdExpiresAt) > now
  );
};

const getSlotBoundaryTimes = (schedule) => {
  const times = schedule.timeSlots.map((slot) => slot.time).sort();
  if (!times.length) return [];
  if (schedule.endTime) return [...times, schedule.endTime];

  let increment = 60;
  if (times.length > 1) {
    increment = timeToMinutes(times[1]) - timeToMinutes(times[0]);
  }

  return [...times, addMinutesToTime(times[times.length - 1], increment)];
};

const getSlotTimesInRange = (schedule, startTime, endTime) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return [];
  }

  return schedule.timeSlots
    .filter((slot) => {
      const slotStart = timeToMinutes(slot.time);
      return slotStart >= start && slotStart < end;
    })
    .map((slot) => slot.time);
};

const holdSlotAtomically = async ({ date, time, bookingId, expiryMinutes = 30 }) => {
  if (await availabilitySettingsService.isDateBlocked(date)) return null;

  const schedule = await getOrCreateSchedule(date);
  requireBookableDate(date);
  const now = new Date();
  const holdExpiresAt = dayjs().add(expiryMinutes, 'minute').toDate();

  const result = await Schedule.updateOne(
    {
      _id: schedule._id,
      dayStatus: { $in: [DAY_STATUS.OPEN, DAY_STATUS.PARTIALLY_CLOSED] },
      timeSlots: {
        $elemMatch: {
          time,
          $or: [
            { status: SLOT_STATUS.AVAILABLE },
            { status: SLOT_STATUS.ON_HOLD, holdExpiresAt: { $lte: now } },
          ],
        },
      },
    },
    {
      $set: {
        'timeSlots.$.status': SLOT_STATUS.ON_HOLD,
        'timeSlots.$.bookingId': bookingId,
        'timeSlots.$.holdExpiresAt': holdExpiresAt,
        'timeSlots.$.reason': null,
      },
      $inc: { __v: 1 },
    }
  );

  return result.modifiedCount === 1 ? holdExpiresAt : null;
};

const blockConfirmedRange = async ({ bookingId, date, startTime, endTime }) => {
  const schedule = await getOrCreateSchedule(date);
  if ([DAY_STATUS.FULLY_CLOSED, DAY_STATUS.HOLIDAY].includes(schedule.dayStatus) || await availabilitySettingsService.isDateBlocked(date)) {
    return { ok: false, reason: 'The selected day is blocked.' };
  }
  const boundaries = getSlotBoundaryTimes(schedule);
  const slotTimes = getSlotTimesInRange(schedule, startTime, endTime);
  if (!boundaries.includes(startTime) || !boundaries.includes(endTime) || !slotTimes.length) {
    return { ok: false, reason: 'Choose an appointment range using the supported start and end times.' };
  }

  const now = new Date();
  const slots = schedule.timeSlots.filter(slot => slotTimes.includes(slot.time));
  const conflicts = slots.filter(slot => slot.status === SLOT_STATUS.BOOKED || slot.status === SLOT_STATUS.CLOSED ||
    (slot.status === SLOT_STATUS.ON_HOLD && (!slot.holdExpiresAt || isActiveHold(slot, now))));
  if (conflicts.length) {
    return { ok: false, reason: 'Selected range overlaps unavailable times: ' + conflicts.map(slot => slot.time).join(', ') };
  }

  for (const slot of slots) {
    slot.status = SLOT_STATUS.BOOKED;
    slot.bookingId = bookingId;
    slot.holdExpiresAt = null;
    slot.reason = null;
  }
  requireBookableDate(date);
  schedule.increment();
  await schedule.save();
  return { ok: true, slotTimes };
};

const releaseBookingSlots = async ({ bookingId }) => {
  const schedules = await Schedule.find({
    'timeSlots.bookingId': bookingId,
  });

  for (const schedule of schedules) {
    let modified = false;
    for (const slot of schedule.timeSlots) {
      if (slot.bookingId && slot.bookingId.toString() === bookingId.toString()) {
        slot.status = SLOT_STATUS.AVAILABLE;
        slot.bookingId = null;
        slot.holdExpiresAt = null;
        slot.reason = null;
        modified = true;
      }
    }

    if (modified) { schedule.increment(); await schedule.save(); }
  }
};

const closeBookingSlots = async ({ bookingId, reason = 'Completed' }) => {
  const schedules = await Schedule.find({
    'timeSlots.bookingId': bookingId,
  });

  for (const schedule of schedules) {
    let modified = false;
    for (const slot of schedule.timeSlots) {
      if (slot.bookingId && slot.bookingId.toString() === bookingId.toString()) {
        slot.status = SLOT_STATUS.CLOSED;
        slot.holdExpiresAt = null;
        slot.reason = reason;
        modified = true;
      }
    }

    if (modified) { schedule.increment(); await schedule.save(); }
  }
};

/**
 * Expire stale holds across all future schedules.
 * Intended to be called by a periodic job or lazy evaluation.
 */
const expireStaleHolds = async () => {
  const now = new Date();
  const schedules = await Schedule.find({
    'timeSlots.status': SLOT_STATUS.ON_HOLD,
    'timeSlots.holdExpiresAt': { $lt: now },
  });

  for (const schedule of schedules) {
    let modified = false;
    for (const slot of schedule.timeSlots) {
      if (
        slot.status === SLOT_STATUS.ON_HOLD &&
        slot.holdExpiresAt &&
        slot.holdExpiresAt <= now
      ) {
        slot.status = SLOT_STATUS.AVAILABLE;
        slot.bookingId = null;
        slot.holdExpiresAt = null;
        slot.reason = null;
        modified = true;
      }
    }
    if (modified) { schedule.increment(); await schedule.save(); }
  }
};

/**
 * Build public-safe availability data for a schedule.
 * Strips booking IDs and internal data.
 */
const toPublicAvailability = (schedule) => {
  const isBlocked = [DAY_STATUS.FULLY_CLOSED, DAY_STATUS.HOLIDAY].includes(schedule.dayStatus);
  const slots = schedule.timeSlots.map((slot) => {
    // Expired holds appear as available to the public
    const isExpiredHold =
      slot.status === SLOT_STATUS.ON_HOLD &&
      slot.holdExpiresAt &&
      new Date() >= slot.holdExpiresAt;

    return {
      time: slot.time,
      status: isBlocked ? SLOT_STATUS.CLOSED : isExpiredHold ? SLOT_STATUS.AVAILABLE : slot.status,
      available: !isBlocked && (isExpiredHold
        ? true
        : slot.status === SLOT_STATUS.AVAILABLE),
    };
  });
  const availableCount = slots.filter((slot) => slot.available).length;
  const totalCount = slots.length;
  const isFullyBooked = !isBlocked && totalCount > 0 && availableCount === 0;
  const isPartiallyBooked =
    !isBlocked && availableCount > 0 && availableCount < totalCount;

  return {
    date: schedule.date,
    dayStatus: schedule.dayStatus,
    closureReason: isBlocked ? 'Unavailable' : null,
    isFullyClosed: isBlocked,
    isBlocked,
    isFullyBooked,
    isPartiallyBooked,
    availabilityStatus: isBlocked
      ? 'blocked'
      : isFullyBooked
        ? 'booked'
        : isPartiallyBooked
          ? 'partial'
          : 'open',
    availableCount,
    totalCount,
    slots,
  };
};

module.exports = {
  getOrCreateSchedule,
  getSlotBoundaryTimes,
  getSlotTimesInRange,
  holdSlotAtomically,
  blockConfirmedRange,
  releaseBookingSlots,
  closeBookingSlots,
  expireStaleHolds,
  toPublicAvailability,
};
