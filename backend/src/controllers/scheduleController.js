const Schedule = require('../models/Schedule');
const { bookingPolicy } = require('../services/bookingPolicy');
const settings = require('../services/availabilitySettingsService');
const { dayAgenda } = require('../services/calendarClosures');
const { expireStaleBookingHolds } = require('../services/holdCleanupService');
const { sendOk } = require('../utils/honoResponse');

async function getBlockedDates(c) {
  const month = c.get('input').query.month || bookingPolicy().studioDate.slice(0, 7);
  return sendOk(c, { month, blockedDates: await settings.getBlockedDatesForMonth(month) });
}

async function getAllSchedules(c) {
  const { startDate, endDate } = c.get('input').query;
  const date = {};
  if (startDate) date.$gte = startDate;
  if (endDate) date.$lte = endDate;
  const [schedules, blockedDates] = await Promise.all([
    Schedule.find(startDate || endDate ? { date } : {}).sort({ date: 1 }).lean(),
    settings.getBlockedDateSet({ startDate, endDate }),
  ]);
  return sendOk(c, { schedules, blockedDates: [...blockedDates] });
}

async function getScheduleByDate(c) {
  return sendOk(c, { schedule: await dayAgenda(c.get('input').params.date) });
}

async function expireHolds(c) {
  return sendOk(c, { expiredBookings: await expireStaleBookingHolds() }, 'Stale holds expired');
}

module.exports = { getAllSchedules, getScheduleByDate, getBlockedDates, expireHolds };
