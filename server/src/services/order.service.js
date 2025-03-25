// src/services/order.service.js
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const inventoryService = require("./inventory.service");
const emailService = require("./email.service");
const paymentService = require("./payment.service");
const logger = require("../config/logger");
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
} = require("../utils/errorTypes");
const { ORDER_STATUS, PAYMENT_STATUS } = require("../utils/constants");

/**
 * Create a new order from cart
 * @param {Object} cart - User's cart
 * @param {Object} orderData - Order data (billing, shipping, payment)
 * @returns {Promise<Object>} Created order object
 */
const createOrderFromCart = async (cart, orderData) => {
  try {
    // Check if cart has items
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestError("Cannot create order with empty cart");
    }

    // Validate product availability and pricing
    await validateCartItems(cart);

    // Create order items from cart items
    const orderItems = cart.items.map((item) => ({
      product: item.product,
      variant: item.variant,
      name: item.name,
      sku: item.sku || `SKU-${item.product}`,
      price: item.price,
      quantity: item.quantity,
      gstPercentage: item.gstPercentage,
      gstAmount: (item.price * item.quantity * item.gstPercentage) / 100,
      subtotal: item.price * item.quantity,
      total:
        item.price * item.quantity +
        (item.price * item.quantity * item.gstPercentage) / 100,
      image: item.image,
    }));

    // Calculate order totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = orderItems.reduce((sum, item) => sum + item.gstAmount, 0);
    const shippingCost = orderData.shipping.cost || cart.shipping?.cost || 0;
    const discount = cart.appliedCoupon ? cart.discountAmount : 0;
    const total = subtotal + tax + shippingCost - discount;

    // Generate unique order number
    const orderNumber = await generateOrderNumber();

    // Create order object
    const order = new Order({
      orderNumber,
      user: cart.user,
      items: orderItems,
      billing: orderData.billing,
      shipping: {
        ...orderData.shipping,
        cost: shippingCost,
      },
      pricing: {
        subtotal,
        shipping: shippingCost,
        tax,
        discount,
        total,
      },
      payment: {
        method: orderData.payment.method,
        status: PAYMENT_STATUS.PENDING,
        razorpayOrderId: orderData.payment.razorpayOrderId,
      },
      status: ORDER_STATUS.PENDING,
      notes: orderData.notes,
      statusHistory: [
        {
          status: ORDER_STATUS.PENDING,
          note: "Order created",
        },
      ],
    });

    // Save order
    await order.save();

    // Update inventory (reserve items)
    await updateInventoryForOrder(order, "reserve");

    // Clear cart after successful order creation
    await cart.clearCart();

    // Send order confirmation email if user has an email
    if (order.billing.email) {
      await sendOrderConfirmationEmail(order);
    }

    return order;
  } catch (error) {
    logger.error("Error creating order from cart:", error);
    throw error;
  }
};

/**
 * Validate cart items before order creation
 * @param {Object} cart - User's cart
 */
const validateCartItems = async (cart) => {
  try {
    for (const item of cart.items) {
      // Get product from database
      const product = await Product.findById(item.product);

      if (!product) {
        throw new BadRequestError(`Product not found for item: ${item.name}`);
      }

      // Check product status
      if (product.status !== "active") {
        throw new BadRequestError(
          `Product ${product.name} is not available for purchase`
        );
      }

      // Check if variant exists if applicable
      let variantObj = null;
      if (item.variant) {
        variantObj = product.variants.id(item.variant);
        if (!variantObj) {
          throw new BadRequestError(
            `Variant not found for product: ${product.name}`
          );
        }
      }

      // Check inventory
      const availableQuantity = variantObj
        ? variantObj.inventory.quantity - variantObj.inventory.reserved
        : product.inventory.quantity - product.inventory.reserved;

      if (availableQuantity < item.quantity) {
        throw new BadRequestError(
          `Not enough inventory for ${product.name}${
            variantObj ? ` (${variantObj.name})` : ""
          }. Available: ${availableQuantity}, Requested: ${item.quantity}`
        );
      }

      // Validate price
      const correctPrice = variantObj
        ? variantObj.price.sale || variantObj.price.regular
        : product.price.sale || product.price.regular;

      // Allow for a small difference to account for rounding errors
      if (Math.abs(item.price - correctPrice) > 0.01) {
        throw new BadRequestError(
          `Price mismatch for ${product.name}. Current price: ${correctPrice}`
        );
      }
    }
  } catch (error) {
    logger.error("Error validating cart items:", error);
    throw error;
  }
};

/**
 * Update inventory quantities for order items
 * @param {Object} order - Order object
 * @param {String} action - "reserve" or "commit" or "release"
 */
const updateInventoryForOrder = async (order, action) => {
  try {
    for (const item of order.items) {
      if (action === "reserve") {
        // Reserve inventory during order creation
        await inventoryService.reserveInventory(
          item.product,
          item.variant,
          item.quantity,
          order._id
        );
      } else if (action === "commit") {
        // Commit (reduce) inventory when order is confirmed
        await inventoryService.commitInventory(
          item.product,
          item.variant,
          item.quantity,
          order._id
        );
      } else if (action === "release") {
        // Release inventory on order cancellation
        await inventoryService.releaseInventory(
          item.product,
          item.variant,
          item.quantity,
          order._id
        );
      }
    }
  } catch (error) {
    logger.error(`Error updating inventory for order ${order._id}:`, error);
    throw error;
  }
};

/**
 * Generate a unique order number
 * @returns {Promise<String>} Unique order number
 */
const generateOrderNumber = async () => {
  // Format: ORDER-YEAR-MONTH-DAYOFMONTH-RANDOMNUMBER
  const now = new Date();
  const year = now.getFullYear().toString().slice(2); // Get last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  const orderNumber = `ORD-${year}${month}${day}-${random}`;

  // Check if this order number already exists
  const existingOrder = await Order.findOne({ orderNumber });
  if (existingOrder) {
    // Recursively try again with a different random number
    return generateOrderNumber();
  }

  return orderNumber;
};

/**
 * Send order confirmation email
 * @param {Object} order - Order object
 */
const sendOrderConfirmationEmail = async (order) => {
  try {
    // Prepare data for email template
    const templateData = {
      orderNumber: order.orderNumber,
      customerName: order.billing.address.name,
      orderDate: order.createdAt,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: order.pricing.subtotal,
      shipping: order.pricing.shipping,
      tax: order.pricing.tax,
      discount: order.pricing.discount,
      total: order.pricing.total,
      shippingAddress: order.shipping.address,
      shippingMethod: order.shipping.method,
      paymentMethod: order.payment.method,
      orderUrl: `${process.env.FRONTEND_URL}/orders/${order._id}`,
    };

    // Send email using template
    await emailService.sendTemplateEmail("order-confirmation", templateData, {
      to: order.billing.email,
      subject: `Order Confirmation #${order.orderNumber}`,
    });

    logger.info(`Order confirmation email sent for order ${order._id}`);
  } catch (error) {
    // Log error but don't fail the order creation
    logger.error(
      `Error sending order confirmation email for order ${order._id}:`,
      error
    );
  }
};

/**
 * Get user's orders with pagination
 * @param {String} userId - User ID
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Orders and pagination info
 */
const getUserOrders = async (userId, options) => {
  try {
    const { page, limit, sort } = options;
    const skip = (page - 1) * limit;

    // Build query
    const query = { user: userId };

    // Apply filters
    if (options.status) {
      query.status = options.status;
    }

    if (options.startDate && options.endDate) {
      query.createdAt = {
        $gte: new Date(options.startDate),
        $lte: new Date(options.endDate),
      };
    } else if (options.startDate) {
      query.createdAt = { $gte: new Date(options.startDate) };
    } else if (options.endDate) {
      query.createdAt = { $lte: new Date(options.endDate) };
    }

    // Execute query with pagination
    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Order.countDocuments(query);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error getting orders for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get order by ID
 * @param {String} orderId - Order ID
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<Object>} Order object
 */
const getOrderById = async (orderId, userId) => {
  try {
    // Find order and populate product information
    const order = await Order.findById(orderId)
      .populate("items.product", "name slug images")
      .lean();

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check if the order belongs to the user (unless admin check is implemented elsewhere)
    if (userId && order.user && order.user.toString() !== userId.toString()) {
      throw new NotFoundError("Order not found");
    }

    return order;
  } catch (error) {
    logger.error(`Error getting order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Cancel an order
 * @param {String} orderId - Order ID
 * @param {String} userId - User ID (for authorization)
 * @param {String} reason - Cancellation reason
 * @returns {Promise<Object>} Updated order
 */
const cancelOrder = async (orderId, userId, reason) => {
  try {
    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check if the order belongs to the user (unless admin check is implemented elsewhere)
    if (userId && order.user && order.user.toString() !== userId.toString()) {
      throw new NotFoundError("Order not found");
    }

    // Check if order can be cancelled
    if (!["pending", "processing"].includes(order.status)) {
      throw new ConflictError(
        "Only pending or processing orders can be cancelled"
      );
    }

    // Update order status
    order.status = ORDER_STATUS.CANCELLED;
    order.cancelReason = reason;

    // Add to status history
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      timestamp: new Date(),
      note: reason,
      user: userId,
    });

    // Release reserved inventory
    await updateInventoryForOrder(order, "release");

    // Process refund if payment was made
    if (order.payment.status === PAYMENT_STATUS.PAID) {
      try {
        const refundResult = await paymentService.processRefund(
          order.payment.razorpayPaymentId,
          order.pricing.total,
          "Order cancelled by customer"
        );

        order.payment.status = PAYMENT_STATUS.REFUNDED;
        order.refundAmount = order.pricing.total;
        order.refundedAt = new Date();
      } catch (refundError) {
        // Log error but continue with cancellation
        logger.error(
          `Refund processing error for order ${orderId}:`,
          refundError
        );

        // Mark that manual refund is needed
        order.statusHistory.push({
          status: order.status,
          timestamp: new Date(),
          note: "Automatic refund failed. Manual refund required.",
          user: userId,
        });
      }
    }

    // Save updated order
    await order.save();

    // Send cancellation email
    try {
      await emailService.sendTemplateEmail(
        "order-cancelled",
        {
          orderNumber: order.orderNumber,
          customerName: order.billing.address.name,
          cancelReason: reason,
        },
        {
          to: order.billing.email,
          subject: `Order #${order.orderNumber} Cancelled`,
        }
      );
    } catch (emailError) {
      // Log error but don't fail the cancellation
      logger.error(
        `Error sending cancellation email for order ${orderId}:`,
        emailError
      );
    }

    return order;
  } catch (error) {
    logger.error(`Error cancelling order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Get orders by status (Admin)
 * @param {String} status - Order status
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Orders and pagination info
 */
const getOrdersByStatus = async (status, options) => {
  try {
    const { page, limit, sort } = options;
    const skip = (page - 1) * limit;

    // Build query
    const query = { status };

    // Execute query with pagination
    const orders = await Order.find(query)
      .populate("user", "email profile.firstName profile.lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Order.countDocuments(query);

    // Get counts for all statuses
    const statusCounts = {};
    for (const orderStatus of Object.values(ORDER_STATUS)) {
      statusCounts[orderStatus] = await Order.countDocuments({
        status: orderStatus,
      });
    }

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      statusCounts,
    };
  } catch (error) {
    logger.error(`Error getting orders with status ${status}:`, error);
    throw error;
  }
};

/**
 * Update order status (Admin)
 * @param {String} orderId - Order ID
 * @param {String} newStatus - New status
 * @param {String} note - Status change note
 * @param {String} userId - Admin user ID
 * @returns {Promise<Object>} Updated order
 */
const updateOrderStatus = async (orderId, newStatus, note, userId) => {
  try {
    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check for valid status transition
    validateStatusTransition(order.status, newStatus);

    // Update order status
    order.status = newStatus;

    // Add to status history
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note: note || `Status updated to ${newStatus}`,
      user: userId,
    });

    // Handle special status transitions
    if (newStatus === ORDER_STATUS.SHIPPED) {
      // Send shipping notification
      try {
        await emailService.sendTemplateEmail(
          "order-shipped",
          {
            orderNumber: order.orderNumber,
            customerName: order.billing.address.name,
            trackingNumber: order.shipping.trackingNumber,
            carrier: order.shipping.carrier,
            estimatedDelivery: order.shipping.estimatedDelivery,
          },
          {
            to: order.billing.email,
            subject: `Order #${order.orderNumber} Shipped`,
          }
        );
      } catch (emailError) {
        // Log error but don't fail the status update
        logger.error(
          `Error sending shipping email for order ${orderId}:`,
          emailError
        );
      }
    } else if (newStatus === ORDER_STATUS.DELIVERED) {
      // Complete inventory management
      await updateInventoryForOrder(order, "commit");
    }

    // Save updated order
    await order.save();

    return order;
  } catch (error) {
    logger.error(`Error updating status for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Validate order status transition
 * @param {String} currentStatus - Current order status
 * @param {String} newStatus - New order status
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  // Define allowed status transitions
  const allowedTransitions = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED]: [
      // Terminal state - no further transitions
    ],
    [ORDER_STATUS.CANCELLED]: [
      // Terminal state - no further transitions
    ],
  };

  // Check if transition is allowed
  if (
    !allowedTransitions[currentStatus] ||
    !allowedTransitions[currentStatus].includes(newStatus)
  ) {
    throw new BadRequestError(
      `Cannot transition order from ${currentStatus} to ${newStatus}`
    );
  }
};

/**
 * Add note to order
 * @param {String} orderId - Order ID
 * @param {Object} noteData - Note data (text, isPublic)
 * @param {String} userId - User ID who created the note
 * @returns {Promise<Object>} Updated order
 */
const addOrderNote = async (orderId, noteData, userId) => {
  try {
    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Add note
    order.notes.push({
      text: noteData.text,
      isPublic: noteData.isPublic,
      createdAt: new Date(),
      createdBy: userId,
    });

    // Save updated order
    await order.save();

    return order;
  } catch (error) {
    logger.error(`Error adding note to order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Update shipping information
 * @param {String} orderId - Order ID
 * @param {Object} shippingData - Shipping data (trackingNumber, carrier, estimatedDelivery)
 * @returns {Promise<Object>} Updated order
 */
const updateShippingInfo = async (orderId, shippingData) => {
  try {
    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Update shipping information
    if (shippingData.trackingNumber !== undefined) {
      order.shipping.trackingNumber = shippingData.trackingNumber;
    }

    if (shippingData.carrier !== undefined) {
      order.shipping.carrier = shippingData.carrier;
    }

    if (shippingData.estimatedDelivery !== undefined) {
      order.shipping.estimatedDelivery = shippingData.estimatedDelivery;
    }

    if (shippingData.method !== undefined) {
      order.shipping.method = shippingData.method;
    }

    if (shippingData.cost !== undefined) {
      order.shipping.cost = shippingData.cost;
      // Recalculate order total
      order.pricing.shipping = shippingData.cost;
      order.pricing.total =
        order.pricing.subtotal +
        order.pricing.tax +
        order.pricing.shipping -
        order.pricing.discount;
    }

    // Save updated order
    await order.save();

    // If tracking info was updated, send notification to customer
    if (
      (shippingData.trackingNumber || shippingData.carrier) &&
      order.billing.email
    ) {
      try {
        await emailService.sendTemplateEmail(
          "tracking-update",
          {
            orderNumber: order.orderNumber,
            customerName: order.billing.address.name,
            trackingNumber: order.shipping.trackingNumber,
            carrier: order.shipping.carrier,
            estimatedDelivery: order.shipping.estimatedDelivery,
          },
          {
            to: order.billing.email,
            subject: `Tracking Update for Order #${order.orderNumber}`,
          }
        );
      } catch (emailError) {
        // Log error but don't fail the update
        logger.error(
          `Error sending tracking update email for order ${orderId}:`,
          emailError
        );
      }
    }

    return order;
  } catch (error) {
    logger.error(`Error updating shipping info for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Process order refund
 * @param {String} orderId - Order ID
 * @param {Number} amount - Refund amount
 * @param {String} reason - Refund reason
 * @returns {Promise<Object>} Updated order
 */
const processRefund = async (orderId, amount, reason) => {
  try {
    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check if payment was made
    if (order.payment.status !== PAYMENT_STATUS.PAID) {
      throw new BadRequestError("Cannot refund unpaid order");
    }

    // Check refund amount
    if (amount <= 0 || amount > order.pricing.total) {
      throw new BadRequestError("Invalid refund amount");
    }

    // Process refund through payment gateway
    try {
      await paymentService.processRefund(
        order.payment.razorpayPaymentId,
        amount,
        reason
      );

      // Update order
      order.payment.status = PAYMENT_STATUS.REFUNDED;
      order.refundAmount = amount;
      order.refundedAt = new Date();

      // Add to status history
      order.statusHistory.push({
        status: order.status,
        timestamp: new Date(),
        note: `Refund processed: ₹${amount} - ${reason}`,
      });

      // If full refund, cancel the order
      if (
        Math.abs(amount - order.pricing.total) < 0.01 &&
        order.status !== ORDER_STATUS.CANCELLED
      ) {
        order.status = ORDER_STATUS.CANCELLED;
        order.cancelReason = reason;

        order.statusHistory.push({
          status: ORDER_STATUS.CANCELLED,
          timestamp: new Date(),
          note: "Order cancelled due to full refund",
        });

        // Release inventory if order was not delivered
        if (order.status !== ORDER_STATUS.DELIVERED) {
          await updateInventoryForOrder(order, "release");
        }
      }

      // Save updated order
      await order.save();

      // Send refund notification email
      if (order.billing.email) {
        try {
          await emailService.sendTemplateEmail(
            "refund-processed",
            {
              orderNumber: order.orderNumber,
              customerName: order.billing.address.name,
              refundAmount: amount,
              refundReason: reason,
            },
            {
              to: order.billing.email,
              subject: `Refund Processed for Order #${order.orderNumber}`,
            }
          );
        } catch (emailError) {
          // Log error but don't fail the refund
          logger.error(
            `Error sending refund email for order ${orderId}:`,
            emailError
          );
        }
      }

      return order;
    } catch (refundError) {
      throw new BadRequestError(
        `Refund processing failed: ${refundError.message}`
      );
    }
  } catch (error) {
    logger.error(`Error processing refund for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Generate invoice for order
 * @param {String} orderId - Order ID
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<String>} Invoice URL
 */
const generateInvoice = async (orderId, userId) => {
  try {
    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check if the order belongs to the user (unless admin check is implemented elsewhere)
    if (userId && order.user && order.user.toString() !== userId.toString()) {
      throw new NotFoundError("Order not found");
    }

    // Check if invoice already exists
    if (order.invoiceUrl) {
      return order.invoiceUrl;
    }

    // In a real implementation, we would generate a PDF invoice here
    // For now, we'll just simulate it with a placeholder URL
    const invoiceUrl = `/invoices/${order.orderNumber}.pdf`;

    // Update order with invoice URL
    order.invoiceUrl = invoiceUrl;
    await order.save();

    return invoiceUrl;
  } catch (error) {
    logger.error(`Error generating invoice for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Get order dashboard stats
 * @param {Object} dateRange - Date range for stats
 * @returns {Promise<Object>} Order statistics
 */
const getOrderStats = async (dateRange = {}) => {
  try {
    // Build date query
    const dateQuery = {};
    if (dateRange.start) {
      dateQuery.$gte = new Date(dateRange.start);
    }
    if (dateRange.end) {
      dateQuery.$lte = new Date(dateRange.end);
    }

    const query = {};
    if (Object.keys(dateQuery).length > 0) {
      query.createdAt = dateQuery;
    }

    // Get total orders
    const totalOrders = await Order.countDocuments(query);

    // Get orders by status
    const ordersByStatus = {};
    for (const status of Object.values(ORDER_STATUS)) {
      ordersByStatus[status] = await Order.countDocuments({
        ...query,
        status,
      });
    }

    // Calculate revenue
    const revenueAggregation = await Order.aggregate([
      { $match: { ...query, status: { $ne: ORDER_STATUS.CANCELLED } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$pricing.total" },
          avgOrderValue: { $avg: "$pricing.total" },
          count: { $sum: 1 },
        },
      },
    ]);

    const revenue =
      revenueAggregation.length > 0
        ? revenueAggregation[0]
        : {
            totalRevenue: 0,
            avgOrderValue: 0,
            count: 0,
          };

    // Get recent orders
    const recentOrders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "email profile.firstName profile.lastName")
      .lean();

    return {
      totalOrders,
      ordersByStatus,
      revenue: {
        total: revenue.totalRevenue,
        average: revenue.avgOrderValue,
      },
      recentOrders,
    };
  } catch (error) {
    logger.error("Error getting order stats:", error);
    throw error;
  }
};

module.exports = {
  createOrderFromCart,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getOrdersByStatus,
  updateOrderStatus,
  addOrderNote,
  updateShippingInfo,
  processRefund,
  generateInvoice,
  getOrderStats,
};
