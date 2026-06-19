"use strict";

const Admin = require("../models/Admin");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendOk,
  sendCreated,
  sendCookieWithToken,
} = require("../utils/response");
const logger = require("../utils/logger");

/**
 * POST /api/auth/login
 * Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { name, password } = req.body;

  const admin = await Admin.findOne({ name }).select("+password");
  if (!admin || !(await admin.comparePassword(password))) {
    logger.warn("auth.login_failed", {
      requestId: req.requestId,
      name,
      ip: req.ip,
    });
    return next(new AppError("Invalid credentials", 401));
  }

  if (!admin.isActive) {
    return next(new AppError("Account is deactivated", 403));
  }

  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  const token = sendCookieWithToken(res, admin);

  logger.info("auth.login_success", {
    requestId: req.requestId,
    adminId: admin._id.toString(),
    name: admin.name,
    role: admin.role,
  });

  sendOk(
    res,
    {
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    },
    "Login successful",
  );
});

/**
 * POST /api/auth/register
 * Protected — super_admin only (or initial seed)
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) {
    return next(new AppError("An admin with this email already exists", 409));
  }

  const admin = await Admin.create({ name, email, password, role });

  const token = sendCookieWithToken(res, admin);

  logger.info("auth.admin_registered", {
    requestId: req.requestId,
    createdAdminId: admin._id.toString(),
    createdBy: req.admin?._id?.toString() || null,
    role: admin.role,
  });

  sendCreated(
    res,
    {
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    },
    "Admin account created",
  );
});

/**
 * POST /api/auth/logout
 * Protected
 */
const logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  logger.info("auth.logout", {
    requestId: req.requestId,
    adminId: req.admin?._id?.toString() || null,
  });

  sendOk(res, {}, "Logged out successfully");
});

/**
 * GET /api/auth/me
 * Protected
 */
const getMe = asyncHandler(async (req, res, next) => {
  sendOk(res, {
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      lastLogin: req.admin.lastLogin,
    },
  });
});

module.exports = { login, register, logout, getMe };
