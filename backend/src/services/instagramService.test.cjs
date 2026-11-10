const { test } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const fs = require('node:fs');
const logger = require('../utils/logger');

function upstream(status, code, transient = false) {
  const error = new Error('Fixture Meta error');
  error.response = { status, data: { error: { code, is_transient: transient, message: 'Fixture Meta error' } } };
  return error;
}

function fixture(t, get, expiry = '') {
  const config = { META_ACCESS_TOKEN: 'fixture-user-token', META_APP_ID: 'fixture-app', META_APP_SECRET: 'fixture-secret', INSTAGRAM_USER_ID: '123', INSTAGRAM_TOKEN_EXPIRES_AT: expiry, IG_API_VERSION: 'v25.0', GRAPH_BASE: 'https://graph.facebook.com' };
  const previous = Object.fromEntries(Object.keys(config).map(key => [key, process.env[key]]));
  Object.assign(process.env, config);
  const modulePaths = ['./instagramService', './tokenService'].map(require.resolve);
  modulePaths.forEach(modulePath => delete require.cache[modulePath]);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    modulePaths.forEach(modulePath => delete require.cache[modulePath]);
  });
  for (const level of ['info', 'warn', 'error']) t.mock.method(logger, level, () => {});
  const writes = t.mock.method(fs, 'writeFileSync', () => {});
  const requests = t.mock.method(axios, 'get', get);
  return { service: require('./instagramService'), requests, writes };
}

const media = { headers: {}, data: { data: [{ id: '456', media_type: 'IMAGE', media_url: 'https://example.test/tattoo.jpg' }] } };
const profile = { data: { id: '123', username: 'fixture-artist' } };

test('transient introspection failure permits authorized media reads without storing false validation', async t => {
  let now = 1800000000000;
  t.mock.method(Date, 'now', () => now);
  let inspections = 0;
  const { service, writes } = fixture(t, async url => {
    if (url.endsWith('/debug_token')) { inspections++; throw upstream(500, 2, true); }
    return url.endsWith('/media') ? media : profile;
  });
  assert.equal((await service.getInstagramProfile()).username, 'fixture-artist');
  assert.equal((await service.getInstagramPosts(1)).posts.length, 1);
  assert.equal(inspections, 1, 'inspection outage has a bounded retry cooldown');
  assert.equal(writes.mock.callCount(), 0, 'an upstream outage never persists token validity or an invented expiry');
  now += 60001;
  await service.getInstagramProfile();
  assert.equal(inspections, 2, 'inspection is retried after the outage cooldown');
});

test('an explicitly invalid token never reaches the media endpoint', async t => {
  const { service, requests } = fixture(t, async () => ({ data: { data: { is_valid: false } } }));
  await assert.rejects(service.getInstagramPosts(1), { statusCode: 401, code: 'IG_TOKEN_EXPIRED' });
  assert.equal(requests.mock.callCount(), 1);
});

test('authentication rejection from the data endpoint remains a 401 during an inspection outage', async t => {
  const { service } = fixture(t, async url => {
    if (url.endsWith('/debug_token')) throw upstream(500, 2, true);
    throw upstream(400, 190);
  });
  await assert.rejects(service.getInstagramPosts(1), { statusCode: 401, code: 'IG_TOKEN_EXPIRED' });
});

test('failed refresh uses a still-valid token, but stops at its real expiry even during cooldown', async t => {
  let now = 1800000000000;
  t.mock.method(Date, 'now', () => now);
  let exchanges = 0;
  const { service, writes } = fixture(t, async url => {
    if (url.endsWith('/oauth/access_token')) { exchanges++; throw upstream(500, 2, true); }
    return url.endsWith('/media') ? media : profile;
  }, String(now + 30000));
  assert.equal((await service.getInstagramProfile()).id, '123');
  assert.equal((await service.getInstagramPosts(1)).posts.length, 1);
  assert.equal(exchanges, 1);
  assert.equal(writes.mock.callCount(), 0);
  now += 31000;
  await assert.rejects(service.getInstagramProfile(), { statusCode: 401, code: 'IG_TOKEN_EXPIRED' });
});

test('permanent inspection configuration errors are not bypassed or mislabeled as expired credentials', async t => {
  const { service, requests } = fixture(t, async () => { throw upstream(400, 100); });
  await assert.rejects(service.getInstagramProfile(), { statusCode: 400, code: 'IG_FETCH_FAILED' });
  assert.equal(requests.mock.callCount(), 1);
});

test('a valid token without an expiration timestamp does not cause an invalid-date 500', async t => {
  const { service, writes } = fixture(t, async url => {
    if (url.endsWith('/debug_token')) return { data: { data: { is_valid: true } } };
    return profile;
  });
  assert.equal((await service.getInstagramProfile()).id, '123');
  const persisted = JSON.parse(writes.mock.calls[0].arguments[1]);
  assert.equal(persisted.expires_at, null);
});

test('an actual authentication failure on refresh is never treated as a transient outage', async t => {
  const { service, requests } = fixture(t, async () => { throw upstream(400, 190); }, String(Date.now() + 30000));
  await assert.rejects(service.getInstagramProfile(), { statusCode: 401, code: 'IG_TOKEN_EXPIRED' });
  assert.equal(requests.mock.callCount(), 1);
});
