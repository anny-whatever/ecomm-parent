// src/utils/validators/inventory.validator.js
const Joi = require("joi");

// Adjust product inventory validation schema
const adjustInventory = Joi.object({
  params: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
      }),
  }),
  body: Joi.object({
    adjustment: Joi.number().required().messages({
      "any.required": "Adjustment amount is required",
      "number.base": "Adjustment must be a number",
    }),
    reason: Joi.string()
      .valid("manual-adjustment", "purchase", "return", "correction", "loss")
      .default("manual-adjustment"),
    note: Joi.string().max(500).allow("", null).messages({
      "string.max": "Note must not exceed 500 characters",
    }),
  }),
});

// Adjust variant inventory validation schema
const adjustVariantInventory = Joi.object({
  params: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
      }),
    variantId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid variant ID format",
        "any.required": "Variant ID is required",
      }),
  }),
  body: Joi.object({
    adjustment: Joi.number().required().messages({
      "any.required": "Adjustment amount is required",
      "number.base": "Adjustment must be a number",
    }),
    reason: Joi.string()
      .valid("manual-adjustment", "purchase", "return", "correction", "loss")
      .default("manual-adjustment"),
    note: Joi.string().max(500).allow("", null).messages({
      "string.max": "Note must not exceed 500 characters",
    }),
  }),
});

// Get inventory history validation schema
const getHistory = Joi.object({
  params: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
      }),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    variantId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null, "")
      .messages({
        "string.pattern.base": "Invalid variant ID format",
      }),
  }),
});

// Get low stock products validation schema
const getLowStock = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
});

// Get product by ID validation schema
const getProductById = Joi.object({
  params: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
      }),
  }),
});

module.exports = {
  adjustInventory,
  adjustVariantInventory,
  getHistory,
  getLowStock,
  getProductById,
};
