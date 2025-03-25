const mongoose = require("mongoose");
const Review = require("../models/review.model");
const Order = require("../models/order.model");
const { NotFoundError, ForbiddenError } = require("../utils/errors");

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Created review
 */
const createReview = async (reviewData, userId) => {
  // Check if user has purchased the product
  const hasOrdered = await Order.exists({
    user: userId,
    "items.product": reviewData.product,
    status: "delivered",
  });

  // Create the review with verified purchase flag
  const review = new Review({
    ...reviewData,
    user: userId,
    isVerifiedPurchase: !!hasOrdered,
  });

  await review.save();
  return review.populate([
    { path: "user", select: "profile.firstName profile.lastName profile.avatar" },
    { path: "product", select: "name slug images" },
  ]);
};

/**
 * Get reviews for a product
 * @param {String} productId - Product ID
 * @param {Object} options - Pagination and filter options
 * @returns {Promise<Object>} Reviews and metadata
 */
const getProductReviews = async (productId, options = {}) => {
  const { page = 1, limit = 10, sort = "-createdAt", status = "approved" } = options;
  
  const query = { product: productId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate({ path: "user", select: "profile.firstName profile.lastName profile.avatar" })
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(query),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get reviews by a user
 * @param {String} userId - User ID
 * @param {Object} options - Pagination and filter options
 * @returns {Promise<Object>} Reviews and metadata
 */
const getUserReviews = async (userId, options = {}) => {
  const { page = 1, limit = 10, sort = "-createdAt" } = options;
  
  const query = { user: userId };
  
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate({ path: "product", select: "name slug images" })
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(query),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a review by ID
 * @param {String} reviewId - Review ID
 * @returns {Promise<Object>} Review
 */
const getReviewById = async (reviewId) => {
  const review = await Review.findById(reviewId)
    .populate({ path: "user", select: "profile.firstName profile.lastName profile.avatar" })
    .populate({ path: "product", select: "name slug images" });

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  return review;
};

/**
 * Update a review
 * @param {String} reviewId - Review ID
 * @param {Object} updateData - Data to update
 * @param {String} userId - User ID (for access control)
 * @param {String} userRole - User role
 * @returns {Promise<Object>} Updated review
 */
const updateReview = async (reviewId, updateData, userId, userRole) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new NotFoundError("Review not found");
  }

  // Only the review author or admins/managers can update
  if (review.user.toString() !== userId && !["admin", "manager"].includes(userRole)) {
    throw new ForbiddenError("You are not authorized to update this review");
  }

  // If regular user, only allow updating certain fields
  if (!["admin", "manager"].includes(userRole)) {
    const allowedFields = ["title", "content", "rating", "images"];
    Object.keys(updateData).forEach((key) => {
      if (!allowedFields.includes(key)) {
        delete updateData[key];
      }
    });
  }

  // Update the review
  Object.assign(review, updateData);
  await review.save();

  return review.populate([
    { path: "user", select: "profile.firstName profile.lastName profile.avatar" },
    { path: "product", select: "name slug images" },
  ]);
};

/**
 * Delete a review
 * @param {String} reviewId - Review ID
 * @param {String} userId - User ID (for access control)
 * @param {String} userRole - User role
 * @returns {Promise<Object>} Deletion result
 */
const deleteReview = async (reviewId, userId, userRole) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new NotFoundError("Review not found");
  }

  // Only the review author or admins/managers can delete
  if (review.user.toString() !== userId && !["admin", "manager"].includes(userRole)) {
    throw new ForbiddenError("You are not authorized to delete this review");
  }

  await review.remove();
  return { success: true, message: "Review deleted successfully" };
};

/**
 * Update review status (admin only)
 * @param {String} reviewId - Review ID
 * @param {String} status - New status
 * @returns {Promise<Object>} Updated review
 */
const updateReviewStatus = async (reviewId, status) => {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { status },
    { new: true }
  ).populate([
    { path: "user", select: "profile.firstName profile.lastName profile.avatar" },
    { path: "product", select: "name slug images" },
  ]);

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  return review;
};

/**
 * Add admin reply to a review
 * @param {String} reviewId - Review ID
 * @param {Object} replyData - Reply data
 * @param {String} adminId - Admin ID
 * @returns {Promise<Object>} Updated review
 */
const addAdminReply = async (reviewId, replyData, adminId) => {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    {
      adminReply: {
        content: replyData.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        admin: adminId,
      },
    },
    { new: true }
  ).populate([
    { path: "user", select: "profile.firstName profile.lastName profile.avatar" },
    { path: "product", select: "name slug images" },
    { path: "adminReply.admin", select: "profile.firstName profile.lastName" },
  ]);

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  return review;
};

/**
 * Vote a review as helpful
 * @param {String} reviewId - Review ID
 * @returns {Promise<Object>} Updated review
 */
const voteReviewHelpful = async (reviewId) => {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { $inc: { helpfulVotes: 1 } },
    { new: true }
  );

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  return review;
};

/**
 * Get review statistics for a product
 * @param {String} productId - Product ID
 * @returns {Promise<Object>} Review statistics
 */
const getProductReviewStats = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), status: "approved" } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  // Organize stats by rating
  const ratingStats = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  stats.forEach((stat) => {
    ratingStats[stat._id] = stat.count;
  });

  const totalReviews = Object.values(ratingStats).reduce((sum, count) => sum + count, 0);

  return {
    ratingBreakdown: ratingStats,
    totalReviews,
  };
};

module.exports = {
  createReview,
  getProductReviews,
  getUserReviews,
  getReviewById,
  updateReview,
  deleteReview,
  updateReviewStatus,
  addAdminReply,
  voteReviewHelpful,
  getProductReviewStats,
}; 