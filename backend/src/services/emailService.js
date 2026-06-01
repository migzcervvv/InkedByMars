'use strict';

const logger = require('../utils/logger');

const emailQueue = [];
let processing = false;

const getBookingReference = (booking) => {
  const id = booking._id?.toString?.() || String(booking._id || '');
  return `IBM-${id.slice(-8).toUpperCase()}`;
};

const getAdminReviewUrl = (booking) => {
  const base = process.env.ADMIN_URL || `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/bookings`;
  return `${base}${base.includes('?') ? '&' : '?'}booking=${booking._id}`;
};

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderReferenceImages = (booking) => {
  const images = booking.referenceImages || [];
  if (!images.length) return '<p>No reference images attached.</p>';

  return images
    .filter((image) => image.url)
    .map((image) => `<p><a href="${escapeHtml(image.url)}">Reference image</a></p>`)
    .join('');
};

const deliverEmail = async ({ to, subject }) => {
  if (process.env.NODE_ENV === 'development' || process.env.EMAIL_TRANSPORT !== 'enabled') {
    logger.info('email.queued_stub', { to, subject });
    return;
  }

  logger.warn('email.transport_missing', { to, subject });
  // Wire a real transport here, for example Nodemailer, SendGrid, or SES.
  // await transporter.sendMail({ from: process.env.FROM_EMAIL, to, subject, text, html });
};

const processQueue = async () => {
  if (processing) return;
  processing = true;

  while (emailQueue.length) {
    const job = emailQueue[0];
    try {
      await deliverEmail(job.payload);
      emailQueue.shift();
    } catch (error) {
      job.attempts += 1;
      logger.error('email.delivery_failed', {
        to: job.payload.to,
        subject: job.payload.subject,
        attempts: job.attempts,
        message: error.message,
      });

      if (job.attempts >= 2) {
        emailQueue.shift();
      } else {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * 2 ** (job.attempts - 1)),
        );
      }
    }
  }

  processing = false;
};

const sendEmail = async (payload) => {
  emailQueue.push({ payload, attempts: 0 });
  await processQueue();
};

const sendBookingConfirmation = async (booking, options = {}) => {
  const endText = options.endTime ? ` until ${options.endTime}` : '';
  await sendEmail({
    to: booking.email,
    subject: 'Booking Confirmed',
    text: `Hi ${booking.clientName}, your booking on ${booking.preferredDate} at ${booking.preferredTime}${endText} is confirmed.`,
    html: `<p>Hi ${escapeHtml(booking.clientName)},</p><p>Your booking on <strong>${escapeHtml(booking.preferredDate)}</strong> at <strong>${escapeHtml(`${booking.preferredTime}${endText}`)}</strong> is confirmed.</p>`,
  });
};

const sendBookingCancellation = async (booking) => {
  await sendEmail({
    to: booking.email,
    subject: 'Booking Cancelled',
    text: `Hi ${booking.clientName}, your booking on ${booking.preferredDate} at ${booking.preferredTime} has been cancelled.`,
    html: `<p>Hi ${escapeHtml(booking.clientName)},</p><p>Your booking has been cancelled.</p>`,
  });
};

const sendBookingPending = async (booking) => {
  await sendEmail({
    to: booking.email,
    subject: 'Booking Received',
    text: `Hi ${booking.clientName}, we received your booking hold for ${booking.preferredDate} at ${booking.preferredTime}. This time is temporarily reserved until admin review.`,
    html: `<p>Hi ${escapeHtml(booking.clientName)},</p><p>Your selected time is temporarily reserved until admin review.</p>`,
  });
};

const sendAdminBookingHoldNotification = async (booking) => {
  const to = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
  if (!to) {
    logger.warn('email.admin_missing', { bookingId: booking._id?.toString?.() });
    return;
  }

  const reference = getBookingReference(booking);
  const reviewUrl = getAdminReviewUrl(booking);
  const text = [
    `New booking hold ${reference}`,
    `Client: ${booking.clientName}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Selected start: ${booking.preferredDate} ${booking.preferredTime}`,
    `Tattoo: ${booking.tattooIdea}`,
    `Placement: ${booking.tattooPlacement}`,
    `Size: ${booking.tattooSize}`,
    `Notes: ${booking.notes || 'None'}`,
    `Review: ${reviewUrl}`,
  ].join('\n');

  const html = `
    <h2>New booking hold ${reference}</h2>
    <p><strong>Client:</strong> ${escapeHtml(booking.clientName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(booking.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(booking.phone)}</p>
    <p><strong>Selected start:</strong> ${escapeHtml(booking.preferredDate)} ${escapeHtml(booking.preferredTime)}</p>
    <p><strong>Tattoo:</strong> ${escapeHtml(booking.tattooIdea)}</p>
    <p><strong>Placement:</strong> ${escapeHtml(booking.tattooPlacement)}</p>
    <p><strong>Size:</strong> ${escapeHtml(booking.tattooSize)}</p>
    <p><strong>Notes:</strong><br>${escapeHtml(booking.notes || 'None')}</p>
    <div>${renderReferenceImages(booking)}</div>
    <p><a href="${escapeHtml(reviewUrl)}">Review booking</a></p>
  `;

  await sendEmail({
    to,
    subject: `New booking hold ${reference}`,
    text,
    html,
  });
};

module.exports = {
  getBookingReference,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendBookingPending,
  sendAdminBookingHoldNotification,
};
