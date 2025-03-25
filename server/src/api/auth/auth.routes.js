// src/api/auth/auth.routes.js
const express = require("express");
const authController = require("./auth.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const authValidator = require("../../utils/validators/auth.validator");

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  validationMiddleware(authValidator.register),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  "/login",
  validationMiddleware(authValidator.login),
  authController.login
);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify user email
 * @access  Public
 */
router.get("/verify-email/:token", authController.verifyEmail);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  "/forgot-password",
  validationMiddleware(authValidator.forgotPassword),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post(
  "/reset-password",
  validationMiddleware(authValidator.resetPassword),
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  "/change-password",
  authMiddleware,
  validationMiddleware(authValidator.changePassword),
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", authMiddleware, authController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", authMiddleware, authController.getCurrentUser);

module.exports = router;
