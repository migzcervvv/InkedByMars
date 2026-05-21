'use strict';

const dayjs = require('dayjs');
const Schedule = require('../models/Schedule');
const { DEFAULT_TIME_SLOTS, SLOT_STATUS, DAY_STATUS } = require('../config/constants');

/**
 * Fetch or create a schedule document for a given date string (YYYY-MM-DD).
 * Newly created schedules are populated with default available time slots.
 */
const getOrCreateSchedule = async (dateStr) => {
  let schedule = await Schedule.findOne({ date: dateStr });

  if (!schedule) {
    const slots = DEFAULT_TIME_SLOTS.map((time) => ({
      time,
      status: SLOT_STATUS.AVAILABLE,
      bookingId: null,
      reason: null,
      holdExpiresAt: null,
    }));

    schedule = await Schedule.create({
      date: dateStr,
      dayStatus: DAY_STATUS.OPEN,
      timeSlots: slots,
    });
  }

  return schedule;
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
  getOrCreateSchedule,
  findSlot,
  isSlotBookable,
  markSlotBooked,
  releaseSlot,
  closeSlot,
  holdSlot,
  expireStaleHolds,
  toPublicAvailability,
};
