const Joi = require('joi');

// Subscribe to events validation schema
const subscribeToEvents = Joi.object({
  query: Joi.object({
    types: Joi.string()
      .optional()
      .description('Comma-separated list of event types to subscribe to'),
  }),
});

// Get events validation schema
const getEvents = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    types: Joi.string()
      .optional()
      .description('Comma-separated list of event types to filter by'),
  }),
});

// Get event by ID validation schema
const getById = Joi.object({
  params: Joi.object({
    eventId: Joi.string().required().messages({
      'any.required': 'Event ID is required',
      'string.empty': 'Event ID cannot be empty',
    }),
  }),
});

// Create event validation schema
const createEvent = Joi.object({
  body: Joi.object({
    type: Joi.string()
      .required()
      .valid(
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
        'system.notification'
      )
      .messages({
        'any.required': 'Event type is required',
        'any.only': 'Invalid event type',
      }),
    target: Joi.string()
      .optional()
      .description('Target object ID (e.g., order ID, user ID)'),
    targetModel: Joi.string()
      .optional()
      .valid('User', 'Order', 'Product', 'Cart', 'Inventory', 'Payment', null)
      .default(null),
    data: Joi.object()
      .required()
      .messages({
        'any.required': 'Event data is required',
      }),
    recipients: Joi.array()
      .items(Joi.string())
      .optional()
      .description('Array of user IDs to send the event to'),
    roles: Joi.array()
      .items(Joi.string().valid('admin', 'manager', 'customer', 'guest'))
      .optional()
      .description('Array of roles to send the event to'),
    isPublic: Joi.boolean()
      .default(false)
      .description('Whether the event is public'),
    metadata: Joi.object()
      .optional()
      .description('Additional metadata for the event'),
  }),
});

// Notify user validation schema
const notifyUser = Joi.object({
  params: Joi.object({
    userId: Joi.string().required().messages({
      'any.required': 'User ID is required',
      'string.empty': 'User ID cannot be empty',
    }),
  }),
  body: Joi.object({
    message: Joi.string().required().messages({
      'any.required': 'Message is required',
      'string.empty': 'Message cannot be empty',
    }),
    data: Joi.object()
      .optional()
      .description('Additional data for the notification'),
  }),
});

// System notification validation schema
const systemNotification = Joi.object({
  body: Joi.object({
    message: Joi.string().required().messages({
      'any.required': 'Message is required',
      'string.empty': 'Message cannot be empty',
    }),
    data: Joi.object()
      .optional()
      .description('Additional data for the notification'),
    roles: Joi.array()
      .items(Joi.string().valid('admin', 'manager', 'customer', 'guest'))
      .default(['admin'])
      .description('Array of roles to send the notification to'),
  }),
});

// Get scheduled tasks validation schema
const getTasksInfo = Joi.object({
  // No parameters needed for this endpoint
});

module.exports = {
  subscribeToEvents,
  getEvents,
  getById,
  createEvent,
  notifyUser,
  systemNotification,
  getTasksInfo
}; 