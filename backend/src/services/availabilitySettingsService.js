const AvailabilitySettings = require('../models/AvailabilitySettings');
const { DEFAULT_TIME_SLOTS } = require('../config/constants');
const AppError = require('../utils/AppError');
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

async function getDefaultSchedule() {
  const settings = await AvailabilitySettings.findOne({ key }).select('defaultTimes defaultEndTime').lean();
  return { times: settings?.defaultTimes || DEFAULT_TIME_SLOTS, endTime: settings?.defaultEndTime || '23:00' };
}

function validateDefaultSchedule({ times, endTime }) {
  const clockTime = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!Array.isArray(times) || !times.length || times.length > 48 || !times.every(clockTime) ||
      new Set(times).size !== times.length || !(clockTime(endTime) || endTime === '24:00') ||
      times.some(time => time >= endTime)) {
    throw new AppError('Enter 1–48 distinct start times and an end time after the final slot.', 400, 'INVALID_DEFAULT_TIMES');
  }
  return { times: [...times].sort(), endTime };
}

async function saveDefaultSchedule(input) {
  const { times, endTime } = validateDefaultSchedule(input);
  await AvailabilitySettings.updateOne({ key }, {
    $set: { defaultTimes: times, defaultEndTime: endTime },
  }, { upsert: true });
  return { times, endTime };
}

module.exports = { getBlockedDateSet, getBlockedDatesForMonth, isDateBlocked, removeBlockedDate, getDefaultSchedule, saveDefaultSchedule, validateDefaultSchedule };
