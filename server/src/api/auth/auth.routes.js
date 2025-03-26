// src/api/auth/auth.routes.js
const express = require("express");
const authController = require("./auth.controller");
const { authMiddleware } = require("../../middleware/auth.middleware");
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
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  "/reset-password",
  validationMiddleware(authValidator.resetPassword),
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password when logged in
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
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post("/logout", authMiddleware, authController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get("/me", authMiddleware, authController.getCurrentUser);

/**
 * Social Authentication Routes
 */

/**
 * @route   GET /api/v1/auth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public
 */
router.get("/google", authController.googleLogin);

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get("/google/callback", authController.googleCallback);

/**
 * @route   GET /api/v1/auth/facebook
 * @desc    Initiate Facebook OAuth authentication
 * @access  Public
 */
router.get("/facebook", authController.facebookLogin);

/**
 * @route   GET /api/v1/auth/facebook/callback
 * @desc    Handle Facebook OAuth callback
 * @access  Public
 */
router.get("/facebook/callback", authController.facebookCallback);

/**
 * @route   POST /api/v1/auth/link/:provider
 * @desc    Link a social account to existing user
 * @access  Private
 */
router.post("/link/:provider", authMiddleware, authController.linkSocialAccount);

/**
 * @route   DELETE /api/v1/auth/unlink/:provider
 * @desc    Unlink a social account from user
 * @access  Private
 */
router.delete("/unlink/:provider", authMiddleware, authController.unlinkSocialAccount);

module.exports = router;
