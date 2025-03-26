// src/api/auth/auth.controller.js
const authService = require("../../services/auth.service");
const logger = require("../../config/logger");
const { responseFormatter } = require("../../utils/responseFormatter");
const { SOCIAL_AUTH_PROVIDERS } = require("../../utils/constants");
const passport = require("../../config/passport");

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @param {object} req.body.profile - User profile information
 * @returns {object} User object and token
 */
const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.registerUser(req.body);

    return res
      .status(201)
      .json(
        responseFormatter(
          true,
          "Registration successful. Please verify your email.",
          { user, token }
        )
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/v1/auth/login
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @returns {object} User object and token
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser(email, password);

    return res
      .status(200)
      .json(responseFormatter(true, "Login successful", { user, token }));
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email
 * @route GET /api/v1/auth/verify-email/:token
 * @param {string} req.params.token - Email verification token
 * @returns {object} Success message
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    await authService.verifyEmail(token);

    // For API response
    if (req.query.api === "true") {
      return res
        .status(200)
        .json(
          responseFormatter(
            true,
            "Email verified successfully. You can now log in."
          )
        );
    }

    // For browser response (redirect to frontend)
    return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @route POST /api/v1/auth/forgot-password
 * @param {string} req.body.email - User email
 * @returns {object} Success message
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);

    // Always return success to prevent email enumeration
    return res
      .status(200)
      .json(
        responseFormatter(
          true,
          "If your email is registered, you will receive a password reset link"
        )
      );
  } catch (error) {
    logger.error("Forgot password error", error);

    // Still return a success message to prevent email enumeration
    return res
      .status(200)
      .json(
        responseFormatter(
          true,
          "If your email is registered, you will receive a password reset link"
        )
      );
  }
};

/**
 * Reset password
 * @route POST /api/v1/auth/reset-password
 * @param {string} req.body.token - Password reset token
 * @param {string} req.body.password - New password
 * @returns {object} Success message
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);

    return res
      .status(200)
      .json(
        responseFormatter(
          true,
          "Password reset successful. You can now log in with your new password."
        )
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @route POST /api/v1/auth/change-password
 * @param {string} req.body.currentPassword - Current password
 * @param {string} req.body.newPassword - New password
 * @returns {object} Success message
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);

    return res
      .status(200)
      .json(responseFormatter(true, "Password changed successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 * @returns {object} Success message
 */
const logout = async (req, res) => {
  // JWT tokens are stateless, so we can't really "invalidate" them server-side
  // without implementing a token blacklist

  return res
    .status(200)
    .json(responseFormatter(true, "Logged out successfully"));
};

/**
 * Get current user profile
 * @route GET /api/v1/auth/me
 * @returns {object} User profile
 */
const getCurrentUser = async (req, res) => {
  return res.status(200).json(
    responseFormatter(true, "User profile retrieved successfully", {
      user: req.user,
    })
  );
};

/**
 * Initiate Google OAuth login
 * @route GET /api/v1/auth/google
 */
const googleLogin = (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
};

/**
 * Handle Google OAuth callback
 * @route GET /api/v1/auth/google/callback
 */
const googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      logger.error("Google authentication error:", err);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(
          err.message || "Authentication failed"
        )}`
      );
    }

    // Generate JWT token
    const token = authService.generateToken(user);

    // Redirect to frontend with token
    return res.redirect(
      `${process.env.FRONTEND_URL}/social-auth-success?token=${token}`
    );
  })(req, res, next);
};

/**
 * Initiate Facebook OAuth login
 * @route GET /api/v1/auth/facebook
 */
const facebookLogin = (req, res, next) => {
  passport.authenticate("facebook", {
    scope: ["email", "public_profile"],
    session: false,
  })(req, res, next);
};

/**
 * Handle Facebook OAuth callback
 * @route GET /api/v1/auth/facebook/callback
 */
const facebookCallback = (req, res, next) => {
  passport.authenticate("facebook", { session: false }, (err, user, info) => {
    if (err) {
      logger.error("Facebook authentication error:", err);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(
          err.message || "Authentication failed"
        )}`
      );
    }

    // Generate JWT token
    const token = authService.generateToken(user);

    // Redirect to frontend with token
    return res.redirect(
      `${process.env.FRONTEND_URL}/social-auth-success?token=${token}`
    );
  })(req, res, next);
};

/**
 * Link social account to existing user
 * @route POST /api/v1/auth/link/:provider
 */
const linkSocialAccount = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { profile, token } = req.body;

    // Validate provider
    if (!Object.values(SOCIAL_AUTH_PROVIDERS).includes(provider)) {
      return res
        .status(400)
        .json(responseFormatter(false, `Invalid provider: ${provider}`));
    }

    const updatedUser = await authService.linkSocialAccount(
      req.user.id,
      provider,
      profile,
      token
    );

    return res
      .status(200)
      .json(
        responseFormatter(
          true,
          `Successfully linked ${provider} account`,
          updatedUser
        )
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Unlink social account from user
 * @route DELETE /api/v1/auth/unlink/:provider
 */
const unlinkSocialAccount = async (req, res, next) => {
  try {
    const { provider } = req.params;

    // Validate provider
    if (!Object.values(SOCIAL_AUTH_PROVIDERS).includes(provider)) {
      return res
        .status(400)
        .json(responseFormatter(false, `Invalid provider: ${provider}`));
    }

    const updatedUser = await authService.unlinkSocialAccount(
      req.user.id,
      provider
    );

    return res
      .status(200)
      .json(
        responseFormatter(
          true,
          `Successfully unlinked ${provider} account`,
          updatedUser
        )
      );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  getCurrentUser,
  googleLogin,
  googleCallback,
  facebookLogin,
  facebookCallback,
  linkSocialAccount,
  unlinkSocialAccount,
};
