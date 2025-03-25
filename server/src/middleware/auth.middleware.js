// src/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");
const User = require("../models/user.model");
const { responseFormatter } = require("../utils/responseFormatter");

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token and attaches the user to the request object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(
          responseFormatter(false, "Authentication required. Please log in.")
        );
    }

    // Extract token from header
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json(
          responseFormatter(false, "Authentication required. Please log in.")
        );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token expiration
    if (decoded.exp * 1000 < Date.now()) {
      return res
        .status(401)
        .json(
          responseFormatter(
            false,
            "Your token has expired. Please log in again."
          )
        );
    }

    // Find user by id from token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json(
          responseFormatter(
            false,
            "The user belonging to this token no longer exists."
          )
        );
    }

    // Check if user is active
    if (user.status !== "active") {
      return res
        .status(401)
        .json(
          responseFormatter(
            false,
            "Your account has been deactivated. Please contact support."
          )
        );
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json(responseFormatter(false, "Invalid token. Please log in again."));
    }

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json(
          responseFormatter(
            false,
            "Your token has expired. Please log in again."
          )
        );
    }

    return res
      .status(401)
      .json(
        responseFormatter(false, "Authentication failed. Please log in again.")
      );
  }
};

/**
 * Optional authentication middleware
 * If a token is provided, it attaches the user to the request object
 * If no token or an invalid token is provided, it still allows the request to proceed
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token, proceed without authentication
      return next();
    }

    // Extract token from header
    const token = authHeader.split(" ")[1];

    if (!token) {
      // No token, proceed without authentication
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id from token
    const user = await User.findById(decoded.id).select("-password");

    if (user && user.status === "active") {
      // Add user to request object
      req.user = user;
    }

    next();
  } catch (error) {
    // Log error but still proceed without authentication
    logger.warn("Optional auth middleware error:", error);
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };
