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

const buildExpiredBookingMessage = (bookingData) =>
  [
    "[InkedByMars] Booking request expired",
    `Name: ${bookingData.clientName || "Unknown"}`,
    `Preferred Date: ${bookingData.preferredDate || bookingData.date || "Unspecified"}`,
    `Contact: ${getClientContact(bookingData) || "Unspecified"}`,
    "Status: Expired",
  ].join("\n");

const extractBase64Parts = (dataUri) => {
  const str = Buffer.isBuffer(dataUri)
    ? dataUri.toString("base64")
    : String(dataUri ?? "");

  if (Buffer.isBuffer(dataUri)) {
    return { mimeType: "image/webp", data: str };
  }

  const match = str.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
};

const buildReferenceImageAttachments = (booking) => {
  if (!booking.referenceImages?.length) return [];
  return booking.referenceImages
    .map((image, i) => {
      const parts = extractBase64Parts(image);
      if (!parts) return null;
      const ext = parts.mimeType.split("/")[1] || "jpg";
      return {
        filename: `ref-${i}.${ext}`,
        content: Buffer.from(parts.data, "base64"),
        contentType: parts.mimeType,
        cid: `refimage_${i}`,
      };
    })
    .filter(Boolean);
};

const buildReferenceImageHtml = (booking) => {
  if (!booking.referenceImages?.length) return "";
  return booking.referenceImages
    .map(
      (_, i) =>
        `<img src="cid:refimage_${i}" style="max-width:300px;display:block;margin:8px 0;" alt="Reference ${i + 1}">`,
    )
    .join("");
};

const buildAdminBookingHoldNotification = (booking) => {
  const reference = getBookingReference(booking);
  const reviewUrl = getAdminReviewUrl(booking);
  const subject = `New booking hold ${reference}`;

  const text = [
    `New booking hold ${reference}`,
    `Client: ${booking.clientName}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Selected start: ${new Date(booking.preferredDate).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "2-digit",
        year: "numeric",
      },
    )} ${booking.preferredTime}`,
    `IG Handle: ${booking.instagramHandle}`,
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
    <p><strong>Selected start:</strong> ${escapeHtml(
      new Date(booking.preferredDate).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    )} ${escapeHtml(booking.preferredTime)}</p>
    <p><strong>IG Handle:</strong> ${escapeHtml(booking.instagramHandle)}</p>
    <p><strong>Placement:</strong> ${escapeHtml(booking.tattooPlacement)}</p>
    <p><strong>Size:</strong> ${escapeHtml(booking.tattooSize)}</p>
    <p><strong>Notes:</strong><br>${escapeHtml(booking.notes || "None")}</p>
    <div>${buildReferenceImageHtml(booking)}</div>
    <p><a href="${escapeHtml(reviewUrl)}">Review booking</a></p>
  `;

  const attachments = buildReferenceImageAttachments(booking);

  return { subject, text, html, attachments };
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

const sendEmail = async ({ to, subject, text, html, attachments }) => {
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
    attachments,
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
      text: `Hi ${booking.clientName}, we received your booking hold for ${new Date(
        booking.preferredDate,
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })} at ${booking.preferredTime}. This time is temporarily reserved until admin review.`,
      html: `
        <p>Hi <strong>${escapeHtml(booking.clientName)}</strong>,</p>

        <p>
          Your booking request has been received for
          <strong>${escapeHtml(
            new Date(booking.preferredDate).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
          )}</strong>
          at
          <strong>${escapeHtml(booking.preferredTime)}</strong>.
        </p>

        <p>
          To confirm your appointment, please send your payment deposit to
          <strong>@inkedbymars</strong> on instagram and include a screenshot of this email
          as proof of your booking.
        </p>

        <p>
          Your appointment will be held for <strong>24 hours only</strong>.
          If payment is not received within that period, the reservation will
          be automatically cancelled and the slot may be made available to
          other clients.
        </p>

        <p>
          Thank you, and we look forward to our session with you!
        </p>
      `,
    });
  },

  async sendBookingConfirmation(booking, options = {}) {
    const endText = options.endTime ? ` until ${options.endTime}` : "";
    await sendEmail({
      to: booking.email,
      subject: "Booking Confirmed",
      text: `Hi ${booking.clientName},

            Great news! Your appointment has been confirmed.

            Booking Details:
            - Date: ${new Date(booking.preferredDate).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "2-digit",
                year: "numeric",
              },
            )}
            - Time: ${booking.preferredTime}${endText}

            Please arrive on time and come prepared for your session. If you have any questions or need to discuss your appointment, feel free to contact us.

            Thank you for choosing Inked by Mars. We look forward to seeing you!`,
      html: `
        <p>Hi <strong>${escapeHtml(booking.clientName)}</strong>,</p>

        <p>
          Great news! Your appointment has been <strong>confirmed</strong>.
        </p>

        <p><strong>Booking Details</strong></p>

        <ul>
          <li><strong>Date:</strong> ${escapeHtml(
            new Date(booking.preferredDate).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
          )}</li>
          <li><strong>Time:</strong> ${escapeHtml(`${booking.preferredTime}${endText}`)}</li>
        </ul>

        <p>
          Please don't be late on your scheduled appointment. If you're more than 15 mins late,
           your appointment will be cancelled or rescheduled on a later time of the day or another date. 
           Deposit will not be refunded and you will be charged with an additional Php 200.00
        </p>

        <p>
          Thank you for choosing <strong>InkedbyMars</strong>. We look forward
          to seeing you!
        </p>
      `,
    });
  },

  async sendBookingCancellation(booking) {
    await sendEmail({
      to: booking.email,
      subject: "Booking Cancelled",
      text: `Hi ${booking.clientName},

          We're writing to let you know that your appointment has been cancelled.

          Cancelled Booking:
          - Date: ${new Date(booking.preferredDate).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "2-digit",
              year: "numeric",
            },
          )}
          - Time: ${booking.preferredTime}

          If you would still like to book a session, you're welcome to submit a new booking request at any time.

          Thank you for your understanding.`,
      html: `
        <p>Hi <strong>${escapeHtml(booking.clientName)}</strong>,</p>

        <p>
          We're writing to let you know that your appointment has been
          <strong>cancelled</strong>.
        </p>

        <p><strong>Cancelled Booking</strong></p>

        <ul>
          <li><strong>Date:</strong> ${escapeHtml(
            new Date(booking.preferredDate).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
          )}</li>
          <li><strong>Time:</strong> ${escapeHtml(booking.preferredTime)}</li>
        </ul>

        <p>
          If you would still like to schedule a session, you are welcome to
          submit a new booking request at any time.
        </p>

        <p>
          Thank you for your understanding.
        </p>
      `,
    });
  },
};

module.exports = notificationService;
