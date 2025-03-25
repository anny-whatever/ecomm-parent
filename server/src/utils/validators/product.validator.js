// src/utils/validators/product.validator.js
const Joi = require("joi");

// Create product validation schema
const create = Joi.object({
  body: Joi.object({
    name: Joi.string().min(3).max(200).required().messages({
      "string.min": "Product name must be at least 3 characters",
      "string.max": "Product name must not exceed 200 characters",
      "any.required": "Product name is required",
    }),
    sku: Joi.string().required().messages({
      "any.required": "SKU is required",
    }),
    description: Joi.object({
      short: Joi.string().max(500).allow(null, "").messages({
        "string.max": "Short description must not exceed 500 characters",
      }),
      long: Joi.string().max(5000).allow(null, "").messages({
        "string.max": "Long description must not exceed 5000 characters",
      }),
    }).default({}),
    price: Joi.object({
      regular: Joi.number().positive().required().messages({
        "number.positive": "Regular price must be positive",
        "any.required": "Regular price is required",
      }),
      sale: Joi.number().positive().allow(null).messages({
        "number.positive": "Sale price must be positive",
      }),
      cost: Joi.number().positive().allow(null).messages({
        "number.positive": "Cost price must be positive",
      }),
      compareAt: Joi.number().positive().allow(null).messages({
        "number.positive": "Compare-at price must be positive",
      }),
    }).required(),
    gstPercentage: Joi.number().min(0).max(100).default(18).messages({
      "number.min": "GST percentage must be a non-negative number",
      "number.max": "GST percentage cannot exceed 100",
    }),
    categories: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            "string.pattern.base": "Invalid category ID format",
          })
      )
      .default([]),
    tags: Joi.array().items(Joi.string()).default([]),
    attributes: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required().messages({
            "any.required": "Attribute name is required",
          }),
          value: Joi.string().required().messages({
            "any.required": "Attribute value is required",
          }),
          visible: Joi.boolean().default(true),
        })
      )
      .default([]),
    variants: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required().messages({
            "any.required": "Variant name is required",
          }),
          sku: Joi.string().required().messages({
            "any.required": "Variant SKU is required",
          }),
          price: Joi.object({
            regular: Joi.number().positive().required().messages({
              "number.positive": "Regular price must be positive",
              "any.required": "Regular price is required",
            }),
            sale: Joi.number().positive().allow(null).messages({
              "number.positive": "Sale price must be positive",
            }),
          }).required(),
          attributes: Joi.array()
            .items(
              Joi.object({
                name: Joi.string().required().messages({
                  "any.required": "Attribute name is required",
                }),
                value: Joi.string().required().messages({
                  "any.required": "Attribute value is required",
                }),
              })
            )
            .min(1)
            .required()
            .messages({
              "array.min": "At least one attribute is required for a variant",
              "any.required": "Variant attributes are required",
            }),
          inventory: Joi.object({
            quantity: Joi.number().integer().min(0).default(0).messages({
              "number.integer": "Quantity must be an integer",
              "number.min": "Quantity cannot be negative",
            }),
            lowStockThreshold: Joi.number()
              .integer()
              .min(1)
              .default(5)
              .messages({
                "number.integer": "Low stock threshold must be an integer",
                "number.min": "Low stock threshold must be at least 1",
              }),
          }).default({}),
          images: Joi.array().items(Joi.string()).default([]),
          isDefault: Joi.boolean().default(false),
        })
      )
      .default([]),
    images: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().required().messages({
            "any.required": "Image URL is required",
          }),
          alt: Joi.string().allow(null, ""),
          isDefault: Joi.boolean().default(false),
        })
      )
      .default([]),
    seo: Joi.object({
      title: Joi.string().max(70).allow(null, "").messages({
        "string.max": "SEO title must not exceed 70 characters",
      }),
      description: Joi.string().max(160).allow(null, "").messages({
        "string.max": "SEO description must not exceed 160 characters",
      }),
      keywords: Joi.array().items(Joi.string()).default([]),
    }).default({}),
    related: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            "string.pattern.base": "Invalid related product ID format",
          })
      )
      .default([]),
    inventory: Joi.object({
      quantity: Joi.number().integer().min(0).default(0).messages({
        "number.integer": "Quantity must be an integer",
        "number.min": "Quantity cannot be negative",
      }),
      lowStockThreshold: Joi.number().integer().min(1).default(5).messages({
        "number.integer": "Low stock threshold must be an integer",
        "number.min": "Low stock threshold must be at least 1",
      }),
    }).default({}),
    isBundle: Joi.boolean().default(false),
    bundleProducts: Joi.array()
      .items(
        Joi.object({
          product: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              "string.pattern.base": "Invalid product ID format",
              "any.required": "Product ID is required for bundle item",
            }),
          quantity: Joi.number().integer().min(1).default(1).messages({
            "number.integer": "Quantity must be an integer",
            "number.min": "Quantity must be at least 1",
          }),
          discount: Joi.number().min(0).max(100).default(0).messages({
            "number.min": "Discount must be a non-negative number",
            "number.max": "Discount cannot exceed 100%",
          }),
        })
      )
      .default([]),
    status: Joi.string()
      .valid("active", "draft", "archived")
      .default("draft")
      .messages({
        "any.only": "Status must be one of: active, draft, archived",
      }),
    isFeatured: Joi.boolean().default(false),
  }),
});

// Update product validation schema
const update = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
      }),
  }),
  body: Joi.object({
    name: Joi.string().min(3).max(200).messages({
      "string.min": "Product name must be at least 3 characters",
      "string.max": "Product name must not exceed 200 characters",
    }),
    sku: Joi.string(),
    description: Joi.object({
      short: Joi.string().max(500).allow(null, "").messages({
        "string.max": "Short description must not exceed 500 characters",
      }),
      long: Joi.string().max(5000).allow(null, "").messages({
        "string.max": "Long description must not exceed 5000 characters",
      }),
    }),
    price: Joi.object({
      regular: Joi.number().positive().messages({
        "number.positive": "Regular price must be positive",
      }),
      sale: Joi.number().positive().allow(null).messages({
        "number.positive": "Sale price must be positive",
      }),
      cost: Joi.number().positive().allow(null).messages({
        "number.positive": "Cost price must be positive",
      }),
      compareAt: Joi.number().positive().allow(null).messages({
        "number.positive": "Compare-at price must be positive",
      }),
    }),
    gstPercentage: Joi.number().min(0).max(100).messages({
      "number.min": "GST percentage must be a non-negative number",
      "number.max": "GST percentage cannot exceed 100",
    }),
    categories: Joi.array().items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid category ID format",
        })
    ),
    tags: Joi.array().items(Joi.string()),
    attributes: Joi.array().items(
      Joi.object({
        name: Joi.string().required().messages({
          "any.required": "Attribute name is required",
        }),
        value: Joi.string().required().messages({
          "any.required": "Attribute value is required",
        }),
        visible: Joi.boolean(),
      })
    ),
    variants: Joi.array().items(
      Joi.object({
        _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
        name: Joi.string(),
        sku: Joi.string(),
        price: Joi.object({
          regular: Joi.number().positive().messages({
            "number.positive": "Regular price must be positive",
          }),
          sale: Joi.number().positive().allow(null).messages({
            "number.positive": "Sale price must be positive",
          }),
        }),
        attributes: Joi.array().items(
          Joi.object({
            name: Joi.string().required().messages({
              "any.required": "Attribute name is required",
            }),
            value: Joi.string().required().messages({
              "any.required": "Attribute value is required",
            }),
          })
        ),
        inventory: Joi.object({
          quantity: Joi.number().integer().min(0).messages({
            "number.integer": "Quantity must be an integer",
            "number.min": "Quantity cannot be negative",
          }),
          lowStockThreshold: Joi.number().integer().min(1).messages({
            "number.integer": "Low stock threshold must be an integer",
            "number.min": "Low stock threshold must be at least 1",
          }),
        }),
        images: Joi.array().items(Joi.string()),
        isDefault: Joi.boolean(),
      })
    ),
    images: Joi.array().items(
      Joi.object({
        _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
        url: Joi.string(),
        alt: Joi.string().allow(null, ""),
        isDefault: Joi.boolean(),
      })
    ),
    seo: Joi.object({
      title: Joi.string().max(70).allow(null, "").messages({
        "string.max": "SEO title must not exceed 70 characters",
      }),
      description: Joi.string().max(160).allow(null, "").messages({
        "string.max": "SEO description must not exceed 160 characters",
      }),
      keywords: Joi.array().items(Joi.string()),
    }),
    related: Joi.array().items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid related product ID format",
        })
    ),
    inventory: Joi.object({
      quantity: Joi.number().integer().min(0).messages({
        "number.integer": "Quantity must be an integer",
        "number.min": "Quantity cannot be negative",
      }),
      lowStockThreshold: Joi.number().integer().min(1).messages({
        "number.integer": "Low stock threshold must be an integer",
        "number.min": "Low stock threshold must be at least 1",
      }),
    }),
    isBundle: Joi.boolean(),
    bundleProducts: Joi.array().items(
      Joi.object({
        product: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            "string.pattern.base": "Invalid product ID format",
            "any.required": "Product ID is required for bundle item",
          }),
        quantity: Joi.number().integer().min(1).messages({
          "number.integer": "Quantity must be an integer",
          "number.min": "Quantity must be at least 1",
        }),
        discount: Joi.number().min(0).max(100).messages({
          "number.min": "Discount must be a non-negative number",
          "number.max": "Discount cannot exceed 100%",
        }),
      })
    ),
    status: Joi.string().valid("active", "draft", "archived").messages({
      "any.only": "Status must be one of: active, draft, archived",
    }),
    isFeatured: Joi.boolean(),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
});

// Get products list validation schema
const list = Joi.object({
  query: Joi.object({
    search: Joi.string().allow(""),
    category: Joi.string().allow(""),
    priceMin: Joi.number().min(0),
    priceMax: Joi.number().min(0),
    status: Joi.string().valid("active", "draft", "archived"),
    tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    attributes: Joi.object().pattern(
      Joi.string(), // Key can be any string (attribute name)
      Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()) // Value can be string, number, or boolean
    ),
    inStock: Joi.boolean(),
    featured: Joi.boolean(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string().valid(
      "name",
      "-name",
      "price.regular",
      "-price.regular",
      "createdAt",
      "-createdAt"
    ),
  }),
});

// Delete product validation schema
const remove = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
      }),
  }),
});

module.exports = {
  create,
  update,
  list,
  remove,
};
