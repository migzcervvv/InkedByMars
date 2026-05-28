'use strict';

const dayjs = require('dayjs');
const { randomUUID } = require('crypto');
const Schedule = require('../models/Schedule');
const { DEFAULT_TIME_SLOTS, SLOT_STATUS, DAY_STATUS } = require('../config/constants');

const CLIENT_HOLD_PREFIX = 'client-hold:';

/**
 * Fetch or create a schedule document for a given date string (YYYY-MM-DD).
 * Newly created schedules are populated with default available time slots.
 */
const getOrCreateSchedule = async (dateStr) => {
  const slots = DEFAULT_TIME_SLOTS.map((time) => ({
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

/**
 * Return the slot object within a schedule by time string.
 */
const findSlot = (schedule, time) => {
  return schedule.timeSlots.find((s) => s.time === time);
};

/**
 * Check if a slot is bookable (available status, day open, hold not expired).
 */
const isSlotBookable = (schedule, time) => {
  if (schedule.dayStatus !== DAY_STATUS.OPEN) return false;

  const slot = findSlot(schedule, time);
  if (!slot) return false;

  // If on-hold, check if hold has expired
  if (slot.status === SLOT_STATUS.ON_HOLD) {
    if (slot.holdExpiresAt && new Date() > new Date(slot.holdExpiresAt)) {
      return true; // Hold expired, treat as available
    }
    return false;
  }

  return slot.status === SLOT_STATUS.AVAILABLE;
};

const createClientHold = async (date, time, expiryMinutes = 30) => {
  const schedule = await getOrCreateSchedule(date);
  const slot = findSlot(schedule, time);
  if (!slot) return null;

  const now = new Date();
  if (schedule.dayStatus !== DAY_STATUS.OPEN) return null;
  if (
    slot.status !== SLOT_STATUS.AVAILABLE &&
    !(slot.status === SLOT_STATUS.ON_HOLD && slot.holdExpiresAt && new Date(slot.holdExpiresAt) <= now)
  ) {
    return null;
  }

  const holdToken = randomUUID();
  const holdExpiresAt = dayjs().add(expiryMinutes, 'minute').toDate();
  const reason = `${CLIENT_HOLD_PREFIX}${holdToken}`;

  const result = await Schedule.updateOne(
    {
      _id: schedule._id,
      dayStatus: DAY_STATUS.OPEN,
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
        'timeSlots.$.bookingId': null,
        'timeSlots.$.holdExpiresAt': holdExpiresAt,
        'timeSlots.$.reason': reason,
      },
    }
  );

  if (result.modifiedCount !== 1) return null;

  return {
    holdToken,
    holdExpiresAt,
    date,
    time,
  };
};

const releaseClientHold = async ({ date, time, holdToken }) => {
  if (!holdToken) return false;

  const schedule = await Schedule.findOne({ date });
  if (!schedule) return false;

  const result = await Schedule.updateOne(
    {
      _id: schedule._id,
      timeSlots: {
        $elemMatch: {
          time,
          status: SLOT_STATUS.ON_HOLD,
          bookingId: null,
          reason: `${CLIENT_HOLD_PREFIX}${holdToken}`,
        },
      },
    },
    {
      $set: {
        'timeSlots.$.status': SLOT_STATUS.AVAILABLE,
        'timeSlots.$.bookingId': null,
        'timeSlots.$.holdExpiresAt': null,
        'timeSlots.$.reason': null,
      },
    }
  );

  return result.modifiedCount === 1;
};

const bindClientHoldToBooking = async ({ schedule, time, holdToken, bookingId, expiryMinutes = 30 }) => {
  const now = new Date();
  const holdExpiresAt = dayjs().add(expiryMinutes, 'minute').toDate();

  const result = await Schedule.updateOne(
    {
      _id: schedule._id,
      dayStatus: DAY_STATUS.OPEN,
      timeSlots: {
        $elemMatch: {
          time,
          status: SLOT_STATUS.ON_HOLD,
          bookingId: null,
          reason: `${CLIENT_HOLD_PREFIX}${holdToken}`,
          holdExpiresAt: { $gt: now },
        },
      },
    },
    {
      $set: {
        'timeSlots.$.bookingId': bookingId,
        'timeSlots.$.holdExpiresAt': holdExpiresAt,
        'timeSlots.$.reason': null,
      },
    }
  );

  return result.modifiedCount === 1 ? holdExpiresAt : null;
};

const holdSlotAtomically = async ({ date, time, bookingId, expiryMinutes = 30 }) => {
  const schedule = await getOrCreateSchedule(date);
  const now = new Date();
  const holdExpiresAt = dayjs().add(expiryMinutes, 'minute').toDate();

  const result = await Schedule.updateOne(
    {
      _id: schedule._id,
      dayStatus: DAY_STATUS.OPEN,
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
    }
  );

  return result.modifiedCount === 1 ? holdExpiresAt : null;
};

/**
 * Mark a slot as booked and associate it with a booking ID.
 * Persists the schedule document.
 */
const markSlotBooked = async (schedule, time, bookingId) => {
  const slot = findSlot(schedule, time);
  if (!slot) throw new Error(`Slot ${time} not found on schedule for ${schedule.date}`);

  slot.status = SLOT_STATUS.BOOKED;
  slot.bookingId = bookingId;
  slot.holdExpiresAt = null;
  await schedule.save();
};

const blockConfirmedRange = async ({ bookingId, date, startTime, endTime, previousHold }) => {
  const schedule = await getOrCreateSchedule(date);
  const slotTimes = getSlotTimesInRange(schedule, startTime, endTime);
  if (!slotTimes.length) {
    return {
      ok: false,
      reason: 'No matching slots exist in the selected time range.',
      conflictSlots: [],
    };
  }

  const now = new Date();
  const conflictSlots = [];
  const bookingIdString = bookingId.toString();
  const nextSlots = schedule.timeSlots.map((slot) => {
    const plain = slot.toObject ? slot.toObject() : { ...slot };
    const isTarget = slotTimes.includes(slot.time);
    const isOwnSlot =
      slot.bookingId && slot.bookingId.toString() === bookingIdString;
    const isExpiredOwnHold =
      isOwnSlot &&
      slot.status === SLOT_STATUS.ON_HOLD &&
      slot.holdExpiresAt &&
      new Date(slot.holdExpiresAt) <= now;

    if (isTarget) {
      if (
        slot.status === SLOT_STATUS.BOOKED &&
        !isOwnSlot
      ) {
        conflictSlots.push(slot.time);
      }

      if (
        slot.status === SLOT_STATUS.ON_HOLD &&
        !isOwnSlot &&
        isActiveHold(slot, now)
      ) {
        conflictSlots.push(slot.time);
      }

      if (slot.status === SLOT_STATUS.CLOSED) {
        conflictSlots.push(slot.time);
      }

      return {
        ...plain,
        status: SLOT_STATUS.BOOKED,
        bookingId,
        holdExpiresAt: null,
        reason: null,
      };
    }

    if (previousHold && previousHold.date === date && previousHold.time === slot.time && isOwnSlot) {
      return {
        ...plain,
        status: SLOT_STATUS.AVAILABLE,
        bookingId: null,
        holdExpiresAt: null,
        reason: null,
      };
    }

    if (isExpiredOwnHold) {
      return {
        ...plain,
        status: SLOT_STATUS.AVAILABLE,
        bookingId: null,
        holdExpiresAt: null,
        reason: null,
      };
    }

    return plain;
  });

  if (conflictSlots.length) {
    return {
      ok: false,
      reason: `Selected range overlaps unavailable slots: ${[...new Set(conflictSlots)].join(', ')}`,
      conflictSlots: [...new Set(conflictSlots)],
    };
  }

  const result = await Schedule.updateOne(
    { _id: schedule._id, __v: schedule.__v },
    {
      $set: { timeSlots: nextSlots },
      $inc: { __v: 1 },
    }
  );

  if (result.modifiedCount !== 1) {
    return {
      ok: false,
      reason: 'Schedule changed while confirming. Reload and try again.',
      conflictSlots: [],
    };
  }

  return {
    ok: true,
    schedule,
    slotTimes,
  };
};

const releaseBookingHolds = async ({ bookingId, exceptDate }) => {
  const schedules = await Schedule.find({
    'timeSlots.bookingId': bookingId,
  });

  for (const schedule of schedules) {
    if (exceptDate && schedule.date === exceptDate) continue;

    let modified = false;
    for (const slot of schedule.timeSlots) {
      if (
        slot.bookingId &&
        slot.bookingId.toString() === bookingId.toString() &&
        slot.status === SLOT_STATUS.ON_HOLD
      ) {
        slot.status = SLOT_STATUS.AVAILABLE;
        slot.bookingId = null;
        slot.holdExpiresAt = null;
        slot.reason = null;
        modified = true;
      }
    }

    if (modified) await schedule.save();
  }
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

    if (modified) await schedule.save();
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

    if (modified) await schedule.save();
  }
};

/**
 * Release a slot back to available.
 * Used when a booking is cancelled or a hold is released.
 */
const releaseSlot = async (schedule, time) => {
  const slot = findSlot(schedule, time);
  if (!slot) throw new Error(`Slot ${time} not found on schedule for ${schedule.date}`);

  slot.status = SLOT_STATUS.AVAILABLE;
  slot.bookingId = null;
  slot.reason = null;
  slot.holdExpiresAt = null;
  await schedule.save();
};

/**
 * Close an individual slot (admin action).
 */
const closeSlot = async (schedule, time, reason = '') => {
  const slot = findSlot(schedule, time);
  if (!slot) throw new Error(`Slot ${time} not found on schedule for ${schedule.date}`);

  slot.status = SLOT_STATUS.CLOSED;
  slot.reason = reason;
  slot.holdExpiresAt = null;
  await schedule.save();
};

/**
 * Put a slot on hold with an expiry time.
 */
const holdSlot = async (schedule, time, bookingId, expiryMinutes = 30) => {
  const slot = findSlot(schedule, time);
  if (!slot) throw new Error(`Slot ${time} not found on schedule for ${schedule.date}`);

  slot.status = SLOT_STATUS.ON_HOLD;
  slot.bookingId = bookingId;
  slot.holdExpiresAt = dayjs().add(expiryMinutes, 'minute').toDate();
  await schedule.save();
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
        slot.holdExpiresAt < now
      ) {
        slot.status = SLOT_STATUS.AVAILABLE;
        slot.bookingId = null;
        slot.holdExpiresAt = null;
        slot.reason = null;
        modified = true;
      }
    }
    if (modified) await schedule.save();
  }
};

/**
 * Build public-safe availability data for a schedule.
 * Strips booking IDs and internal data.
 */
const toPublicAvailability = (schedule) => {
  return {
    date: schedule.date,
    dayStatus: schedule.dayStatus,
    closureReason: schedule.closureReason || null,
    isFullyClosed: schedule.dayStatus !== DAY_STATUS.OPEN,
    slots: schedule.timeSlots.map((slot) => {
      // Expired holds appear as available to the public
      const isExpiredHold =
        slot.status === SLOT_STATUS.ON_HOLD &&
        slot.holdExpiresAt &&
        new Date() > slot.holdExpiresAt;

      return {
        time: slot.time,
        status: isExpiredHold ? SLOT_STATUS.AVAILABLE : slot.status,
        available: isExpiredHold
          ? true
          : slot.status === SLOT_STATUS.AVAILABLE,
      };
    }),
  };
};

module.exports = {
  CLIENT_HOLD_PREFIX,
  getOrCreateSchedule,
  findSlot,
  getSlotBoundaryTimes,
  getSlotTimesInRange,
  isSlotBookable,
  createClientHold,
  releaseClientHold,
  bindClientHoldToBooking,
  holdSlotAtomically,
  markSlotBooked,
  blockConfirmedRange,
  releaseBookingHolds,
  releaseBookingSlots,
  closeBookingSlots,
  releaseSlot,
  closeSlot,
  holdSlot,
  expireStaleHolds,
  toPublicAvailability,
};
