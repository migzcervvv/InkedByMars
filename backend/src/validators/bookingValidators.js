"use strict";

const { body, param } = require("express-validator");
const { BOOKING_STATUS } = require("../config/constants");
const { validDate } = require('../services/bookingPolicy');

const createBookingValidators = [
  body('submissionKey').optional().isUUID(4).withMessage('Invalid submission key'),
  body("clientName")
    .trim()
    .notEmpty()
    .withMessage("Client name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("email")
    .isEmail()
    .withMessage("Provide a valid email address")
    .normalizeEmail(),

  body("phone").trim().notEmpty().withMessage("Phone number is required"),

  body("instagramHandle")
    .trim()
    .notEmpty()
    .withMessage("Instagram handle is required")
    .isLength({ max: 100 })
    .withMessage("Instagram handle cannot exceed 100 characters"),

  body("tattooPlacement")
    .trim()
    .notEmpty()
    .withMessage("Tattoo placement is required"),

  body("tattooSize")
    .optional()
    .isIn(["tiny", "small", "medium", "large", "extra_large", "custom"])
    .withMessage("Invalid tattoo size"),

  body("preferredDate")
    .notEmpty()
    .withMessage("Preferred date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format")
    .custom(validDate).withMessage('Invalid date'),

  body("preferredTime")
    .notEmpty()
    .withMessage("Preferred time is required")
    .matches(/^\d{2}:\d{2}$/)
    .withMessage("Time must be in HH:MM 24h format"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),

  body("referenceImages")
    .optional()
    .isArray({ max: 4 })
    .withMessage("Reference images must be an array with at most 4 items"),

  body("referenceImages.*").custom(value => require('../services/mediaService').isMediaKey(value)).withMessage('References must be uploaded media keys, not inline data or external URLs'),
];

const updateBookingStatusValidators = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
  body('expectedUpdatedAt').isISO8601().withMessage('Reload the booking before saving.'),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(Object.values(BOOKING_STATUS))
    .withMessage(
      `Status must be one of: ${Object.values(BOOKING_STATUS).join(", ")}`,
    ),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),

  body("adminNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Admin notes cannot exceed 1000 characters"),
];

const confirmBookingValidators = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
  body('expectedUpdatedAt').isISO8601().withMessage('Reload the booking before saving.'),

  body("date")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format")
    .custom(validDate).withMessage('Invalid date'),

  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .matches(/^\d{2}:\d{2}$/)
    .withMessage("Start time must be in HH:MM 24h format"),

  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .matches(/^\d{2}:\d{2}$/)
    .withMessage("End time must be in HH:MM 24h format")
    .custom((value, { req }) => {
      if (value <= req.body.startTime) {
        throw new Error("End time must be after start time");
      }
      return true;
    }),

  body("adminNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Admin notes cannot exceed 1000 characters"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

const mongoIdParam = [param("id").isMongoId().withMessage("Invalid ID format")];

module.exports = {
  createBookingValidators,
  updateBookingStatusValidators,
  confirmBookingValidators,
  mongoIdParam,
};
