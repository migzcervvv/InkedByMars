'use strict';

const crypto = require('crypto');
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    logger.info('request.complete', {
      requestId: req.requestId,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      adminId: req.admin?._id?.toString() || null,
      ip: req.ip,
    });
  });

  next();
};

module.exports = requestLogger;

