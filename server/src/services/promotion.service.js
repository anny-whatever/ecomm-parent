// src/services/promotion.service.js
const Promotion = require("../models/promotion.model");
const Cart = require("../models/cart.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
} = require("../utils/errorTypes");
const logger = require("../config/logger");

/**
 * Create a new promotion
 * @param {Object} promotionData - Data for new promotion
 * @returns {Promise<Object>} Created promotion
 */
const createPromotion = async (promotionData) => {
  try {
    // If code is provided, check if it's unique
    if (promotionData.code) {
      const existingPromotion = await Promotion.findOne({
        code: promotionData.code.toUpperCase(),
      });

      if (existingPromotion) {
        throw new ConflictError(
          `Promotion code '${promotionData.code}' already exists`
        );
      }
    }

    // Validate applicable products if provided
    if (
      promotionData.applicableProducts &&
      promotionData.applicableProducts.length > 0
    ) {
      const productCount = await Product.countDocuments({
        _id: { $in: promotionData.applicableProducts },
      });

      if (productCount !== promotionData.applicableProducts.length) {
        throw new BadRequestError(
          "One or more specified products do not exist"
        );
      }
    }

    // Create the promotion
    const promotion = new Promotion(promotionData);
    await promotion.save();

    return promotion;
  } catch (error) {
    logger.error("Error creating promotion:", error);
    throw error;
  }
};

/**
 * Get promotion by ID
 * @param {String} promotionId - Promotion ID
 * @returns {Promise<Object>} Promotion object
 */
const getPromotionById = async (promotionId) => {
  try {
    const promotion = await Promotion.findById(promotionId)
      .populate("applicableProducts", "name sku")
      .populate("applicableCategories", "name");

    if (!promotion) {
      throw new NotFoundError("Promotion not found");
    }

    return promotion;
  } catch (error) {
    logger.error(`Error getting promotion ${promotionId}:`, error);
    throw error;
  }
};

/**
 * Get promotion by code
 * @param {String} code - Promotion code
 * @returns {Promise<Object>} Promotion object
 */
const getPromotionByCode = async (code) => {
  try {
    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
    });

    if (!promotion) {
      throw new NotFoundError("Promotion not found");
    }

    return promotion;
  } catch (error) {
    logger.error(`Error getting promotion by code ${code}:`, error);
    throw error;
  }
};

/**
 * Update a promotion
 * @param {String} promotionId - Promotion ID to update
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated promotion
 */
const updatePromotion = async (promotionId, updateData) => {
  try {
    // Check if promotion exists
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      throw new NotFoundError("Promotion not found");
    }

    // If code is being updated, check if it's unique
    if (updateData.code && updateData.code !== promotion.code) {
      const existingPromotion = await Promotion.findOne({
        code: updateData.code.toUpperCase(),
        _id: { $ne: promotionId },
      });

      if (existingPromotion) {
        throw new ConflictError(
          `Promotion code '${updateData.code}' already exists`
        );
      }
    }

    // Validate applicable products if provided
    if (
      updateData.applicableProducts &&
      updateData.applicableProducts.length > 0
    ) {
      const productCount = await Product.countDocuments({
        _id: { $in: updateData.applicableProducts },
      });

      if (productCount !== updateData.applicableProducts.length) {
        throw new BadRequestError(
          "One or more specified products do not exist"
        );
      }
    }

    // Update the promotion
    const updatedPromotion = await Promotion.findByIdAndUpdate(
      promotionId,
      updateData,
      { new: true, runValidators: true }
    );

    return updatedPromotion;
  } catch (error) {
    logger.error(`Error updating promotion ${promotionId}:`, error);
    throw error;
  }
};

/**
 * Delete a promotion
 * @param {String} promotionId - Promotion ID to delete
 * @returns {Promise<Boolean>} Deletion success
 */
const deletePromotion = async (promotionId) => {
  try {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      throw new NotFoundError("Promotion not found");
    }

    await Promotion.findByIdAndDelete(promotionId);
    return true;
  } catch (error) {
    logger.error(`Error deleting promotion ${promotionId}:`, error);
    throw error;
  }
};

/**
 * Get all promotions with filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Promotions with pagination info
 */
const getAllPromotions = async (filters = {}, options = {}) => {
  try {
    const query = {};

    // Apply filters
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.code) {
      query.code = new RegExp(filters.code, "i");
    }

    // If validNow is true, only return currently valid promotions
    if (filters.validNow) {
      const now = new Date();
      query.validFrom = { $lte: now };
      query.validUntil = { $gte: now };
      query.isActive = true;

      // Only include promotions that haven't reached usage limit
      query.$or = [
        { usageLimit: 0 }, // No usage limit
        { $expr: { $lt: ["$usageCount", "$usageLimit"] } }, // Usage count < limit
      ];
    }

    // Set up pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // Set up sorting
    const sortBy = options.sortBy || "-createdAt";

    // Execute query with pagination
    const promotions = await Promotion.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate("applicableProducts", "name sku")
      .populate("applicableCategories", "name");

    // Get total count
    const total = await Promotion.countDocuments(query);

    return {
      promotions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error getting promotions:", error);
    throw error;
  }
};

/**
 * Get active promotions available for a specific user
 * @param {String} userId - User ID (optional)
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Active promotions
 */
const getActivePromotions = async (userId, options = {}) => {
  try {
    const now = new Date();

    // Base query for active promotions
    const query = {
      isActive: true,
      validFrom: { $lte: now },
      $or: [{ validUntil: { $gte: now } }, { validUntil: null }],
      $or: [
        { usageLimit: 0 }, // No usage limit
        { $expr: { $lt: ["$usageCount", "$usageLimit"] } }, // Usage count < limit
      ],
    };

    // If userId is provided, filter for user-specific eligibility
    let userIsExisting = false;
    if (userId) {
      // Get user registration date to determine if "new" or "existing"
      const user = await User.findById(userId);
      if (user) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // User is considered "existing" if registered more than 30 days ago
        userIsExisting = user.createdAt < thirtyDaysAgo;

        // Filter promotions by user type
        if (userIsExisting) {
          query.$or = [{ customerType: "all" }, { customerType: "existing" }];
        } else {
          query.$or = [{ customerType: "all" }, { customerType: "new" }];
        }

        // Filter out promotions where user has reached their usage limit
        query.$or.push(
          { userUsageLimit: 0 }, // No user limit
          {
            userUsageLimit: { $gt: 0 },
            usedBy: {
              $not: {
                $elemMatch: {
                  user: userId,
                  count: { $gte: "$userUsageLimit" },
                },
              },
            },
          }
        );
      }
    } else {
      // For non-authenticated users, only show "all" customer type
      query.customerType = "all";
    }

    // Set up pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // Execute query
    const promotions = await Promotion.find(query)
      .select(
        "name description code type value maxDiscount minOrderValue minimumItems validUntil"
      )
      .sort("validUntil")
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Promotion.countDocuments(query);

    return {
      promotions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error getting active promotions:", error);
    throw error;
  }
};

/**
 * Validate a promotion code for a cart
 * @param {String} code - Promotion code
 * @param {String} cartId - Cart ID
 * @param {String} userId - User ID (optional)
 * @returns {Promise<Object>} Validation result
 */
const validatePromotion = async (code, cartId, userId = null) => {
  try {
    // Find the promotion by code
    let promotion;
    try {
      promotion = await getPromotionByCode(code.toUpperCase());
    } catch (error) {
      // If promotion not found, return invalid result
      return {
        valid: false,
        message: "Invalid promotion code",
      };
    }

    // Check if promotion is valid
    if (!promotion.isValid()) {
      return {
        valid: false,
        message: "Promotion is inactive or expired",
      };
    }

    // For logged-in users, check user-specific limitations
    if (userId) {
      // Check if user can use this promotion
      if (!promotion.canBeUsedByUser(userId)) {
        return {
          valid: false,
          message: "You have reached the usage limit for this promotion",
        };
      }

      // Check customer type restrictions
      if (promotion.customerType !== "all") {
        const user = await User.findById(userId);
        if (!user) {
          return {
            valid: false,
            message: "User not found",
          };
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isNewUser = user.createdAt >= thirtyDaysAgo;

        if (
          (promotion.customerType === "new" && !isNewUser) ||
          (promotion.customerType === "existing" && isNewUser)
        ) {
          return {
            valid: false,
            message: `This promotion is only for ${promotion.customerType} customers`,
          };
        }
      }
    } else if (promotion.customerType !== "all") {
      // Non-authenticated user trying to use customer-specific promotion
      return {
        valid: false,
        message: "Please log in to use this promotion",
      };
    }

    // Get the cart
    const cart = await Cart.findById(cartId);
    if (!cart) {
      return {
        valid: false,
        message: "Cart not found",
      };
    }

    // If cart has no items, it's invalid
    if (!cart.items || cart.items.length === 0) {
      return {
        valid: false,
        message: "Cannot apply promotion to empty cart",
      };
    }

    // For category-specific promotions, we need populated items
    const needsPopulation = ["category_percentage", "category_fixed"].includes(
      promotion.type
    );

    if (needsPopulation) {
      // Populate cart items with product data to check categories
      const populatedItems = await Promise.all(
        cart.items.map(async (item) => {
          const productData = await Product.findById(item.product).populate(
            "categories"
          );
          return {
            ...item.toObject(),
            productData,
          };
        })
      );

      cart.populatedItems = populatedItems;
    }

    // Calculate the discount using promotion's calculation method
    const userData = {
      isExisting: userId ? true : false, // Simplified for now
    };

    const discountResult = promotion.calculateDiscount(cart, userData);

    if (!discountResult.applicable) {
      return {
        valid: false,
        message: discountResult.message,
      };
    }

    // Valid promotion!
    return {
      valid: true,
      discount: discountResult,
    };
  } catch (error) {
    logger.error(`Error validating promotion code ${code}:`, error);
    throw error;
  }
};

/**
 * Apply a validated promotion to a cart
 * @param {String} cartId - Cart ID
 * @param {String} code - Promotion code
 * @param {String} userId - User ID (optional)
 * @returns {Promise<Object>} Updated cart with applied promotion
 */
const applyPromotionToCart = async (cartId, code, userId = null) => {
  try {
    // First validate the promotion
    const validationResult = await validatePromotion(code, cartId, userId);

    if (!validationResult.valid) {
      throw new BadRequestError(validationResult.message);
    }

    // Get the cart
    const cart = await Cart.findById(cartId);
    if (!cart) {
      throw new NotFoundError("Cart not found");
    }

    // Get the promotion
    const promotion = await getPromotionByCode(code.toUpperCase());

    // Apply the promotion to the cart
    cart.appliedCoupon = {
      code: promotion.code,
      discountType: validationResult.discount.type,
      discountValue: validationResult.discount.value,
      minimumOrderValue: promotion.minOrderValue,
    };

    await cart.save();

    return cart;
  } catch (error) {
    logger.error(`Error applying promotion to cart ${cartId}:`, error);
    throw error;
  }
};

/**
 * Record usage of a promotion
 * @param {String} promotionId - Promotion ID
 * @param {String} userId - User ID (optional)
 * @returns {Promise<Object>} Updated promotion
 */
const recordPromotionUsage = async (promotionId, userId = null) => {
  try {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      throw new NotFoundError("Promotion not found");
    }

    await promotion.recordUsage(userId);
    return promotion;
  } catch (error) {
    logger.error(`Error recording usage for promotion ${promotionId}:`, error);
    throw error;
  }
};

module.exports = {
  createPromotion,
  getPromotionById,
  getPromotionByCode,
  updatePromotion,
  deletePromotion,
  getAllPromotions,
  getActivePromotions,
  validatePromotion,
  applyPromotionToCart,
  recordPromotionUsage,
};
