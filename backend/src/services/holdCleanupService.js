'use strict';

const Booking = require('../models/Booking');
const { BOOKING_STATUS } = require('../config/constants');
const scheduleService = require('./scheduleService');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');
const { expiryReason } = require('./bookingReview');
const { current, transaction } = require('../bindings/runtime');

const expireStaleBookingHolds = async () => {
  const now = new Date();
  const due = {
    status: BOOKING_STATUS.ON_HOLD,
    holdExpiresAt: { $not: { $gt: now } },
  };
  const bookings = await Booking.find(due);

  for (const booking of bookings) {
    const expired = await transaction(async () => {
      const result = await Booking.updateOne({ _id: booking._id, ...due }, {
        $set: { status: BOOKING_STATUS.CANCELLED },
        $push: {
          statusHistory: {
            status: BOOKING_STATUS.CANCELLED,
            reason: expiryReason,
          },
        },
      });
      if (result.modifiedCount !== 1) return false;
      await scheduleService.releaseBookingSlots({ bookingId: booking._id });
      return true;
    });
    if (!expired) continue;

    logger.info('booking.hold_expired', {
      bookingId: booking._id.toString(),
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
    });

    current().waitUntil(notificationService.notifyAdminBookingExpired(booking));
  }

  await scheduleService.expireStaleHolds();
  return bookings.length;
};

module.exports = { expireStaleBookingHolds };
