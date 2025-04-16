// src/api/products/product.routes.js
const express = require("express");
const productController = require("./product.controller");
const { authMiddleware } = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const {
  upload,
  multerErrorHandler,
} = require("../../middleware/upload.middleware");
const { processImages } = require("../../middleware/imageProcessor.middleware");
const productValidator = require("../../utils/validators/product.validator");

const router = express.Router();

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with filtering
 * @access  Public
 */
router.get(
  "/",
  validationMiddleware(productValidator.list),
  productController.getProducts
);

/**
 * @route   GET /api/v1/products/new-arrivals
 * @desc    Get new arrivals (recently added products)
 * @access  Public
 */
router.get("/new-arrivals", productController.getNewArrivals);

/**
 * @route   GET /api/v1/products/:idOrSlug
 * @desc    Get product by ID or slug
 * @access  Public
 */
router.get("/:idOrSlug", productController.getProductDetail);

/**
 * @route   GET /api/v1/products/:id/related
 * @desc    Get related products
 * @access  Public
 */
router.get("/:id/related", productController.getRelatedProducts);

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product
 * @access  Private (Admin)
 */
router.post(
  "/",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(productValidator.create),
  productController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(productValidator.update),
  productController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin"]),
  validationMiddleware(productValidator.remove),
  productController.deleteProduct
);

/**
 * @route   POST /api/v1/products/:productId/images
 * @desc    Upload product images
 * @access  Private (Admin)
 */
router.post(
  "/:productId/images",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  upload.array("product-images", 10),
  multerErrorHandler,
  processImages,
  productController.uploadProductImages
);

/**
 * @route   DELETE /api/v1/products/:productId/images/:imageIndex
 * @desc    Delete product image
 * @access  Private (Admin)
 */
router.delete(
  "/:productId/images/:imageIndex",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  productController.deleteProductImage
);

module.exports = router;
