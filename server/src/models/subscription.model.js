const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Subscription plan schema
 * Defines the different subscription plans available in the system
 */
const subscriptionPlanSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "INR",
        uppercase: true,
      },
    },
    billingCycle: {
      interval: {
        type: String,
        enum: ["day", "week", "month", "year"],
        default: "month",
      },
      frequency: {
        type: Number,
        default: 1,
        min: 1,
      },
    },
    trialPeriod: {
      days: {
        type: Number,
        default: 0,
      },
      enabled: {
        type: Boolean,
        default: false,
      },
    },
    features: [
      {
        name: String,
        description: String,
        included: {
          type: Boolean,
          default: true,
        },
        value: Schema.Types.Mixed,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * User subscription schema
 * Tracks a user's subscription to a plan
 */
const subscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "active", // Subscription is active
        "trial", // In trial period
        "past_due", // Payment is past due
        "unpaid", // Payment failed
        "cancelled", // Cancelled by user but not expired
        "expired", // Subscription period ended
        "paused", // Temporarily paused
      ],
      default: "active",
      index: true,
    },
    paymentMethod: {
      type: Schema.Types.Mixed,
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancellationReason: {
      type: String,
    },
    cancellationDate: {
      type: Date,
    },
    billingHistory: [
      {
        paymentId: {
          type: Schema.Types.ObjectId,
          ref: "Payment",
        },
        amount: Number,
        currency: String,
        date: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["success", "failed", "pending", "refunded"],
          default: "pending",
        },
        periodStart: Date,
        periodEnd: Date,
        invoice: String,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
    },
    productSubscriptions: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        variantId: {
          type: Schema.Types.ObjectId,
        },
        customAttributes: Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create indexes
subscriptionPlanSchema.index({ code: 1 });
subscriptionPlanSchema.index({ isActive: 1 });
subscriptionPlanSchema.index({ "price.amount": 1 });

subscriptionSchema.index({ user: 1, plan: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

/**
 * Check if subscription is active
 */
subscriptionSchema.methods.isActive = function () {
  const now = new Date();
  return (
    (this.status === "active" || this.status === "trial") &&
    now <= this.currentPeriodEnd &&
    !this.cancelAtPeriodEnd
  );
};

/**
 * Calculate next billing date
 */
subscriptionSchema.methods.getNextBillingDate = function () {
  return this.currentPeriodEnd;
};

/**
 * Format subscription info for frontend
 */
subscriptionSchema.methods.formatForClient = function () {
  return {
    id: this._id,
    plan: this.plan,
    status: this.status,
    currentPeriodStart: this.currentPeriodStart,
    currentPeriodEnd: this.currentPeriodEnd,
    autoRenew: this.autoRenew,
    cancelAtPeriodEnd: this.cancelAtPeriodEnd,
    isActive: this.isActive(),
    nextBillingDate: this.getNextBillingDate(),
  };
};

// Create models
const SubscriptionPlan = mongoose.model(
  "SubscriptionPlan",
  subscriptionPlanSchema
);
const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = { SubscriptionPlan, Subscription };
