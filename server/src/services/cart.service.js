// src/services/cart.service.js
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const promotionService = require("./promotion.service"); // Import promotion service
const { NotFoundError, BadRequestError } = require("../utils/errorTypes");
const logger = require("../config/logger");
const crypto = require("crypto");
const User = require("../models/user.model");
const emailService = require("./email.service");
const eventService = require("./event.service");

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

/**
 * Cart Service
 * Manages shopping cart operations
 */
class CartService {
  /**
   * Process abandoned carts and send recovery emails
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing statistics
   */
  async processAbandonedCarts(options = {}) {
    try {
      const {
        maxAge = 24 * 60, // Default 24 hours in minutes
        minAge = 60, // Default 1 hour in minutes
        minValue = 0, // Minimum cart value to qualify
        reminderStage = null, // Process specific reminder stage only (1, 2, 3)
      } = options;

      const now = new Date();

      // Convert ages to dates
      const maxAgeDate = new Date(now.getTime() - maxAge * 60 * 1000);
      const minAgeDate = new Date(now.getTime() - minAge * 60 * 1000);

      logger.info(
        `Processing abandoned carts between ${minAgeDate} and ${maxAgeDate}`
      );

      // Build the query to find abandoned carts
      let query = {
        isActive: true,
        updatedAt: { $lte: minAgeDate, $gte: maxAgeDate },
        items: { $exists: true, $not: { $size: 0 } },
        status: "active",
        emailRecoveryAttempts: { $exists: true },
      };

      // If processing specific reminder stage
      if (reminderStage) {
        query.emailRecoveryAttempts = reminderStage - 1;
        logger.info(`Processing stage ${reminderStage} reminders`);
      } else {
        // Default: stage 1 (no previous attempts)
        query.emailRecoveryAttempts = { $lt: 3 }; // At most 3 recovery attempts
      }

      // Find qualifying abandoned carts
      const abandonedCarts = await Cart.find(query);

      logger.info(`Found ${abandonedCarts.length} abandoned carts to process`);

      // Stats to return
      const stats = {
        total: abandonedCarts.length,
        processed: 0,
        skipped: 0,
        errors: 0,
        byStage: {
          stage1: 0,
          stage2: 0,
          stage3: 0,
        },
      };

      // Process each cart
      for (const cart of abandonedCarts) {
        try {
          // Skip carts with no user associated or no email (guest carts)
          if (!cart.user && !cart.guestEmail) {
            stats.skipped++;
            continue;
          }

          // Skip carts below minimum value
          if (cart.total < minValue) {
            stats.skipped++;
            continue;
          }

          // Get user/email and validate
          let email = cart.guestEmail;
          let userData = null;

          if (cart.user) {
            userData = await User.findById(cart.user);
            if (!userData || !userData.email) {
              stats.skipped++;
              continue;
            }
            email = userData.email;
          }

          // Determine recovery stage (1, 2, or 3)
          const recoveryStage = (cart.emailRecoveryAttempts || 0) + 1;

          if (recoveryStage > 3) {
            stats.skipped++;
            continue; // Skip if already sent 3 emails
          }

          // Generate recovery token
          const token = generateRecoveryToken(cart._id);

          // Send email based on recovery stage
          await this.sendRecoveryEmail(
            email,
            cart,
            userData,
            recoveryStage,
            token
          );

          // Update cart with recovery attempt
          await Cart.findByIdAndUpdate(cart._id, {
            $inc: { emailRecoveryAttempts: 1 },
            $set: {
              lastRecoveryAttempt: new Date(),
              recoveryToken: token,
              recoveryStage: recoveryStage,
            },
          });

          // Update stats
          stats.processed++;

          if (recoveryStage === 1) stats.byStage.stage1++;
          else if (recoveryStage === 2) stats.byStage.stage2++;
          else if (recoveryStage === 3) stats.byStage.stage3++;
        } catch (error) {
          logger.error(`Error processing abandoned cart ${cart._id}:`, error);
          stats.errors++;
        }
      }

      return stats;
    } catch (error) {
      logger.error("Error processing abandoned carts:", error);
      throw new Error("Failed to process abandoned carts");
    }
  }

  /**
   * Send recovery email for abandoned cart
   * @param {String} email - Recipient email
   * @param {Object} cart - Cart object
   * @param {Object} user - User object (may be null for guest)
   * @param {Number} stage - Recovery stage (1, 2, or 3)
   * @param {String} token - Recovery token
   * @returns {Promise<void>}
   */
  async sendRecoveryEmail(email, cart, user, stage, token) {
    try {
      // Get recovery template based on stage
      let template,
        subject,
        additionalData = {};

      // Prepare recovery URL
      const recoveryUrl = `${process.env.FRONTEND_URL}/cart/recover/${cart._id}/${token}`;

      // Calculate total savings if applicable
      let savings = 0;
      if (cart.discounts && cart.discounts.length) {
        savings = cart.discounts.reduce(
          (total, discount) => total + discount.amount,
          0
        );
      }

      // Based on stage, send different emails with increasing incentives
      switch (stage) {
        case 1:
          // First reminder (gentle)
          template = "abandoned-cart-reminder-1";
          subject = "Items in your cart are waiting for you";
          break;

        case 2:
          // Second reminder (with urgency)
          template = "abandoned-cart-reminder-2";
          subject = "Your cart items are still available - Limited time offer!";

          // If no existing discount, generate a small discount for stage 2
          if (savings === 0) {
            // Generate a 5% discount code specifically for this recovery
            const discountCode = await this.generateRecoveryDiscount(
              cart._id,
              5
            );
            additionalData.discountCode = discountCode;
            additionalData.discountPercent = 5;
          }
          break;

        case 3:
          // Final reminder (strongest incentive)
          template = "abandoned-cart-reminder-3";
          subject = "Last chance: Complete your purchase with a special offer";

          // Generate a 10% discount code for the final reminder
          const discountCode = await this.generateRecoveryDiscount(
            cart._id,
            10
          );
          additionalData.discountCode = discountCode;
          additionalData.discountPercent = 10;
          break;
      }

      // Build email data
      const emailData = {
        to: email,
        subject,
        template,
        data: {
          firstName: user ? user.firstName : "Valued Customer",
          cartItems: cart.items,
          cartTotal: cart.total,
          cartId: cart._id,
          recoveryUrl,
          savings,
          ...additionalData,
        },
      };

      // Send the email using the updated template system
      await emailService.sendEmail(emailData);

      logger.info(
        `Sent stage ${stage} recovery email for cart ${cart._id} to ${email}`
      );
    } catch (error) {
      logger.error(`Error sending recovery email for cart ${cart._id}:`, error);
      throw error;
    }
  }

  /**
   * Generate a discount code specifically for cart recovery
   * @param {String} cartId - Cart ID
   * @param {Number} percentage - Discount percentage
   * @returns {Promise<String>} Discount code
   */
  async generateRecoveryDiscount(cartId, percentage) {
    try {
      // Create a unique discount code for this recovery
      const code = `COMEBACK-${cartId.substr(-6)}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Create the discount in the promotion service
      const discount = {
        code,
        type: "percentage",
        value: percentage,
        minPurchase: 0,
        maxUses: 1, // One-time use only
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
        isActive: true,
        applicableTo: {
          specific: {
            carts: [cartId], // Only applies to this specific cart
          },
        },
        metadata: {
          recoveryDiscount: true,
          cartId,
          stage: percentage === 5 ? 2 : 3,
        },
      };

      // Store the discount using the promotion service
      await promotionService.createDiscount(discount);

      return code;
    } catch (error) {
      logger.error(
        `Error generating recovery discount for cart ${cartId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Recover an abandoned cart
   * @param {String} cartId - Cart ID
   * @param {String} token - Recovery token
   * @returns {Promise<Object>} Recovered cart
   */
  async recoverAbandonedCart(cartId, token) {
    try {
      const cart = await Cart.findById(cartId);

      if (!cart) {
        throw new NotFoundError("Cart not found");
      }

      // Verify token matches
      if (cart.recoveryToken !== token) {
        throw new BadRequestError("Invalid recovery token");
      }

      // Track recovery for analytics
      await Cart.findByIdAndUpdate(cartId, {
        $set: {
          status: "recovered",
          recoveredAt: new Date(),
          metadata: {
            ...cart.metadata,
            recovered: true,
            recoveryStage: cart.recoveryStage,
            recoverySource: "email",
          },
        },
      });

      // Log event for analytics
      await eventService.createEvent({
        type: "cart.recovered",
        target: cartId,
        targetModel: "Cart",
        data: {
          cartId,
          recoveryStage: cart.recoveryStage,
          total: cart.total,
        },
        recipients: cart.user ? [cart.user] : [],
        roles: ["admin", "manager"],
      });

      return cart;
    } catch (error) {
      logger.error(`Error recovering cart ${cartId}:`, error);
      throw error;
    }
  }

  /**
   * Get cart recovery analytics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Recovery analytics
   */
  async getCartRecoveryAnalytics(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days by default
        endDate = new Date(),
      } = options;

      // Get all abandoned carts in the date range
      const totalAbandoned = await Cart.countDocuments({
        updatedAt: { $gte: startDate, $lte: endDate },
        isActive: true,
        status: "active",
        emailRecoveryAttempts: { $gt: 0 },
      });

      // Get all recovered carts in date range
      const totalRecovered = await Cart.countDocuments({
        recoveredAt: { $gte: startDate, $lte: endDate },
        status: "recovered",
      });

      // Get recovery by stage
      const stageRecovery = await Cart.aggregate([
        {
          $match: {
            recoveredAt: { $gte: startDate, $lte: endDate },
            status: "recovered",
            recoveryStage: { $exists: true },
          },
        },
        {
          $group: {
            _id: "$recoveryStage",
            count: { $sum: 1 },
            totalValue: { $sum: "$total" },
          },
        },
      ]);

      // Calculate recovery rate and stage stats
      const recoveryRate =
        totalAbandoned > 0 ? (totalRecovered / totalAbandoned) * 100 : 0;

      // Format stage recovery stats
      const stageStats = {
        stage1: { count: 0, totalValue: 0 },
        stage2: { count: 0, totalValue: 0 },
        stage3: { count: 0, totalValue: 0 },
      };

      stageRecovery.forEach((stage) => {
        const stageKey = `stage${stage._id}`;
        stageStats[stageKey] = {
          count: stage.count,
          totalValue: stage.totalValue,
        };
      });

      // Calculate total recovered value
      const totalRecoveredValue = stageRecovery.reduce(
        (sum, stage) => sum + stage.totalValue,
        0
      );

      return {
        totalAbandoned,
        totalRecovered,
        recoveryRate,
        stageStats,
        totalRecoveredValue,
        period: {
          startDate,
          endDate,
        },
      };
    } catch (error) {
      logger.error("Error getting cart recovery analytics:", error);
      throw error;
    }
  }
}

/**
 * Generate recovery token for a cart
 * @param {String} cartId - Cart ID
 * @returns {String} Recovery token
 */
function generateRecoveryToken(cartId) {
  const timestamp = Date.now();
  return crypto
    .createHash("sha256")
    .update(`${cartId}-${timestamp}-${process.env.JWT_SECRET}`)
    .digest("hex");
}

// Create and export an instance of the cart service
const cartService = new CartService();
module.exports = cartService;
