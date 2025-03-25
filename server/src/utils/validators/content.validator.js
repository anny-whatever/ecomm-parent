// src/utils/validators/content.validator.js
const Joi = require("joi");

// Create content validation schema
const create = Joi.object({
  body: Joi.object({
    title: Joi.string().min(3).max(200).required().messages({
      "string.min": "Title must be at least 3 characters",
      "string.max": "Title must not exceed 200 characters",
      "any.required": "Title is required",
    }),
    slug: Joi.string()
      .min(3)
      .max(200)
      .pattern(/^[a-z0-9-]+$/)
      .messages({
        "string.min": "Slug must be at least 3 characters",
        "string.max": "Slug must not exceed 200 characters",
        "string.pattern.base":
          "Slug can only contain lowercase letters, numbers, and hyphens",
      }),
    type: Joi.string()
      .valid("page", "post", "banner", "announcement", "custom")
      .required()
      .messages({
        "any.only":
          "Type must be one of: page, post, banner, announcement, custom",
        "any.required": "Type is required",
      }),
    content: Joi.string().required().messages({
      "any.required": "Content is required",
    }),
    excerpt: Joi.string().max(500).allow("", null).messages({
      "string.max": "Excerpt must not exceed 500 characters",
    }),
    featuredImage: Joi.string().allow("", null),
    status: Joi.string()
      .valid("draft", "published", "archived")
      .default("draft"),
    publishedAt: Joi.date().allow(null),
    category: Joi.string().allow("", null),
    tags: Joi.array().items(Joi.string()).default([]),
    seo: Joi.object({
      title: Joi.string().max(70).allow("", null),
      description: Joi.string().max(160).allow("", null),
      keywords: Joi.array().items(Joi.string()),
      ogImage: Joi.string().allow("", null),
    }).default({}),
    template: Joi.string().default("default"),
    order: Joi.number().integer().min(0).default(0),
    sections: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          content: Joi.string().allow("", null),
          settings: Joi.object().allow(null),
        })
      )
      .default([]),
    metaData: Joi.object().allow(null),
    isHomepage: Joi.boolean().default(false),
    includeInMenu: Joi.boolean().default(false),
    includeInFooter: Joi.boolean().default(false),
    displayInSitemap: Joi.boolean().default(true),
  }),
});

// Update content validation schema
const update = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid content ID format",
        "any.required": "Content ID is required",
      }),
  }),
  body: Joi.object({
    title: Joi.string().min(3).max(200).messages({
      "string.min": "Title must be at least 3 characters",
      "string.max": "Title must not exceed 200 characters",
    }),
    slug: Joi.string()
      .min(3)
      .max(200)
      .pattern(/^[a-z0-9-]+$/)
      .messages({
        "string.min": "Slug must be at least 3 characters",
        "string.max": "Slug must not exceed 200 characters",
        "string.pattern.base":
          "Slug can only contain lowercase letters, numbers, and hyphens",
      }),
    type: Joi.string()
      .valid("page", "post", "banner", "announcement", "custom")
      .messages({
        "any.only":
          "Type must be one of: page, post, banner, announcement, custom",
      }),
    content: Joi.string(),
    excerpt: Joi.string().max(500).allow("", null).messages({
      "string.max": "Excerpt must not exceed 500 characters",
    }),
    featuredImage: Joi.string().allow("", null),
    status: Joi.string().valid("draft", "published", "archived"),
    publishedAt: Joi.date().allow(null),
    category: Joi.string().allow("", null),
    tags: Joi.array().items(Joi.string()),
    seo: Joi.object({
      title: Joi.string().max(70).allow("", null),
      description: Joi.string().max(160).allow("", null),
      keywords: Joi.array().items(Joi.string()),
      ogImage: Joi.string().allow("", null),
    }),
    template: Joi.string(),
    order: Joi.number().integer().min(0),
    sections: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        content: Joi.string().allow("", null),
        settings: Joi.object().allow(null),
      })
    ),
    metaData: Joi.object().allow(null),
    isHomepage: Joi.boolean(),
    includeInMenu: Joi.boolean(),
    includeInFooter: Joi.boolean(),
    displayInSitemap: Joi.boolean(),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
});

// Get content by ID validation schema
const getById = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid content ID format",
        "any.required": "Content ID is required",
      }),
  }),
});

// Get content by slug validation schema
const getBySlug = Joi.object({
  params: Joi.object({
    type: Joi.string()
      .valid("page", "post", "banner", "announcement", "custom")
      .required()
      .messages({
        "any.only":
          "Type must be one of: page, post, banner, announcement, custom",
        "any.required": "Content type is required",
      }),
    slug: Joi.string().required().messages({
      "any.required": "Slug is required",
    }),
  }),
});

// Get content by type validation schema
const getByType = Joi.object({
  params: Joi.object({
    type: Joi.string()
      .valid("page", "post", "banner", "announcement", "custom")
      .required()
      .messages({
        "any.only":
          "Type must be one of: page, post, banner, announcement, custom",
        "any.required": "Content type is required",
      }),
  }),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(50),
  }),
});

// List content validation schema
const list = Joi.object({
  query: Joi.object({
    type: Joi.string().valid(
      "page",
      "post",
      "banner",
      "announcement",
      "custom"
    ),
    status: Joi.string().valid("draft", "published", "archived"),
    category: Joi.string(),
    tag: Joi.string(),
    author: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    search: Joi.string(),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso().min(Joi.ref("fromDate")),
    includeInMenu: Joi.string().valid("true", "false"),
    includeInFooter: Joi.string().valid("true", "false"),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string(),
  }),
});

// List published content validation schema
const listPublished = Joi.object({
  params: Joi.object({
    type: Joi.string()
      .valid("page", "post", "banner", "announcement", "custom")
      .required()
      .messages({
        "any.only":
          "Type must be one of: page, post, banner, announcement, custom",
        "any.required": "Content type is required",
      }),
  }),
  query: Joi.object({
    category: Joi.string(),
    tag: Joi.string(),
    search: Joi.string(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(50),
    sortBy: Joi.string().valid(
      "publishedAt",
      "-publishedAt",
      "title",
      "-title"
    ),
  }),
});

// Delete content validation schema
const remove = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid content ID format",
        "any.required": "Content ID is required",
      }),
  }),
});

module.exports = {
  create,
  update,
  getById,
  getBySlug,
  getByType,
  list,
  listPublished,
  remove,
};
