// src/api/categories/category.routes.js
const express = require("express");
const categoryController = require("./category.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const {
  upload,
  multerErrorHandler,
} = require("../../middleware/upload.middleware");
const { processImages } = require("../../middleware/imageProcessor.middleware");
const categoryValidator = require("../../utils/validators/category.validator");

const router = express.Router();

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get(
  "/",
  validationMiddleware(categoryValidator.list),
  categoryController.getCategories
);

/**
 * @route   GET /api/v1/categories/tree
 * @desc    Get category tree
 * @access  Public
 */
router.get("/tree", categoryController.getCategoryTree);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get(
  "/:id",
  validationMiddleware(categoryValidator.getById),
  categoryController.getCategoryById
);

/**
 * @route   GET /api/v1/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get(
  "/slug/:slug",
  validationMiddleware(categoryValidator.getBySlug),
  categoryController.getCategoryBySlug
);

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Private (Admin)
 */
router.post(
  "/",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(categoryValidator.create),
  categoryController.createCategory
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(categoryValidator.update),
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin"]),
  validationMiddleware(categoryValidator.remove),
  categoryController.deleteCategory
);

/**
 * @route   POST /api/v1/categories/:id/image
 * @desc    Upload category image
 * @access  Private (Admin)
 */
router.post(
  "/:id/image",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  upload.single("category-image"),
  multerErrorHandler,
  processImages,
  categoryController.uploadCategoryImage
);

module.exports = router;
