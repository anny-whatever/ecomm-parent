const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const Event = require('../models/event.model');
const sseManager = require('../utils/sseManager');
const { InternalServerError, NotFoundError, BadRequestError } = require('../utils/errorTypes');

/**
 * Create a new event and broadcast it to relevant clients
 * @param {Object} eventData - Data for the event
 * @returns {Promise<Object>} Created event
 */
const createEvent = async (eventData) => {
  try {
    // Create event in database
    const event = await Event.createEvent(eventData);
    
    // Broadcast event to relevant clients
    if (event.isPublic) {
      // Broadcast to all clients
      sseManager.broadcastEvent(event.type, {
        id: event._id,
        type: event.type,
        data: event.data,
        timestamp: event.createdAt
      });
    } else if (event.recipients && event.recipients.length > 0) {
      // Send to specific users
      sseManager.sendEventToUsers(event.recipients, event.type, {
        id: event._id,
        type: event.type,
        data: event.data,
        timestamp: event.createdAt
      });
    } else if (event.roles && event.roles.length > 0) {
      // Send to users with specific roles
      sseManager.sendEventToRoles(event.roles, event.type, {
        id: event._id,
        type: event.type,
        data: event.data,
        timestamp: event.createdAt
      });
    }
    
    // Mark event as processed
    await Event.markAsProcessed(event._id);
    
    return event;
  } catch (error) {
    logger.error('Error creating event:', error);
    throw new InternalServerError('Failed to create event');
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
    throw new InternalServerError('Failed to retrieve events');
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
    throw new InternalServerError('Failed to retrieve events');
  }
};

/**
 * Initialize SSE connection for a client
 * @param {Object} res - Express response object
 * @param {Object} options - Connection options
 * @returns {String} Client ID
 */
const initSSEConnection = (res, options = {}) => {
  try {
    const clientId = uuidv4();
    sseManager.initConnection(clientId, res, options);
    return clientId;
  } catch (error) {
    logger.error('Error initializing SSE connection:', error);
    throw new InternalServerError('Failed to initialize SSE connection');
  }
};

/**
 * Close SSE connection for a client
 * @param {String} clientId - ID of client to close connection for
 */
const closeSSEConnection = (clientId) => {
  try {
    sseManager.closeConnection(clientId);
  } catch (error) {
    logger.error(`Error closing SSE connection for client ${clientId}:`, error);
  }
};

/**
 * Get SSE connection statistics
 * @returns {Object} Connection statistics
 */
const getSSEStats = () => {
  try {
    return sseManager.getStats();
  } catch (error) {
    logger.error('Error getting SSE stats:', error);
    throw new InternalServerError('Failed to get SSE statistics');
  }
};

/**
 * Clean up disconnected SSE clients
 * @param {Object} options - Cleanup options
 * @returns {Number} Number of clients cleaned up
 */
const cleanupSSEConnections = (options = {}) => {
  try {
    const {
      ageThreshold = 5 * 60 * 1000, // Default: consider connections stale after 5 minutes without activity
      forceCleanup = false // Force cleanup for testing
    } = options;
    
    logger.debug('Starting SSE connection cleanup');
    
    // Get stats before cleanup
    const statsBefore = sseManager.getStats();
    
    // Current timestamp
    const now = Date.now();
    
    // Define criteria for which connections to clean up
    const cleanupFn = (client) => {
      // Already marked as disconnected
      if (!client.isConnected) return true;
      
      // Connection has been inactive for too long
      if (client.lastEventAt && (now - new Date(client.lastEventAt).getTime() > ageThreshold)) {
        logger.debug(`Client ${client.id} has been inactive for too long, marking for cleanup`);
        return true;
      }
      
      // Force cleanup for testing if enabled
      return forceCleanup;
    };
    
    // Perform the cleanup
    const cleanedCount = sseManager.cleanupDisconnectedClients(cleanupFn);
    
    // Get stats after cleanup
    const statsAfter = sseManager.getStats();
    
    logger.info(`SSE Connection cleanup complete. Before: ${statsBefore.totalConnections} connections, After: ${statsAfter.totalConnections} connections, Cleaned: ${cleanedCount}`);
    
    return cleanedCount;
  } catch (error) {
    logger.error('Error cleaning up SSE connections:', error);
    throw new InternalServerError('Failed to clean up SSE connections');
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
      throw new BadRequestError('Order ID is required');
    }
    
    const eventData = {
      type: 'order.updated',
      target: orderId,
      targetModel: 'Order',
      data: {
        orderId,
        status,
        ...orderData
      },
      recipients: [orderData.userId],
      roles: ['admin', 'manager'], // Admins and managers also get these events
    };
    
    return await createEvent(eventData);
  } catch (error) {
    logger.error(`Error creating order status event for order ${orderId}:`, error);
    throw new InternalServerError('Failed to create order status event');
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
      throw new BadRequestError('Cart ID is required');
    }
    
    const eventData = {
      type: 'cart.updated',
      target: cartId,
      targetModel: 'Cart',
      data: {
        cartId,
        ...cartData
      },
      recipients: userId ? [userId] : [],
    };
    
    return await createEvent(eventData);
  } catch (error) {
    logger.error(`Error creating cart update event for cart ${cartId}:`, error);
    throw new InternalServerError('Failed to create cart update event');
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
      throw new BadRequestError('Product ID is required');
    }
    
    const eventData = {
      type: 'inventory.low',
      target: productId,
      targetModel: 'Product',
      data: {
        productId,
        quantity,
        ...productData
      },
      roles: ['admin', 'manager'], // Only for administrators and managers
    };
    
    return await createEvent(eventData);
  } catch (error) {
    logger.error(`Error creating inventory alert event for product ${productId}:`, error);
    throw new InternalServerError('Failed to create inventory alert event');
  }
};

/**
 * Create a payment event
 * @param {String} paymentId - ID of the payment
 * @param {String} status - Payment status
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Created event
 */
const createPaymentEvent = async (paymentId, status, paymentData) => {
  try {
    if (!paymentId) {
      throw new BadRequestError('Payment ID is required');
    }
    
    const eventData = {
      type: status === 'success' ? 'payment.received' : 'payment.failed',
      target: paymentId,
      targetModel: 'Payment',
      data: {
        paymentId,
        status,
        ...paymentData
      },
      recipients: paymentData.userId ? [paymentData.userId] : [],
      roles: ['admin', 'manager'], // Admins and managers also get these events
    };
    
    return await createEvent(eventData);
  } catch (error) {
    logger.error(`Error creating payment event for payment ${paymentId}:`, error);
    throw new InternalServerError('Failed to create payment event');
  }
};

/**
 * Create a user notification event
 * @param {String} userId - ID of the user to notify
 * @param {String} message - Notification message
 * @param {Object} data - Additional notification data
 * @returns {Promise<Object>} Created event
 */
const createUserNotification = async (userId, message, data = {}) => {
  try {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }
    
    const eventData = {
      type: 'user.notification',
      target: userId,
      targetModel: 'User',
      data: {
        message,
        ...data
      },
      recipients: [userId],
    };
    
    return await createEvent(eventData);
  } catch (error) {
    logger.error(`Error creating notification for user ${userId}:`, error);
    throw new InternalServerError('Failed to create user notification');
  }
};

/**
 * Create a system notification event
 * @param {String} message - Notification message
 * @param {Object} data - Additional notification data
 * @param {Array} roles - Roles to receive this notification
 * @returns {Promise<Object>} Created event
 */
const createSystemNotification = async (message, data = {}, roles = ['admin']) => {
  try {
    const eventData = {
      type: 'system.notification',
      data: {
        message,
        ...data
      },
      roles,
    };
    
    return await createEvent(eventData);
  } catch (error) {
    logger.error('Error creating system notification:', error);
    throw new InternalServerError('Failed to create system notification');
  }
};

module.exports = {
  Event,
  createEvent,
  getEventsForUser,
  getEventsByType,
  initSSEConnection,
  closeSSEConnection,
  getSSEStats,
  cleanupSSEConnections,
  createOrderStatusEvent,
  createCartUpdateEvent,
  createInventoryAlertEvent,
  createPaymentEvent,
  createUserNotification,
  createSystemNotification,
}; 