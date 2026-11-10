const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTokenExpiry } = require('./tokenExpiry');

test('Meta seconds and stored milliseconds resolve to the same expiry', () => {
  const seconds = 1800000000;
  assert.equal(normalizeTokenExpiry(String(seconds)), seconds * 1000);
  assert.equal(normalizeTokenExpiry(seconds * 1000), seconds * 1000);
  const now = seconds * 1000 - 60000;
  assert.ok(normalizeTokenExpiry(seconds) > now);
});

test('unknown expiry stays unknown; malformed configuration is rejected', () => {
  for (const value of [undefined, null, '', 0, '0']) assert.equal(normalizeTokenExpiry(value), null);
  for (const value of ['not-a-date', -1, Infinity]) assert.throws(() => normalizeTokenExpiry(value));
});
