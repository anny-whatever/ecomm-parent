// src/middleware/error.middleware.js
const logger = require("../config/logger");
const { responseFormatter } = require("../utils/responseFormatter");

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorMiddleware = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let errorDetails = undefined;

  // Log error
  logger.error(
    `${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  logger.error(err.stack);

  // Handle specific error types
  if (err.name === "ValidationError") {
    // Mongoose validation error
    statusCode = 400;
    message = "Validation Error";
    errorDetails = Object.values(err.errors).map((val) => val.message);
  } else if (err.name === "CastError") {
    // Mongoose bad ObjectId
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    // Mongoose duplicate key error
    statusCode = 400;
    message = "Duplicate field value entered";
    errorDetails = err.keyValue;
  } else if (err.name === "JsonWebTokenError") {
    // JWT error
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  } else if (err.name === "TokenExpiredError") {
    // JWT expired
    statusCode = 401;
    message = "Your token has expired. Please log in again.";
  }

  // Only include error details in development
  if (process.env.NODE_ENV === "development") {
    errorDetails = errorDetails || err.stack;
  }

  // Send response
  res
    .status(statusCode)
    .json(responseFormatter(false, message, null, errorDetails));
};

module.exports = errorMiddleware;
