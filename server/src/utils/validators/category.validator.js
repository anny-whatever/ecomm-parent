// src/utils/validators/category.validator.js
const Joi = require("joi");

// Create category validation schema
const create = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Category name must be at least 2 characters",
      "string.max": "Category name must not exceed 100 characters",
      "any.required": "Category name is required",
    }),
    description: Joi.string().max(500).allow("", null).messages({
      "string.max": "Description must not exceed 500 characters",
    }),
    parent: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null)
      .messages({
        "string.pattern.base": "Invalid parent category ID format",
      }),
    image: Joi.string().allow("", null),
    order: Joi.number().integer().min(0).default(0).messages({
      "number.min": "Order must be a positive integer",
    }),
    isActive: Joi.boolean().default(true),
    seo: Joi.object({
      title: Joi.string().max(100).allow("", null).messages({
        "string.max": "SEO title must not exceed 100 characters",
      }),
      description: Joi.string().max(255).allow("", null).messages({
        "string.max": "SEO description must not exceed 255 characters",
      }),
      keywords: Joi.array().items(Joi.string()).default([]),
    }).default({}),
  }),
});

// Update category validation schema
const update = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid category ID format",
        "any.required": "Category ID is required",
      }),
  }),
  body: Joi.object({
    name: Joi.string().min(2).max(100).messages({
      "string.min": "Category name must be at least 2 characters",
      "string.max": "Category name must not exceed 100 characters",
    }),
    description: Joi.string().max(500).allow("", null).messages({
      "string.max": "Description must not exceed 500 characters",
    }),
    parent: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null)
      .messages({
        "string.pattern.base": "Invalid parent category ID format",
      }),
    image: Joi.string().allow("", null),
    order: Joi.number().integer().min(0).messages({
      "number.min": "Order must be a positive integer",
    }),
    isActive: Joi.boolean(),
    seo: Joi.object({
      title: Joi.string().max(100).allow("", null).messages({
        "string.max": "SEO title must not exceed 100 characters",
      }),
      description: Joi.string().max(255).allow("", null).messages({
        "string.max": "SEO description must not exceed 255 characters",
      }),
      keywords: Joi.array().items(Joi.string()),
    }),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
});

// Get category by ID validation schema
const getById = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid category ID format",
        "any.required": "Category ID is required",
      }),
  }),
});

// Get category by slug validation schema
const getBySlug = Joi.object({
  params: Joi.object({
    slug: Joi.string().required().messages({
      "any.required": "Category slug is required",
    }),
  }),
});

// List categories validation schema
const list = Joi.object({
  query: Joi.object({
    parent: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow("root", null, "")
      .messages({
        "string.pattern.base": "Invalid parent category ID format",
      }),
    isActive: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(100).messages({
      "number.min": "Limit must be at least 1",
      "number.max": "Limit must not exceed 100",
    }),
    sortBy: Joi.string(),
  }),
});

// Delete category validation schema
const remove = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid category ID format",
        "any.required": "Category ID is required",
      }),
  }),
});

module.exports = {
  create,
  update,
  getById,
  getBySlug,
  list,
  remove,
};
