const express = require("express");
const { asyncHandler } = require("../../middleware/asyncHandler");
const { isAuthenticated } = require("../../middleware/auth");
const { isAdmin } = require("../../middleware/roleCheck");
const loyaltyService = require("../../services/loyalty.service");
const { NotFoundError, BadRequestError } = require("../../utils/errorTypes");
const logger = require("../../config/logger");
const router = express.Router();

/**
 * @route   GET /api/loyalty/settings
 * @desc    Get loyalty program settings
 * @access  Public
 */
router.get(
  "/settings",
  asyncHandler(async (req, res) => {
    const settings = await loyaltyService.getSettings();
    res.json(settings);
  })
);

/**
 * @route   PUT /api/loyalty/settings
 * @desc    Update loyalty program settings
 * @access  Admin
 */
router.put(
  "/settings",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await loyaltyService.updateSettings(req.body);
    res.json(result);
  })
);

/**
 * @route   GET /api/loyalty/tiers
 * @desc    Get all active loyalty tiers
 * @access  Public
 */
router.get(
  "/tiers",
  asyncHandler(async (req, res) => {
    const result = await loyaltyService.getLoyaltyTiers();
    res.json(result);
  })
);

/**
 * @route   GET /api/loyalty/rules
 * @desc    Get active points rules
 * @access  Public
 */
router.get(
  "/rules",
  asyncHandler(async (req, res) => {
    const result = await loyaltyService.getPointsRules();
    res.json(result);
  })
);

/**
 * @route   GET /api/loyalty/my-account
 * @desc    Get user's loyalty account information
 * @access  Authenticated
 */
router.get(
  "/my-account",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const result = await loyaltyService.getUserLoyalty(req.user.id);
    res.json(result);
  })
);

/**
 * @route   POST /api/loyalty/enroll
 * @desc    Enroll user in loyalty program
 * @access  Authenticated
 */
router.post(
  "/enroll",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const result = await loyaltyService.enrollUser(req.user.id);
    res.json(result);
  })
);

/**
 * @route   POST /api/loyalty/redeem
 * @desc    Redeem loyalty points
 * @access  Authenticated
 */
router.post(
  "/redeem",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { points, type, referenceId, description } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid points amount is required",
      });
    }

    const result = await loyaltyService.redeemPoints(req.user.id, {
      points,
      type,
      referenceId,
      description,
    });

    res.json(result);
  })
);

/**
 * @route   GET /api/loyalty/referral
 * @desc    Get user's referral link
 * @access  Authenticated
 */
router.get(
  "/referral",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const result = await loyaltyService.generateReferralLink(req.user.id);
    res.json(result);
  })
);

/**
 * @route   POST /api/loyalty/initialize
 * @desc    Initialize loyalty program with default settings, tiers, and rules
 * @access  Admin
 */
router.post(
  "/initialize",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await loyaltyService.initializeLoyaltyProgram();
    res.json(result);
  })
);

/**
 * @route   POST /api/loyalty/award-points
 * @desc    Award points to a user manually
 * @access  Admin
 */
router.post(
  "/award-points",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { userId, points, type, source, description, referenceId } = req.body;

    if (!userId || !points) {
      return res.status(400).json({
        success: false,
        message: "User ID and points amount are required",
      });
    }

    const result = await loyaltyService.awardPoints(userId, {
      points: parseInt(points),
      type,
      source: source || "manual",
      description: description || "Points awarded by admin",
      referenceId,
    });

    res.json(result);
  })
);

/**
 * @route   GET /api/loyalty/user/:userId
 * @desc    Get a specific user's loyalty information (admin only)
 * @access  Admin
 */
router.get(
  "/user/:userId",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await loyaltyService.getUserLoyalty(req.params.userId);
    res.json(result);
  })
);

/**
 * @route   POST /api/loyalty/clear-expired
 * @desc    Clear expired points from all user accounts
 * @access  Admin
 */
router.post(
  "/clear-expired",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await loyaltyService.clearExpiredPoints();
    res.json(result);
  })
);

/**
 * @route   POST /api/loyalty/process-order
 * @desc    Process order points (internal API, not directly called by client)
 * @access  Internal
 */
router.post(
  "/process-order",
  asyncHandler(async (req, res) => {
    const { orderId, userId, secretKey } = req.body;

    // Validate secret key for internal API calls
    // This should be replaced with a proper internal authentication system
    const validKey = process.env.INTERNAL_API_KEY;
    if (!validKey || secretKey !== validKey) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized internal API request",
      });
    }

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and User ID are required",
      });
    }

    const result = await loyaltyService.processOrderPoints(orderId, userId);
    res.json(result);
  })
);

module.exports = router;
