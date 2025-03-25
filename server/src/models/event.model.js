const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Event Schema
 * Represents an event that can be broadcast to clients
 */
const eventSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'cart.updated',
        'order.created', 
        'order.updated',
        'order.shipped',
        'order.delivered',
        'order.cancelled',
        'product.updated',
        'inventory.low',
        'payment.received',
        'payment.failed',
        'user.notification',
        'system.notification',
      ],
      index: true
    },
    target: {
      type: Schema.Types.ObjectId,
      refPath: 'targetModel',
      index: true
    },
    targetModel: {
      type: String,
      enum: ['User', 'Order', 'Product', 'Cart', 'Inventory', 'Payment', null],
      default: null
    },
    data: {
      type: Schema.Types.Mixed,
      required: true
    },
    recipients: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }],
    roles: [{
      type: String,
      enum: ['admin', 'manager', 'customer', 'guest']
    }],
    // Public events are broadcast to all connected clients
    isPublic: {
      type: Boolean,
      default: false
    },
    // Metadata for event tracking
    metadata: {
      type: Schema.Types.Mixed
    },
    // Whether this event has been processed and sent
    processed: {
      type: Boolean,
      default: false
    },
    // If there was an error processing this event
    error: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
eventSchema.index({ createdAt: 1 });
eventSchema.index({ type: 1, createdAt: 1 });
eventSchema.index({ processed: 1, createdAt: 1 });

/**
 * Create a new event
 * @param {Object} eventData - Data for the event
 * @returns {Promise<Object>} Created event
 */
eventSchema.statics.createEvent = async function(eventData) {
  return this.create(eventData);
};

/**
 * Get pending events for processing
 * @param {Number} limit - Maximum number of events to retrieve
 * @returns {Promise<Array>} Array of unprocessed events
 */
eventSchema.statics.getPendingEvents = async function(limit = 100) {
  return this.find({ processed: false })
    .sort({ createdAt: 1 })
    .limit(limit);
};

/**
 * Mark event as processed
 * @param {String} eventId - ID of the event to mark as processed
 * @returns {Promise<Object>} Updated event
 */
eventSchema.statics.markAsProcessed = async function(eventId) {
  return this.findByIdAndUpdate(
    eventId,
    { processed: true },
    { new: true }
  );
};

/**
 * Get events for a specific user
 * @param {String} userId - User ID to get events for
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of events
 */
eventSchema.statics.getEventsForUser = async function(userId, options = {}) {
  const { limit = 20, skip = 0, types = [] } = options;
  
  const query = {
    $or: [
      { recipients: userId },
      { isPublic: true }
    ]
  };
  
  if (types.length > 0) {
    query.type = { $in: types };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Get events for users with specific roles
 * @param {Array} roles - Array of roles to get events for
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of events
 */
eventSchema.statics.getEventsByRoles = async function(roles, options = {}) {
  const { limit = 20, skip = 0, types = [] } = options;
  
  const query = {
    $or: [
      { roles: { $in: roles } },
      { isPublic: true }
    ]
  };
  
  if (types.length > 0) {
    query.type = { $in: types };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 