'use strict';

const dayjs = require('dayjs');
const AvailabilitySettings = require('../models/AvailabilitySettings');

const SETTINGS_KEY = 'default';

const getSettings = async () => {
  return AvailabilitySettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY, blockedDates: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const normalizeDates = (dates = []) => {
  return [...new Set(dates)]
    .filter((date) => dayjs(date, 'YYYY-MM-DD', true).isValid())
    .sort();
};

const getBlockedDateSet = async ({ startDate, endDate } = {}) => {
  const settings = await getSettings();
  const blockedDates = settings.blockedDates || [];

  if (!startDate || !endDate) return new Set(blockedDates);

  return new Set(
    blockedDates.filter((date) => date >= startDate && date <= endDate)
  );
};

const getBlockedDatesForMonth = async (month) => {
  const settings = await getSettings();
  const prefix = `${month}-`;
  return (settings.blockedDates || [])
    .filter((date) => date.startsWith(prefix))
    .sort();
};

const replaceBlockedDatesForMonth = async (month, blockedDates) => {
  const prefix = `${month}-`;
  const settings = await getSettings();
  const nextMonthDates = normalizeDates(blockedDates).filter((date) =>
    date.startsWith(prefix)
  );

  const otherDates = (settings.blockedDates || []).filter(
    (date) => !date.startsWith(prefix)
  );

  settings.blockedDates = normalizeDates([...otherDates, ...nextMonthDates]);
  await settings.save();

  return nextMonthDates;
};

const isDateBlocked = async (date) => {
  const settings = await getSettings();
  return (settings.blockedDates || []).includes(date);
};

module.exports = {
  getBlockedDateSet,
  getBlockedDatesForMonth,
  replaceBlockedDatesForMonth,
  isDateBlocked,
};
