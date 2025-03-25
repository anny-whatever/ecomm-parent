const reviewService = require("../../services/review.service");
const { responseFormatter } = require("../../utils/responseFormatter");
const logger = require("../../config/logger");
const { ForbiddenError } = require("../../utils/errors");

/**
 * Create a new review
 * @route POST /api/v1/reviews
 * @access Private
 */
const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.body, req.user._id);
    return res.status(201).json(
      responseFormatter(true, "Review submitted successfully", {
        review,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a product
 * @route GET /api/v1/reviews/product/:productId
 * @access Public
 */
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page, limit, sort, status } = req.query;

    const result = await reviewService.getProductReviews(productId, {
      page,
      limit,
      sort,
      status: status === "all" ? undefined : status,
    });

    return res.status(200).json(
      responseFormatter(true, "Product reviews retrieved successfully", {
        reviews: result.reviews,
        pagination: result.pagination,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get review statistics for a product
 * @route GET /api/v1/reviews/product/:productId/stats
 * @access Public
 */
const getProductReviewStats = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const stats = await reviewService.getProductReviewStats(productId);

    return res.status(200).json(
      responseFormatter(true, "Review statistics retrieved successfully", {
        stats,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews by current user
 * @route GET /api/v1/reviews/my-reviews
 * @access Private
 */
const getMyReviews = async (req, res, next) => {
  try {
    const { page, limit, sort } = req.query;
    const result = await reviewService.getUserReviews(req.user._id, {
      page,
      limit,
      sort,
    });

    return res.status(200).json(
      responseFormatter(true, "User reviews retrieved successfully", {
        reviews: result.reviews,
        pagination: result.pagination,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a review by ID
 * @route GET /api/v1/reviews/:id
 * @access Public
 */
const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);

    return res.status(200).json(
      responseFormatter(true, "Review retrieved successfully", {
        review,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update a review
 * @route PUT /api/v1/reviews/:id
 * @access Private
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.updateReview(
      id,
      req.body,
      req.user._id,
      req.user.role
    );

    return res.status(200).json(
      responseFormatter(true, "Review updated successfully", {
        review,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a review
 * @route DELETE /api/v1/reviews/:id
 * @access Private
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await reviewService.deleteReview(
      id,
      req.user._id,
      req.user.role
    );

    return res.status(200).json(responseFormatter(true, result.message));
  } catch (error) {
    next(error);
  }
};

/**
 * Update review status (admin only)
 * @route PATCH /api/v1/reviews/:id/status
 * @access Private (Admin)
 */
const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Verify user has admin/manager role (should be enforced by RBAC middleware as well)
    if (!["admin", "manager"].includes(req.user.role)) {
      throw new ForbiddenError("Not authorized to update review status");
    }

    const review = await reviewService.updateReviewStatus(id, status);

    return res.status(200).json(
      responseFormatter(true, "Review status updated successfully", {
        review,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add admin reply to a review
 * @route POST /api/v1/reviews/:id/reply
 * @access Private (Admin)
 */
const addAdminReply = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify user has admin/manager role (should be enforced by RBAC middleware as well)
    if (!["admin", "manager"].includes(req.user.role)) {
      throw new ForbiddenError("Not authorized to reply to reviews");
    }

    const review = await reviewService.addAdminReply(
      id,
      req.body,
      req.user._id
    );

    return res.status(200).json(
      responseFormatter(true, "Reply added successfully", {
        review,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Vote a review as helpful
 * @route POST /api/v1/reviews/:id/helpful
 * @access Public
 */
const voteReviewHelpful = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.voteReviewHelpful(id);

    return res.status(200).json(
      responseFormatter(true, "Vote recorded successfully", {
        helpfulVotes: review.helpfulVotes,
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getProductReviewStats,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
  updateReviewStatus,
  addAdminReply,
  voteReviewHelpful,
}; 