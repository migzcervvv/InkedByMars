'use strict';

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ADMIN_ROLES } = require('../config/constants');

/**
 * Protect routes — verify JWT from Authorization header or cookie.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('Not authenticated. Please log in.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  const admin = await Admin.findById(decoded.id).select('+passwordChangedAt');
  if (!admin) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (!admin.isActive) {
    return next(new AppError('This account has been deactivated.', 403));
  }

  if (admin.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was recently changed. Please log in again.', 401));
  }

  req.admin = admin;
  next();
});

/**
 * Restrict access to specific roles.
 * Usage: restrictTo(ADMIN_ROLES.SUPER_ADMIN)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

/**
 * Convenience: require any valid admin (admin or super_admin).
 */
const requireAdmin = [
  protect,
  restrictTo(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
];

/**
 * Convenience: require super_admin only.
 */
const requireSuperAdmin = [
  protect,
  restrictTo(ADMIN_ROLES.SUPER_ADMIN),
];

module.exports = { protect, restrictTo, requireAdmin, requireSuperAdmin };
