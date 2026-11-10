"use strict";

const Admin = require("../models/Admin");
const AppError = require("../utils/AppError");
const { fail } = require('../utils/honoResponse');
const {
  sendOk,
  sendCreated,
  sendCookieWithToken,
} = require("../utils/honoResponse");
const logger = require("../utils/logger");

/**
 * POST /api/auth/login
 * Public
 */
const login = async (c) => {
  const req = c.get('input');
  const { name, password } = req.body;

  const admin = await Admin.findOne({ name }).select("+password");
  if (!admin || !(await admin.comparePassword(password))) {
    logger.warn("auth.login_failed", {
      requestId: req.requestId,
      name,
      ip: req.ip,
    });
    return fail(new AppError("Invalid credentials", 401));
  }

  if (!admin.isActive) {
    return fail(new AppError("Account is deactivated", 403));
  }

  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  const token = sendCookieWithToken(c, admin);

  logger.info("auth.login_success", {
    requestId: req.requestId,
    adminId: admin._id.toString(),
    name: admin.name,
    role: admin.role,
  });

  return sendOk(c,
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
};

/**
 * POST /api/auth/register
 * Protected — super_admin only (or initial seed)
 */
const register = async (c) => {
  const req = c.get('input');
  const { name, email, password, role } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) {
    return fail(new AppError("An admin with this email already exists", 409));
  }

  const admin = await Admin.create({ name, email, password, role });

  const token = sendCookieWithToken(c, admin);

  logger.info("auth.admin_registered", {
    requestId: req.requestId,
    createdAdminId: admin._id.toString(),
    createdBy: req.admin?._id?.toString() || null,
    role: admin.role,
  });

  return sendCreated(c,
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
};

/**
 * POST /api/auth/logout
 * Protected
 */
const logout = async (c) => {
  const req = c.get('input');
  require('hono/cookie').deleteCookie(c, 'token', { path: '/' });

  logger.info("auth.logout", {
    requestId: req.requestId,
    adminId: req.admin?._id?.toString() || null,
  });

  return sendOk(c, {}, "Logged out successfully");
};

/**
 * GET /api/auth/me
 * Protected
 */
const getMe = async (c) => {
  const req = c.get('input');
  return sendOk(c, {
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      lastLogin: req.admin.lastLogin,
    },
  });
};

module.exports = { login, register, logout, getMe };
