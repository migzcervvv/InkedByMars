'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async (attempt = 1) => {
  const maxAttempts = Number(process.env.MONGO_CONNECT_RETRIES) || 5;

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
    });

    logger.info('mongo.connected', {
      host: conn.connection.host,
      name: conn.connection.name,
      attempt,
    });

    return conn;
  } catch (error) {
    logger.error('mongo.connection_failed', {
      attempt,
      maxAttempts,
      message: error.message,
    });

    if (attempt >= maxAttempts) throw error;

    const delayMs = Math.min(1000 * attempt, 5000);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return connectDB(attempt + 1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('mongo.disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('mongo.reconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error('mongo.error', { message: error.message, stack: error.stack });
});

module.exports = connectDB;

