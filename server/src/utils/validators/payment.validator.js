// src/utils/validators/payment.validator.js
const Joi = require("joi");

// Create payment order validation schema
const createOrder = Joi.object({
  body: Joi.object({
    // Additional order parameters if needed
    // For example, custom notes or specific amounts
    notes: Joi.object().allow(null),
    currency: Joi.string().valid("INR").default("INR"),
  }).optional(),
});

// Verify payment validation schema
const verifyPayment = Joi.object({
  body: Joi.object({
    razorpayOrderId: Joi.string().required().messages({
      "any.required": "Razorpay order ID is required",
    }),
    razorpayPaymentId: Joi.string().required().messages({
      "any.required": "Razorpay payment ID is required",
    }),
    razorpaySignature: Joi.string().required().messages({
      "any.required": "Razorpay signature is required",
    }),
  }),
});

// Generic ID param validator (used for various routes)
const getById = Joi.object({
  params: Joi.object({
    paymentId: Joi.string().when('orderId', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required()
    }).messages({
      "any.required": "Payment ID is required",
    }),
    orderId: Joi.string().when('paymentId', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required()
    }).messages({
      "any.required": "Order ID is required",
    }),
  }),
});

// Get all payments validation schema
const getPayments = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid(
      "created",
      "authorized",
      "captured",
      "failed",
      "refunded",
      "partially_refunded",
      "disputed",
      "expired"
    ),
    userId: Joi.string(),
  }),
});

// Process refund validation schema
const processRefund = Joi.object({
  params: Joi.object({
    paymentId: Joi.string().required().messages({
      "any.required": "Payment ID is required",
    }),
  }),
  body: Joi.object({
    amount: Joi.number().positive().when('fullRefund', {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.required()
    }).messages({
      "any.required": "Amount is required for partial refunds",
      "number.positive": "Amount must be a positive number",
    }),
    reason: Joi.string().max(500),
    fullRefund: Joi.boolean().default(false),
  }),
});

// Verify UPI validation schema
const verifyUpi = Joi.object({
  body: Joi.object({
    vpa: Joi.string().required().pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/).messages({
      "any.required": "UPI ID (VPA) is required",
      "string.pattern.base": "Invalid UPI ID format",
    }),
  }),
});

// Create subscription plan validation schema
const createPlan = Joi.object({
  body: Joi.object({
    period: Joi.string().valid("daily", "weekly", "monthly", "yearly").required().messages({
      "any.required": "Plan period is required",
      "string.valid": "Period must be one of: daily, weekly, monthly, yearly",
    }),
    interval: Joi.number().integer().min(1).required().messages({
      "any.required": "Plan interval is required",
      "number.min": "Interval must be at least 1",
    }),
    name: Joi.string().max(100).required().messages({
      "any.required": "Plan name is required",
    }),
    amount: Joi.number().positive().required().messages({
      "any.required": "Plan amount is required",
      "number.positive": "Amount must be a positive number",
    }),
    currency: Joi.string().valid("INR").default("INR"),
    description: Joi.string().max(500),
    notes: Joi.object(),
  }),
});

// Create subscription validation schema
const createSubscription = Joi.object({
  body: Joi.object({
    planId: Joi.string().required().messages({
      "any.required": "Plan ID is required",
    }),
    totalCycles: Joi.number().integer().min(1).default(1),
    startAt: Joi.number().integer(),
    notifyCustomer: Joi.number().valid(0, 1).default(1),
    notes: Joi.object(),
  }),
});

module.exports = {
  createOrder,
  verifyPayment,
  getById,
  getPayments,
  processRefund,
  verifyUpi,
  createPlan,
  createSubscription,
};
