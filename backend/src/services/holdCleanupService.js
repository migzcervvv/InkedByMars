'use strict';

const Booking = require('../models/Booking');
const { BOOKING_STATUS } = require('../config/constants');
const scheduleService = require('./scheduleService');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

const expireStaleBookingHolds = async () => {
  const now = new Date();
  const bookings = await Booking.find({
    status: BOOKING_STATUS.ON_HOLD,
    holdExpiresAt: { $lt: now },
  });

  for (const booking of bookings) {
    const result = await Booking.updateOne(
      {
        _id: booking._id,
        status: BOOKING_STATUS.ON_HOLD,
        holdExpiresAt: { $lt: now },
      },
      {
        $set: { status: BOOKING_STATUS.CANCELLED },
        $push: {
          statusHistory: {
            status: BOOKING_STATUS.CANCELLED,
            reason: 'Temporary hold expired before admin confirmation',
          },
        },
      }
    );

    if (result.modifiedCount !== 1) continue;

    await scheduleService.releaseBookingSlots({ bookingId: booking._id });

    logger.info('booking.hold_expired', {
      bookingId: booking._id.toString(),
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
    });

    notificationService.notifyAdminBookingExpired(booking).catch(console.error);
  }

  await scheduleService.expireStaleHolds();
  return bookings.length;
};

const startHoldCleanupJob = ({ intervalMs = 60 * 1000 } = {}) => {
  const run = () => {
    expireStaleBookingHolds().catch((error) => {
      logger.error('booking.hold_cleanup_failed', {
        message: error.message,
        stack: error.stack,
      });
    });
  };

  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  run();

  return timer;
};

module.exports = {
  expireStaleBookingHolds,
  startHoldCleanupJob,
};
