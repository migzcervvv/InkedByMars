'use strict';

const rateLimit = require('express-rate-limit');

const jsonHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please slow down and try again shortly.',
    requestId: req.requestId,
  });
};

const keyGenerator = (req) => {
  return req.admin?._id?.toString() || req.ip;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.ADMIN_RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: (req) => req.method === 'OPTIONS',
  handler: jsonHandler,
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.PUBLIC_RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  handler: jsonHandler,
});

module.exports = {
  authLimiter,
  adminLimiter,
  publicLimiter,
};

