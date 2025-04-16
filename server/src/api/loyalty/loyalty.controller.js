const { asyncHandler } = require("../../middleware/asyncHandler");
const loyaltyService = require("../../services/loyalty.service");
const { NotFoundError, BadRequestError } = require("../../utils/errorTypes");
const logger = require("../../config/logger");

/**
 * Get loyalty program settings
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await loyaltyService.getSettings();
  res.json(settings);
});

/**
 * Update loyalty program settings
 */
const updateSettings = asyncHandler(async (req, res) => {
  const result = await loyaltyService.updateSettings(req.body);
  res.json(result);
});

/**
 * Get all active loyalty tiers
 */
const getLoyaltyTiers = asyncHandler(async (req, res) => {
  const result = await loyaltyService.getLoyaltyTiers();
  res.json(result);
});

/**
 * Get active points rules
 */
const getPointsRules = asyncHandler(async (req, res) => {
  const result = await loyaltyService.getPointsRules();
  res.json(result);
});

/**
 * Get user's loyalty account information
 */
const getMyLoyaltyAccount = asyncHandler(async (req, res) => {
  const result = await loyaltyService.getUserLoyalty(req.user.id);
  res.json(result);
});

/**
 * Enroll user in loyalty program
 */
const enrollUser = asyncHandler(async (req, res) => {
  const result = await loyaltyService.enrollUser(req.user.id);
  res.json(result);
});

/**
 * Redeem loyalty points
 */
const redeemPoints = asyncHandler(async (req, res) => {
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
});

/**
 * Get user's referral link
 */
const getReferralLink = asyncHandler(async (req, res) => {
  const result = await loyaltyService.generateReferralLink(req.user.id);
  res.json(result);
});

/**
 * Initialize loyalty program with default settings, tiers, and rules
 */
const initializeLoyaltyProgram = asyncHandler(async (req, res) => {
  const result = await loyaltyService.initializeLoyaltyProgram();
  res.json(result);
});

/**
 * Award points to a user manually
 */
const awardPoints = asyncHandler(async (req, res) => {
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
});

/**
 * Get a specific user's loyalty information (admin only)
 */
const getUserLoyalty = asyncHandler(async (req, res) => {
  const result = await loyaltyService.getUserLoyalty(req.params.userId);
  res.json(result);
});

/**
 * Clear expired points from all user accounts
 */
const clearExpiredPoints = asyncHandler(async (req, res) => {
  const result = await loyaltyService.clearExpiredPoints();
  res.json(result);
});

/**
 * Process order points (internal API, not directly called by client)
 */
const processOrderPoints = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getSettings,
  updateSettings,
  getLoyaltyTiers,
  getPointsRules,
  getMyLoyaltyAccount,
  enrollUser,
  redeemPoints,
  getReferralLink,
  initializeLoyaltyProgram,
  awardPoints,
  getUserLoyalty,
  clearExpiredPoints,
  processOrderPoints,
};
