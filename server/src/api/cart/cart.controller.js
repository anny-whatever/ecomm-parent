// src/api/cart/cart.controller.js
const cartService = require("../../services/cart.service");
const { responseFormatter } = require("../../utils/responseFormatter");
const logger = require("../../config/logger");
const crypto = require("crypto");

/**
 * Helper to get cart identifiers from request
 * @param {Object} req - Express request object
 * @returns {Object} Cart identifiers (userId or guestId)
 */
const getCartIdentifiers = (req) => {
  // If user is authenticated, use userId
  if (req.user) {
    return { userId: req.user._id };
  }

  // Otherwise, use or create guestId from session or cookies
  let guestId = req.cookies.guestId;

  if (!guestId) {
    // Generate a random guest ID
    guestId = crypto.randomBytes(16).toString("hex");

    // Set as cookie for future requests
    req.res.cookie("guestId", guestId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }

  return { guestId };
};

/**
 * Get cart
 * @route GET /api/v1/cart
 * @access Public
 */
const getCart = async (req, res, next) => {
  try {
    const identifiers = getCartIdentifiers(req);
    const cart = await cartService.getOrCreateCart(identifiers);

    return res
      .status(200)
      .json(responseFormatter(true, "Cart retrieved successfully", { cart }));
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * @route POST /api/v1/cart/items
 * @access Public
 */
const addItemToCart = async (req, res, next) => {
  try {
    const identifiers = getCartIdentifiers(req);
    const cart = await cartService.addItemToCart(identifiers, req.body);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Item added to cart successfully", { cart })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 * @route PUT /api/v1/cart/items/:itemId
 * @access Public
 */
const updateCartItemQuantity = async (req, res, next) => {
  try {
    const identifiers = getCartIdentifiers(req);
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateCartItemQuantity(
      identifiers,
      itemId,
      quantity
    );

    return res.status(200).json(
      responseFormatter(true, "Cart item quantity updated successfully", {
        cart,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * @route DELETE /api/v1/cart/items/:itemId
 * @access Public
 */
const removeCartItem = async (req, res, next) => {
  try {
    const identifiers = getCartIdentifiers(req);
    const { itemId } = req.params;

    const cart = await cartService.removeCartItem(identifiers, itemId);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Item removed from cart successfully", { cart })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 * @route DELETE /api/v1/cart
 * @access Public
 */
const clearCart = async (req, res, next) => {
  try {
    const identifiers = getCartIdentifiers(req);
    const cart = await cartService.clearCart(identifiers);

    return res
      .status(200)
      .json(responseFormatter(true, "Cart cleared successfully", { cart }));
  } catch (error) {
    next(error);
  }
};

/**
 * Apply coupon to cart
 * @route POST /api/v1/cart/coupon
 * @access Public
 */
const applyCoupon = async (req, res, next) => {
  try {
    const identifiers = getCartIdentifiers(req);
    const { couponCode } = req.body;

    const cart = await cartService.applyCoupon(identifiers, couponCode);

    return res
      .status(200)
      .json(responseFormatter(true, "Coupon applied successfully", { cart }));
  } catch (error) {
    next(error);
  }
};

/**
 * Remove coupon from cart
 * @route DELETE /api/v1/cart/coupon
 * @access Public
 */
const removeCoupon = async (req, res, next) => {
  try {
    const identifiers = getCartIdentifiers(req);
    const cart = await cartService.removeCoupon(identifiers);

    return res
      .status(200)
      .json(responseFormatter(true, "Coupon removed successfully", { cart }));
  } catch (error) {
    next(error);
  }
};

/**
 * Add shipping method to cart
 * @route POST /api/v1/cart/shipping
 * @access Public
 */
const addShippingMethod = async (req, res, next) => {
  try {
    const identifiers = getCartIdentifiers(req);
    const cart = await cartService.addShippingMethod(identifiers, req.body);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Shipping method added successfully", { cart })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Add notes to cart
 * @route POST /api/v1/cart/notes
 * @access Public
 */
const addCartNotes = async (req, res, next) => {
  try {
    const identifiers = getCartIdentifiers(req);
    const { notes } = req.body;

    const cart = await cartService.addCartNotes(identifiers, notes);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Notes added to cart successfully", { cart })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Merge guest cart with user cart after login
 * @route POST /api/v1/cart/merge
 * @access Private
 */
const mergeGuestCart = async (req, res, next) => {
  try {
    // Check for guest ID in cookies
    const guestId = req.cookies.guestId;

    if (!guestId) {
      return res
        .status(200)
        .json(responseFormatter(true, "No guest cart to merge"));
    }

    // Merge carts
    const cart = await cartService.mergeGuestCart(guestId, req.user._id);

    // Clear guest ID cookie
    res.clearCookie("guestId");

    return res
      .status(200)
      .json(
        responseFormatter(
          true,
          cart ? "Carts merged successfully" : "No guest cart to merge",
          cart ? { cart } : undefined
        )
      );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  addShippingMethod,
  addCartNotes,
  mergeGuestCart,
};
