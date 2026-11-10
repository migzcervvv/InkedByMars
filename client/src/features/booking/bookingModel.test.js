import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildBookingPayload, createDraft, validateBookingStep } from './bookingModel.js'

test('validates tattoo and client stages without accepting whitespace-only fields', () => {
  const draft = createDraft('freehand')
  draft.tattooPlacement = '   '
  assert.ok(validateBookingStep(draft, 'idea').tattooPlacement)
  draft.tattooPlacement = 'Shoulder'
  draft.tattooSize = 'small'
  assert.deepEqual(validateBookingStep(draft, 'idea'), {})
  Object.assign(draft, { clientName: 'Studio test', email: 'bad-address', phone: '12345', instagramHandle: '@studio-test' })
  assert.ok(validateBookingStep(draft, 'details').email)
  draft.email = 'test@example.com'
  assert.deepEqual(validateBookingStep(draft, 'details'), {})
})

test('builds the existing backend contract while preserving style in notes', () => {
  const draft = { ...createDraft('flash'), clientName: ' Test ', email: ' test@example.com ', phone: ' 123 ', instagramHandle: ' @test ', tattooPlacement: ' Arm ', tattooSize: 'small', notes: ' Blue fish ', references: [{ name: 'drawing.webp', key: 'references/12345678-1234-1234-1234-123456789abc.webp', size: 3 }] }
  const payload = buildBookingPayload(draft, '2026-12-01', '13:00')
  assert.equal(payload.clientName, 'Test')
  assert.equal(payload.tattooPlacement, 'Arm')
  assert.equal(payload.preferredDate, '2026-12-01')
  assert.equal(payload.preferredTime, '13:00')
  assert.equal(payload.notes, 'Starting point: flash\nBlue fish')
  assert.deepEqual(payload.referenceImages, ['references/12345678-1234-1234-1234-123456789abc.webp'])
  assert.equal('references' in payload, false)
  assert.equal('category' in payload, false)
  assert.equal(draft.clientName, ' Test ')
})

test('keeps notes within budget and sends object keys without file names or binary data', () => {
  const draft = { ...createDraft('minimalistic'), notes: 'a'.repeat(900), references: [{ name: 'b'.repeat(220), key: 'references/12345678-1234-1234-1234-123456789abc.webp' }] }
  assert.ok(buildBookingPayload(draft, '2026-12-01', '13:00').notes.length <= 1000)
  assert.equal(buildBookingPayload(draft, '2026-12-01', '13:00').referenceImages[0], draft.references[0].key)
  draft.notes += 'a'
  assert.ok(validateBookingStep(draft, 'idea').notes)
})
