// src/services/auth.service.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.model");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../utils/errorTypes");
const logger = require("../config/logger");
const emailService = require("./email.service");

/**
 * Generate JWT token based on user role
 * @param {Object} user - User document from database
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  // Set expiration based on role
  const expiresIn =
    user.role === "customer"
      ? process.env.JWT_CUSTOMER_EXPIRY
      : process.env.JWT_ADMIN_EXPIRY;

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Hash user password
 * @param {String} password - Plain text password
 * @returns {String} Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 * @param {String} password - Plain text password to check
 * @param {String} hash - Stored password hash
 * @returns {Boolean} True if password matches
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate verification token
 * @returns {String} Random verification token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Send verification email
 * @param {Object} user - User object with email and verification token
 * @returns {Promise} Email sending result
 */
const sendVerificationEmail = async (user) => {
  const verificationUrl = `${process.env.BASE_URL}/api/${process.env.API_VERSION}/auth/verify-email/${user.emailVerificationToken}`;

  const emailContent = {
    to: user.email,
    subject: "Please verify your email address",
    html: `
      <h2>Welcome to our E-commerce Platform!</h2>
      <p>Hi ${user.profile.firstName || "there"},</p>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
      </p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
      <p>Thanks,<br>The E-commerce Team</p>
    `,
  };

  return await emailService.sendEmail(emailContent);
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} Created user and JWT token
 */
const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new BadRequestError("Email already registered");
    }

    // Create verification token
    const emailVerificationToken = generateVerificationToken();
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24); // 24 hour expiry

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const user = new User({
      email: userData.email,
      password: hashedPassword,
      profile: userData.profile,
      emailVerificationToken,
      emailVerificationExpires: tokenExpires,
      emailVerified: false,
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(user);

    // Generate JWT token
    const token = generateToken(user);

    // Clean user data for response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.emailVerificationToken;
    delete userResponse.emailVerificationExpires;

    return { user: userResponse, token };
  } catch (error) {
    logger.error("User registration error:", error);
    throw error;
  }
};

/**
 * Login user
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} User data and JWT token
 */
const loginUser = async (email, password) => {
  try {
    // Find user and include password for verification
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedError("Please verify your email before logging in");
    }

    // Check if user is active
    if (user.status !== "active") {
      throw new UnauthorizedError(
        "Your account has been deactivated. Please contact support."
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Clean user data for response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.emailVerificationToken;
    delete userResponse.emailVerificationExpires;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpires;

    return { user: userResponse, token };
  } catch (error) {
    logger.error("User login error:", error);
    throw error;
  }
};

/**
 * Verify user email
 * @param {String} token - Email verification token
 * @returns {Object} Updated user data
 */
const verifyEmail = async (token) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestError("Invalid or expired verification token");
    }

    // Update user verification status
    user.emailVerified = true;
    user.status = "active";
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return user;
  } catch (error) {
    logger.error("Email verification error:", error);
    throw error;
  }
};

/**
 * Request password reset
 * @param {String} email - User email
 * @returns {Boolean} Success status
 */
const forgotPassword = async (email) => {
  try {
    const user = await User.findOne({ email });

    // Don't reveal if email exists or not for security
    if (!user) {
      return true;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    // Update user with reset token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await emailService.sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>Hi ${user.profile.firstName || "there"},</p>
        <p>You requested a password reset for your account.</p>
        <p>Please click the button below to set a new password:</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p>Thanks,<br>The E-commerce Team</p>
      `,
    });

    return true;
  } catch (error) {
    logger.error("Forgot password error:", error);
    throw error;
  }
};

/**
 * Reset user password
 * @param {String} token - Reset token
 * @param {String} password - New password
 * @returns {Boolean} Success status
 */
const resetPassword = async (token, password) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestError("Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Send confirmation email
    await emailService.sendEmail({
      to: user.email,
      subject: "Your password has been changed",
      html: `
        <h2>Password Changed</h2>
        <p>Hi ${user.profile.firstName || "there"},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <p>Thanks,<br>The E-commerce Team</p>
      `,
    });

    return true;
  } catch (error) {
    logger.error("Reset password error:", error);
    throw error;
  }
};

/**
 * Change user password
 * @param {String} userId - User ID
 * @param {String} currentPassword - Current password
 * @param {String} newPassword - New password
 * @returns {Boolean} Success status
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Find user with password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestError("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Send notification email
    await emailService.sendEmail({
      to: user.email,
      subject: "Your password has been changed",
      html: `
        <h2>Password Changed</h2>
        <p>Hi ${user.profile.firstName || "there"},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <p>Thanks,<br>The E-commerce Team</p>
      `,
    });

    return true;
  } catch (error) {
    logger.error("Change password error:", error);
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
};
