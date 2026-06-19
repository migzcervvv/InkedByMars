"use strict";

const mongoose = require("mongoose");
const { BOOKING_STATUS } = require("../config/constants");

const bookingSchema = new mongoose.Schema(
  {
    // Client Information
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    // Tattoo Details
    instagramHandle: {
      type: String,
      required: [true, "Instagram handle is required"],
      lowercase: true,
      trim: true,
      maxlength: [100, "Instagram handle cannot exceed 100 characters"],
    },
    tattooPlacement: {
      type: String,
      required: [true, "Tattoo placement is required"],
      trim: true,
    },
    tattooSize: {
      type: String,
      enum: ["tiny", "small", "medium", "large", "extra_large", "custom"],
      default: "medium",
    },
    referenceImages: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],

    // Scheduling
    preferredDate: {
      type: String, // Stored as YYYY-MM-DD string for reliable timezone-free comparisons
      required: [true, "Preferred date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    preferredTime: {
      type: String, // Stored as HH:MM 24h format
      required: [true, "Preferred time is required"],
      match: [/^\d{2}:\d{2}$/, "Time must be in HH:MM format"],
    },

    // Booking State
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Admin notes cannot exceed 1000 characters"],
    },

    // Payment
    depositPaid: {
      type: Boolean,
      default: false,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    depositPaidAt: {
      type: Date,
    },

    // Stripe readiness
    stripePaymentIntentId: {
      type: String,
      select: false,
    },

    // Metadata
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        reason: { type: String },
      },
    ],

    // Hold expiry support
    holdExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index: prevent double booking at same date+time
bookingSchema.index(
  { preferredDate: 1, preferredTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed", "on-hold"] },
    },
  },
);

bookingSchema.index({ email: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ preferredDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
