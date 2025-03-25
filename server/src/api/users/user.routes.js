// src/api/users/user.routes.js
const express = require("express");
const userController = require("./user.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const userValidator = require("../../utils/validators/user.validator");
const {
  upload,
  multerErrorHandler,
} = require("../../middleware/upload.middleware");
const { processImages } = require("../../middleware/image.middleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get("/profile", userController.getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  "/profile",
  validationMiddleware(userValidator.updateProfile),
  userController.updateProfile
);

/**
 * @route   POST /api/v1/users/profile/avatar
 * @desc    Upload profile avatar
 * @access  Private
 */
router.post(
  "/profile/avatar",
  upload.single("user-avatar"),
  multerErrorHandler,
  processImages,
  userController.uploadAvatar
);

/**
 * @route   GET /api/v1/users/addresses
 * @desc    Get all user addresses
 * @access  Private
 */
router.get("/addresses", userController.getAddresses);

/**
 * @route   POST /api/v1/users/addresses
 * @desc    Add a new address
 * @access  Private
 */
router.post(
  "/addresses",
  validationMiddleware(userValidator.addAddress),
  userController.addAddress
);

/**
 * @route   PUT /api/v1/users/addresses/:addressId
 * @desc    Update an address
 * @access  Private
 */
router.put(
  "/addresses/:addressId",
  validationMiddleware(userValidator.updateAddress),
  userController.updateAddress
);

/**
 * @route   DELETE /api/v1/users/addresses/:addressId
 * @desc    Delete an address
 * @access  Private
 */
router.delete(
  "/addresses/:addressId",
  validationMiddleware(userValidator.deleteAddress),
  userController.deleteAddress
);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put(
  "/preferences",
  validationMiddleware(userValidator.updatePreferences),
  userController.updatePreferences
);

/**
 * @route   GET /api/v1/users/wishlist
 * @desc    Get user wishlist
 * @access  Private
 */
router.get("/wishlist", userController.getWishlist);

/**
 * @route   POST /api/v1/users/wishlist
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post(
  "/wishlist",
  validationMiddleware(userValidator.addToWishlist),
  userController.addToWishlist
);

/**
 * @route   DELETE /api/v1/users/wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete(
  "/wishlist/:productId",
  validationMiddleware(userValidator.removeFromWishlist),
  userController.removeFromWishlist
);

/**
 * @route   GET /api/v1/users/recently-viewed
 * @desc    Get recently viewed products
 * @access  Private
 */
router.get("/recently-viewed", userController.getRecentlyViewed);

module.exports = router;
