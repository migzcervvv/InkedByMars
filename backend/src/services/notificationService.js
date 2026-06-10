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

const buildNewBookingMessage = (bookingData) =>
  [
    "[InkedByMars] New booking request",
    `Name: ${bookingData.clientName || "Unknown"}`,
    `Service: ${bookingData.service || bookingData.tattooIdea || "Tattoo appointment"}`,
    `Preferred Date: ${bookingData.preferredDate || bookingData.date || "Unspecified"}`,
    `Contact: ${getClientContact(bookingData) || "Unspecified"}`,
    "Status: Pending - expires in 48 hours",
  ].join("\n");

const buildExpiredBookingMessage = (bookingData) =>
  [
    "[InkedByMars] Booking request expired",
    `Name: ${bookingData.clientName || "Unknown"}`,
    `Preferred Date: ${bookingData.preferredDate || bookingData.date || "Unspecified"}`,
    `Contact: ${getClientContact(bookingData) || "Unspecified"}`,
    "Status: Expired",
  ].join("\n");

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

const sendEmail = async ({ to, subject, text }) => {
  if (!to) return;
  const transporter = createTransporter();
  if (!transporter) return;

  await transporter.sendMail({
    from: process.env.ADMIN_GMAIL_USER,
    to,
    subject,
    text,
  });
};

const sendSms = async ({ to, text }) => {
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
    const message = buildNewBookingMessage(bookingData);
    await this.notifyAdmin({
      subject: "[InkedByMars] New booking request",
      message,
    });
  },

  async notifyAdminBookingExpired(bookingData) {
    const message = buildExpiredBookingMessage(bookingData);
    await this.notifyAdmin({
      subject: "[InkedByMars] Booking request expired",
      message,
    });
  },

  async notifyAdmin({ subject, message }) {
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
};

module.exports = notificationService;
