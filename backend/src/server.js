'use strict';

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const logger = require('./utils/logger');
const { startHoldCleanupJob } = require('./services/holdCleanupService');

process.on('uncaughtException', (err) => {
  logger.error('process.uncaught_exception', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

validateEnv();

const PORT = process.env.PORT || 5000;
let server;
let holdCleanupTimer;

connectDB()
  .then(() => {
    holdCleanupTimer = startHoldCleanupJob({
      intervalMs: Number(process.env.HOLD_CLEANUP_INTERVAL_MS) || 60 * 1000,
    });

    server = app.listen(PORT, () => {
      logger.info('server.started', {
        env: process.env.NODE_ENV || 'development',
        port: PORT,
      });
    });
  })
  .catch((err) => {
    logger.error('server.start_failed', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });

process.on('unhandledRejection', (err) => {
  logger.error('process.unhandled_rejection', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  logger.warn('process.sigterm');
  if (holdCleanupTimer) clearInterval(holdCleanupTimer);
  if (server) {
    server.close(() => {
      logger.info('server.closed');
    });
  }
});
