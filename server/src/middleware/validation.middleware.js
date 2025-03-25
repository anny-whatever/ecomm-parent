// src/middleware/validation.middleware.js
const { responseFormatter } = require("../utils/responseFormatter");

/**
 * Middleware for request data validation using Joi schemas
 *
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validationMiddleware = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    // Determine which part of the request to validate
    const dataToValidate = {};

    if (schema.body) {
      dataToValidate.body = req.body;
    }

    if (schema.params) {
      dataToValidate.params = req.params;
    }

    if (schema.query) {
      dataToValidate.query = req.query;
    }

    const { error } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      allowUnknown: true, // Allow unknown keys that will be ignored
      stripUnknown: true, // Remove unknown keys from the validated data
    });

    if (error) {
      // Format validation errors
      const errorDetails = error.details.map((detail) => ({
        message: detail.message,
        path: detail.path,
      }));

      return res
        .status(400)
        .json(responseFormatter(false, "Validation error", null, errorDetails));
    }

    next();
  };
};

module.exports = validationMiddleware;
