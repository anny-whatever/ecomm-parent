// src/utils/validators/shipping.validator.js
const Joi = require("joi");

// Address schema for reuse
const addressSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Recipient name is required",
  }),
  street: Joi.string().required().messages({
    "any.required": "Street address is required",
  }),
  city: Joi.string().required().messages({
    "any.required": "City is required",
  }),
  state: Joi.string().required().messages({
    "any.required": "State is required",
  }),
  postalCode: Joi.string().required().messages({
    "any.required": "Postal code is required",
  }),
  country: Joi.string().default("India"),
  phone: Joi.string().required().messages({
    "any.required": "Phone number is required",
  }),
});

// Dimensions schema for reuse
const dimensionsSchema = Joi.object({
  length: Joi.number().min(0).required(),
  width: Joi.number().min(0).required(),
  height: Joi.number().min(0).required(),
});

// Calculate shipping rates validation schema
const calculateRates = Joi.object({
  body: Joi.object({
    destination: addressSchema.required().messages({
      "any.required": "Destination address is required",
    }),
    totalWeight: Joi.number().min(0.01).required().messages({
      "number.min": "Weight must be greater than 0",
      "any.required": "Total weight is required",
    }),
    totalValue: Joi.number().min(0).required().messages({
      "number.min": "Value must be a non-negative number",
      "any.required": "Total value is required",
    }),
    items: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        weight: Joi.number().min(0),
        price: Joi.number().min(0),
      })
    ),
    countryCode: Joi.string().length(2).default("IN"),
  }),
});

// Get tracking information validation schema
const getTracking = Joi.object({
  params: Joi.object({
    trackingNumber: Joi.string().required().messages({
      "any.required": "Tracking number is required",
    }),
  }),
  query: Joi.object({
    carrierId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  }),
});

// Create shipment validation schema
const createShipment = Joi.object({
  body: Joi.object({
    orderId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid order ID format",
        "any.required": "Order ID is required",
      }),
    shippingInfo: Joi.object({
      methodCode: Joi.string(),
      weight: Joi.number().min(0),
      dimensions: dimensionsSchema,
      packageCount: Joi.number().integer().min(1),
      notes: Joi.string().max(500),
    }).default({}),
  }),
});

// Update shipment status validation schema
const updateStatus = Joi.object({
  params: Joi.object({
    shipmentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid shipment ID format",
        "any.required": "Shipment ID is required",
      }),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid(
        "pending",
        "processing",
        "label_created",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed_delivery",
        "returned",
        "cancelled",
        "exception"
      )
      .required()
      .messages({
        "any.only": "Invalid status value",
        "any.required": "Status is required",
      }),
    description: Joi.string().max(500),
    location: Joi.string(),
  }),
});

// Get shipments validation schema
const getShipments = Joi.object({
  query: Joi.object({
    status: Joi.string().valid(
      "pending",
      "processing",
      "label_created",
      "picked_up",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "failed_delivery",
      "returned",
      "cancelled",
      "exception"
    ),
    carrier: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso().min(Joi.ref("fromDate")),
    orderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string(),
  }),
});

// Get by ID validation schema (used for various resources)
const getById = Joi.object({
  params: Joi.object({
    shipmentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    methodId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    zoneId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    carrierId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  })
    .min(1)
    .messages({
      "object.min": "At least one ID parameter is required",
    }),
});

// Create shipping method validation schema
const createMethod = Joi.object({
  body: Joi.object({
    name: Joi.string().required().messages({
      "any.required": "Method name is required",
    }),
    code: Joi.string().required().messages({
      "any.required": "Method code is required",
    }),
    description: Joi.string(),
    type: Joi.string().valid(
      "standard",
      "express",
      "same_day",
      "international",
      "custom"
    ),
    carrier: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    zones: Joi.array().items(
      Joi.object({
        zone: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required(),
        rates: Joi.object({
          basePrice: Joi.number().min(0).required(),
          additionalPrice: Joi.number().min(0),
          freeShippingThreshold: Joi.number().min(0),
          maxWeight: Joi.number().min(0),
        }).required(),
      })
    ),
    estimatedDelivery: Joi.object({
      min: Joi.number().integer().min(0),
      max: Joi.number().integer().min(Joi.ref("min")),
    }),
    isActive: Joi.boolean(),
    displayOrder: Joi.number().integer(),
    rules: Joi.object({
      minOrderValue: Joi.number().min(0),
      maxOrderValue: Joi.number().min(0),
      minWeight: Joi.number().min(0),
      maxWeight: Joi.number().min(0),
      excludedProducts: Joi.array().items(
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
      ),
      excludedCategories: Joi.array().items(
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
      ),
    }),
    specialRequirements: Joi.string(),
    metadata: Joi.object(),
  }),
});

// Update shipping method validation schema
const updateMethod = Joi.object({
  params: Joi.object({
    methodId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid method ID format",
        "any.required": "Method ID is required",
      }),
  }),
  body: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    type: Joi.string().valid(
      "standard",
      "express",
      "same_day",
      "international",
      "custom"
    ),
    carrier: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    zones: Joi.array().items(
      Joi.object({
        zone: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required(),
        rates: Joi.object({
          basePrice: Joi.number().min(0).required(),
          additionalPrice: Joi.number().min(0),
          freeShippingThreshold: Joi.number().min(0),
          maxWeight: Joi.number().min(0),
        }).required(),
      })
    ),
    estimatedDelivery: Joi.object({
      min: Joi.number().integer().min(0),
      max: Joi.number().integer().min(Joi.ref("min")),
    }),
    isActive: Joi.boolean(),
    displayOrder: Joi.number().integer(),
    rules: Joi.object({
      minOrderValue: Joi.number().min(0),
      maxOrderValue: Joi.number().min(0),
      minWeight: Joi.number().min(0),
      maxWeight: Joi.number().min(0),
      excludedProducts: Joi.array().items(
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
      ),
      excludedCategories: Joi.array().items(
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
      ),
    }),
    specialRequirements: Joi.string(),
    metadata: Joi.object(),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
});

// Create shipping zone validation schema
const createZone = Joi.object({
  body: Joi.object({
    name: Joi.string().required().messages({
      "any.required": "Zone name is required",
    }),
    countries: Joi.array().items(Joi.string()),
    regions: Joi.array().items(Joi.string()),
    postcodes: Joi.array().items(
      Joi.object({
        from: Joi.string().required(),
        to: Joi.string().required(),
      })
    ),
    postcodesFlat: Joi.array().items(Joi.string()),
  }),
});

// Update shipping zone validation schema
const updateZone = Joi.object({
  params: Joi.object({
    zoneId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid zone ID format",
        "any.required": "Zone ID is required",
      }),
  }),
  body: Joi.object({
    name: Joi.string(),
    countries: Joi.array().items(Joi.string()),
    regions: Joi.array().items(Joi.string()),
    postcodes: Joi.array().items(
      Joi.object({
        from: Joi.string().required(),
        to: Joi.string().required(),
      })
    ),
    postcodesFlat: Joi.array().items(Joi.string()),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
});

// Create shipping carrier validation schema
const createCarrier = Joi.object({
  body: Joi.object({
    name: Joi.string().required().messages({
      "any.required": "Carrier name is required",
    }),
    code: Joi.string().required().messages({
      "any.required": "Carrier code is required",
    }),
    type: Joi.string()
      .valid("delhivery", "shiprocket", "fedex", "dhl", "ups", "custom")
      .required()
      .messages({
        "any.only": "Invalid carrier type",
        "any.required": "Carrier type is required",
      }),
    description: Joi.string(),
    logo: Joi.string(),
    isActive: Joi.boolean(),
    credentials: Joi.object({
      apiKey: Joi.string(),
      apiSecret: Joi.string(),
      username: Joi.string(),
      password: Joi.string(),
      accountNumber: Joi.string(),
      sandbox: Joi.boolean(),
    }),
    endpoints: Joi.object({
      shipment: Joi.string(),
      tracking: Joi.string(),
      rates: Joi.string(),
      labelGeneration: Joi.string(),
      webhook: Joi.string(),
    }),
    settings: Joi.object({
      defaultPackaging: Joi.string(),
      defaultServiceType: Joi.string(),
      requiresManifest: Joi.boolean(),
      allowsInternational: Joi.boolean(),
      supportsCashOnDelivery: Joi.boolean(),
      defaultInsuranceAmount: Joi.number().min(0),
    }),
    metadata: Joi.object(),
  }),
});

// Update shipping carrier validation schema
const updateCarrier = Joi.object({
  params: Joi.object({
    carrierId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid carrier ID format",
        "any.required": "Carrier ID is required",
      }),
  }),
  body: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    logo: Joi.string(),
    isActive: Joi.boolean(),
    credentials: Joi.object({
      apiKey: Joi.string(),
      apiSecret: Joi.string(),
      username: Joi.string(),
      password: Joi.string(),
      accountNumber: Joi.string(),
      sandbox: Joi.boolean(),
    }),
    endpoints: Joi.object({
      shipment: Joi.string(),
      tracking: Joi.string(),
      rates: Joi.string(),
      labelGeneration: Joi.string(),
      webhook: Joi.string(),
    }),
    settings: Joi.object({
      defaultPackaging: Joi.string(),
      defaultServiceType: Joi.string(),
      requiresManifest: Joi.boolean(),
      allowsInternational: Joi.boolean(),
      supportsCashOnDelivery: Joi.boolean(),
      defaultInsuranceAmount: Joi.number().min(0),
    }),
    metadata: Joi.object(),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
});

module.exports = {
  calculateRates,
  getTracking,
  createShipment,
  updateStatus,
  getShipments,
  getById,
  createMethod,
  updateMethod,
  createZone,
  updateZone,
  createCarrier,
  updateCarrier,
};
