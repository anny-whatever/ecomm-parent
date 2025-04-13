const Joi = require("joi");

/**
 * Validators for loyalty program API endpoints
 */
const loyaltyValidator = {
  /**
   * Validate settings update request
   */
  updateSettings: {
    body: Joi.object({
      programName: Joi.string().max(100),
      isActive: Joi.boolean(),
      pointsPerCurrencyUnit: Joi.number().min(0),
      pointValue: Joi.number().min(0),
      minimumRedemption: Joi.number().integer().min(0),
      pointsExpiry: Joi.number().integer().min(0),
      autoEnroll: Joi.boolean(),
      enablePointExpiry: Joi.boolean(),
      enableTiers: Joi.boolean(),
      enableReferrals: Joi.boolean(),
      referrerPoints: Joi.number().integer().min(0),
      referredPoints: Joi.number().integer().min(0),
    }),
  },

  /**
   * Validate points redemption request
   */
  redeemPoints: {
    body: Joi.object({
      points: Joi.number().integer().min(1).required(),
      type: Joi.string()
        .valid("discount", "cashback", "reward", "custom")
        .required(),
      referenceId: Joi.string().optional(),
      description: Joi.string().max(255).optional(),
    }),
  },

  /**
   * Validate manual points award request
   */
  awardPoints: {
    body: Joi.object({
      userId: Joi.string().required(),
      points: Joi.number().integer().min(1).required(),
      type: Joi.string()
        .valid("purchase", "signup", "review", "referral", "manual", "custom")
        .required(),
      source: Joi.string().max(50).optional(),
      description: Joi.string().max(255).optional(),
      referenceId: Joi.string().optional(),
    }),
  },

  /**
   * Validate process order points request
   */
  processOrderPoints: {
    body: Joi.object({
      orderId: Joi.string().required(),
      userId: Joi.string().required(),
      secretKey: Joi.string().required(),
    }),
  },

  /**
   * Validate get user loyalty request
   */
  getUserLoyalty: {
    params: Joi.object({
      userId: Joi.string().required(),
    }),
  },

  /**
   * Validate loyalty tier creation/update
   */
  loyaltyTier: {
    body: Joi.object({
      name: Joi.string().max(50).required(),
      code: Joi.string().max(50).required(),
      pointThreshold: Joi.number().integer().min(0).required(),
      benefits: Joi.array().items(
        Joi.object({
          type: Joi.string().required(),
          value: Joi.any().required(),
          description: Joi.string().max(255).required(),
        })
      ),
      pointsMultiplier: Joi.number().min(1).required(),
      color: Joi.string().max(20).optional(),
      isActive: Joi.boolean().default(true),
      displayOrder: Joi.number().integer().min(1).optional(),
    }),
  },

  /**
   * Validate points rule creation/update
   */
  pointsRule: {
    body: Joi.object({
      name: Joi.string().max(100).required(),
      type: Joi.string()
        .valid("purchase", "signup", "review", "referral", "custom")
        .required(),
      calculationType: Joi.string()
        .valid("fixed", "percentage", "multiplier")
        .required(),
      value: Joi.number().min(0).required(),
      minimumAmount: Joi.number().min(0).optional(),
      eventCode: Joi.string().max(50).required(),
      description: Joi.string().max(255).required(),
      isActive: Joi.boolean().default(true),
    }),
  },
};

module.exports = loyaltyValidator;
