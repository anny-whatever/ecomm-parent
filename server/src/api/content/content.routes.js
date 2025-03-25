// src/api/content/content.routes.js
const express = require("express");
const contentController = require("./content.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const {
  upload,
  multerErrorHandler,
} = require("../../middleware/upload.middleware");
const { processImages } = require("../../middleware/imageProcessor.middleware");
const contentValidator = require("../../utils/validators/content.validator");

const router = express.Router();

// Public routes

/**
 * @route   GET /api/v1/content/homepage
 * @desc    Get homepage content
 * @access  Public
 */
router.get("/homepage", contentController.getHomepage);

/**
 * @route   GET /api/v1/content/published/:type
 * @desc    List published content of a specific type
 * @access  Public
 */
router.get(
  "/published/:type",
  validationMiddleware(contentValidator.listPublished),
  contentController.listPublishedContent
);

/**
 * @route   GET /api/v1/content/categories/:type
 * @desc    Get content categories
 * @access  Public
 */
router.get(
  "/categories/:type",
  validationMiddleware(contentValidator.getByType),
  contentController.getContentCategories
);

/**
 * @route   GET /api/v1/content/tags/:type
 * @desc    Get content tags
 * @access  Public
 */
router.get(
  "/tags/:type",
  validationMiddleware(contentValidator.getByType),
  contentController.getContentTags
);

/**
 * @route   GET /api/v1/content/recent/:type
 * @desc    Get recent content
 * @access  Public
 */
router.get(
  "/recent/:type",
  validationMiddleware(contentValidator.getByType),
  contentController.getRecentContent
);

/**
 * @route   GET /api/v1/content/popular/:type
 * @desc    Get popular content
 * @access  Public
 */
router.get(
  "/popular/:type",
  validationMiddleware(contentValidator.getByType),
  contentController.getPopularContent
);

/**
 * @route   GET /api/v1/content/:id/related
 * @desc    Get related content
 * @access  Public
 */
router.get(
  "/:id/related",
  validationMiddleware(contentValidator.getById),
  contentController.getRelatedContent
);

/**
 * @route   GET /api/v1/content/menu
 * @desc    Get menu items
 * @access  Public
 */
router.get("/menu", contentController.getMenuItems);

/**
 * @route   GET /api/v1/content/footer
 * @desc    Get footer items
 * @access  Public
 */
router.get("/footer", contentController.getFooterItems);

/**
 * @route   GET /api/v1/content/:type/:slug
 * @desc    Get content by slug and type
 * @access  Public
 */
router.get(
  "/:type/:slug",
  validationMiddleware(contentValidator.getBySlug),
  contentController.getContentBySlug
);

// Admin routes - these require authentication

/**
 * @route   GET /api/v1/content
 * @desc    List all content with filtering
 * @access  Private (Admin)
 */
router.get(
  "/",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(contentValidator.list),
  contentController.listContent
);

/**
 * @route   POST /api/v1/content
 * @desc    Create new content
 * @access  Private (Admin)
 */
router.post(
  "/",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(contentValidator.create),
  contentController.createContent
);

/**
 * @route   GET /api/v1/content/:id
 * @desc    Get content by ID
 * @access  Private (Admin)
 */
router.get(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(contentValidator.getById),
  contentController.getContentById
);

/**
 * @route   PUT /api/v1/content/:id
 * @desc    Update content
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(contentValidator.update),
  contentController.updateContent
);

/**
 * @route   DELETE /api/v1/content/:id
 * @desc    Delete content
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin"]),
  validationMiddleware(contentValidator.remove),
  contentController.deleteContent
);

/**
 * @route   POST /api/v1/content/:id/image
 * @desc    Upload content image
 * @access  Private (Admin)
 */
router.post(
  "/:id/image",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(contentValidator.getById),
  upload.single("content-image"),
  multerErrorHandler,
  processImages,
  contentController.uploadContentImage
);

module.exports = router;
