const express = require("express");
const router = express.Router();
const abandonedCartController = require("./abandoned-cart.controller");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const abandonedCartValidator = require("../../utils/validators/cart.validator");

/**
 * Admin Routes for abandoned cart management
 */

/**
 * @route   POST /api/v1/admin/abandoned-cart/process
 * @desc    Process abandoned carts and send recovery emails
 * @access  Private (Admin, Manager)
 */
router.post(
  "/process",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(abandonedCartValidator.processAbandonedCarts),
  abandonedCartController.processAbandonedCarts
);

/**
 * @route   GET /api/v1/admin/abandoned-cart/analytics
 * @desc    Get abandoned cart recovery analytics
 * @access  Private (Admin, Manager)
 */
router.get(
  "/analytics",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(abandonedCartValidator.getCartRecoveryAnalytics),
  abandonedCartController.getCartRecoveryAnalytics
);

/**
 * Public route for cart recovery from email links
 * This route should be registered separately in the main API router
 * as it's a public route and not under the admin namespace
 */

module.exports = router;
