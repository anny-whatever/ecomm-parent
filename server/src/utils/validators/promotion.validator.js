// src/utils/validators/promotion.validator.js
const Joi = require("joi");

// Create promotion validation schema
const create = Joi.object({
  body: Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      "string.min": "Promotion name must be at least 3 characters",
      "string.max": "Promotion name must not exceed 100 characters",
      "any.required": "Promotion name is required",
    }),
    description: Joi.string().max(500).allow("", null).messages({
      "string.max": "Description must not exceed 500 characters",
    }),
    code: Joi.string().min(3).max(20).allow(null).messages({
      "string.min": "Promotion code must be at least 3 characters",
      "string.max": "Promotion code must not exceed 20 characters",
    }),
    type: Joi.string()
      .valid(
        "percentage",
        "fixed",
        "shipping",
        "buy_x_get_y",
        "product_percentage",
        "product_fixed",
        "category_percentage",
        "category_fixed"
      )
      .required()
      .messages({
        "any.only": "Invalid promotion type",
        "any.required": "Promotion type is required",
      }),
    value: Joi.number().min(0).required().messages({
      "number.min": "Value must be a non-negative number",
      "any.required": "Discount value is required",
    }),
    maxDiscount: Joi.number().min(0).allow(null).messages({
      "number.min": "Maximum discount must be a non-negative number",
    }),
    minOrderValue: Joi.number().min(0).default(0).messages({
      "number.min": "Minimum order value must be a non-negative number",
    }),
    applicableProducts: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            "string.pattern.base": "Invalid product ID format",
          })
      )
      .default([]),
    applicableCategories: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            "string.pattern.base": "Invalid category ID format",
          })
      )
      .default([]),
    buyXGetYConfig: Joi.object({
      buyQuantity: Joi.number().integer().min(1).required().messages({
        "number.min": "Buy quantity must be at least 1",
        "any.required": "Buy quantity is required",
      }),
      getQuantity: Joi.number().integer().min(1).required().messages({
        "number.min": "Get quantity must be at least 1",
        "any.required": "Get quantity is required",
      }),
      discountPercent: Joi.number().min(0).max(100).default(100).messages({
        "number.min": "Discount percent must be between 0 and 100",
        "number.max": "Discount percent must be between 0 and 100",
      }),
    }).when("type", {
      is: "buy_x_get_y",
      then: Joi.required().messages({
        "any.required":
          "Buy X Get Y configuration is required for this promotion type",
      }),
      otherwise: Joi.optional(),
    }),
    isActive: Joi.boolean().default(true),
    usageLimit: Joi.number().integer().min(0).default(0).messages({
      "number.min": "Usage limit must be a non-negative integer",
    }),
    userUsageLimit: Joi.number().integer().min(0).default(0).messages({
      "number.min": "User usage limit must be a non-negative integer",
    }),
    validFrom: Joi.date().default(Date.now),
    validUntil: Joi.date().greater(Joi.ref("validFrom")).allow(null).messages({
      "date.greater": "End date must be after start date",
    }),
    customerType: Joi.string()
      .valid("all", "new", "existing")
      .default("all")
      .messages({
        "any.only": "Customer type must be one of: all, new, existing",
      }),
    minimumItems: Joi.number().integer().min(0).default(0).messages({
      "number.min": "Minimum items must be a non-negative integer",
    }),
  }),
});

// Update promotion validation schema
const update = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid promotion ID format",
        "any.required": "Promotion ID is required",
      }),
  }),
  body: Joi.object({
    name: Joi.string().min(3).max(100).messages({
      "string.min": "Promotion name must be at least 3 characters",
      "string.max": "Promotion name must not exceed 100 characters",
    }),
    description: Joi.string().max(500).allow("", null).messages({
      "string.max": "Description must not exceed 500 characters",
    }),
    code: Joi.string().min(3).max(20).allow(null).messages({
      "string.min": "Promotion code must be at least 3 characters",
      "string.max": "Promotion code must not exceed 20 characters",
    }),
    type: Joi.string()
      .valid(
        "percentage",
        "fixed",
        "shipping",
        "buy_x_get_y",
        "product_percentage",
        "product_fixed",
        "category_percentage",
        "category_fixed"
      )
      .messages({
        "any.only": "Invalid promotion type",
      }),
    value: Joi.number().min(0).messages({
      "number.min": "Value must be a non-negative number",
    }),
    maxDiscount: Joi.number().min(0).allow(null).messages({
      "number.min": "Maximum discount must be a non-negative number",
    }),
    minOrderValue: Joi.number().min(0).messages({
      "number.min": "Minimum order value must be a non-negative number",
    }),
    applicableProducts: Joi.array().items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid product ID format",
        })
    ),
    applicableCategories: Joi.array().items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid category ID format",
        })
    ),
    buyXGetYConfig: Joi.object({
      buyQuantity: Joi.number().integer().min(1).required().messages({
        "number.min": "Buy quantity must be at least 1",
        "any.required": "Buy quantity is required",
      }),
      getQuantity: Joi.number().integer().min(1).required().messages({
        "number.min": "Get quantity must be at least 1",
        "any.required": "Get quantity is required",
      }),
      discountPercent: Joi.number().min(0).max(100).messages({
        "number.min": "Discount percent must be between 0 and 100",
        "number.max": "Discount percent must be between 0 and 100",
      }),
    }),
    isActive: Joi.boolean(),
    usageLimit: Joi.number().integer().min(0).messages({
      "number.min": "Usage limit must be a non-negative integer",
    }),
    userUsageLimit: Joi.number().integer().min(0).messages({
      "number.min": "User usage limit must be a non-negative integer",
    }),
    validFrom: Joi.date(),
    validUntil: Joi.date().greater(Joi.ref("validFrom")).allow(null).messages({
      "date.greater": "End date must be after start date",
    }),
    customerType: Joi.string().valid("all", "new", "existing").messages({
      "any.only": "Customer type must be one of: all, new, existing",
    }),
    minimumItems: Joi.number().integer().min(0).messages({
      "number.min": "Minimum items must be a non-negative integer",
    }),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
});

// Get promotion by ID validation schema
const getById = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid promotion ID format",
        "any.required": "Promotion ID is required",
      }),
  }),
});

// List promotions validation schema
const list = Joi.object({
  query: Joi.object({
    isActive: Joi.string().valid("true", "false"),
    type: Joi.string().valid(
      "percentage",
      "fixed",
      "shipping",
      "buy_x_get_y",
      "product_percentage",
      "product_fixed",
      "category_percentage",
      "category_fixed"
    ),
    code: Joi.string(),
    validNow: Joi.string().valid("true", "false"),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string(),
  }),
});

// Validate promotion code validation schema
const validate = Joi.object({
  body: Joi.object({
    code: Joi.string().required().messages({
      "any.required": "Promotion code is required",
    }),
    cartId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid cart ID format",
        "any.required": "Cart ID is required",
      }),
  }),
});

// Delete promotion validation schema
const remove = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid promotion ID format",
        "any.required": "Promotion ID is required",
      }),
  }),
});

module.exports = {
  create,
  update,
  getById,
  list,
  validate,
  remove,
};
