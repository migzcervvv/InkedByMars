const { setCookie } = require('hono/cookie');
const { env } = require('../bindings/runtime');
exports.fail = error => { throw error; };
exports.sendOk = (c, data = {}, message = 'Success') => c.json({ success: true, requestId: c.get('requestId'), message, ...data });
exports.sendCreated = (c, data = {}, message = 'Resource created') => c.json({ success: true, requestId: c.get('requestId'), message, ...data }, 201);
exports.sendCookieWithToken = (c, admin) => {
  const token = admin.getSignedJwt();
  setCookie(c, 'token', token, { path: '/', httpOnly: true, secure: env().NODE_ENV === 'production', sameSite: 'Lax', maxAge: 86400 * (Number(env().JWT_COOKIE_EXPIRE) || 7) });
  return token;
};
