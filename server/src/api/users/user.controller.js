// src/api/users/user.controller.js
const userService = require("../../services/user.service");
const { responseFormatter } = require("../../utils/responseFormatter");

/**
 * Get user profile
 * @route GET /api/v1/users/profile
 * @access Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user._id);

    return res
      .status(200)
      .json(
        responseFormatter(true, "User profile retrieved successfully", { user })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/v1/users/profile
 * @access Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(
      req.user._id,
      req.body.profile
    );

    return res
      .status(200)
      .json(responseFormatter(true, "Profile updated successfully", { user }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all addresses
 * @route GET /api/v1/users/addresses
 * @access Private
 */
const getAddresses = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user._id);

    return res.status(200).json(
      responseFormatter(true, "Addresses retrieved successfully", {
        addresses: user.addresses,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new address
 * @route POST /api/v1/users/addresses
 * @access Private
 */
const addAddress = async (req, res, next) => {
  try {
    const user = await userService.addAddress(req.user._id, req.body.address);

    // Get the newly added address (last in the array)
    const newAddress = user.addresses[user.addresses.length - 1];

    return res.status(201).json(
      responseFormatter(true, "Address added successfully", {
        address: newAddress,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update an address
 * @route PUT /api/v1/users/addresses/:addressId
 * @access Private
 */
const updateAddress = async (req, res, next) => {
  try {
    const user = await userService.updateAddress(
      req.user._id,
      req.params.addressId,
      req.body.address
    );

    // Find the updated address
    const updatedAddress = user.addresses.id(req.params.addressId);

    return res.status(200).json(
      responseFormatter(true, "Address updated successfully", {
        address: updatedAddress,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an address
 * @route DELETE /api/v1/users/addresses/:addressId
 * @access Private
 */
const deleteAddress = async (req, res, next) => {
  try {
    await userService.deleteAddress(req.user._id, req.params.addressId);

    return res
      .status(200)
      .json(responseFormatter(true, "Address deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 * @route PUT /api/v1/users/preferences
 * @access Private
 */
const updatePreferences = async (req, res, next) => {
  try {
    const user = await userService.updatePreferences(
      req.user._id,
      req.body.preferences
    );

    return res.status(200).json(
      responseFormatter(true, "Preferences updated successfully", {
        preferences: user.preferences,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user wishlist
 * @route GET /api/v1/users/wishlist
 * @access Private
 */
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await userService.getWishlist(req.user._id);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Wishlist retrieved successfully", { wishlist })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Add product to wishlist
 * @route POST /api/v1/users/wishlist
 * @access Private
 */
const addToWishlist = async (req, res, next) => {
  try {
    await userService.addToWishlist(req.user._id, req.body.productId);

    return res
      .status(200)
      .json(responseFormatter(true, "Product added to wishlist successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Remove product from wishlist
 * @route DELETE /api/v1/users/wishlist/:productId
 * @access Private
 */
const removeFromWishlist = async (req, res, next) => {
  try {
    await userService.removeFromWishlist(req.user._id, req.params.productId);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Product removed from wishlist successfully")
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Get recently viewed products
 * @route GET /api/v1/users/recently-viewed
 * @access Private
 */
const getRecentlyViewed = async (req, res, next) => {
  try {
    const recentlyViewed = await userService.getRecentlyViewed(req.user._id);

    return res
      .status(200)
      .json(
        responseFormatter(
          true,
          "Recently viewed products retrieved successfully",
          { recentlyViewed }
        )
      );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updatePreferences,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getRecentlyViewed,
};
