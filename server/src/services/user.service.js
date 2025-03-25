// src/services/user.service.js
const User = require("../models/user.model");
const logger = require("../config/logger");
const { NotFoundError, BadRequestError } = require("../utils/errorTypes");

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  } catch (error) {
    logger.error(`Error getting user by ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated user
 */
const updateProfile = async (userId, profileData) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Update profile fields
    Object.assign(user.profile, profileData);

    await user.save();
    return user;
  } catch (error) {
    logger.error(`Error updating profile for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Add new address to user
 * @param {string} userId - User ID
 * @param {Object} addressData - Address data
 * @returns {Promise<Object>} Updated user with new address
 */
const addAddress = async (userId, addressData) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if this is the first address of its type
    const isFirstOfType = !user.addresses.some(
      (addr) => addr.type === addressData.type
    );

    // If first of type or explicitly set as default, make it default
    if (isFirstOfType || addressData.isDefault) {
      // Set all other addresses of same type to non-default
      if (addressData.isDefault) {
        user.addresses.forEach((addr) => {
          if (addr.type === addressData.type) {
            addr.isDefault = false;
          }
        });
      }

      addressData.isDefault = true;
    }

    // Add new address
    user.addresses.push(addressData);

    await user.save();
    return user;
  } catch (error) {
    logger.error(`Error adding address for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Update existing address
 * @param {string} userId - User ID
 * @param {string} addressId - Address ID
 * @param {Object} addressData - Updated address data
 * @returns {Promise<Object>} Updated user
 */
const updateAddress = async (userId, addressId, addressData) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Find address
    const address = user.addresses.id(addressId);

    if (!address) {
      throw new NotFoundError("Address not found");
    }

    // If updating to default, un-set other defaults of same type
    if (addressData.isDefault && addressData.type === address.type) {
      user.addresses.forEach((addr) => {
        if (
          addr.type === addressData.type &&
          addr._id.toString() !== addressId
        ) {
          addr.isDefault = false;
        }
      });
    }

    // If changing type and setting as default for new type
    if (addressData.type !== address.type && addressData.isDefault) {
      user.addresses.forEach((addr) => {
        if (addr.type === addressData.type) {
          addr.isDefault = false;
        }
      });
    }

    // Update address
    Object.assign(address, addressData);

    // Ensure at least one default per type
    const addressesOfSameType = user.addresses.filter(
      (addr) => addr.type === address.type
    );
    if (
      addressesOfSameType.length > 0 &&
      !addressesOfSameType.some((addr) => addr.isDefault)
    ) {
      addressesOfSameType[0].isDefault = true;
    }

    await user.save();
    return user;
  } catch (error) {
    logger.error(
      `Error updating address ${addressId} for user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Delete address
 * @param {string} userId - User ID
 * @param {string} addressId - Address ID
 * @returns {Promise<Object>} Updated user
 */
const deleteAddress = async (userId, addressId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Find address
    const address = user.addresses.id(addressId);

    if (!address) {
      throw new NotFoundError("Address not found");
    }

    // Check if this is the only address
    if (user.addresses.length === 1) {
      throw new BadRequestError(
        "Cannot delete the only address. Please add another address first."
      );
    }

    // Check if this is the default address
    const isDefault = address.isDefault;
    const addressType = address.type;

    // Remove address
    address.remove();

    // If removed address was default, set a new default
    if (isDefault) {
      const addressesOfSameType = user.addresses.filter(
        (addr) => addr.type === addressType
      );
      if (addressesOfSameType.length > 0) {
        addressesOfSameType[0].isDefault = true;
      }
    }

    await user.save();
    return user;
  } catch (error) {
    logger.error(
      `Error deleting address ${addressId} for user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - Preference settings
 * @returns {Promise<Object>} Updated user
 */
const updatePreferences = async (userId, preferences) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Update preferences
    Object.assign(user.preferences, preferences);

    await user.save();
    return user;
  } catch (error) {
    logger.error(`Error updating preferences for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Add product to wishlist
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Updated user
 */
const addToWishlist = async (userId, productId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if product is already in wishlist
    const alreadyInWishlist = user.wishlist.some(
      (id) => id.toString() === productId
    );

    if (!alreadyInWishlist) {
      user.wishlist.push(productId);
      await user.save();
    }

    return user;
  } catch (error) {
    logger.error(
      `Error adding product ${productId} to wishlist for user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Remove product from wishlist
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Updated user
 */
const removeFromWishlist = async (userId, productId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Filter out the product
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);

    await user.save();
    return user;
  } catch (error) {
    logger.error(
      `Error removing product ${productId} from wishlist for user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get user wishlist with populated product data
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Wishlist items
 */
const getWishlist = async (userId) => {
  try {
    const user = await User.findById(userId).populate({
      path: "wishlist",
      select: "name slug price images status inventory",
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user.wishlist;
  } catch (error) {
    logger.error(`Error getting wishlist for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Track recently viewed product
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Success status
 */
const trackRecentlyViewed = async (userId, productId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      // Silently fail if user not found - this is a non-critical feature
      return false;
    }

    // Find existing entry for this product
    const existingIndex = user.recentlyViewed.findIndex(
      (item) => item.product.toString() === productId
    );

    // If exists, remove it (will add to front of array)
    if (existingIndex !== -1) {
      user.recentlyViewed.splice(existingIndex, 1);
    }

    // Add to front of array
    user.recentlyViewed.unshift({
      product: productId,
      viewedAt: new Date(),
    });

    // Limit to 10 most recent
    if (user.recentlyViewed.length > 10) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 10);
    }

    await user.save();
    return true;
  } catch (error) {
    logger.error(
      `Error tracking recently viewed product ${productId} for user ${userId}:`,
      error
    );
    // Silently fail - this is a non-critical feature
    return false;
  }
};

/**
 * Get recently viewed products
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Recently viewed products
 */
const getRecentlyViewed = async (userId) => {
  try {
    const user = await User.findById(userId).populate({
      path: "recentlyViewed.product",
      select: "name slug price images status inventory",
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user.recentlyViewed;
  } catch (error) {
    logger.error(
      `Error getting recently viewed products for user ${userId}:`,
      error
    );
    throw error;
  }
};

module.exports = {
  getUserById,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  updatePreferences,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  trackRecentlyViewed,
  getRecentlyViewed,
};
