'use strict';

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const logger = require('./utils/logger');

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

connectDB()
  .then(() => {
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
  if (server) {
    server.close(() => {
      logger.info('server.closed');
    });
  }
});

