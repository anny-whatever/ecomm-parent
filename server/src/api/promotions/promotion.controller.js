// src/api/promotions/promotion.controller.js
const promotionService = require("../../services/promotion.service");
const logger = require("../../config/logger");
const { responseFormatter } = require("../../utils/responseFormatter");

/**
 * Create a new promotion
 * @route POST /api/v1/promotions
 * @access Private (Admin)
 */
const createPromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.createPromotion(req.body);

    return res.status(201).json(
      responseFormatter(true, "Promotion created successfully", {
        promotion,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all promotions with filtering and pagination
 * @route GET /api/v1/promotions
 * @access Private (Admin)
 */
const getPromotions = async (req, res, next) => {
  try {
    const filters = {
      isActive:
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
          ? false
          : undefined,
      type: req.query.type,
      code: req.query.code,
      validNow: req.query.validNow === "true",
    };

    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sortBy: req.query.sortBy || "-createdAt",
    };

    const result = await promotionService.getAllPromotions(filters, options);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Promotions retrieved successfully", result)
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific promotion by ID
 * @route GET /api/v1/promotions/:id
 * @access Private (Admin)
 */
const getPromotionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promotion = await promotionService.getPromotionById(id);

    return res.status(200).json(
      responseFormatter(true, "Promotion retrieved successfully", {
        promotion,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update a promotion
 * @route PUT /api/v1/promotions/:id
 * @access Private (Admin)
 */
const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedPromotion = await promotionService.updatePromotion(
      id,
      req.body
    );

    return res.status(200).json(
      responseFormatter(true, "Promotion updated successfully", {
        promotion: updatedPromotion,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a promotion
 * @route DELETE /api/v1/promotions/:id
 * @access Private (Admin)
 */
const deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    await promotionService.deletePromotion(id);

    return res
      .status(200)
      .json(responseFormatter(true, "Promotion deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Validate a promotion/coupon code
 * @route POST /api/v1/promotions/validate
 * @access Public
 */
const validatePromotion = async (req, res, next) => {
  try {
    const { code, cartId } = req.body;
    const userId = req.user ? req.user._id : null;

    const result = await promotionService.validatePromotion(
      code,
      cartId,
      userId
    );

    return res
      .status(200)
      .json(
        responseFormatter(
          result.valid,
          result.valid
            ? "Promotion code is valid and applicable"
            : result.message,
          result.valid ? { discount: result.discount } : null
        )
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Get active promotions for customers
 * @route GET /api/v1/promotions/active
 * @access Public
 */
const getActivePromotions = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
    };

    const userId = req.user ? req.user._id : null;
    const result = await promotionService.getActivePromotions(userId, options);

    return res
      .status(200)
      .json(
        responseFormatter(
          true,
          "Active promotions retrieved successfully",
          result
        )
      );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  validatePromotion,
  getActivePromotions,
};
