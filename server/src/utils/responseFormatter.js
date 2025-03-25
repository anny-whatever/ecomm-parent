// src/utils/responseFormatter.js

/**
 * Standard response formatter for consistent API responses
 *
 * @param {boolean} success - Whether the request was successful
 * @param {string} message - A message describing the response
 * @param {*} data - The response data (optional)
 * @param {*} error - Error details (optional, only included if success is false)
 * @returns {Object} Formatted response object
 */
const responseFormatter = (
  success,
  message,
  data = null,
  error = undefined
) => {
  const response = {
    success,
    message,
  };

  // Include data only if provided
  if (data !== null) {
    response.data = data;
  }

  // Include error details only if provided and success is false
  if (!success && error !== undefined) {
    response.error = error;
  }

  return response;
};

module.exports = { responseFormatter };
