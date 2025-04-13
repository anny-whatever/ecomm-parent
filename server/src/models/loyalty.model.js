const mongoose = require("mongoose");

/**
 * Loyalty Tier Schema
 * Defines membership tiers in the loyalty program
 */
const loyaltyTierSchema = new mongoose.Schema(
  {
    // Tier name (Bronze, Silver, Gold, Platinum)
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Tier code for internal reference
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Points required to reach this tier
    pointThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
    // Tier benefits
    benefits: [
      {
        type: {
          type: String,
          enum: [
            "discount_percentage",
            "free_shipping",
            "priority_support",
            "birthday_bonus",
            "exclusive_products",
            "early_access",
            "bonus_points",
            "free_gift",
            "custom",
          ],
          required: true,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
    // Points multiplier for purchases at this tier
    pointsMultiplier: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Color code for UI representation
    color: {
      type: String,
      default: "#000000",
    },
    // Icon or image URL
    icon: {
      type: String,
    },
    // Whether this tier is active
    isActive: {
      type: Boolean,
      default: true,
    },
    // Sort order for display
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/**
 * Points Rule Schema
 * Defines rules for earning and redeeming points
 */
const pointsRuleSchema = new mongoose.Schema(
  {
    // Rule name
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Rule type
    type: {
      type: String,
      enum: [
        "purchase",
        "signup",
        "review",
        "referral",
        "social_share",
        "birthday",
        "special_event",
        "redemption",
        "custom",
      ],
      required: true,
    },
    // Points calculation type
    calculationType: {
      type: String,
      enum: ["fixed", "percentage", "multiplier", "custom"],
      required: true,
    },
    // Value for points calculation (meaning depends on calculation type)
    value: {
      type: Number,
      required: true,
    },
    // Minimum amount for rule to apply (for purchase rules)
    minimumAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Maximum points that can be earned per transaction from this rule
    maxPointsPerTransaction: {
      type: Number,
      min: 0,
    },
    // Event code for triggering points (e.g., 'purchase.completed')
    eventCode: {
      type: String,
    },
    // Product categories this rule applies to (empty means all)
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    // Specific products this rule applies to (empty means all)
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // Description for customers
    description: {
      type: String,
    },
    // Whether this rule is active
    isActive: {
      type: Boolean,
      default: true,
    },
    // Start and end dates for temporary rules
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    // Rule metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

/**
 * Customer Loyalty Schema
 * Tracks a customer's loyalty program status
 */
const customerLoyaltySchema = new mongoose.Schema(
  {
    // User reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Total points earned (lifetime)
    totalPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Current available points balance
    pointsBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Current tier
    currentTier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoyaltyTier",
    },
    // Tier history
    tierHistory: [
      {
        tier: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LoyaltyTier",
          required: true,
        },
        achievedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Points transaction history
    transactions: [
      {
        // Transaction type
        type: {
          type: String,
          enum: ["earn", "redeem", "expire", "adjust", "bonus"],
          required: true,
        },
        // Points amount (positive for earn, negative for redeem/expire)
        points: {
          type: Number,
          required: true,
        },
        // Source of transaction
        source: {
          type: String,
          enum: [
            "purchase",
            "signup",
            "review",
            "referral",
            "social_share",
            "birthday",
            "redemption",
            "expiration",
            "admin_adjustment",
            "tier_bonus",
            "custom",
          ],
          required: true,
        },
        // Reference ID (order ID, review ID, etc.)
        referenceId: {
          type: String,
        },
        // Reference model name
        referenceModel: {
          type: String,
        },
        // Transaction description
        description: {
          type: String,
        },
        // Expiration date for these points (if applicable)
        expiryDate: {
          type: Date,
        },
        // Transaction timestamp
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Redemption history
    redemptions: [
      {
        // Redemption type
        type: {
          type: String,
          enum: ["discount", "product", "gift_card", "free_shipping", "custom"],
          required: true,
        },
        // Points used
        pointsRedeemed: {
          type: Number,
          required: true,
          min: 1,
        },
        // Value of redemption
        value: {
          type: Number,
        },
        // Reference ID (order ID, etc.)
        referenceId: {
          type: String,
        },
        // Redemption description
        description: {
          type: String,
        },
        // Redemption timestamp
        redeemedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Enrollment date
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    // Whether account is active in loyalty program
    isActive: {
      type: Boolean,
      default: true,
    },
    // Customer's referral code
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Customers referred by this user
    referrals: [
      {
        referredUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        referredAt: {
          type: Date,
          default: Date.now,
        },
        pointsAwarded: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

// Create an index for faster lookup of user's point balance
customerLoyaltySchema.index({ user: 1 });
customerLoyaltySchema.index({ pointsBalance: 1 });
customerLoyaltySchema.index({ referralCode: 1 });

/**
 * Loyalty Program Settings Schema
 */
const loyaltySettingsSchema = new mongoose.Schema(
  {
    // Program name
    programName: {
      type: String,
      required: true,
      default: "Rewards Program",
    },
    // Whether the program is active
    isActive: {
      type: Boolean,
      default: true,
    },
    // Base points conversion rate (e.g., 10 points per $1)
    pointsPerCurrencyUnit: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },
    // Value per point for redemption (e.g., 0.01 = 1 cent per point)
    pointValue: {
      type: Number,
      required: true,
      min: 0,
      default: 0.01,
    },
    // Minimum points for redemption
    minimumRedemption: {
      type: Number,
      required: true,
      min: 0,
      default: 100,
    },
    // Points expiration in days (0 = no expiration)
    pointsExpiry: {
      type: Number,
      default: 365,
      min: 0,
    },
    // Auto-enroll customers in loyalty program
    autoEnroll: {
      type: Boolean,
      default: true,
    },
    // Enable point expiry
    enablePointExpiry: {
      type: Boolean,
      default: true,
    },
    // Enable tier-based system
    enableTiers: {
      type: Boolean,
      default: true,
    },
    // Enable referral program
    enableReferrals: {
      type: Boolean,
      default: true,
    },
    // Points for referrer
    referrerPoints: {
      type: Number,
      default: 100,
    },
    // Points for referred customer
    referredPoints: {
      type: Number,
      default: 50,
    },
  },
  { timestamps: true }
);

// Create models
const LoyaltyTier = mongoose.model("LoyaltyTier", loyaltyTierSchema);
const PointsRule = mongoose.model("PointsRule", pointsRuleSchema);
const CustomerLoyalty = mongoose.model(
  "CustomerLoyalty",
  customerLoyaltySchema
);
const LoyaltySettings = mongoose.model(
  "LoyaltySettings",
  loyaltySettingsSchema
);

module.exports = {
  LoyaltyTier,
  PointsRule,
  CustomerLoyalty,
  LoyaltySettings,
};
