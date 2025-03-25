const Joi = require("joi");
const mongoose = require("mongoose");

// Helper to validate ObjectId
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

// Validate product search
const searchProducts = {
  query: Joi.object({
    keyword: Joi.string().trim().allow(""),
    category: Joi.alternatives().try(
      Joi.string().custom(objectId, "Valid MongoDB ID"),
      Joi.array().items(Joi.string().custom(objectId, "Valid MongoDB ID"))
    ),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    rating: Joi.number().min(0).max(5),
    availability: Joi.string().valid("in_stock", "out_of_stock", "low_stock"),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    sortBy: Joi.string().valid(
      "relevance",
      "price_asc",
      "price_desc",
      "newest",
      "rating",
      "popularity"
    ),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    featured: Joi.boolean(),
    status: Joi.string(), // Admin-only filter
  }).unknown(true), // Allow additional attributes for dynamic filtering
};

// Validate global search
const globalSearch = {
  query: Joi.object({
    keyword: Joi.string().trim().required(),
    entities: Joi.alternatives().try(
      Joi.string().valid("products", "categories", "users", "orders", "reviews"),
      Joi.array().items(
        Joi.string().valid("products", "categories", "users", "orders", "reviews")
      )
    ).default("products"),
    limit: Joi.number().integer().min(1).max(20).default(5),
  }),
};

// Validate autocomplete
const autocomplete = {
  query: Joi.object({
    query: Joi.string().trim().min(1).required(),
    limit: Joi.number().integer().min(1).max(20).default(10),
  }),
};

module.exports = {
  searchProducts,
  globalSearch,
  autocomplete,
}; 