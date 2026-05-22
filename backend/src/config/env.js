"use strict";

const required = ["MONGO_URI", "JWT_SECRET"];

const parseList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
};

const getAllowedOrigins = () => {
  const configured = parseList(process.env.CLIENT_URL);
  return Array.from(new Set(["http://localhost:5173", ...configured]));
};

module.exports = {
  validateEnv,
  getAllowedOrigins,
};
