// src/api/orders/order.routes.js
const express = require("express");
const orderController = require("./order.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const orderValidator = require("../../utils/validators/order.validator");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/v1/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post(
  "/",
  validationMiddleware(orderValidator.create),
  orderController.createOrder
);

/**
 * @route   GET /api/v1/orders
 * @desc    Get user's orders with pagination
 * @access  Private
 */
router.get(
  "/",
  validationMiddleware(orderValidator.list),
  orderController.getUserOrders
);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get(
  "/:id",
  validationMiddleware(orderValidator.getById),
  orderController.getOrderById
);

/**
 * @route   PUT /api/v1/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.put(
  "/:id/cancel",
  validationMiddleware(orderValidator.cancel),
  orderController.cancelOrder
);

/**
 * @route   GET /api/v1/orders/:id/invoice
 * @desc    Get order invoice
 * @access  Private
 */
router.get(
  "/:id/invoice",
  validationMiddleware(orderValidator.getById),
  orderController.getOrderInvoice
);

// Admin routes
/**
 * @route   GET /api/v1/orders/status/:status
 * @desc    Get orders by status (Admin)
 * @access  Private (Admin)
 */
router.get(
  "/status/:status",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(orderValidator.getByStatus),
  orderController.getOrdersByStatus
);

/**
 * @route   PUT /api/v1/orders/:id/status
 * @desc    Update order status (Admin)
 * @access  Private (Admin)
 */
router.put(
  "/:id/status",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(orderValidator.updateStatus),
  orderController.updateOrderStatus
);

/**
 * @route   POST /api/v1/orders/:id/notes
 * @desc    Add note to order
 * @access  Private (Admin)
 */
router.post(
  "/:id/notes",
  rbacMiddleware(["admin", "manager", "staff"]),
  validationMiddleware(orderValidator.addNote),
  orderController.addOrderNote
);

/**
 * @route   PUT /api/v1/orders/:id/shipping
 * @desc    Update shipping information
 * @access  Private (Admin)
 */
router.put(
  "/:id/shipping",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(orderValidator.updateShipping),
  orderController.updateShippingInfo
);

/**
 * @route   POST /api/v1/orders/:id/refund
 * @desc    Process order refund
 * @access  Private (Admin)
 */
router.post(
  "/:id/refund",
  rbacMiddleware(["admin"]),
  validationMiddleware(orderValidator.processRefund),
  orderController.processRefund
);

/**
 * @route   GET /api/v1/orders/stats
 * @desc    Get order dashboard stats (Admin)
 * @access  Private (Admin)
 */
router.get(
  "/stats",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(orderValidator.getStats),
  orderController.getOrderStats
);

module.exports = router;
