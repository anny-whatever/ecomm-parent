const subscriptionService = require("../../services/subscription.service");
const logger = require("../../config/logger");
const { responseFormatter } = require("../../utils/responseFormatter");
const { BadRequestError, NotFoundError } = require("../../utils/errorTypes");

/**
 * Get all subscription plans
 * @route GET /api/v1/subscriptions/plans
 * @access Public
 */
const getAllPlans = async (req, res, next) => {
  try {
    const options = {
      isActive: req.query.isActive === "false" ? false : true,
      sortBy: req.query.sortBy || "sortOrder",
      sortOrder: req.query.sortOrder || "asc",
      limit: parseInt(req.query.limit) || 50,
      skip: parseInt(req.query.skip) || 0,
    };

    const plans = await subscriptionService.getAllPlans(options);

    return res.status(200).json(
      responseFormatter(true, "Subscription plans retrieved successfully", {
        plans,
      })
    );
  } catch (error) {
    logger.error("Error fetching subscription plans:", error);
    next(error);
  }
};

/**
 * Get a subscription plan by ID or code
 * @route GET /api/v1/subscriptions/plans/:identifier
 * @access Public
 */
const getPlan = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    const plan = await subscriptionService.getPlan(identifier);

    return res.status(200).json(
      responseFormatter(true, "Subscription plan retrieved successfully", {
        plan,
      })
    );
  } catch (error) {
    logger.error(
      `Error fetching subscription plan ${req.params.identifier}:`,
      error
    );
    next(error);
  }
};

/**
 * Create a subscription plan
 * @route POST /api/v1/admin/subscriptions/plans
 * @access Private (Admin)
 */
const createPlan = async (req, res, next) => {
  try {
    const planData = req.body;
    planData.createdBy = req.user._id;

    const plan = await subscriptionService.createPlan(planData);

    return res.status(201).json(
      responseFormatter(true, "Subscription plan created successfully", {
        plan,
      })
    );
  } catch (error) {
    logger.error("Error creating subscription plan:", error);
    next(error);
  }
};

/**
 * Update a subscription plan
 * @route PUT /api/v1/admin/subscriptions/plans/:planId
 * @access Private (Admin)
 */
const updatePlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;

    const plan = await subscriptionService.updatePlan(planId, updateData);

    return res.status(200).json(
      responseFormatter(true, "Subscription plan updated successfully", {
        plan,
      })
    );
  } catch (error) {
    logger.error(
      `Error updating subscription plan ${req.params.planId}:`,
      error
    );
    next(error);
  }
};

/**
 * Delete a subscription plan
 * @route DELETE /api/v1/admin/subscriptions/plans/:planId
 * @access Private (Admin)
 */
const deletePlan = async (req, res, next) => {
  try {
    const { planId } = req.params;

    const plan = await subscriptionService.deletePlan(planId);

    return res.status(200).json(
      responseFormatter(true, "Subscription plan deleted successfully", {
        plan,
      })
    );
  } catch (error) {
    logger.error(
      `Error deleting subscription plan ${req.params.planId}:`,
      error
    );
    next(error);
  }
};

/**
 * Subscribe to a plan
 * @route POST /api/v1/subscriptions
 * @access Private
 */
const subscribe = async (req, res, next) => {
  try {
    const subscriptionData = {
      userId: req.user._id,
      planId: req.body.planId,
      paymentMethodId: req.body.paymentMethodId,
      productSubscriptions: req.body.productSubscriptions,
    };

    const subscription = await subscriptionService.createSubscription(
      subscriptionData
    );

    return res.status(201).json(
      responseFormatter(true, "Subscription created successfully", {
        subscription,
      })
    );
  } catch (error) {
    logger.error("Error creating subscription:", error);
    next(error);
  }
};

/**
 * Get current user's subscriptions
 * @route GET /api/v1/subscriptions
 * @access Private
 */
const getUserSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.getUserSubscriptions(
      req.user._id
    );

    return res.status(200).json(
      responseFormatter(true, "User subscriptions retrieved successfully", {
        subscriptions,
      })
    );
  } catch (error) {
    logger.error(
      `Error fetching subscriptions for user ${req.user._id}:`,
      error
    );
    next(error);
  }
};

/**
 * Get subscription details
 * @route GET /api/v1/subscriptions/:subscriptionId
 * @access Private
 */
const getSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await subscriptionService.getSubscription(
      subscriptionId
    );

    // Check if subscription belongs to current user (unless admin)
    if (
      subscription.user._id.toString() !== req.user._id.toString() &&
      !req.user.roles.includes("admin")
    ) {
      throw new BadRequestError(
        "You don't have permission to access this subscription"
      );
    }

    return res.status(200).json(
      responseFormatter(true, "Subscription retrieved successfully", {
        subscription,
      })
    );
  } catch (error) {
    logger.error(
      `Error fetching subscription ${req.params.subscriptionId}:`,
      error
    );
    next(error);
  }
};

/**
 * Cancel a subscription
 * @route POST /api/v1/subscriptions/:subscriptionId/cancel
 * @access Private
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const cancelOptions = {
      cancelImmediately: req.body.cancelImmediately || false,
      reason: req.body.reason || "",
    };

    // First check if subscription belongs to current user
    const subscription = await subscriptionService.getSubscription(
      subscriptionId
    );

    if (
      subscription.user._id.toString() !== req.user._id.toString() &&
      !req.user.roles.includes("admin")
    ) {
      throw new BadRequestError(
        "You don't have permission to cancel this subscription"
      );
    }

    const cancelledSubscription = await subscriptionService.cancelSubscription(
      subscriptionId,
      cancelOptions
    );

    return res.status(200).json(
      responseFormatter(true, "Subscription cancelled successfully", {
        subscription: cancelledSubscription,
        cancelledImmediately: cancelOptions.cancelImmediately,
      })
    );
  } catch (error) {
    logger.error(
      `Error cancelling subscription ${req.params.subscriptionId}:`,
      error
    );
    next(error);
  }
};

/**
 * Reactivate a cancelled subscription
 * @route POST /api/v1/subscriptions/:subscriptionId/reactivate
 * @access Private
 */
const reactivateSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;

    // First check if subscription belongs to current user
    const subscription = await subscriptionService.getSubscription(
      subscriptionId
    );

    if (
      subscription.user._id.toString() !== req.user._id.toString() &&
      !req.user.roles.includes("admin")
    ) {
      throw new BadRequestError(
        "You don't have permission to reactivate this subscription"
      );
    }

    const reactivatedSubscription =
      await subscriptionService.reactivateSubscription(subscriptionId);

    return res.status(200).json(
      responseFormatter(true, "Subscription reactivated successfully", {
        subscription: reactivatedSubscription,
      })
    );
  } catch (error) {
    logger.error(
      `Error reactivating subscription ${req.params.subscriptionId}:`,
      error
    );
    next(error);
  }
};

/**
 * Change subscription plan
 * @route POST /api/v1/subscriptions/:subscriptionId/change-plan
 * @access Private
 */
const changePlan = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const { newPlanId, prorate, immediateChange } = req.body;

    // First check if subscription belongs to current user
    const subscription = await subscriptionService.getSubscription(
      subscriptionId
    );

    if (
      subscription.user._id.toString() !== req.user._id.toString() &&
      !req.user.roles.includes("admin")
    ) {
      throw new BadRequestError(
        "You don't have permission to modify this subscription"
      );
    }

    const updatedSubscription = await subscriptionService.changePlan(
      subscriptionId,
      newPlanId,
      { prorate, immediateChange }
    );

    return res.status(200).json(
      responseFormatter(true, "Subscription plan changed successfully", {
        subscription: updatedSubscription,
      })
    );
  } catch (error) {
    logger.error(
      `Error changing plan for subscription ${req.params.subscriptionId}:`,
      error
    );
    next(error);
  }
};

/**
 * Admin: Process due subscription renewals
 * @route POST /api/v1/admin/subscriptions/process-renewals
 * @access Private (Admin)
 */
const processRenewals = async (req, res, next) => {
  try {
    const results = await subscriptionService.processAllDueRenewals();

    return res
      .status(200)
      .json(
        responseFormatter(
          true,
          "Subscription renewals processed successfully",
          { results }
        )
      );
  } catch (error) {
    logger.error("Error processing subscription renewals:", error);
    next(error);
  }
};

module.exports = {
  getAllPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  subscribe,
  getUserSubscriptions,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  changePlan,
  processRenewals,
};
