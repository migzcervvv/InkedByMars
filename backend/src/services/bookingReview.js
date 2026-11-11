const AppError = require('../utils/AppError');
const { BOOKING_STATUS: status } = require('../config/constants');

const expiryReason = 'Temporary hold expired before admin confirmation';
const views = ['review', 'confirmed', 'completed', 'cancelled', 'all'];

function viewFilter(view, now) {
  if (view === 'review') return { $or: [
    { status: status.PENDING },
    { status: status.ON_HOLD, holdExpiresAt: { $gt: now } },
  ] };
  if (view === 'cancelled') return { $or: [
    { status: status.CANCELLED },
    { status: status.ON_HOLD, holdExpiresAt: { $not: { $gt: now } } },
  ] };
  return view === 'all' ? {} : { status: view };
}

function isExpired(booking, now = new Date()) {
  if (booking.status === status.ON_HOLD) return !(booking.holdExpiresAt && new Date(booking.holdExpiresAt) > now);
  return booking.status === status.CANCELLED && booking.statusHistory?.at(-1)?.reason === expiryReason;
}

function requireCurrentVersion(booking, expectedUpdatedAt) {
  if (!expectedUpdatedAt || booking.updatedAt?.toISOString() !== expectedUpdatedAt) {
    throw new AppError('This booking changed. Review the updated request before trying again.', 409, 'BOOKING_CHANGED');
  }
}

module.exports = { expiryReason, isExpired, requireCurrentVersion, views, viewFilter };
