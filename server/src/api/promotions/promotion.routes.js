// src/api/promotions/promotion.routes.js
const express = require("express");
const promotionController = require("./promotion.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const promotionValidator = require("../../utils/validators/promotion.validator");

const router = express.Router();

/**
 * @route   GET /api/v1/promotions/active
 * @desc    Get active promotions that customer can use
 * @access  Public
 */
router.get(
  "/active",
  validationMiddleware(promotionValidator.list),
  promotionController.getActivePromotions
);

/**
 * @route   POST /api/v1/promotions/validate
 * @desc    Validate a promotion/coupon code
 * @access  Public
 */
router.post(
  "/validate",
  validationMiddleware(promotionValidator.validate),
  promotionController.validatePromotion
);

/**
 * @route   GET /api/v1/promotions
 * @desc    Get all promotions with filtering
 * @access  Private (Admin)
 */
router.get(
  "/",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(promotionValidator.list),
  promotionController.getPromotions
);

/**
 * @route   GET /api/v1/promotions/:id
 * @desc    Get a promotion by ID
 * @access  Private (Admin)
 */
router.get(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(promotionValidator.getById),
  promotionController.getPromotionById
);

/**
 * @route   POST /api/v1/promotions
 * @desc    Create a new promotion
 * @access  Private (Admin)
 */
router.post(
  "/",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(promotionValidator.create),
  promotionController.createPromotion
);

/**
 * @route   PUT /api/v1/promotions/:id
 * @desc    Update a promotion
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(promotionValidator.update),
  promotionController.updatePromotion
);

/**
 * @route   DELETE /api/v1/promotions/:id
 * @desc    Delete a promotion
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin"]),
  validationMiddleware(promotionValidator.remove),
  promotionController.deletePromotion
);

module.exports = router;
