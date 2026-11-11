const Schedule = require('../models/Schedule');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const { DAY_STATUS, SLOT_STATUS } = require('../config/constants');
const settings = require('./availabilitySettingsService');
const { getSlotBoundaryTimes, getSlotTimesInRange } = require('./scheduleService');
const { transaction } = require('../bindings/runtime');

const wholeDayClosed = schedule => [DAY_STATUS.FULLY_CLOSED, DAY_STATUS.HOLIDAY].includes(schedule.dayStatus);
const isOccupied = (slot, now) => slot.status === SLOT_STATUS.BOOKED ||
  (slot.status === SLOT_STATUS.ON_HOLD && (!slot.holdExpiresAt || new Date(slot.holdExpiresAt) > now));
const isAdminClosure = slot => slot.status === SLOT_STATUS.CLOSED && !slot.bookingId;

async function scheduleForNewDate(date) {
  const { times, endTime } = await settings.getDefaultSchedule();
  return new Schedule({ date, endTime, timeSlots: times.map(time => ({ time })) });
}

function planClosure(schedule, { action, startTime, endTime, reason }, now = new Date()) {
  const wholeDay = action.endsWith('day');
  const closing = action.startsWith('block');
  const boundaries = getSlotBoundaryTimes(schedule);
  const times = wholeDay ? schedule.timeSlots.map(slot => slot.time) : getSlotTimesInRange(schedule, startTime, endTime);
  if (!wholeDay && (!boundaries.includes(startTime) || !boundaries.includes(endTime) || !times.length)) {
    throw new AppError('Choose a start and end from the available schedule boundaries.', 400);
  }
  const slots = schedule.timeSlots.filter(slot => times.includes(slot.time));
  if (closing) {
    const conflicts = slots.filter(slot => isOccupied(slot, now) || (slot.status === SLOT_STATUS.CLOSED && slot.bookingId));
    if (conflicts.length) {
      throw new AppError(`Time is reserved at ${conflicts.map(slot => slot.time).join(', ')}. Review the linked bookings first.`, 409, 'SCHEDULE_CONFLICT', {
        bookings: conflicts.map(({ time, bookingId }) => ({ time, bookingId })),
      });
    }
  }
  return {
    wholeDay, closing, reason,
    slots: wholeDay ? [] : slots.filter(slot => closing ? !isAdminClosure(slot) : isAdminClosure(slot)),
  };
}

async function dayAgenda(date) {
  const schedule = await Schedule.findOne({ date }).lean() || (await scheduleForNewDate(date)).toObject();
  const legacyBlocked = await settings.isDateBlocked(date);
  const blocked = wholeDayClosed(schedule) || legacyBlocked;
  const ids = schedule.timeSlots.map(slot => slot.bookingId).filter(Boolean);
  const bookings = ids.length ? await Booking.find({ _id: { $in: ids } }).select('clientName').lean() : [];
  const names = new Map(bookings.map(booking => [String(booking._id), booking.clientName]));
  const now = new Date();
  return {
    ...schedule, blocked, legacyBlocked, version: schedule.__v ?? null,
    boundaries: getSlotBoundaryTimes(schedule),
    timeSlots: schedule.timeSlots.map(slot => {
      const expired = slot.status === SLOT_STATUS.ON_HOLD && !isOccupied(slot, now);
      return {
        ...slot,
        status: expired ? SLOT_STATUS.AVAILABLE : slot.status,
        bookingId: expired ? null : slot.bookingId,
        clientName: expired ? undefined : names.get(String(slot.bookingId)),
        canUnblock: isAdminClosure(slot),
      };
    }),
  };
}

async function changeClosure(date, operation) {
  await transaction(async () => {
    const schedule = await Schedule.findOne({ date }) || await scheduleForNewDate(date);
    if ((schedule.__v ?? null) !== operation.version) {
      throw new AppError('The calendar changed. Review the updated day and try again.', 409, 'SCHEDULE_CHANGED');
    }
    const change = planClosure(schedule, operation);
    if (change.wholeDay) {
      if (!change.closing && await settings.isDateBlocked(date)) await settings.removeBlockedDate(date);
      if (change.closing && wholeDayClosed(schedule)) return;
      if (!change.closing && !wholeDayClosed(schedule)) return;
      schedule.dayStatus = change.closing ? DAY_STATUS.FULLY_CLOSED : DAY_STATUS.OPEN;
      schedule.closureReason = change.closing ? change.reason : null;
    } else {
      if (wholeDayClosed(schedule) || await settings.isDateBlocked(date)) {
        throw new AppError('Unblock the whole day before editing individual times.', 409);
      }
      if (!change.slots.length) return;
      for (const slot of change.slots) {
        slot.status = change.closing ? SLOT_STATUS.CLOSED : SLOT_STATUS.AVAILABLE;
        slot.reason = change.closing ? change.reason : null;
        slot.holdExpiresAt = null;
        slot.bookingId = null;
      }
    }
    if (!schedule.isNew) schedule.increment();
    await schedule.save();
  });
  return dayAgenda(date);
}

module.exports = { dayAgenda, changeClosure, planClosure };
