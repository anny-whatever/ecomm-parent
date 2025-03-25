const Joi = require("joi");
const mongoose = require("mongoose");

// Helper to validate ObjectId
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

// Validate ID parameter
const getById = {
  params: Joi.object({
    id: Joi.string().custom(objectId, "Valid MongoDB ID").required(),
  }),
};

// Validate product ID parameter
const getByProduct = {
  params: Joi.object({
    productId: Joi.string().custom(objectId, "Valid MongoDB ID").required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    sort: Joi.string().valid("createdAt", "-createdAt", "rating", "-rating", "helpfulVotes", "-helpfulVotes").default("-createdAt"),
    status: Joi.string().valid("pending", "approved", "rejected", "all"),
  }),
};

// Validate create review
const createReview = {
  body: Joi.object({
    product: Joi.string().custom(objectId, "Valid MongoDB ID").required(),
    title: Joi.string().min(3).max(100).required(),
    content: Joi.string().min(10).max(2000).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().allow("", null),
      })
    ).max(5),
  }),
};

// Validate update review
const updateReview = {
  params: Joi.object({
    id: Joi.string().custom(objectId, "Valid MongoDB ID").required(),
  }),
  body: Joi.object({
    title: Joi.string().min(3).max(100),
    content: Joi.string().min(10).max(2000),
    rating: Joi.number().integer().min(1).max(5),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().allow("", null),
      })
    ).max(5),
    status: Joi.string().valid("pending", "approved", "rejected"),
  }),
};

// Validate update review status
const updateReviewStatus = {
  params: Joi.object({
    id: Joi.string().custom(objectId, "Valid MongoDB ID").required(),
  }),
  body: Joi.object({
    status: Joi.string().valid("pending", "approved", "rejected").required(),
  }),
};

// Validate add admin reply
const addAdminReply = {
  params: Joi.object({
    id: Joi.string().custom(objectId, "Valid MongoDB ID").required(),
  }),
  body: Joi.object({
    content: Joi.string().min(10).max(1000).required(),
  }),
};

// Validate helpful vote
const voteHelpful = {
  params: Joi.object({
    id: Joi.string().custom(objectId, "Valid MongoDB ID").required(),
  }),
};

// Validate user reviews query
const getUserReviews = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    sort: Joi.string().valid("createdAt", "-createdAt", "rating", "-rating").default("-createdAt"),
  }),
};

module.exports = {
  getById,
  getByProduct,
  createReview,
  updateReview,
  updateReviewStatus,
  addAdminReply,
  voteHelpful,
  getUserReviews,
}; 