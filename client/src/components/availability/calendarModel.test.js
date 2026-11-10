import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getDateStatus } from './calendarModel.js'

const date = { dateKey: '2026-12-01', todayKey: '2026-11-10', requireKnown: true }

test('never converts missing or loading public availability into an open day', () => {
  assert.equal(getDateStatus(date), 'unknown')
  assert.equal(getDateStatus({ ...date, loading: true, day: { availableCount: 4 } }), 'loading')
  assert.equal(getDateStatus({ ...date, day: { availableCount: 4 } }), 'available')
})

test('closed and booked states take precedence over partial availability', () => {
  assert.equal(getDateStatus({ ...date, day: { isBlocked: true, isPartiallyBooked: true, availableCount: 3 } }), 'blocked')
  assert.equal(getDateStatus({ ...date, day: { availableCount: 0, isPartiallyBooked: true } }), 'booked')
  assert.equal(getDateStatus({ ...date, day: { availableCount: 2, availabilityStatus: 'partial' } }), 'limited')
})

test('past days cannot be public booking candidates; admin can edit unrecorded future days', () => {
  assert.equal(getDateStatus({ ...date, dateKey: '2026-11-09', day: { availableCount: 4 } }), 'past')
  assert.equal(getDateStatus({ ...date, requireKnown: false }), 'available')
  assert.equal(getDateStatus({ ...date, requireKnown: false, blocked: true }), 'blocked')
})
