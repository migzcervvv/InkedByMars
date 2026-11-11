const { test } = require('node:test');
const assert = require('node:assert/strict');
const { expiredReferencesFilter, purgeBookingReferences, purgeExpiredReferences } = require('./referenceRetentionService');

const first = 'references/11111111-1111-4111-8111-111111111111.webp';
const second = 'references/22222222-2222-4222-8222-222222222222.jpg';

test('retention becomes due 14 days after the appointment starts in Manila, including at midnight', () => {
  const check = (now, date, time) => assert.deepEqual(expiredReferencesFilter(new Date(now)), {
    'referenceImages.0': { $exists: true },
    $or: [{ preferredDate: { $lt: date } }, { preferredDate: date, preferredTime: { $lte: time } }],
  });
  check('2026-12-14T15:59:59.999Z', '2026-11-30', '23:59');
  check('2026-12-14T16:00:00.000Z', '2026-12-01', '00:00');
  check('2027-01-11T07:30:00.000Z', '2026-12-28', '15:30');
});

test('provider failures retain only the keys that still need retry', async () => {
  const booking = { _id: 'booking', referenceImages: [first, first, second] };
  const removed = [];
  const bookings = {
    async exists() { return null; },
    async updateOne(filter, update) {
      assert.deepEqual(filter, { _id: booking._id });
      Object.assign(booking, update.$set);
    },
  };
  await assert.rejects(purgeBookingReferences(booking, {
    async delete(key) {
      if (key === second) throw new Error('provider unavailable');
      removed.push(key);
    },
  }, bookings), { code: 'REFERENCE_CLEANUP_FAILED' });
  assert.deepEqual(removed, [first]);
  assert.deepEqual(booking.referenceImages, [second]);
  await purgeBookingReferences(booking, { async delete(key) { removed.push(key); } }, bookings);
  assert.deepEqual(removed, [first, second]);
  assert.deepEqual(booking.referenceImages, []);
});

test('shared objects survive until the last booking reference is removed', async () => {
  const older = { _id: 'older', referenceImages: [first, { url: 'data:image/png;base64,AAAA' }] };
  const later = { _id: 'later', referenceImages: [first] };
  const records = [older, later];
  const deleted = [];
  const bookings = {
    async exists({ _id, referenceImages }) {
      return records.find(record => record._id !== _id.$ne && record.referenceImages.includes(referenceImages));
    },
    async updateOne({ _id }, { $set }) { Object.assign(records.find(record => record._id === _id), $set); },
  };
  const storage = { async delete(key) { deleted.push(key); } };
  await purgeBookingReferences(older, storage, bookings);
  assert.deepEqual(older.referenceImages, []);
  assert.deepEqual(deleted, []);
  await purgeBookingReferences(later, storage, bookings);
  assert.deepEqual(deleted, [first]);
});

test('the scheduled sweep deletes due references and skips an appointment moved after the scan', async () => {
  const now = new Date('2026-12-15T07:30:00Z');
  const filter = expiredReferencesFilter(now);
  const due = { _id: 'due', referenceImages: [first] };
  const deleted = [];
  let insideLock = false;
  const query = {
    sort() { return this; },
    limit() { return this; },
    async lean() { return [{ _id: 'moved' }, { _id: 'due' }]; },
  };
  const bookings = {
    find(candidateFilter) {
      assert.deepEqual(candidateFilter, filter);
      return query;
    },
    findOne({ _id, ...candidateFilter }) {
      assert.ok(insideLock);
      assert.deepEqual(candidateFilter, filter);
      return { async lean() { return _id === due._id ? due : null; } };
    },
    async exists() { return null; },
    async updateOne({ _id }, { $set }) {
      assert.equal(_id, due._id);
      Object.assign(due, $set);
    },
  };
  await purgeExpiredReferences({
    now, bookings,
    storage: { async delete(key) { deleted.push(key); } },
    async exclusive(operation) {
      insideLock = true;
      try {
        await operation();
      } finally {
        insideLock = false;
      }
    },
  });
  assert.deepEqual(deleted, [first]);
  assert.deepEqual(due.referenceImages, []);
});
