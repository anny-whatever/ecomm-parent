// src/services/cart.service.js
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const promotionService = require("./promotion.service"); // Import promotion service
const { NotFoundError, BadRequestError } = require("../utils/errorTypes");
const logger = require("../config/logger");

/**
 * Get or create a cart for a user or guest
 * @param {Object} identifiers - Cart identifiers (userId or guestId)
 * @param {String} identifiers.userId - User ID
 * @param {String} identifiers.guestId - Guest ID
 * @returns {Promise<Object>} Cart object
 */
const getOrCreateCart = async ({ userId, guestId }) => {
  try {
    let cart;

    // Use either userId or guestId, but not both
    const query = userId ? { user: userId } : { guestId };

    cart = await Cart.findOne(query);

    if (!cart) {
      cart = new Cart(
        userId ? { user: userId, items: [] } : { guestId, items: [] }
      );
      await cart.save();
    }

    return cart;
  } catch (error) {
    logger.error("Error getting or creating cart:", error);
    throw error;
  }
};

/**
 * Get cart by ID
 * @param {String} cartId - Cart ID
 * @returns {Promise<Object>} Cart object
 */
const getCartById = async (cartId) => {
  try {
    const cart = await Cart.findById(cartId).populate({
      path: "items.product",
      select: "name price images inventory status",
    });

    if (!cart) {
      throw new NotFoundError("Cart not found");
    }

    return cart;
  } catch (error) {
    logger.error(`Error getting cart by ID ${cartId}:`, error);
    throw error;
  }
};

/**
 * Add an item to cart
 * @param {Object} identifiers - Cart identifiers (userId or guestId)
 * @param {Object} itemData - Item data
 * @returns {Promise<Object>} Updated cart
 */
const addItemToCart = async (identifiers, itemData) => {
  try {
    // Validate product
    const product = await Product.findById(itemData.productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (product.status !== "active") {
      throw new BadRequestError("Product is not available for purchase");
    }

    // Initialize item details
    const newItem = {
      product: product._id,
      name: product.name,
      price: product.price.sale || product.price.regular,
      quantity: itemData.quantity || 1,
      gstPercentage: product.gstPercentage || 18,
    };

    // Set default image if available
    const defaultImage = product.images.find((img) => img.isDefault);
    if (defaultImage) {
      newItem.image = defaultImage.url;
    } else if (product.images.length > 0) {
      newItem.image = product.images[0].url;
    }

    // Handle variant if specified
    if (itemData.variantId && product.variants && product.variants.length > 0) {
      const variant = product.variants.id(itemData.variantId);

      if (!variant) {
        throw new NotFoundError("Product variant not found");
      }

      newItem.variant = variant._id;
      newItem.price = variant.price.sale || variant.price.regular;
      newItem.attributes = variant.attributes;

      // Check variant inventory
      if (variant.inventory.quantity < newItem.quantity) {
        throw new BadRequestError(
          `Only ${variant.inventory.quantity} items available`
        );
      }
    } else {
      // Check product inventory
      if (product.inventory.quantity < newItem.quantity) {
        throw new BadRequestError(
          `Only ${product.inventory.quantity} items available`
        );
      }
    }

    // Get or create cart
    const cart = await getOrCreateCart(identifiers);

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex((item) => {
      if (item.product.toString() !== newItem.product.toString()) {
        return false;
      }

      // If both have variants, compare variant IDs
      if (item.variant && newItem.variant) {
        return item.variant.toString() === newItem.variant.toString();
      }

      // If neither has variants
      return !item.variant && !newItem.variant;
    });

    if (existingItemIndex !== -1) {
      // Update quantity if product exists
      cart.items[existingItemIndex].quantity += newItem.quantity;
    } else {
      // Add new item if product doesn't exist
      cart.items.push(newItem);
    }

    // Revalidate any applied coupon
    if (cart.appliedCoupon && cart.appliedCoupon.code) {
      try {
        // Validate the promotion with the updated cart
        const validationResult = await promotionService.validatePromotion(
          cart.appliedCoupon.code,
          cart._id,
          identifiers.userId
        );

        // If the promotion is no longer valid, remove it
        if (!validationResult.valid) {
          cart.appliedCoupon = undefined;
        }
      } catch (error) {
        // If there's any error validating the promotion, remove it to be safe
        logger.warn(
          `Error validating promotion after adding item: ${error.message}`
        );
        cart.appliedCoupon = undefined;
      }
    }

    await cart.save();
    return cart;
  } catch (error) {
    logger.error("Error adding item to cart:", error);
    throw error;
  }
};

/**
 * Update cart item quantity
 * @param {Object} identifiers - Cart identifiers (userId or guestId)
 * @param {String} itemId - Cart item ID
 * @param {Number} quantity - New quantity
 * @returns {Promise<Object>} Updated cart
 */
const updateCartItemQuantity = async (identifiers, itemId, quantity) => {
  try {
    const cart = await getOrCreateCart(identifiers);

    // Find item in cart
    const item = cart.items.id(itemId);

    if (!item) {
      throw new NotFoundError("Item not found in cart");
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      item.remove();
    } else {
      // Update quantity
      const product = await Product.findById(item.product);

      if (!product) {
        throw new NotFoundError("Product not found");
      }

      // Check inventory
      if (item.variant) {
        const variant = product.variants.id(item.variant);

        if (!variant) {
          throw new NotFoundError("Product variant not found");
        }

        if (variant.inventory.quantity < quantity) {
          throw new BadRequestError(
            `Only ${variant.inventory.quantity} items available`
          );
        }
      } else {
        if (product.inventory.quantity < quantity) {
          throw new BadRequestError(
            `Only ${product.inventory.quantity} items available`
          );
        }
      }

      item.quantity = quantity;
    }

    // Revalidate any applied coupon
    if (cart.appliedCoupon && cart.appliedCoupon.code) {
      try {
        // Validate the promotion with the updated cart
        const validationResult = await promotionService.validatePromotion(
          cart.appliedCoupon.code,
          cart._id,
          identifiers.userId
        );

        // If the promotion is no longer valid, remove it
        if (!validationResult.valid) {
          cart.appliedCoupon = undefined;
        }
      } catch (error) {
        // If there's any error validating the promotion, remove it to be safe
        logger.warn(
          `Error validating promotion after updating quantity: ${error.message}`
        );
        cart.appliedCoupon = undefined;
      }
    }

    await cart.save();
    return cart;
  } catch (error) {
    logger.error("Error updating cart item quantity:", error);
    throw error;
  }
};

/**
 * Remove an item from cart
 * @param {Object} identifiers - Cart identifiers (userId or guestId)
 * @param {String} itemId - Cart item ID
 * @returns {Promise<Object>} Updated cart
 */
const removeCartItem = async (identifiers, itemId) => {
  try {
    const cart = await getOrCreateCart(identifiers);

    // Find item in cart
    const item = cart.items.id(itemId);

    if (!item) {
      throw new NotFoundError("Item not found in cart");
    }

    // Remove item
    item.remove();

    // Revalidate any applied coupon
    if (cart.appliedCoupon && cart.appliedCoupon.code) {
      try {
        // Validate the promotion with the updated cart
        const validationResult = await promotionService.validatePromotion(
          cart.appliedCoupon.code,
          cart._id,
          identifiers.userId
        );

        // If the promotion is no longer valid, remove it
        if (!validationResult.valid) {
          cart.appliedCoupon = undefined;
        }
      } catch (error) {
        // If there's any error validating the promotion, remove it to be safe
        logger.warn(
          `Error validating promotion after removing item: ${error.message}`
        );
        cart.appliedCoupon = undefined;
      }
    }

    await cart.save();

    return cart;
  } catch (error) {
    logger.error("Error removing cart item:", error);
    throw error;
  }
};

/**
 * Clear cart
 * @param {Object} identifiers - Cart identifiers (userId or guestId)
 * @returns {Promise<Object>} Empty cart
 */
const clearCart = async (identifiers) => {
  try {
    const cart = await getOrCreateCart(identifiers);

    cart.items = [];
    cart.appliedCoupon = undefined;
    cart.shipping = { cost: 0 };
    cart.notes = "";

    await cart.save();
    return cart;
  } catch (error) {
    logger.error("Error clearing cart:", error);
    throw error;
  }
};

/**
 * Apply coupon to cart
 * @param {Object} identifiers - Cart identifiers (userId or guestId)
 * @param {String} couponCode - Coupon code
 * @returns {Promise<Object>} Updated cart
 */
const applyCoupon = async (identifiers, couponCode) => {
  try {
    const cart = await getOrCreateCart(identifiers);

    // Use the promotion service to apply the coupon
    return await promotionService.applyPromotionToCart(
      cart._id,
      couponCode,
      identifiers.userId
    );
  } catch (error) {
    logger.error("Error applying coupon:", error);
    throw error;
  }
};

/**
 * Remove coupon from cart
 * @param {Object} identifiers - Cart identifiers (userId or guestId)
 * @returns {Promise<Object>} Updated cart
 */
const removeCoupon = async (identifiers) => {
  try {
    const cart = await getOrCreateCart(identifiers);

    cart.appliedCoupon = undefined;
    await cart.save();

    return cart;
  } catch (error) {
    logger.error("Error removing coupon:", error);
    throw error;
  }
};

/**
 * Add shipping method to cart
 * @param {Object} identifiers - Cart identifiers (userId or guestId)
 * @param {Object} shippingData - Shipping data
 * @returns {Promise<Object>} Updated cart
 */
const addShippingMethod = async (identifiers, shippingData) => {
  try {
    const cart = await getOrCreateCart(identifiers);

    // This is a placeholder - we'll implement shipping method validation
    // later when we build the shipping system
    cart.shipping = {
      method: shippingData.method,
      cost: shippingData.cost || 0,
    };

    // Revalidate any applied coupon (especially for shipping discounts)
    if (cart.appliedCoupon && cart.appliedCoupon.code) {
      try {
        // Validate the promotion with the updated cart
        const validationResult = await promotionService.validatePromotion(
          cart.appliedCoupon.code,
          cart._id,
          identifiers.userId
        );

        // If the promotion is no longer valid, remove it
        if (!validationResult.valid) {
          cart.appliedCoupon = undefined;
        }
      } catch (error) {
        // If there's any error validating the promotion, remove it to be safe
        logger.warn(
          `Error validating promotion after adding shipping: ${error.message}`
        );
        cart.appliedCoupon = undefined;
      }
    }

    await cart.save();
    return cart;
  } catch (error) {
    logger.error("Error adding shipping method:", error);
    throw error;
  }
};

/**
 * Add notes to cart
 * @param {Object} identifiers - Cart identifiers (userId or guestId)
 * @param {String} notes - Cart notes
 * @returns {Promise<Object>} Updated cart
 */
const addCartNotes = async (identifiers, notes) => {
  try {
    const cart = await getOrCreateCart(identifiers);

    cart.notes = notes;
    await cart.save();

    return cart;
  } catch (error) {
    logger.error("Error adding cart notes:", error);
    throw error;
  }
};

/**
 * Merge guest cart with user cart
 * @param {String} guestId - Guest ID
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Merged cart
 */
const mergeGuestCart = async (guestId, userId) => {
  try {
    return await Cart.mergeGuestCart(guestId, userId);
  } catch (error) {
    logger.error(
      `Error merging guest cart ${guestId} with user cart ${userId}:`,
      error
    );
    throw error;
  }
};

module.exports = {
  getOrCreateCart,
  getCartById,
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
