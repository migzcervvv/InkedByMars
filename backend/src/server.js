'use strict';

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

// Handle uncaught synchronous exceptions before anything runs
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION — shutting down');
  console.error(err.name, err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

let server;

connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION — shutting down gracefully');
  console.error(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown on SIGTERM (Docker, cloud platforms)
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Process terminated');
    });
  }
});
