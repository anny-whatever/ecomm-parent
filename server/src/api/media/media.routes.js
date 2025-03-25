// src/api/media/media.routes.js
const express = require("express");
const mediaController = require("./media.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const {
  upload,
  multerErrorHandler,
} = require("../../middleware/upload.middleware");
const { processImages } = require("../../middleware/imageProcessor.middleware");
const mediaValidator = require("../../utils/validators/media.validator");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/media/folders
 * @desc    Get media folders
 * @access  Private (Admin)
 */
router.get(
  "/folders",
  rbacMiddleware(["admin", "manager"]),
  mediaController.getMediaFolders
);

/**
 * @route   GET /api/v1/media/tags
 * @desc    Get media tags
 * @access  Private (Admin)
 */
router.get(
  "/tags",
  rbacMiddleware(["admin", "manager"]),
  mediaController.getMediaTags
);

/**
 * @route   GET /api/v1/media/stats
 * @desc    Get media stats
 * @access  Private (Admin)
 */
router.get(
  "/stats",
  rbacMiddleware(["admin", "manager"]),
  mediaController.getMediaStats
);

/**
 * @route   GET /api/v1/media/content/:contentId
 * @desc    Get media by content
 * @access  Private (Admin)
 */
router.get(
  "/content/:contentId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(mediaValidator.getByContentId),
  mediaController.getMediaByContent
);

/**
 * @route   GET /api/v1/media/product/:productId
 * @desc    Get media by product
 * @access  Private (Admin)
 */
router.get(
  "/product/:productId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(mediaValidator.getByProductId),
  mediaController.getMediaByProduct
);

/**
 * @route   DELETE /api/v1/media/bulk
 * @desc    Bulk delete media
 * @access  Private (Admin)
 */
router.delete(
  "/bulk",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(mediaValidator.bulkDelete),
  mediaController.bulkDeleteMedia
);

/**
 * @route   GET /api/v1/media
 * @desc    List media with filtering
 * @access  Private (Admin)
 */
router.get(
  "/",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(mediaValidator.list),
  mediaController.listMedia
);

/**
 * @route   POST /api/v1/media
 * @desc    Upload media
 * @access  Private (Admin)
 */
router.post(
  "/",
  rbacMiddleware(["admin", "manager"]),
  upload.single("file"),
  multerErrorHandler,
  processImages,
  mediaController.uploadMedia
);

/**
 * @route   GET /api/v1/media/:id
 * @desc    Get media by ID
 * @access  Private (Admin)
 */
router.get(
  "/:id",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(mediaValidator.getById),
  mediaController.getMediaById
);

/**
 * @route   PUT /api/v1/media/:id
 * @desc    Update media
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(mediaValidator.update),
  mediaController.updateMedia
);

/**
 * @route   DELETE /api/v1/media/:id
 * @desc    Delete media
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(mediaValidator.remove),
  mediaController.deleteMedia
);

module.exports = router;
