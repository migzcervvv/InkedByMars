"use strict";

const { body } = require("express-validator");

const loginValidators = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const registerValidators = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("email")
    .isEmail()
    .withMessage("Provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  body("role")
    .optional()
    .isIn(["admin", "super_admin"])
    .withMessage("Role must be admin or super_admin"),
];

module.exports = { loginValidators, registerValidators };
