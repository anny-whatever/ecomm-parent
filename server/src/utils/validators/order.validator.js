// src/utils/validators/order.validator.js
const Joi = require("joi");
const { ORDER_STATUS, PAYMENT_METHODS } = require("../constants");

// Address schema for reuse
const addressSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Name is required for address",
  }),
  street: Joi.string().required().messages({
    "any.required": "Street is required for address",
  }),
  city: Joi.string().required().messages({
    "any.required": "City is required for address",
  }),
  state: Joi.string().required().messages({
    "any.required": "State is required for address",
  }),
  postalCode: Joi.string().required().messages({
    "any.required": "Postal code is required for address",
  }),
  country: Joi.string().default("India"),
  phone: Joi.string().required().messages({
    "any.required": "Phone is required for address",
  }),
});

// Create order validation schema
const create = Joi.object({
  body: Joi.object({
    billing: Joi.object({
      address: addressSchema.required(),
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email",
        "any.required": "Email is required for billing",
      }),
    }).required(),
    shipping: Joi.object({
      address: addressSchema.required(),
      method: Joi.string().required().messages({
        "any.required": "Shipping method is required",
      }),
    }).required(),
    payment: Joi.object({
      method: Joi.string()
        .valid(...Object.values(PAYMENT_METHODS))
        .default(PAYMENT_METHODS.RAZORPAY),
      razorpayOrderId: Joi.string().when("method", {
        is: PAYMENT_METHODS.RAZORPAY,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }).required(),
    notes: Joi.string().max(500).allow("", null).messages({
      "string.max": "Notes must not exceed 500 characters",
    }),
  }),
});

// Get orders list validation schema
const list = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid("createdAt", "-createdAt", "total", "-total"),
    status: Joi.string().valid(...Object.values(ORDER_STATUS)),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")),
  }),
});

// Get order by ID validation schema
const getById = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid order ID format",
        "any.required": "Order ID is required",
      }),
  }),
});

// Cancel order validation schema
const cancel = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid order ID format",
        "any.required": "Order ID is required",
      }),
  }),
  body: Joi.object({
    reason: Joi.string().max(500).required().messages({
      "any.required": "Cancellation reason is required",
      "string.max": "Reason must not exceed 500 characters",
    }),
  }),
});

// Get orders by status validation schema
const getByStatus = Joi.object({
  params: Joi.object({
    status: Joi.string()
      .valid(...Object.values(ORDER_STATUS))
      .required()
      .messages({
        "any.only": `Status must be one of: ${Object.values(ORDER_STATUS).join(
          ", "
        )}`,
        "any.required": "Status is required",
      }),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid("createdAt", "-createdAt", "total", "-total"),
  }),
});

// Update order status validation schema
const updateStatus = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid order ID format",
        "any.required": "Order ID is required",
      }),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(ORDER_STATUS))
      .required()
      .messages({
        "any.only": `Status must be one of: ${Object.values(ORDER_STATUS).join(
          ", "
        )}`,
        "any.required": "Status is required",
      }),
    note: Joi.string().max(500).allow("", null).messages({
      "string.max": "Note must not exceed 500 characters",
    }),
  }),
});

// Add note to order validation schema
const addNote = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid order ID format",
        "any.required": "Order ID is required",
      }),
  }),
  body: Joi.object({
    text: Joi.string().max(1000).required().messages({
      "any.required": "Note text is required",
      "string.max": "Note must not exceed 1000 characters",
    }),
    isPublic: Joi.boolean().default(false),
  }),
});

// Update shipping information validation schema
const updateShipping = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid order ID format",
        "any.required": "Order ID is required",
      }),
  }),
  body: Joi.object({
    trackingNumber: Joi.string().allow("", null),
    carrier: Joi.string().allow("", null),
    estimatedDelivery: Joi.date().iso().allow(null),
    method: Joi.string(),
    cost: Joi.number().min(0),
  })
    .min(1)
    .messages({
      "object.min": "At least one shipping field must be provided",
    }),
});

// Process refund validation schema
const processRefund = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid order ID format",
        "any.required": "Order ID is required",
      }),
  }),
  body: Joi.object({
    amount: Joi.number().positive().required().messages({
      "number.positive": "Refund amount must be positive",
      "any.required": "Refund amount is required",
    }),
    reason: Joi.string().max(500).required().messages({
      "any.required": "Refund reason is required",
      "string.max": "Reason must not exceed 500 characters",
    }),
  }),
});

// Get order stats validation schema
const getStats = Joi.object({
  query: Joi.object({
    start: Joi.date().iso(),
    end: Joi.date().iso().min(Joi.ref("start")),
  }),
});

module.exports = {
  create,
  list,
  getById,
  cancel,
  getByStatus,
  updateStatus,
  addNote,
  updateShipping,
  processRefund,
  getStats,
};
