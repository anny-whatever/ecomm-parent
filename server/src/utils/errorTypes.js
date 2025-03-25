// src/utils/errorTypes.js

/**
 * Custom API error class
 * Extends the built-in Error class with additional properties
 */
class ApiError extends Error {
  /**
   * Create an API error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {*} details - Additional error details (optional)
   */
  constructor(message, statusCode, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 */
class BadRequestError extends ApiError {
  constructor(message = "Bad Request", details = undefined) {
    super(message, 400, details);
  }
}

/**
 * Unauthorized Error (401)
 */
class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", details = undefined) {
    super(message, 401, details);
  }
}

/**
 * Forbidden Error (403)
 */
class ForbiddenError extends ApiError {
  constructor(message = "Forbidden", details = undefined) {
    super(message, 403, details);
  }
}

/**
 * Not Found Error (404)
 */
class NotFoundError extends ApiError {
  constructor(message = "Resource not found", details = undefined) {
    super(message, 404, details);
  }
}

/**
 * Conflict Error (409)
 */
class ConflictError extends ApiError {
  constructor(message = "Resource conflict", details = undefined) {
    super(message, 409, details);
  }
}

/**
 * Validation Error (422)
 */
class ValidationError extends ApiError {
  constructor(message = "Validation failed", details = undefined) {
    super(message, 422, details);
  }
}

/**
 * Internal Server Error (500)
 */
class InternalServerError extends ApiError {
  constructor(message = "Internal server error", details = undefined) {
    super(message, 500, details);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
};
