const express = require("express");
const router = express.Router();
const subscriptionController = require("./subscription.controller");
const { authMiddleware } = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const subscriptionValidator = require("../../utils/validators/subscription.validator");

// Public routes - for viewing available plans
router.get(
  "/plans",
  validationMiddleware(subscriptionValidator.getPlans),
  subscriptionController.getAllPlans
);

router.get(
  "/plans/:identifier",
  validationMiddleware(subscriptionValidator.getPlan),
  subscriptionController.getPlan
);

// Routes requiring authentication
router.use(authMiddleware);

// User subscription management
router.post(
  "/",
  validationMiddleware(subscriptionValidator.subscribe),
  subscriptionController.subscribe
);

router.get("/", subscriptionController.getUserSubscriptions);

router.get(
  "/:subscriptionId",
  validationMiddleware(subscriptionValidator.getSubscription),
  subscriptionController.getSubscription
);

router.post(
  "/:subscriptionId/cancel",
  validationMiddleware(subscriptionValidator.cancelSubscription),
  subscriptionController.cancelSubscription
);

router.post(
  "/:subscriptionId/reactivate",
  validationMiddleware(subscriptionValidator.reactivateSubscription),
  subscriptionController.reactivateSubscription
);

router.post(
  "/:subscriptionId/change-plan",
  validationMiddleware(subscriptionValidator.changePlan),
  subscriptionController.changePlan
);

// Admin routes
const adminRouter = express.Router();

adminRouter.use(authMiddleware);
adminRouter.use(rbacMiddleware(["admin"]));

// Admin - Plan management
adminRouter.post(
  "/plans",
  validationMiddleware(subscriptionValidator.createPlan),
  subscriptionController.createPlan
);

adminRouter.put(
  "/plans/:planId",
  validationMiddleware(subscriptionValidator.updatePlan),
  subscriptionController.updatePlan
);

adminRouter.delete(
  "/plans/:planId",
  validationMiddleware(subscriptionValidator.deletePlan),
  subscriptionController.deletePlan
);

// Admin - Process renewals
adminRouter.post("/process-renewals", subscriptionController.processRenewals);

module.exports = {
  subscriptionRoutes: router,
  adminSubscriptionRoutes: adminRouter,
};
