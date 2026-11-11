const AvailabilitySettings = require('../models/AvailabilitySettings');
const key = 'default';

async function getBlockedDateSet({ startDate, endDate } = {}) {
  const settings = await AvailabilitySettings.findOne({ key }).select('blockedDates').lean();
  return new Set((settings?.blockedDates || []).filter(date =>
    (!startDate || date >= startDate) && (!endDate || date <= endDate)));
}

async function getBlockedDatesForMonth(month) {
  const dates = await getBlockedDateSet();
  return [...dates].filter(date => date.startsWith(`${month}-`)).sort();
}

async function isDateBlocked(date) {
  return Boolean(await AvailabilitySettings.exists({ key, blockedDates: date }));
}

const removeBlockedDate = date => AvailabilitySettings.updateOne({ key }, { $pull: { blockedDates: date } });

module.exports = { getBlockedDateSet, getBlockedDatesForMonth, isDateBlocked, removeBlockedDate };
