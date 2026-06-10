'use strict';

const mongoose = require('mongoose');

const availabilitySettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default',
      unique: true,
      immutable: true,
    },
    blockedDates: {
      type: [
        {
          type: String,
          match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AvailabilitySettings', availabilitySettingsSchema);
