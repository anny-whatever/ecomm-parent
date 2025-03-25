const express = require("express");
const reviewController = require("./review.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const { optionalAuth } = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const reviewValidator = require("../../utils/validators/review.validator");
const {
  upload,
  multerErrorHandler,
} = require("../../middleware/upload.middleware");

const router = express.Router();

/**
 * @route   POST /api/v1/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post(
  "/",
  authMiddleware,
  validationMiddleware(reviewValidator.createReview),
  reviewController.createReview
);

/**
 * @route   GET /api/v1/reviews/product/:productId
 * @desc    Get reviews for a product
 * @access  Public
 */
router.get(
  "/product/:productId",
  validationMiddleware(reviewValidator.getByProduct),
  reviewController.getProductReviews
);

/**
 * @route   GET /api/v1/reviews/product/:productId/stats
 * @desc    Get review statistics for a product
 * @access  Public
 */
router.get(
  "/product/:productId/stats",
  validationMiddleware(reviewValidator.getById),
  reviewController.getProductReviewStats
);

/**
 * @route   GET /api/v1/reviews/my-reviews
 * @desc    Get reviews by current user
 * @access  Private
 */
router.get(
  "/my-reviews",
  authMiddleware,
  validationMiddleware(reviewValidator.getUserReviews),
  reviewController.getMyReviews
);

/**
 * @route   GET /api/v1/reviews/:id
 * @desc    Get a review by ID
 * @access  Public
 */
router.get(
  "/:id",
  validationMiddleware(reviewValidator.getById),
  reviewController.getReviewById
);

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update a review
 * @access  Private
 */
router.put(
  "/:id",
  authMiddleware,
  validationMiddleware(reviewValidator.updateReview),
  reviewController.updateReview
);

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete a review
 * @access  Private
 */
router.delete(
  "/:id",
  authMiddleware,
  validationMiddleware(reviewValidator.getById),
  reviewController.deleteReview
);

/**
 * @route   PATCH /api/v1/reviews/:id/status
 * @desc    Update review status (admin only)
 * @access  Private (Admin)
 */
router.patch(
  "/:id/status",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(reviewValidator.updateReviewStatus),
  reviewController.updateReviewStatus
);

/**
 * @route   POST /api/v1/reviews/:id/reply
 * @desc    Add admin reply to a review
 * @access  Private (Admin)
 */
router.post(
  "/:id/reply",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(reviewValidator.addAdminReply),
  reviewController.addAdminReply
);

/**
 * @route   POST /api/v1/reviews/:id/helpful
 * @desc    Vote a review as helpful
 * @access  Public
 */
router.post(
  "/:id/helpful",
  validationMiddleware(reviewValidator.voteHelpful),
  reviewController.voteReviewHelpful
);

/**
 * @route   POST /api/v1/reviews/:id/images
 * @desc    Upload images for a review
 * @access  Private
 */
router.post(
  "/:id/images",
  authMiddleware,
  validationMiddleware(reviewValidator.getById),
  upload.array("review-images", 5),
  multerErrorHandler,
  (req, res) => {
    // Return the file paths
    const fileUrls = req.files.map((file) => ({
      url: `/${file.path.replace(/\\/g, "/")}`,
      alt: req.body.alt || "",
    }));
    
    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      images: fileUrls,
    });
  }
);

module.exports = router; 