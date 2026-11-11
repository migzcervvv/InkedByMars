'use strict';

const mongoose = require('mongoose');
const { SLOT_STATUS, DAY_STATUS } = require('../config/constants');

const timeSlotSchema = new mongoose.Schema(
  {
    time: {
      type: String, // HH:MM 24h
      required: true,
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'],
    },
    status: {
      type: String,
      enum: Object.values(SLOT_STATUS),
      default: SLOT_STATUS.AVAILABLE,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    holdExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const scheduleSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD — no timezone ambiguity
      required: [true, 'Date is required'],
      unique: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    dayStatus: {
      type: String,
      enum: Object.values(DAY_STATUS),
      default: DAY_STATUS.OPEN,
    },
    closureReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Closure reason cannot exceed 500 characters'],
    },
    timeSlots: [timeSlotSchema],
    endTime: String,
  },
  {
    timestamps: true,
  }
);

// date field already carries a unique index via `unique: true` in schema definition

module.exports = require('../bindings/model').boundModel('Schedule', scheduleSchema);
