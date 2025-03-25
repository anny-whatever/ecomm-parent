// src/middleware/rbac.middleware.js
const { responseFormatter } = require("../utils/responseFormatter");

/**
 * Role-Based Access Control (RBAC) middleware
 * Checks if user has the required role(s) to access a resource
 *
 * @param {string|string[]} roles - Required role(s) to access the route
 * @returns {Function} Express middleware
 */
const rbacMiddleware = (roles) => {
  // Convert to array if string
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    // Check if user exists (should be attached by auth middleware)
    if (!req.user) {
      return res
        .status(401)
        .json(
          responseFormatter(false, "Authentication required. Please log in.")
        );
    }

    // Check if user has one of the required roles
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // If we're here, user doesn't have required role
    return res
      .status(403)
      .json(
        responseFormatter(
          false,
          "You do not have permission to perform this action."
        )
      );
  };
};

module.exports = rbacMiddleware;
