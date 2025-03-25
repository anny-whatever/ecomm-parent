// src/utils/validators/media.validator.js
const Joi = require("joi");

// Create media validation schema
const create = Joi.object({
  body: Joi.object({
    alt: Joi.string().max(500).allow("", null).messages({
      "string.max": "Alt text must not exceed 500 characters",
    }),
    title: Joi.string().max(255).allow("", null).messages({
      "string.max": "Title must not exceed 255 characters",
    }),
    caption: Joi.string().max(1000).allow("", null).messages({
      "string.max": "Caption must not exceed 1000 characters",
    }),
    tags: Joi.string().allow("", null).messages({
      "string.base": "Tags must be a string (comma-separated)",
    }),
    folder: Joi.string().max(255).allow("", null).messages({
      "string.max": "Folder path must not exceed 255 characters",
    }),
    isPublic: Joi.string().valid("true", "false").default("true"),
    contentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow("", null)
      .messages({
        "string.pattern.base": "Invalid content ID format",
      }),
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow("", null)
      .messages({
        "string.pattern.base": "Invalid product ID format",
      }),
  }),
});

// Update media validation schema
const update = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid media ID format",
        "any.required": "Media ID is required",
      }),
  }),
  body: Joi.object({
    alt: Joi.string().max(500).allow("", null).messages({
      "string.max": "Alt text must not exceed 500 characters",
    }),
    title: Joi.string().max(255).allow("", null).messages({
      "string.max": "Title must not exceed 255 characters",
    }),
    caption: Joi.string().max(1000).allow("", null).messages({
      "string.max": "Caption must not exceed 1000 characters",
    }),
    tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    folder: Joi.string().max(255).allow("", null).messages({
      "string.max": "Folder path must not exceed 255 characters",
    }),
    isPublic: Joi.boolean(),
    relatedContent: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null)
      .messages({
        "string.pattern.base": "Invalid content ID format",
      }),
    relatedProduct: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null)
      .messages({
        "string.pattern.base": "Invalid product ID format",
      }),
    metadata: Joi.object().allow(null),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
});

// Get media by ID validation schema
const getById = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid media ID format",
        "any.required": "Media ID is required",
      }),
  }),
});

// Remove media validation schema
const remove = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid media ID format",
        "any.required": "Media ID is required",
      }),
  }),
});

// List media validation schema
const list = Joi.object({
  query: Joi.object({
    type: Joi.string().valid("image", "video", "document", "audio", "other"),
    folder: Joi.string(),
    tag: Joi.string(),
    uploadedBy: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    isPublic: Joi.string().valid("true", "false"),
    search: Joi.string(),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso().min(Joi.ref("fromDate")),
    minSize: Joi.number().integer().min(0),
    maxSize: Joi.number().integer().min(0),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string(),
  }),
});

// Get media by content ID validation schema
const getByContentId = Joi.object({
  params: Joi.object({
    contentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid content ID format",
        "any.required": "Content ID is required",
      }),
  }),
});

// Get media by product ID validation schema
const getByProductId = Joi.object({
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

// Bulk delete media validation schema
const bulkDelete = Joi.object({
  body: Joi.object({
    ids: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
      )
      .min(1)
      .required()
      .messages({
        "array.min": "At least one media ID must be provided",
        "any.required": "Media IDs are required",
      }),
  }),
});

module.exports = {
  create,
  update,
  getById,
  remove,
  list,
  getByContentId,
  getByProductId,
  bulkDelete,
};
