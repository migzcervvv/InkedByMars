const AppError = require('../utils/AppError');
const timeZone = 'Asia/Manila';
const dateFormat = new Intl.DateTimeFormat('sv-SE', { timeZone, dateStyle: 'short' });

function bookingPolicy(now = new Date()) {
  const studioDate = dateFormat.format(now);
  const tomorrow = new Date(`${studioDate}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return { timeZone, studioDate, earliestBookableDate: tomorrow.toISOString().slice(0, 10), sameDayBookingAllowed: false };
}

function validDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
}

function requireBookableDate(date, now) {
  if (!validDate(date)) throw new AppError('Choose a valid appointment date.', 400);
  if (date < bookingPolicy(now).earliestBookableDate) {
    throw new AppError('New appointments must be scheduled for tomorrow or later in Philippine time.', 409, 'BOOKING_DATE_POLICY');
  }
}

module.exports = { bookingPolicy, validDate, requireBookableDate };
