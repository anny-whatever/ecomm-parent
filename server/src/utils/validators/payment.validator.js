// src/utils/validators/payment.validator.js
const Joi = require("joi");

// Create payment order validation schema
const createOrder = Joi.object({
  body: Joi.object({
    // Additional order parameters if needed
    // For example, custom notes or specific amounts
    notes: Joi.object().allow(null),
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

// Get payment details validation schema
const getPaymentDetails = Joi.object({
  params: Joi.object({
    paymentId: Joi.string().required().messages({
      "any.required": "Payment ID is required",
    }),
  }),
});

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
};
