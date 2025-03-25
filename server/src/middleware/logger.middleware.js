// src/middleware/logger.middleware.js
const logger = require("../config/logger");

/**
 * HTTP request logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const loggerMiddleware = (req, res, next) => {
  // Log initial request
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);

  // Calculate response time
  const start = new Date();

  // Log response when finished
  res.on("finish", () => {
    const duration = new Date() - start;
    const { statusCode } = res;

    // Log different levels based on status code
    if (statusCode >= 500) {
      logger.error(
        `${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`
      );
    } else if (statusCode >= 400) {
      logger.warn(
        `${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`
      );
    } else {
      logger.info(
        `${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`
      );
    }
  });

  next();
};

module.exports = loggerMiddleware;
