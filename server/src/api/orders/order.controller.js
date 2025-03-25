// src/api/orders/order.controller.js
const orderService = require("../../services/order.service");
const cartService = require("../../services/cart.service");
const { responseFormatter } = require("../../utils/responseFormatter");
const logger = require("../../config/logger");

/**
 * Create a new order
 * @route POST /api/v1/orders
 * @access Private
 */
const createOrder = async (req, res, next) => {
  try {
    // Get the cart for the user
    const cart = await cartService.getOrCreateCart({
      userId: req.user._id,
    });

    // Ensure cart has items
    if (!cart.items || cart.items.length === 0) {
      return res
        .status(400)
        .json(responseFormatter(false, "Cannot create order with empty cart"));
    }

    // Create order from cart
    const order = await orderService.createOrderFromCart(cart, req.body);

    return res
      .status(201)
      .json(responseFormatter(true, "Order created successfully", { order }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's orders with pagination
 * @route GET /api/v1/orders
 * @access Private
 */
const getUserOrders = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sort: req.query.sort || "-createdAt",
    };

    const result = await orderService.getUserOrders(req.user._id, options);

    return res
      .status(200)
      .json(responseFormatter(true, "Orders retrieved successfully", result));
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 * @route GET /api/v1/orders/:id
 * @access Private
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user._id);

    return res
      .status(200)
      .json(responseFormatter(true, "Order retrieved successfully", { order }));
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an order
 * @route PUT /api/v1/orders/:id/cancel
 * @access Private
 */
const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(
      req.params.id,
      req.user._id,
      req.body.reason
    );

    return res
      .status(200)
      .json(responseFormatter(true, "Order cancelled successfully", { order }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders by status (Admin)
 * @route GET /api/v1/orders/status/:status
 * @access Private (Admin)
 */
const getOrdersByStatus = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sort: req.query.sort || "-createdAt",
    };

    const result = await orderService.getOrdersByStatus(
      req.params.status,
      options
    );

    return res
      .status(200)
      .json(responseFormatter(true, "Orders retrieved successfully", result));
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status (Admin)
 * @route PUT /api/v1/orders/:id/status
 * @access Private (Admin)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.body.note,
      req.user._id
    );

    return res
      .status(200)
      .json(
        responseFormatter(true, "Order status updated successfully", { order })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Add note to order
 * @route POST /api/v1/orders/:id/notes
 * @access Private (Admin)
 */
const addOrderNote = async (req, res, next) => {
  try {
    const order = await orderService.addOrderNote(
      req.params.id,
      {
        text: req.body.text,
        isPublic: req.body.isPublic || false,
      },
      req.user._id
    );

    return res
      .status(200)
      .json(
        responseFormatter(true, "Note added to order successfully", { order })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipping information
 * @route PUT /api/v1/orders/:id/shipping
 * @access Private (Admin)
 */
const updateShippingInfo = async (req, res, next) => {
  try {
    const order = await orderService.updateShippingInfo(
      req.params.id,
      req.body
    );

    return res
      .status(200)
      .json(responseFormatter(true, "Shipping information updated", { order }));
  } catch (error) {
    next(error);
  }
};

/**
 * Process order refund
 * @route POST /api/v1/orders/:id/refund
 * @access Private (Admin)
 */
const processRefund = async (req, res, next) => {
  try {
    const order = await orderService.processRefund(
      req.params.id,
      req.body.amount,
      req.body.reason
    );

    return res
      .status(200)
      .json(
        responseFormatter(true, "Refund processed successfully", { order })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Get order invoice
 * @route GET /api/v1/orders/:id/invoice
 * @access Private
 */
const getOrderInvoice = async (req, res, next) => {
  try {
    const invoiceUrl = await orderService.generateInvoice(
      req.params.id,
      req.user._id
    );

    return res.status(200).json(
      responseFormatter(true, "Invoice generated successfully", {
        invoiceUrl,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get order dashboard stats (Admin)
 * @route GET /api/v1/orders/stats
 * @access Private (Admin)
 */
const getOrderStats = async (req, res, next) => {
  try {
    const dateRange = {
      start: req.query.start ? new Date(req.query.start) : undefined,
      end: req.query.end ? new Date(req.query.end) : undefined,
    };

    const stats = await orderService.getOrderStats(dateRange);

    return res
      .status(200)
      .json(responseFormatter(true, "Order stats retrieved", { stats }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getOrdersByStatus,
  updateOrderStatus,
  addOrderNote,
  updateShippingInfo,
  processRefund,
  getOrderInvoice,
  getOrderStats,
};
