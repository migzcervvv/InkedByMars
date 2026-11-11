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
const { ADMIN_ROLES } = require('../config/constants');

const account = admin => ({ id: admin._id, name: admin.name, email: admin.email, role: admin.role });

async function requireAvailableIdentity({ name, email }, id) {
  const match = await Admin.exists({
    $or: [{ name }, { email }],
    ...(id && { _id: { $ne: id } }),
  });
  if (match) throw new AppError('That username or email is already in use.', 409, 'ACCOUNT_EXISTS');
}

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

  await requireAvailableIdentity({ name, email });

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

const listUsers = async c => {
  const users = await Admin.find().select('name email role').sort({ name: 1, _id: 1 }).lean();
  return sendOk(c, { users: users.map(account) });
};

const createUser = async c => {
  const { name, email, password } = c.get('input').body;
  await requireAvailableIdentity({ name, email });
  const admin = await Admin.create({ name, email, password, role: ADMIN_ROLES.ADMIN });
  return sendCreated(c, { admin: account(admin) }, 'Admin account created.');
};

const editUser = async c => {
  const { admin: operator, params: { id }, body: { name, email, password, currentPassword } } = c.get('input');
  const self = String(operator._id) === id.toLowerCase();
  if (!self && operator.role !== ADMIN_ROLES.SUPER_ADMIN) throw new AppError('Super administrator required.', 403);
  const admin = await Admin.findById(id).select('+password');
  if (!admin) throw new AppError('Admin account not found.', 404);
  if (self && password && (!currentPassword || !await admin.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect.', 400, 'CURRENT_PASSWORD_INVALID');
  }
  await requireAvailableIdentity({ name, email }, admin._id);
  admin.name = name;
  admin.email = email;
  if (password) admin.password = password;
  await admin.save();
  return sendOk(c, { admin: account(admin), signInAgain: Boolean(self && password) }, 'Admin account updated.');
};

function requireOtherUser(operator, id, message) {
  if (String(operator._id) === id.toLowerCase()) throw new AppError(message, 400);
}

const removeUser = async c => {
  const { admin, params: { id } } = c.get('input');
  requireOtherUser(admin, id, 'You cannot delete your own account.');
  const result = await Admin.deleteOne({ _id: id });
  if (!result.deletedCount) throw new AppError('Admin account not found.', 404);
  return sendOk(c, {}, 'Admin account deleted.');
};

const resetUserPassword = async c => {
  const { admin, params: { id }, body: { password } } = c.get('input');
  requireOtherUser(admin, id, 'Use Edit account to change your own password.');
  const user = await Admin.findById(id).select('+password');
  if (!user) throw new AppError('Admin account not found.', 404);
  user.password = password;
  await user.save();
  return sendOk(c, {}, 'Password reset. Existing sessions were signed out.');
};

module.exports = { login, register, logout, getMe, listUsers, createUser, editUser, removeUser, resetUserPassword };
