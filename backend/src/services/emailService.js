'use strict';

/**
 * Email notification service.
 *
 * Currently a structured stub. Wire in Nodemailer, SendGrid, or SES
 * by implementing the send() method with your preferred transport.
 *
 * All controllers call these named functions — no changes to callers
 * required when swapping providers.
 */

const sendEmail = async ({ to, subject, text, html }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[EmailService] To: ${to} | Subject: ${subject}`);
    return;
  }
  // TODO: implement transport
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ from: process.env.FROM_EMAIL, to, subject, text, html });
};

const sendBookingConfirmation = async (booking) => {
  await sendEmail({
    to: booking.email,
    subject: 'Booking Confirmed',
    text: `Hi ${booking.clientName}, your booking on ${booking.preferredDate} at ${booking.preferredTime} is confirmed.`,
    html: `<p>Hi ${booking.clientName},</p><p>Your booking on <strong>${booking.preferredDate}</strong> at <strong>${booking.preferredTime}</strong> is confirmed.</p>`,
  });
};

const sendBookingCancellation = async (booking) => {
  await sendEmail({
    to: booking.email,
    subject: 'Booking Cancelled',
    text: `Hi ${booking.clientName}, your booking on ${booking.preferredDate} at ${booking.preferredTime} has been cancelled.`,
    html: `<p>Hi ${booking.clientName},</p><p>Your booking has been cancelled.</p>`,
  });
};

const sendBookingPending = async (booking) => {
  await sendEmail({
    to: booking.email,
    subject: 'Booking Received',
    text: `Hi ${booking.clientName}, we received your booking request for ${booking.preferredDate} at ${booking.preferredTime}. We will review and confirm shortly.`,
    html: `<p>Hi ${booking.clientName},</p><p>Your booking request is pending review.</p>`,
  });
};

module.exports = {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendBookingPending,
};
