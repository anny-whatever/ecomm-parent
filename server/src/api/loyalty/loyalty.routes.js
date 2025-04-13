const express = require("express");
const router = express.Router();
const loyaltyController = require("./loyalty.controller");
const { authMiddleware } = require("../../middleware/auth.middleware");
const { rbacMiddleware } = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const loyaltyValidator = require("../../utils/validators/loyalty.validator");

// Public routes
router.get("/settings", loyaltyController.getSettings);
router.get("/tiers", loyaltyController.getLoyaltyTiers);
router.get("/rules", loyaltyController.getPointsRules);

// Authenticated user routes
router.get(
  "/my-account",
  authMiddleware,
  loyaltyController.getMyLoyaltyAccount
);
router.post("/enroll", authMiddleware, loyaltyController.enrollUser);
router.post(
  "/redeem",
  authMiddleware,
  validationMiddleware(loyaltyValidator.redeemPoints),
  loyaltyController.redeemPoints
);
router.get("/referral", authMiddleware, loyaltyController.getReferralLink);

// Admin only routes
router.put(
  "/settings",
  authMiddleware,
  rbacMiddleware(["admin"]),
  validationMiddleware(loyaltyValidator.updateSettings),
  loyaltyController.updateSettings
);
router.post(
  "/initialize",
  authMiddleware,
  rbacMiddleware(["admin"]),
  loyaltyController.initializeLoyaltyProgram
);
router.post(
  "/award-points",
  authMiddleware,
  rbacMiddleware(["admin"]),
  validationMiddleware(loyaltyValidator.awardPoints),
  loyaltyController.awardPoints
);
router.get(
  "/user/:userId",
  authMiddleware,
  rbacMiddleware(["admin"]),
  validationMiddleware(loyaltyValidator.getUserLoyalty),
  loyaltyController.getUserLoyalty
);
router.post(
  "/clear-expired",
  authMiddleware,
  rbacMiddleware(["admin"]),
  loyaltyController.clearExpiredPoints
);

// Internal API route (requires secret key)
router.post(
  "/process-order",
  validationMiddleware(loyaltyValidator.processOrderPoints),
  loyaltyController.processOrderPoints
);

module.exports = router;
