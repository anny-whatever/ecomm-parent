const {
  SubscriptionPlan,
  Subscription,
} = require("../models/subscription.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const paymentService = require("./payment.service");
const eventService = require("./event.service");
const logger = require("../config/logger");
const {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} = require("../utils/errorTypes");

/**
 * Subscription Service
 * Manages subscription plans and user subscriptions
 */
class SubscriptionService {
  /**
   * Get all subscription plans
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of subscription plans
   */
  async getAllPlans(options = {}) {
    try {
      const {
        isActive = true,
        sortBy = "sortOrder",
        limit = 50,
        skip = 0,
      } = options;

      const query = {};
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      const sort = {};
      sort[sortBy] = options.sortOrder === "desc" ? -1 : 1;

      const plans = await SubscriptionPlan.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip);

      return plans;
    } catch (error) {
      logger.error("Error fetching subscription plans:", error);
      throw new InternalServerError("Failed to fetch subscription plans");
    }
  }

  /**
   * Get a subscription plan by ID or code
   * @param {String} identifier - Plan ID or code
   * @returns {Promise<Object>} Subscription plan
   */
  async getPlan(identifier) {
    try {
      let plan;

      // Check if identifier is ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
        plan = await SubscriptionPlan.findById(identifier);
      } else {
        // Otherwise, assume it's a plan code
        plan = await SubscriptionPlan.findOne({ code: identifier });
      }

      if (!plan) {
        throw new NotFoundError("Subscription plan not found");
      }

      return plan;
    } catch (error) {
      if (error.name === "NotFoundError") {
        throw error;
      }
      logger.error(`Error fetching subscription plan ${identifier}:`, error);
      throw new InternalServerError("Failed to fetch subscription plan");
    }
  }

  /**
   * Create a new subscription plan
   * @param {Object} planData - Plan data
   * @returns {Promise<Object>} Created plan
   */
  async createPlan(planData) {
    try {
      // Check if plan with same code already exists
      const existingPlan = await SubscriptionPlan.findOne({
        code: planData.code,
      });
      if (existingPlan) {
        throw new BadRequestError(
          `Plan with code ${planData.code} already exists`
        );
      }

      const plan = new SubscriptionPlan(planData);
      await plan.save();

      // Fire event for plan creation
      await eventService.fireEvent("subscription.plan.created", {
        planId: plan._id,
        planCode: plan.code,
        name: plan.name,
      });

      return plan;
    } catch (error) {
      if (
        error.name === "ValidationError" ||
        error.name === "BadRequestError"
      ) {
        throw error;
      }
      logger.error("Error creating subscription plan:", error);
      throw new InternalServerError("Failed to create subscription plan");
    }
  }

  /**
   * Update a subscription plan
   * @param {String} planId - Plan ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated plan
   */
  async updatePlan(planId, updateData) {
    try {
      const plan = await SubscriptionPlan.findById(planId);

      if (!plan) {
        throw new NotFoundError("Subscription plan not found");
      }

      // Prevent changing the code if it's already used in subscriptions
      if (updateData.code && updateData.code !== plan.code) {
        const subscriptionsUsingPlan = await Subscription.countDocuments({
          plan: planId,
        });
        if (subscriptionsUsingPlan > 0) {
          throw new BadRequestError(
            `Cannot change plan code as it's used by ${subscriptionsUsingPlan} active subscriptions`
          );
        }
      }

      // Update the plan
      Object.keys(updateData).forEach((key) => {
        plan[key] = updateData[key];
      });

      await plan.save();

      // Fire event for plan update
      await eventService.fireEvent("subscription.plan.updated", {
        planId: plan._id,
        planCode: plan.code,
        changes: Object.keys(updateData),
      });

      return plan;
    } catch (error) {
      if (
        error.name === "ValidationError" ||
        error.name === "NotFoundError" ||
        error.name === "BadRequestError"
      ) {
        throw error;
      }
      logger.error(`Error updating subscription plan ${planId}:`, error);
      throw new InternalServerError("Failed to update subscription plan");
    }
  }

  /**
   * Delete a subscription plan (soft delete by setting isActive = false)
   * @param {String} planId - Plan ID
   * @returns {Promise<Object>} Deleted plan
   */
  async deletePlan(planId) {
    try {
      // Check if plan is used in any active subscriptions
      const activeSubscriptions = await Subscription.countDocuments({
        plan: planId,
        status: { $in: ["active", "trial"] },
      });

      if (activeSubscriptions > 0) {
        throw new BadRequestError(
          `Cannot delete plan used by ${activeSubscriptions} active subscriptions`
        );
      }

      // Soft delete by setting isActive = false
      const plan = await SubscriptionPlan.findByIdAndUpdate(
        planId,
        { isActive: false },
        { new: true }
      );

      if (!plan) {
        throw new NotFoundError("Subscription plan not found");
      }

      // Fire event for plan deletion
      await eventService.fireEvent("subscription.plan.deleted", {
        planId: plan._id,
        planCode: plan.code,
      });

      return plan;
    } catch (error) {
      if (error.name === "NotFoundError" || error.name === "BadRequestError") {
        throw error;
      }
      logger.error(`Error deleting subscription plan ${planId}:`, error);
      throw new InternalServerError("Failed to delete subscription plan");
    }
  }

  /**
   * Subscribe a user to a plan
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const { userId, planId, paymentMethodId, productSubscriptions } =
        subscriptionData;

      // Get the user
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Get the plan
      const plan = await this.getPlan(planId);
      if (!plan || !plan.isActive) {
        throw new NotFoundError("Subscription plan not found or inactive");
      }

      // Calculate next billing date based on billing cycle
      const startDate = new Date();
      let endDate;

      if (
        plan.trialPeriod &&
        plan.trialPeriod.enabled &&
        plan.trialPeriod.days > 0
      ) {
        // If trial period is enabled, set end date to trial period end
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.trialPeriod.days);
      } else {
        // Otherwise, set end date based on billing cycle
        endDate = new Date(startDate);

        switch (plan.billingCycle.interval) {
          case "day":
            endDate.setDate(endDate.getDate() + plan.billingCycle.frequency);
            break;
          case "week":
            endDate.setDate(
              endDate.getDate() + 7 * plan.billingCycle.frequency
            );
            break;
          case "month":
            endDate.setMonth(endDate.getMonth() + plan.billingCycle.frequency);
            break;
          case "year":
            endDate.setFullYear(
              endDate.getFullYear() + plan.billingCycle.frequency
            );
            break;
          default:
            endDate.setMonth(endDate.getMonth() + 1); // Default to 1 month
        }
      }

      // Check if user already has an active subscription to this plan
      const existingSubscription = await Subscription.findOne({
        user: userId,
        plan: plan._id,
        status: { $in: ["active", "trial"] },
      });

      if (existingSubscription) {
        throw new BadRequestError(
          "User already has an active subscription to this plan"
        );
      }

      // Validate product subscriptions if provided
      if (productSubscriptions && productSubscriptions.length > 0) {
        for (const item of productSubscriptions) {
          const product = await Product.findById(item.product);
          if (!product) {
            throw new NotFoundError(`Product ${item.product} not found`);
          }

          // Check variant if specified
          if (item.variantId) {
            const variant = product.variants.id(item.variantId);
            if (!variant) {
              throw new NotFoundError(
                `Variant ${item.variantId} not found in product ${item.product}`
              );
            }
          }
        }
      }

      // Create the subscription
      const subscription = new Subscription({
        user: userId,
        plan: plan._id,
        startDate,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        status: plan.trialPeriod.enabled ? "trial" : "active",
        paymentMethod: paymentMethodId,
        productSubscriptions: productSubscriptions || [],
      });

      await subscription.save();

      // Fire event for subscription creation
      await eventService.fireEvent("subscription.created", {
        userId,
        subscriptionId: subscription._id,
        planId: plan._id,
        planCode: plan.code,
        status: subscription.status,
      });

      return subscription;
    } catch (error) {
      if (
        error.name === "ValidationError" ||
        error.name === "NotFoundError" ||
        error.name === "BadRequestError"
      ) {
        throw error;
      }
      logger.error("Error creating subscription:", error);
      throw new InternalServerError("Failed to create subscription");
    }
  }

  /**
   * Get all subscriptions for a user
   * @param {String} userId - User ID
   * @returns {Promise<Array>} Array of user subscriptions
   */
  async getUserSubscriptions(userId) {
    try {
      const subscriptions = await Subscription.find({ user: userId })
        .populate("plan")
        .sort({ createdAt: -1 });

      return subscriptions;
    } catch (error) {
      logger.error(`Error fetching subscriptions for user ${userId}:`, error);
      throw new InternalServerError("Failed to fetch user subscriptions");
    }
  }

  /**
   * Get a subscription by ID
   * @param {String} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Subscription
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId)
        .populate("plan")
        .populate("user", "firstName lastName email");

      if (!subscription) {
        throw new NotFoundError("Subscription not found");
      }

      return subscription;
    } catch (error) {
      if (error.name === "NotFoundError") {
        throw error;
      }
      logger.error(`Error fetching subscription ${subscriptionId}:`, error);
      throw new InternalServerError("Failed to fetch subscription");
    }
  }

  /**
   * Cancel a subscription
   * @param {String} subscriptionId - Subscription ID
   * @param {Object} cancelOptions - Cancellation options
   * @returns {Promise<Object>} Updated subscription
   */
  async cancelSubscription(subscriptionId, cancelOptions = {}) {
    try {
      const { cancelImmediately = false, reason = "" } = cancelOptions;

      const subscription = await this.getSubscription(subscriptionId);

      if (
        subscription.status === "cancelled" ||
        subscription.status === "expired"
      ) {
        throw new BadRequestError(
          "Subscription is already cancelled or expired"
        );
      }

      if (cancelImmediately) {
        // Immediate cancellation
        subscription.status = "cancelled";
        subscription.cancellationDate = new Date();
        subscription.cancellationReason = reason;
        subscription.endDate = new Date();
      } else {
        // Cancel at period end
        subscription.cancelAtPeriodEnd = true;
        subscription.cancellationDate = new Date();
        subscription.cancellationReason = reason;
      }

      await subscription.save();

      // Fire event for subscription cancellation
      await eventService.fireEvent("subscription.cancelled", {
        subscriptionId: subscription._id,
        userId: subscription.user,
        planId: subscription.plan._id,
        immediate: cancelImmediately,
        reason,
      });

      return subscription;
    } catch (error) {
      if (error.name === "NotFoundError" || error.name === "BadRequestError") {
        throw error;
      }
      logger.error(`Error cancelling subscription ${subscriptionId}:`, error);
      throw new InternalServerError("Failed to cancel subscription");
    }
  }

  /**
   * Reactivate a cancelled subscription (if not yet expired)
   * @param {String} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Updated subscription
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = await this.getSubscription(subscriptionId);

      if (
        subscription.status !== "cancelled" ||
        subscription.endDate < new Date()
      ) {
        throw new BadRequestError("Subscription cannot be reactivated");
      }

      // Reactivate subscription
      subscription.status = "active";
      subscription.cancelAtPeriodEnd = false;
      subscription.cancellationDate = null;
      subscription.cancellationReason = null;

      await subscription.save();

      // Fire event for subscription reactivation
      await eventService.fireEvent("subscription.reactivated", {
        subscriptionId: subscription._id,
        userId: subscription.user,
        planId: subscription.plan._id,
      });

      return subscription;
    } catch (error) {
      if (error.name === "NotFoundError" || error.name === "BadRequestError") {
        throw error;
      }
      logger.error(`Error reactivating subscription ${subscriptionId}:`, error);
      throw new InternalServerError("Failed to reactivate subscription");
    }
  }

  /**
   * Change a subscription's plan
   * @param {String} subscriptionId - Subscription ID
   * @param {String} newPlanId - New plan ID
   * @param {Object} options - Change options
   * @returns {Promise<Object>} Updated subscription
   */
  async changePlan(subscriptionId, newPlanId, options = {}) {
    try {
      const { prorate = true, immediateChange = true } = options;

      const subscription = await this.getSubscription(subscriptionId);
      const newPlan = await this.getPlan(newPlanId);

      if (subscription.status !== "active" && subscription.status !== "trial") {
        throw new BadRequestError(
          "Cannot change plan for inactive subscription"
        );
      }

      // If changing immediately, update the subscription
      if (immediateChange) {
        // Calculate new period end date
        const startDate = new Date();
        let endDate = new Date(startDate);

        switch (newPlan.billingCycle.interval) {
          case "day":
            endDate.setDate(endDate.getDate() + newPlan.billingCycle.frequency);
            break;
          case "week":
            endDate.setDate(
              endDate.getDate() + 7 * newPlan.billingCycle.frequency
            );
            break;
          case "month":
            endDate.setMonth(
              endDate.getMonth() + newPlan.billingCycle.frequency
            );
            break;
          case "year":
            endDate.setFullYear(
              endDate.getFullYear() + newPlan.billingCycle.frequency
            );
            break;
          default:
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Update subscription
        subscription.plan = newPlan._id;
        subscription.currentPeriodStart = startDate;
        subscription.currentPeriodEnd = endDate;

        // Add record to billing history if prorating
        if (prorate && subscription.status === "active") {
          // Calculate prorated amount for remaining time on old subscription
          // This is a simplified calculation - in a real implementation you'd need
          // more complex proration logic based on days remaining
          // Here we'd process the payment for the new plan (minus prorated refund)
          // This is where payment processing would happen
        }
      } else {
        // Schedule the change for the next billing cycle by storing it in metadata
        if (!subscription.metadata) {
          subscription.metadata = {};
        }
        subscription.metadata.pendingPlanChange = {
          planId: newPlan._id,
          effectiveDate: subscription.currentPeriodEnd,
        };
      }

      await subscription.save();

      // Fire event for plan change
      await eventService.fireEvent("subscription.plan.changed", {
        subscriptionId: subscription._id,
        userId: subscription.user,
        oldPlanId: subscription.plan._id,
        newPlanId: newPlan._id,
        immediate: immediateChange,
      });

      return subscription;
    } catch (error) {
      if (error.name === "NotFoundError" || error.name === "BadRequestError") {
        throw error;
      }
      logger.error(
        `Error changing subscription plan ${subscriptionId}:`,
        error
      );
      throw new InternalServerError("Failed to change subscription plan");
    }
  }

  /**
   * Process a subscription renewal
   * @param {String} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Renewal result
   */
  async processRenewal(subscriptionId) {
    try {
      const subscription = await this.getSubscription(subscriptionId);

      // Check if subscription should renew
      if (subscription.status !== "active" || subscription.cancelAtPeriodEnd) {
        logger.info(
          `Subscription ${subscriptionId} will not renew - status: ${subscription.status}, cancelAtPeriodEnd: ${subscription.cancelAtPeriodEnd}`
        );

        if (subscription.cancelAtPeriodEnd) {
          // Set status to cancelled since we've reached the period end
          subscription.status = "cancelled";
          await subscription.save();

          await eventService.fireEvent("subscription.expired", {
            subscriptionId: subscription._id,
            userId: subscription.user,
            planId: subscription.plan._id,
          });
        }

        return {
          renewed: false,
          reason: "Subscription not eligible for renewal",
        };
      }

      // Check if current period is ending soon (within 24 hours)
      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);
      const timeDiff = periodEnd.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        return {
          renewed: false,
          reason: "Subscription not due for renewal yet",
        };
      }

      // Process payment for renewal (this is where you'd integrate with payment gateway)
      // For this implementation, we'll assume payment is successful
      const plan = subscription.plan;

      // Calculate new billing period
      const newPeriodStart = new Date(subscription.currentPeriodEnd);
      let newPeriodEnd = new Date(newPeriodStart);

      // Check if there's a pending plan change
      if (subscription.metadata && subscription.metadata.pendingPlanChange) {
        const pendingChange = subscription.metadata.pendingPlanChange;
        if (new Date(pendingChange.effectiveDate) <= newPeriodStart) {
          // Apply pending plan change
          const newPlan = await this.getPlan(pendingChange.planId);
          plan = newPlan;
          subscription.plan = newPlan._id;
          delete subscription.metadata.pendingPlanChange;

          await eventService.fireEvent("subscription.plan.changed", {
            subscriptionId: subscription._id,
            userId: subscription.user,
            oldPlanId: subscription.plan._id,
            newPlanId: newPlan._id,
            immediate: true,
          });
        }
      }

      // Calculate new period end based on billing cycle
      switch (plan.billingCycle.interval) {
        case "day":
          newPeriodEnd.setDate(
            newPeriodEnd.getDate() + plan.billingCycle.frequency
          );
          break;
        case "week":
          newPeriodEnd.setDate(
            newPeriodEnd.getDate() + 7 * plan.billingCycle.frequency
          );
          break;
        case "month":
          newPeriodEnd.setMonth(
            newPeriodEnd.getMonth() + plan.billingCycle.frequency
          );
          break;
        case "year":
          newPeriodEnd.setFullYear(
            newPeriodEnd.getFullYear() + plan.billingCycle.frequency
          );
          break;
        default:
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }

      // Update subscription with new billing period
      subscription.currentPeriodStart = newPeriodStart;
      subscription.currentPeriodEnd = newPeriodEnd;

      // Add payment to billing history
      subscription.billingHistory.push({
        amount: plan.price.amount,
        currency: plan.price.currency,
        date: new Date(),
        status: "success",
        periodStart: newPeriodStart,
        periodEnd: newPeriodEnd,
        invoice: `INV-${Math.floor(Math.random() * 10000000)}`,
      });

      await subscription.save();

      // Fire event for successful renewal
      await eventService.fireEvent("subscription.renewed", {
        subscriptionId: subscription._id,
        userId: subscription.user,
        planId: plan._id,
        newPeriodEnd: newPeriodEnd,
      });

      return {
        renewed: true,
        subscription,
        nextRenewalDate: newPeriodEnd,
      };
    } catch (error) {
      logger.error(
        `Error processing renewal for subscription ${subscriptionId}:`,
        error
      );
      throw new InternalServerError("Failed to process subscription renewal");
    }
  }

  /**
   * Process all due renewals
   * @returns {Promise<Object>} Processing results
   */
  async processAllDueRenewals() {
    try {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // Find all active subscriptions due for renewal
      const dueSubscriptions = await Subscription.find({
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: { $lte: endOfDay },
      });

      logger.info(
        `Found ${dueSubscriptions.length} subscriptions due for renewal`
      );

      const results = {
        total: dueSubscriptions.length,
        successful: 0,
        failed: 0,
        details: [],
      };

      // Process each subscription
      for (const subscription of dueSubscriptions) {
        try {
          const result = await this.processRenewal(subscription._id);
          results.details.push({
            subscriptionId: subscription._id,
            success: result.renewed,
            message: result.renewed ? "Renewal successful" : result.reason,
          });

          if (result.renewed) {
            results.successful++;
          }
        } catch (error) {
          logger.error(
            `Failed to process renewal for subscription ${subscription._id}:`,
            error
          );
          results.failed++;
          results.details.push({
            subscriptionId: subscription._id,
            success: false,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error("Error processing due renewals:", error);
      throw new InternalServerError(
        "Failed to process due subscription renewals"
      );
    }
  }
}

// Create instance and export
const subscriptionService = new SubscriptionService();
module.exports = subscriptionService;
