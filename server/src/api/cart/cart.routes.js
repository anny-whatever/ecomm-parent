// src/api/cart/cart.routes.js
const express = require("express");
const cartController = require("./cart.controller");
const { authMiddleware } = require("../../middleware/auth.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const cartValidator = require("../../utils/validators/cart.validator");

const router = express.Router();

/**
 * @route   GET /api/v1/cart
 * @desc    Get cart
 * @access  Public
 */
router.get("/", cartController.getCart);

/**
 * @route   POST /api/v1/cart/items
 * @desc    Add item to cart
 * @access  Public
 */
router.post(
  "/items",
  validationMiddleware(cartValidator.addItem),
  cartController.addItemToCart
);

/**
 * @route   PUT /api/v1/cart/items/:itemId
 * @desc    Update cart item quantity
 * @access  Public
 */
router.put(
  "/items/:itemId",
  validationMiddleware(cartValidator.updateQuantity),
  cartController.updateCartItemQuantity
);

/**
 * @route   DELETE /api/v1/cart/items/:itemId
 * @desc    Remove item from cart
 * @access  Public
 */
router.delete(
  "/items/:itemId",
  validationMiddleware(cartValidator.removeItem),
  cartController.removeCartItem
);

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear cart
 * @access  Public
 */
router.delete("/", cartController.clearCart);

/**
 * @route   POST /api/v1/cart/coupon
 * @desc    Apply coupon to cart
 * @access  Public
 */
router.post(
  "/coupon",
  validationMiddleware(cartValidator.applyCoupon),
  cartController.applyCoupon
);

/**
 * @route   DELETE /api/v1/cart/coupon
 * @desc    Remove coupon from cart
 * @access  Public
 */
router.delete("/coupon", cartController.removeCoupon);

/**
 * @route   POST /api/v1/cart/shipping
 * @desc    Add shipping method to cart
 * @access  Public
 */
router.post(
  "/shipping",
  validationMiddleware(cartValidator.addShipping),
  cartController.addShippingMethod
);

/**
 * @route   POST /api/v1/cart/notes
 * @desc    Add notes to cart
 * @access  Public
 */
router.post(
  "/notes",
  validationMiddleware(cartValidator.addNotes),
  cartController.addCartNotes
);

/**
 * @route   POST /api/v1/cart/merge
 * @desc    Merge guest cart with user cart
 * @access  Private
 */
router.post("/merge", authMiddleware, cartController.mergeGuestCart);

module.exports = router;
