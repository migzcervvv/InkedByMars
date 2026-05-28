"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/bookings");
const scheduleRoutes = require("./routes/schedule");
const publicRoutes = require("./routes/public");

const errorHandler = require("./middlewares/error");
const notFound = require("./middlewares/notFound");
const requestLogger = require("./middlewares/requestLogger");
const requestTimeout = require("./middlewares/timeout");
const { sanitizeInput } = require("./middlewares/security");
const { authLimiter, adminLimiter, publicLimiter } = require("./middlewares/rateLimiters");
const { getAllowedOrigins } = require("./config/env");
const AppError = require("./utils/AppError");

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = getAllowedOrigins();
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new AppError(`CORS blocked origin: ${origin}`, 403));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  exposedHeaders: [
    "X-Request-Id",
    "RateLimit-Limit",
    "RateLimit-Remaining",
    "RateLimit-Reset",
  ],
  optionsSuccessStatus: 204,
};

// CORS and preflight must run before rate limiters. Otherwise 429s appear as CORS failures.
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(helmet());
app.use(requestTimeout(Number(process.env.REQUEST_TIMEOUT_MS) || 30000));
app.use(requestLogger);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "8mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || "8mb" }));
app.use(cookieParser());
app.use(sanitizeInput);

app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;

  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    message: "Server health check",
    requestId: req.requestId,
    uptimeSeconds: Math.round(process.uptime()),
    memory: process.memoryUsage(),
    database: {
      state: dbState,
      connected: dbState === 1,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/bookings", adminLimiter, bookingRoutes);
app.use("/api/schedule", adminLimiter, scheduleRoutes);
app.use("/api/public", publicLimiter, publicRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
