'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ADMIN_ROLES } = require('../config/constants');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ADMIN_ROLES),
      default: ADMIN_ROLES.ADMIN,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }
});

// Compare entered password with stored hash
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Generate signed JWT
adminSchema.methods.getSignedJwt = function () {
  return jwt.sign(
    { id: this._id, role: this.role, passwordVersion: this.passwordChangedAt?.getTime() || 0 },
    require('../bindings/runtime').env().JWT_SECRET,
    { expiresIn: require('../bindings/runtime').env().JWT_EXPIRE }
  );
};

// Check if password changed after JWT was issued
adminSchema.methods.changedPasswordAfter = function (jwtIssuedAt, passwordVersion) {
  if (passwordVersion !== undefined) return passwordVersion !== (this.passwordChangedAt?.getTime() || 0);
  if (this.passwordChangedAt) {
    return jwtIssuedAt <= Math.floor(this.passwordChangedAt.getTime() / 1000);
  }
  return false;
};

module.exports = require('../bindings/model').boundModel('Admin', adminSchema);
