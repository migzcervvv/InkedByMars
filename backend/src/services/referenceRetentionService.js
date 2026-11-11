const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const { createMediaStorage } = require('../bindings/mediaStorage');
const { isMediaKey } = require('./mediaService');

const retentionMs = 14 * 24 * 60 * 60 * 1000;
const studioTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function expiredReferencesFilter(now) {
  const cutoff = new Date(now.getTime() - retentionMs);
  const parts = Object.fromEntries(studioTime.formatToParts(cutoff).map(({ type, value }) => [type, value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;
  return {
    'referenceImages.0': { $exists: true },
    $or: [
      { preferredDate: { $lt: date } },
      { preferredDate: date, preferredTime: { $lte: time } },
    ],
  };
}

async function purgeBookingReferences(booking, storage, bookings = Booking) {
  const keys = [...new Set(booking.referenceImages || [])];
  const outcomes = await Promise.allSettled(keys.map(async key => {
    if (!isMediaKey(key)) return;
    const shared = await bookings.exists({ _id: { $ne: booking._id }, referenceImages: key });
    if (!shared) await storage.delete(key);
  }));
  const remaining = keys.filter((_, index) => outcomes[index].status === 'rejected');
  if (remaining.length < keys.length) {
    await bookings.updateOne({ _id: booking._id }, { $set: { referenceImages: remaining } });
  }
  if (remaining.length) throw new AppError('Reference images could not all be removed. Retry the operation.', 502, 'REFERENCE_CLEANUP_FAILED');
}

async function purgeExpiredReferences({ env, exclusive, now = new Date(), bookings = Booking, storage }) {
  const filter = expiredReferencesFilter(now);
  const candidates = await bookings.find(filter, { _id: 1 })
    .sort({ preferredDate: 1, preferredTime: 1, _id: 1 }).limit(10).lean();
  if (!candidates.length) return;
  const media = storage ?? createMediaStorage(env);
  let failed = 0;
  for (const { _id } of candidates) {
    try {
      await exclusive(async () => {
        // A confirmation or reschedule may have moved the appointment since the scan.
        const booking = await bookings.findOne({ _id, ...filter }, { referenceImages: 1 }).lean();
        if (booking) await purgeBookingReferences(booking, media, bookings);
      });
    } catch {
      failed++;
    }
  }
  if (failed) {
    throw new AppError(`Reference cleanup needs to retry ${failed} booking(s).`, 502, 'REFERENCE_CLEANUP_FAILED');
  }
}

module.exports = { expiredReferencesFilter, purgeBookingReferences, purgeExpiredReferences };
