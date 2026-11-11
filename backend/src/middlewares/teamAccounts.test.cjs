const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Hono } = require('hono');
const { input, validate } = require('./input');
const { createUserValidators, editUserValidators, resetUserPasswordValidators } = require('../validators/authValidators');
const { createUser, editUser, removeUser, resetUserPassword } = require('../controllers/authController');
const { mongoIdParam } = require('../validators/bookingValidators');
const { run } = require('../bindings/runtime');
const Admin = require('../models/Admin');

test('team creation forces the admin role and returns neither a password nor a session', async () => {
  const app = new Hono();
  app.use('*', input);
  app.post('/', validate(createUserValidators), createUser);
  const fakeAdmin = {
    async exists() { return null; },
    async create(data) {
      assert.equal(data.role, 'admin');
      return { ...data, _id: 'created' };
    },
  };
  const response = await run({ db: { models: { Admin: fakeAdmin } } }, () => app.request('/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'fixture', email: 'fixture@example.com', password: 'Fixture123', role: 'super_admin' }),
  }));
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('set-cookie'), null);
  const result = await response.json();
  assert.deepEqual(result.admin, { id: 'created', name: 'fixture', email: 'fixture@example.com', role: 'admin' });
  assert.equal(result.token, undefined);
});

test('regular administrators cannot edit someone else and self password changes require their password', async () => {
  const id = '507f1f77bcf86cd799439011';
  const app = new Hono();
  app.onError((error, c) => c.json({ code: error.code }, error.statusCode || 500));
  app.use('*', input, async (c, next) => {
    c.get('input').admin = { _id: id, role: 'admin' };
    await next();
  });
  app.put('/:id', validate(editUserValidators), editUser);
  const send = target => app.request('/' + target, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'fixture', email: 'fixture@example.com', password: 'Fixture123' }),
  });
  assert.equal((await send('507f1f77bcf86cd799439012')).status, 403);
  const response = await run({ db: { models: { Admin: {
    findById: () => ({ select: async () => ({ comparePassword: async () => false }) }),
  } } } }, () => send(id));
  assert.deepEqual(await response.json(), { code: 'CURRENT_PASSWORD_INVALID' });
});

test('a password change invalidates old tokens but allows a new session in the same second', () => {
  const admin = new Admin({ passwordChangedAt: new Date(12001) });
  assert.equal(admin.changedPasswordAfter(12), true);
  assert.equal(admin.changedPasswordAfter(12, 0), true);
  assert.equal(admin.changedPasswordAfter(12, 12001), false);
});

test('team deletion and password reset reject self and mutate only the selected teammate', async () => {
  const operator = '507f1f77bcf86cd799439011';
  const teammate = '507f1f77bcf86cd799439012';
  const deleted = [];
  const saved = [];
  const user = { async save() { saved.push(this.password); } };
  const db = { models: { Admin: {
    async deleteOne({ _id }) { deleted.push(_id); return { deletedCount: 1 }; },
    findById(id) { assert.equal(id, teammate); return { select: async () => user }; },
  } } };
  const app = new Hono();
  app.onError((error, c) => c.json({ message: error.message }, error.statusCode || 500));
  app.use('*', input, async (c, next) => {
    c.get('input').admin = { _id: operator, role: 'super_admin' };
    await next();
  });
  app.delete('/:id', validate(mongoIdParam), removeUser);
  app.post('/:id/reset-password', validate(resetUserPasswordValidators), resetUserPassword);
  const remove = id => run({ db }, () => app.request('/' + id, { method: 'DELETE' }));
  const reset = id => run({ db }, () => app.request('/' + id + '/reset-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'Fixture123' }),
  }));
  assert.equal((await remove(operator)).status, 400);
  assert.equal((await reset(operator)).status, 400);
  assert.equal((await reset(teammate)).status, 200);
  assert.equal((await remove(teammate)).status, 200);
  assert.deepEqual(saved, ['Fixture123']);
  assert.deepEqual(deleted, [teammate]);
});
