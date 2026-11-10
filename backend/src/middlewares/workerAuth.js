const jwt = require('jsonwebtoken');
const { getCookie } = require('hono/cookie');
const Admin = require('../models/Admin');
const AppError = require('../utils/AppError');
const { env } = require('../bindings/runtime');
const protect = async (c, next) => {
  const token = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '') || getCookie(c, 'token');
  if (!token) throw new AppError('Not authenticated.', 401, 'AUTH_INVALID_TOKEN');
  let decoded;
  try { decoded = jwt.verify(token, env().JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { throw new AppError('Invalid or expired token.', 401, 'AUTH_INVALID_TOKEN'); }
  const admin = await Admin.findById(decoded.id).select('+passwordChangedAt');
  if (!admin || !admin.isActive || admin.changedPasswordAfter(decoded.iat)) throw new AppError('Invalid administrator session.', 401, 'AUTH_INVALID_TOKEN');
  c.get('input').admin = admin;
  await next();
};
const superAdmin = async (c, next) => {
  if (c.get('input').admin.role !== 'super_admin') throw new AppError('Super administrator required.', 403);
  await next();
};
module.exports = { protect, requireAdmin: [protect], requireSuperAdmin: [protect, superAdmin] };
