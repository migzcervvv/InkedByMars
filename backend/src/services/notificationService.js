"use strict";

const axios = require("axios");
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const envEnabled = (name, fallback) => {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === "true";
};

const getClientContact = (bookingData) => {
  return [bookingData.email, bookingData.phone].filter(Boolean).join(" / ");
};

const getBookingReference = (booking) => {
  const id = booking._id?.toString?.() || String(booking._id || "");
  return `IBM-${id.slice(-8).toUpperCase()}`;
};

const getAdminReviewUrl = (booking) => {
  const base =
    process.env.ADMIN_URL ||
    `${process.env.CLIENT_URL || "http://localhost:5173"}/admin/bookings`;
  return `${base}${base.includes("?") ? "&" : "?"}booking=${booking._id}`;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderReferenceImages = (booking) => {
  const images = booking.referenceImages || [];
  if (!images.length) return "<p>No reference images attached.</p>";

  return images
    .filter((image) => image.url)
    .map(
      (image) =>
        `<p><a href="${escapeHtml(image.url)}">Reference image</a></p>`,
    )
    .join("");
};

const buildExpiredBookingMessage = (bookingData) =>
  [
    "[InkedByMars] Booking request expired",
    `Name: ${bookingData.clientName || "Unknown"}`,
    `Preferred Date: ${bookingData.preferredDate || bookingData.date || "Unspecified"}`,
    `Contact: ${getClientContact(bookingData) || "Unspecified"}`,
    "Status: Expired",
  ].join("\n");

const buildAdminBookingHoldNotification = (booking) => {
  const reference = getBookingReference(booking);
  const reviewUrl = getAdminReviewUrl(booking);
  const subject = `New booking hold ${reference}`;
  const text = [
    `New booking hold ${reference}`,
    `Client: ${booking.clientName}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Selected start: ${booking.preferredDate} ${booking.preferredTime}`,
    `Tattoo: ${booking.tattooIdea}`,
    `Placement: ${booking.tattooPlacement}`,
    `Size: ${booking.tattooSize}`,
    `Notes: ${booking.notes || "None"}`,
    `Review: ${reviewUrl}`,
  ].join("\n");

  const html = `
    <h2>New booking hold ${escapeHtml(reference)}</h2>
    <p><strong>Client:</strong> ${escapeHtml(booking.clientName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(booking.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(booking.phone)}</p>
    <p><strong>Selected start:</strong> ${escapeHtml(booking.preferredDate)} ${escapeHtml(booking.preferredTime)}</p>
    <p><strong>Tattoo:</strong> ${escapeHtml(booking.tattooIdea)}</p>
    <p><strong>Placement:</strong> ${escapeHtml(booking.tattooPlacement)}</p>
    <p><strong>Size:</strong> ${escapeHtml(booking.tattooSize)}</p>
    <p><strong>Notes:</strong><br>${escapeHtml(booking.notes || "None")}</p>
    <div>${renderReferenceImages(booking)}</div>
    <p><a href="${escapeHtml(reviewUrl)}">Review booking</a></p>
  `;

  return { subject, text, html };
};

const createTransporter = () => {
  if (!process.env.ADMIN_GMAIL_USER || !process.env.ADMIN_GMAIL_APP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ADMIN_GMAIL_USER,
      pass: process.env.ADMIN_GMAIL_APP_PASSWORD,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return;
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("notification.email_transport_missing", { to, subject });
    return;
  }

  await transporter.sendMail({
    from: process.env.ADMIN_GMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};

const sendSms = async ({ to, text }) => {
  const SMS_API_KEY = process.env.SMS_API_KEY;
  if (!to || !SMS_API_KEY) return;

  await axios.post("https://smsapiph.onrender.com/api/v1/send/sms", null, {
    params: {
      apikey: SMS_API_KEY,
      recipient: to,
      message: text,
    },
  });
};

const notificationService = {
  channels: {
    email: { enabled: true, to: process.env.ADMIN_EMAIL },
    sms: { enabled: false, to: process.env.ADMIN_PHONE },
  },

  async notifyAdminNewBooking(bookingData) {
    const adminEmail = buildAdminBookingHoldNotification(bookingData);
    await this.notifyAdmin({
      subject: adminEmail.subject,
      message: adminEmail.text,
      html: adminEmail.html,
    });
  },

  async notifyAdminBookingExpired(bookingData) {
    const message = buildExpiredBookingMessage(bookingData);
    await this.notifyAdmin({
      subject: "[InkedByMars] Booking request expired",
      message,
    });
  },

  async notifyAdmin({ subject, message, html }) {
    const emailEnabled = envEnabled(
      "NOTIFICATION_EMAIL_ENABLED",
      this.channels.email.enabled,
    );
    const smsEnabled = envEnabled(
      "NOTIFICATION_SMS_ENABLED",
      this.channels.sms.enabled,
    );

    const jobs = [];

    if (emailEnabled) {
      jobs.push(
        sendEmail({
          to: process.env.ADMIN_EMAIL || this.channels.email.to,
          subject,
          text: message,
          html,
        }),
      );
    }

    if (smsEnabled) {
      jobs.push(
        sendSms({
          to: process.env.ADMIN_PHONE || this.channels.sms.to,
          text: message,
        }),
      );
    }

    const results = await Promise.allSettled(jobs);
    results.forEach((result) => {
      if (result.status === "rejected") {
        logger.error("notification.delivery_failed", {
          subject,
          message: result.reason?.message,
        });
      }
    });
  },

  async sendBookingPending(booking) {
    await sendEmail({
      to: booking.email,
      subject: "Booking Received",
      text: `Hi ${booking.clientName}, we received your booking hold for ${booking.preferredDate} at ${booking.preferredTime}. This time is temporarily reserved until admin review.`,
      html: `<p>Hi ${escapeHtml(booking.clientName)},</p><p>Your selected time on <strong>${escapeHtml(booking.preferredDate)}</strong> at <strong>${escapeHtml(booking.preferredTime)}</strong> is temporarily reserved until admin review.</p>`,
    });
  },

  async sendBookingConfirmation(booking, options = {}) {
    const endText = options.endTime ? ` until ${options.endTime}` : "";
    await sendEmail({
      to: booking.email,
      subject: "Booking Confirmed",
      text: `Hi ${booking.clientName}, your booking on ${booking.preferredDate} at ${booking.preferredTime}${endText} is confirmed.`,
      html: `<p>Hi ${escapeHtml(booking.clientName)},</p><p>Your booking on <strong>${escapeHtml(booking.preferredDate)}</strong> at <strong>${escapeHtml(`${booking.preferredTime}${endText}`)}</strong> is confirmed.</p>`,
    });
  },

  async sendBookingCancellation(booking) {
    await sendEmail({
      to: booking.email,
      subject: "Booking Cancelled",
      text: `Hi ${booking.clientName}, your booking on ${booking.preferredDate} at ${booking.preferredTime} has been cancelled.`,
      html: `<p>Hi ${escapeHtml(booking.clientName)},</p><p>Your booking on <strong>${escapeHtml(booking.preferredDate)}</strong> at <strong>${escapeHtml(booking.preferredTime)}</strong> has been cancelled.</p>`,
    });
  },
};

module.exports = notificationService;
