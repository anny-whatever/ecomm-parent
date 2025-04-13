const Joi = require("joi");

// Validate get plans request
const getPlans = Joi.object({
  query: Joi.object({
    isActive: Joi.boolean(),
    sortBy: Joi.string().valid(
      "name",
      "price.amount",
      "sortOrder",
      "createdAt"
    ),
    sortOrder: Joi.string().valid("asc", "desc"),
    limit: Joi.number().integer().min(1).max(100),
    skip: Joi.number().integer().min(0),
  }),
});

// Validate get plan request
const getPlan = Joi.object({
  params: Joi.object({
    identifier: Joi.string().required(),
  }),
});

// Validate subscription plan creation
const createPlan = Joi.object({
  body: Joi.object({
    name: Joi.string().required().min(3).max(100),
    code: Joi.string()
      .required()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z0-9\-_]+$/),
    description: Joi.string().max(500),
    price: Joi.object({
      amount: Joi.number().required().min(0),
      currency: Joi.string().default("INR").length(3),
    }).required(),
    billingCycle: Joi.object({
      interval: Joi.string().valid("day", "week", "month", "year").required(),
      frequency: Joi.number().integer().min(1).max(12).default(1),
    }).required(),
    trialPeriod: Joi.object({
      days: Joi.number().integer().min(0).max(60).default(0),
      enabled: Joi.boolean().default(false),
    }),
    features: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        description: Joi.string(),
        included: Joi.boolean().default(true),
        value: Joi.any(),
      })
    ),
    isActive: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().default(0),
    metadata: Joi.object(),
  }).required(),
});

// Validate subscription plan update
const updatePlan = Joi.object({
  params: Joi.object({
    planId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/),
  }),
  body: Joi.object({
    name: Joi.string().min(3).max(100),
    code: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z0-9\-_]+$/),
    description: Joi.string().max(500),
    price: Joi.object({
      amount: Joi.number().min(0),
      currency: Joi.string().length(3),
    }),
    billingCycle: Joi.object({
      interval: Joi.string().valid("day", "week", "month", "year"),
      frequency: Joi.number().integer().min(1).max(12),
    }),
    trialPeriod: Joi.object({
      days: Joi.number().integer().min(0).max(60),
      enabled: Joi.boolean(),
    }),
    features: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        description: Joi.string(),
        included: Joi.boolean().default(true),
        value: Joi.any(),
      })
    ),
    isActive: Joi.boolean(),
    sortOrder: Joi.number().integer(),
    metadata: Joi.object(),
  })
    .min(1)
    .required(),
});

// Validate subscription plan deletion
const deletePlan = Joi.object({
  params: Joi.object({
    planId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/),
  }),
});

// Validate subscription creation
const subscribe = Joi.object({
  body: Joi.object({
    planId: Joi.string().required(),
    paymentMethodId: Joi.string(),
    productSubscriptions: Joi.array().items(
      Joi.object({
        product: Joi.string()
          .required()
          .pattern(/^[0-9a-fA-F]{24}$/),
        quantity: Joi.number().integer().min(1).default(1),
        variantId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
        customAttributes: Joi.object(),
      })
    ),
  }).required(),
});

// Validate get subscription request
const getSubscription = Joi.object({
  params: Joi.object({
    subscriptionId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/),
  }),
});

// Validate subscription cancellation
const cancelSubscription = Joi.object({
  params: Joi.object({
    subscriptionId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/),
  }),
  body: Joi.object({
    cancelImmediately: Joi.boolean().default(false),
    reason: Joi.string().allow("", null).max(500),
  }),
});

// Validate subscription reactivation
const reactivateSubscription = Joi.object({
  params: Joi.object({
    subscriptionId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/),
  }),
});

// Validate subscription plan change
const changePlan = Joi.object({
  params: Joi.object({
    subscriptionId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/),
  }),
  body: Joi.object({
    newPlanId: Joi.string().required(),
    prorate: Joi.boolean().default(true),
    immediateChange: Joi.boolean().default(true),
  }).required(),
});

module.exports = {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  subscribe,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  changePlan,
};
