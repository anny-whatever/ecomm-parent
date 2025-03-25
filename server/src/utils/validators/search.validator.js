const Joi = require("joi");
const mongoose = require("mongoose");

// Helper to validate ObjectId
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

// Schema for searching products with advanced filtering
const searchProducts = Joi.object({
  query: Joi.object({
    keyword: Joi.string().allow('').optional(),
    category: Joi.alternatives().try(
      Joi.string().allow('').optional(),
      Joi.array().items(Joi.string())
    ),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    sort: Joi.string().valid('price_asc', 'price_desc', 'newest', 'rating', 'popularity').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    tags: Joi.alternatives().try(
      Joi.string().allow('').optional(),
      Joi.array().items(Joi.string())
    ),
    attributes: Joi.alternatives().try(
      Joi.string().allow('').optional(),
      Joi.object().pattern(Joi.string(), Joi.string())
    ),
    inStock: Joi.boolean().optional(),
    onSale: Joi.boolean().optional()
  })
});

// Schema for global search
const globalSearch = Joi.object({
  query: Joi.object({
    keyword: Joi.string().required().min(2).max(100),
    entities: Joi.alternatives().try(
      Joi.string().valid('products', 'categories', 'users', 'orders', 'reviews'),
      Joi.array().items(Joi.string().valid('products', 'categories', 'users', 'orders', 'reviews'))
    ).default('products'),
    limit: Joi.number().integer().min(1).max(20).default(10)
  })
});

// Schema for autocomplete
const autocomplete = Joi.object({
  query: Joi.object({
    query: Joi.string().required().min(1).max(100),
    limit: Joi.number().integer().min(1).max(10).default(5)
  })
});

module.exports = {
  searchProducts,
  globalSearch,
  autocomplete
}; 