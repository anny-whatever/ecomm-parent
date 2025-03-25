// src/api/inventory/inventory.routes.js
const express = require("express");
const inventoryController = require("./inventory.controller");
const { authMiddleware } = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const inventoryValidator = require("../../utils/validators/inventory.validator");

const router = express.Router();

// All routes require authentication and admin/manager role
router.use(authMiddleware);
router.use(rbacMiddleware(["admin", "manager"]));

/**
 * @route   PUT /api/v1/inventory/products/:productId
 * @desc    Adjust product inventory
 * @access  Private (Admin)
 */
router.put(
  "/products/:productId",
  validationMiddleware(inventoryValidator.adjustInventory),
  inventoryController.adjustProductInventory
);

/**
 * @route   PUT /api/v1/inventory/products/:productId/variants/:variantId
 * @desc    Adjust variant inventory
 * @access  Private (Admin)
 */
router.put(
  "/products/:productId/variants/:variantId",
  validationMiddleware(inventoryValidator.adjustVariantInventory),
  inventoryController.adjustVariantInventory
);

/**
 * @route   GET /api/v1/inventory/products/:productId/history
 * @desc    Get inventory history for a product
 * @access  Private (Admin)
 */
router.get(
  "/products/:productId/history",
  validationMiddleware(inventoryValidator.getHistory),
  inventoryController.getProductInventoryHistory
);

/**
 * @route   GET /api/v1/inventory/low-stock
 * @desc    Get low stock products
 * @access  Private (Admin)
 */
router.get(
  "/low-stock",
  validationMiddleware(inventoryValidator.getLowStock),
  inventoryController.getLowStockProducts
);

/**
 * @route   GET /api/v1/inventory/products/:productId/summary
 * @desc    Get product inventory summary
 * @access  Private (Admin)
 */
router.get(
  "/products/:productId/summary",
  validationMiddleware(inventoryValidator.getProductById),
  inventoryController.getProductInventorySummary
);

module.exports = router;
