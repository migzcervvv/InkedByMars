const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Hono } = require('hono');
const { input, validate } = require('../middlewares/input');
const { createBookingValidators, confirmBookingValidators } = require('../validators/bookingValidators');
const { dateParamValidator, rangeQueryValidators } = require('../validators/scheduleValidators');
const { createBooking, confirmBooking } = require('../controllers/bookingController');
const { getAvailability, getAvailabilityByDate } = require('../controllers/publicController');
const { bookingPolicy, validDate, requireBookableDate } = require('./bookingPolicy');
const { expiryReason, isExpired, requireCurrentVersion, viewFilter } = require('./bookingReview');
const { planClosure } = require('./calendarClosures');
const { toPublicAvailability, getSlotBoundaryTimes } = require('./scheduleService');
const { validateDefaultSchedule } = require('./availabilitySettingsService');

test('custom starts are sorted and the explicit end works for uneven slots and midnight', () => {
  const { times, endTime } = validateDefaultSchedule({ times: ['20:30', '15:00', '19:15'], endTime: '24:00' });
  assert.deepEqual(getSlotBoundaryTimes({ timeSlots: times.map(time => ({ time })), endTime }), ['15:00', '19:15', '20:30', '24:00']);
  assert.deepEqual(getSlotBoundaryTimes({ timeSlots: [{ time: '15:00' }, { time: '16:00' }] }), ['15:00', '16:00', '17:00']);
  for (const bad of [
    { times: ['16:00', '16:00'], endTime: '19:00' },
    { times: ['16:00'], endTime: '16:00' },
    { times: ['09:60'], endTime: '19:00' },
  ]) assert.throws(() => validateDefaultSchedule(bad), { code: 'INVALID_DEFAULT_TIMES' });
});

test('Manila midnight advances the first bookable date without a 24-hour lead time', () => {
  const before = new Date('2028-02-28T15:59:59.999Z');
  const after = new Date('2028-02-28T16:00:00.000Z');
  assert.equal(bookingPolicy(before).earliestBookableDate, '2028-02-29');
  assert.equal(bookingPolicy(after).earliestBookableDate, '2028-03-01');
  assert.doesNotThrow(() => requireBookableDate('2028-02-29', before));
  assert.throws(() => requireBookableDate('2028-02-29', after), { code: 'BOOKING_DATE_POLICY' });
  assert.equal(validDate('2027-02-29'), false);
  assert.equal(validDate('2028-04-31'), false);
});

test('direct booking and reschedule requests for today fail before touching the schedule', async () => {
  const api = new Hono();
  api.onError((error, c) => c.json({ code: error.code }, error.statusCode || 500));
  api.use('*', input);
  api.post('/public/bookings', validate(createBookingValidators), createBooking);
  api.post('/bookings', validate(createBookingValidators), createBooking);
  api.put('/bookings/:id/confirm', validate(confirmBookingValidators), confirmBooking);
  api.get('/availability/:date', validate(dateParamValidator), getAvailabilityByDate);
  api.get('/availability', validate(rangeQueryValidators), getAvailability);
  const { studioDate } = bookingPolicy();
  const body = {
    clientName: 'Fixture', email: 'fixture@example.invalid', phone: '0000',
    instagramHandle: 'fixture', tattooPlacement: 'Arm', preferredDate: studioDate, preferredTime: '15:00',
  };
  const send = (path, method, data) => api.request(path, {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  for (const path of ['/public/bookings', '/bookings']) {
    const response = await send(path, 'POST', body);
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { code: 'BOOKING_DATE_POLICY' });
  }
  const confirmed = await send('/bookings/507f1f77bcf86cd799439011/confirm', 'PUT', {
    date: studioDate, startTime: '15:00', endTime: '16:00', expectedUpdatedAt: new Date().toISOString(),
  });
  assert.equal(confirmed.status, 409);
  const availability = await api.request('/availability/' + studioDate);
  const day = await availability.json();
  assert.equal(availability.status, 200);
  assert.equal(availability.headers.get('cache-control'), 'no-store');
  assert.equal(day.availableCount, 0);
  assert.equal(day.slots.every(slot => !slot.available), true);
  assert.equal(day.policy.sameDayBookingAllowed, false);
  const range = await api.request(`/availability?startDate=${studioDate}&endDate=${studioDate}`);
  assert.equal(range.status, 200);
  const summary = await range.json();
  assert.equal(summary.availability[0].availableCount, 0);
  assert.equal(summary.policy.earliestBookableDate, day.policy.earliestBookableDate);
});

test('queue and detail agree on expired holds, and stale writes are rejected', () => {
  const now = new Date('2026-12-01T02:00:00Z');
  assert.equal(isExpired({ status: 'on-hold', holdExpiresAt: now }, now), true);
  assert.equal(isExpired({ status: 'on-hold', holdExpiresAt: new Date(now.valueOf() + 1) }, now), false);
  assert.equal(isExpired({ status: 'cancelled', statusHistory: [{ reason: expiryReason }] }), true);
  assert.equal(isExpired({ status: 'cancelled', statusHistory: [{ reason: 'Client cancelled' }] }), false);
  assert.deepEqual(viewFilter('review', now).$or[1].holdExpiresAt, { $gt: now });
  assert.throws(() => requireCurrentVersion({ updatedAt: now }, '2026-12-01T01:00:00.000Z'), { code: 'BOOKING_CHANGED' });
});

test('a whole-day or range block detects reservations before touching any slot', () => {
  const now = new Date('2026-12-01T02:00:00Z');
  const open = { time: '15:00', status: 'available' };
  const held = { time: '16:00', status: 'on-hold', bookingId: 'held', holdExpiresAt: new Date(now.valueOf() + 1000) };
  const booked = { time: '17:00', status: 'booked', bookingId: 'confirmed' };
  const day = { timeSlots: [open, held, booked] };
  assert.throws(() => planClosure(day, { action: 'block-day' }, now), {
    statusCode: 409, details: { bookings: [{ time: '16:00', bookingId: 'held' }, { time: '17:00', bookingId: 'confirmed' }] },
  });
  assert.throws(() => planClosure(day, { action: 'block-range', startTime: '15:00', endTime: '17:00' }, now), { statusCode: 409 });
  assert.deepEqual(planClosure(day, { action: 'block-range', startTime: '15:00', endTime: '16:00' }, now).slots, [open]);
  assert.throws(() => planClosure(day, { action: 'block-range', startTime: '15:30', endTime: '16:00' }, now), { statusCode: 400 });
  assert.equal(open.status, 'available');
});

test('only studio closures can be reopened and public availability omits internal details', () => {
  const closure = { time: '15:00', status: 'closed', reason: 'Private reason' };
  const appointment = { time: '16:00', status: 'closed', bookingId: 'completed' };
  const open = { time: '17:00', status: 'available' };
  const day = { date: '2099-01-01', dayStatus: 'fully_closed', closureReason: 'Private day reason', timeSlots: [closure, appointment, open] };
  const change = planClosure(day, { action: 'unblock-range', startTime: '15:00', endTime: '18:00' });
  assert.deepEqual(change.slots, [closure]);
  const summary = toPublicAvailability(day);
  assert.equal(summary.availableCount, 0);
  assert.equal(summary.closureReason, 'Unavailable');
  assert.ok(summary.slots.every(slot => !slot.available && !slot.bookingId && !slot.reason));
});
