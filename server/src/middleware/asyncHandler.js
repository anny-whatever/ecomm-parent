/**
 * Async Handler Middleware
 * Wraps async route handlers to automatically catch errors and pass them to Express error handling
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
