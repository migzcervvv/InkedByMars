"use strict";

module.exports = {
  BOOKING_STATUS: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    ON_HOLD: "on-hold",
  },

  SLOT_STATUS: {
    AVAILABLE: "available",
    BOOKED: "booked",
    ON_HOLD: "on-hold",
    CLOSED: "closed",
  },

  DAY_STATUS: {
    OPEN: "open",
    FULLY_CLOSED: "fully_closed",
    PARTIALLY_CLOSED: "partially_closed",
    HOLIDAY: "holiday",
  },

  ADMIN_ROLES: {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
  },

  // Default daily time slots (24h format strings)
  DEFAULT_TIME_SLOTS: [
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
  ],

  HOLD_EXPIRY_MINUTES: 48 * 60,
};
