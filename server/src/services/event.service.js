const { v4: uuidv4 } = require("uuid");
const logger = require("../config/logger");
const Event = require("../models/event.model");
const {
  InternalServerError,
  NotFoundError,
  BadRequestError,
} = require("../utils/errorTypes");

/**
 * Create a new event
 * @param {Object} eventData - Data for the event
 * @returns {Promise<Object>} Created event
 */
const createEvent = async (eventData) => {
  try {
    // Create event in database
    const event = await Event.createEvent(eventData);

    // Mark event as processed immediately since we're not using SSE
    await Event.markAsProcessed(event._id);

    return event;
  } catch (error) {
    logger.error("Error creating event:", error);
    throw new InternalServerError("Failed to create event");
  }
};

/**
 * Get events for a specific user
 * @param {String} userId - User ID to get events for
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of events
 */
const getEventsForUser = async (userId, options = {}) => {
  try {
    return await Event.getEventsForUser(userId, options);
  } catch (error) {
    logger.error(`Error getting events for user ${userId}:`, error);
    throw new InternalServerError("Failed to retrieve events");
  }
};

/**
 * Get events by type
 * @param {String} type - Event type to get
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of events
 */
const getEventsByType = async (type, options = {}) => {
  try {
    const { limit = 20, skip = 0 } = options;

    return await Event.find({ type })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  } catch (error) {
    logger.error(`Error getting events of type ${type}:`, error);
    throw new InternalServerError("Failed to retrieve events");
  }
};

/**
 * Create an order status update event
 * @param {String} orderId - ID of the order
 * @param {String} status - New status of the order
 * @param {Object} orderData - Additional order data
 * @returns {Promise<Object>} Created event
 */
const createOrderStatusEvent = async (orderId, status, orderData) => {
  try {
    if (!orderId) {
      throw new BadRequestError("Order ID is required");
    }

    const eventData = {
      type: "order.updated",
      target: orderId,
      targetModel: "Order",
      data: {
        orderId,
        status,
        ...orderData,
      },
      recipients: [orderData.userId],
      roles: ["admin", "manager"], // Admins and managers also get these events
    };

    return await createEvent(eventData);
  } catch (error) {
    logger.error(
      `Error creating order status event for order ${orderId}:`,
      error
    );
    throw new InternalServerError("Failed to create order status event");
  }
};

/**
 * Create a cart update event
 * @param {String} cartId - ID of the cart
 * @param {String} userId - ID of the user
 * @param {Object} cartData - Cart data
 * @returns {Promise<Object>} Created event
 */
const createCartUpdateEvent = async (cartId, userId, cartData) => {
  try {
    if (!cartId) {
      throw new BadRequestError("Cart ID is required");
    }

    const eventData = {
      type: "cart.updated",
      target: cartId,
      targetModel: "Cart",
      data: {
        cartId,
        ...cartData,
      },
      recipients: userId ? [userId] : [],
    };

    return await createEvent(eventData);
  } catch (error) {
    logger.error(`Error creating cart update event for cart ${cartId}:`, error);
    throw new InternalServerError("Failed to create cart update event");
  }
};

/**
 * Create an inventory alert event
 * @param {String} productId - ID of the product
 * @param {Number} quantity - Current quantity
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created event
 */
const createInventoryAlertEvent = async (productId, quantity, productData) => {
  try {
    if (!productId) {
      throw new BadRequestError("Product ID is required");
    }

    const eventData = {
      type: "inventory.alert",
      target: productId,
      targetModel: "Product",
      data: {
        productId,
        quantity,
        ...productData,
      },
      // Send to admin and manager roles
      roles: ["admin", "manager"],
      isPublic: false,
    };

    return await createEvent(eventData);
  } catch (error) {
    logger.error(
      `Error creating inventory alert event for product ${productId}:`,
      error
    );
    throw new InternalServerError("Failed to create inventory alert event");
  }
};

/**
 * Create a payment event
 * @param {String} paymentId - ID of the payment
 * @param {String} status - Payment status
 * @param {Object} paymentData - Additional payment data
 * @returns {Promise<Object>} Created event
 */
const createPaymentEvent = async (paymentId, status, paymentData) => {
  try {
    if (!paymentId) {
      throw new BadRequestError("Payment ID is required");
    }

    const eventData = {
      type: "payment.updated",
      target: paymentId,
      targetModel: "Payment",
      data: {
        paymentId,
        status,
        ...paymentData,
      },
      recipients: paymentData.userId ? [paymentData.userId] : [],
      roles: ["admin", "manager"],
    };

    return await createEvent(eventData);
  } catch (error) {
    logger.error(
      `Error creating payment event for payment ${paymentId}:`,
      error
    );
    throw new InternalServerError("Failed to create payment event");
  }
};

/**
 * Create a user notification
 * @param {String} userId - ID of the user to notify
 * @param {String} message - Notification message
 * @param {Object} data - Additional data for the notification
 * @returns {Promise<Object>} Created event
 */
const createUserNotification = async (userId, message, data = {}) => {
  try {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const eventData = {
      type: "notification.user",
      data: {
        message,
        ...data,
      },
      recipients: [userId],
      isPublic: false,
    };

    return await createEvent(eventData);
  } catch (error) {
    logger.error(`Error creating user notification for user ${userId}:`, error);
    throw new InternalServerError("Failed to create user notification");
  }
};

/**
 * Create a system notification for admin/staff
 * @param {String} message - Notification message
 * @param {Object} data - Additional data for the notification
 * @param {Array} roles - Roles to notify, defaults to admin
 * @returns {Promise<Object>} Created event
 */
const createSystemNotification = async (
  message,
  data = {},
  roles = ["admin"]
) => {
  try {
    const eventData = {
      type: "notification.system",
      data: {
        message,
        ...data,
      },
      roles,
      isPublic: false,
    };

    return await createEvent(eventData);
  } catch (error) {
    logger.error("Error creating system notification:", error);
    throw new InternalServerError("Failed to create system notification");
  }
};

module.exports = {
  createEvent,
  getEventsForUser,
  getEventsByType,
  createOrderStatusEvent,
  createCartUpdateEvent,
  createInventoryAlertEvent,
  createPaymentEvent,
  createUserNotification,
  createSystemNotification,
};
