import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldClearAdminSession } from './requestPolicy.js'
test('Instagram and public API authentication failures do not invalidate studio login', () => {
  for (const url of ['/instagram/posts', '/instagram/profile', '/public/bookings', '/public/availability']) assert.equal(shouldClearAdminSession(401, url), false)
})
test('expired studio authentication still clears the admin session', () => {
  for (const url of ['/auth/me', '/bookings', '/schedule/2026-11-10']) assert.equal(shouldClearAdminSession(401, url), true)
  assert.equal(shouldClearAdminSession(503, '/auth/me'), false)
})
