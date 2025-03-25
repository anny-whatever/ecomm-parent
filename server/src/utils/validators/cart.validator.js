// src/utils/validators/cart.validator.js
const Joi = require("joi");

// Add item to cart validation schema
const addItem = Joi.object({
  body: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
      }),
    variantId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .messages({
        "string.pattern.base": "Invalid variant ID format",
      }),
    quantity: Joi.number().integer().min(1).default(1).messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.min": "Quantity must be at least 1",
    }),
  }),
});

// Update cart item quantity validation schema
const updateQuantity = Joi.object({
  params: Joi.object({
    itemId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid item ID format",
        "any.required": "Item ID is required",
      }),
  }),
  body: Joi.object({
    quantity: Joi.number().integer().required().messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "any.required": "Quantity is required",
    }),
  }),
});

// Remove cart item validation schema
const removeItem = Joi.object({
  params: Joi.object({
    itemId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid item ID format",
        "any.required": "Item ID is required",
      }),
  }),
});

// Apply coupon validation schema
const applyCoupon = Joi.object({
  body: Joi.object({
    couponCode: Joi.string().required().messages({
      "any.required": "Coupon code is required",
    }),
  }),
});

// Add shipping method validation schema
const addShipping = Joi.object({
  body: Joi.object({
    method: Joi.string().required().messages({
      "any.required": "Shipping method is required",
    }),
    cost: Joi.number().min(0).default(0).messages({
      "number.base": "Shipping cost must be a number",
      "number.min": "Shipping cost must be a non-negative number",
    }),
  }),
});

// Add notes validation schema
const addNotes = Joi.object({
  body: Joi.object({
    notes: Joi.string().max(500).allow("", null).messages({
      "string.max": "Notes must not exceed 500 characters",
    }),
  }),
});

module.exports = {
  addItem,
  updateQuantity,
  removeItem,
  applyCoupon,
  addShipping,
  addNotes,
};
