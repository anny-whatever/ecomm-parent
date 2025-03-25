// src/models/shipping-method.model.js
const mongoose = require("mongoose");

/**
 * Shipping Rate Schema - Defines pricing rules for shipping
 */
const shippingRateSchema = new mongoose.Schema({
  // Base price for shipping
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  // Per additional kg or unit price (if applicable)
  additionalPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Free shipping threshold (if applicable)
  freeShippingThreshold: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Maximum weight in kg (if applicable)
  maxWeight: {
    type: Number,
    default: 0, // 0 means unlimited
  },
});

/**
 * Shipping Zone Schema - Geographic areas for shipping
 */
const shippingZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  countries: [
    {
      type: String,
      trim: true,
    },
  ],
  // For domestic shipping - states or provinces
  regions: [
    {
      type: String,
      trim: true,
    },
  ],
  // For even more specific targeting - city or postal code ranges
  postcodes: [
    {
      from: String,
      to: String,
    },
  ],
  // Flat postcodes list (for exact matches)
  postcodesFlat: [
    {
      type: String,
      trim: true,
    },
  ],
});

/**
 * Shipping Method Schema
 */
const shippingMethodSchema = new mongoose.Schema(
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
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Type of shipping method
    type: {
      type: String,
      enum: ["standard", "express", "same_day", "international", "custom"],
      default: "standard",
    },
    // Associated carrier
    carrier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingCarrier",
    },
    // Shipping zones where this method applies
    zones: [
      {
        zone: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ShippingZone",
        },
        rates: shippingRateSchema,
      },
    ],
    // Estimated delivery time in days (min and max)
    estimatedDelivery: {
      min: {
        type: Number,
        default: 1,
      },
      max: {
        type: Number,
        default: 3,
      },
    },
    // Is this shipping method active
    isActive: {
      type: Boolean,
      default: true,
    },
    // Display order in storefront
    displayOrder: {
      type: Number,
      default: 0,
    },
    // Rules for when this method applies
    rules: {
      // Minimum order value required
      minOrderValue: {
        type: Number,
        default: 0,
      },
      // Maximum order value allowed
      maxOrderValue: {
        type: Number,
        default: 0, // 0 means unlimited
      },
      // Minimum weight in kg
      minWeight: {
        type: Number,
        default: 0,
      },
      // Maximum weight in kg
      maxWeight: {
        type: Number,
        default: 0, // 0 means unlimited
      },
      // Product-specific restrictions (if any)
      excludedProducts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      // Category-specific restrictions (if any)
      excludedCategories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
    },
    // Special requirements or instructions
    specialRequirements: {
      type: String,
    },
    // Metadata for carrier-specific information
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Shipping Carrier Schema - Integration with shipping providers
 */
const shippingCarrierSchema = new mongoose.Schema(
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
      lowercase: true,
    },
    // Type of carrier (delhivery, shiprocket, custom, etc.)
    type: {
      type: String,
      enum: ["delhivery", "shiprocket", "fedex", "dhl", "ups", "custom"],
      required: true,
    },
    description: {
      type: String,
    },
    logo: {
      type: String, // URL to carrier logo
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Account credentials (encrypted or reference to secure storage)
    credentials: {
      apiKey: String,
      apiSecret: String,
      username: String,
      password: String,
      accountNumber: String,
      sandbox: {
        type: Boolean,
        default: false,
      },
    },
    // URL endpoints for API calls
    endpoints: {
      shipment: String,
      tracking: String,
      rates: String,
      labelGeneration: String,
      webhook: String,
    },
    // Default settings for this carrier
    settings: {
      defaultPackaging: String,
      defaultServiceType: String,
      requiresManifest: Boolean,
      allowsInternational: Boolean,
      supportsCashOnDelivery: Boolean,
      defaultInsuranceAmount: Number,
    },
    // Additional metadata as needed
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Shipment Schema - Tracks actual shipments
 */
const shipmentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    trackingNumber: {
      type: String,
      index: true,
    },
    carrier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingCarrier",
    },
    shippingMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingMethod",
    },
    status: {
      type: String,
      enum: [
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
        "exception",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        location: String,
        description: String,
      },
    ],
    // Shipping information
    shippingInfo: {
      packageWeight: Number, // in kg
      dimensions: {
        length: Number, // in cm
        width: Number, // in cm
        height: Number, // in cm
      },
      packageCount: {
        type: Number,
        default: 1,
      },
      shippingDate: Date,
      estimatedDelivery: Date,
      actualDelivery: Date,
      // For international shipping
      customs: {
        contentType: {
          type: String,
          enum: [
            "merchandise",
            "gift",
            "documents",
            "sample",
            "return",
            "other",
          ],
        },
        customsValue: Number,
        harmonizedCode: String,
        originCountry: String,
      },
    },
    // Recipient information
    recipient: {
      name: {
        type: String,
        required: true,
      },
      address: {
        street: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        postalCode: {
          type: String,
          required: true,
        },
        country: {
          type: String,
          required: true,
          default: "India",
        },
      },
      phone: {
        type: String,
        required: true,
      },
      email: String,
    },
    // Labels and documents
    labels: {
      shippingLabel: String, // URL or path to shipping label
      returnLabel: String, // URL or path to return label
      manifestUrl: String, // URL or path to manifest
      invoiceUrl: String, // URL or path to invoice
    },
    // Additional information
    notes: String,
    // Provider-specific data
    carrierData: {
      type: mongoose.Schema.Types.Mixed,
    },
    cost: {
      amount: Number,
      currency: {
        type: String,
        default: "INR",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Define virtual method to calculate volumetric weight
shipmentSchema.virtual("volumetricWeight").get(function () {
  if (!this.shippingInfo.dimensions) return 0;

  const { length, width, height } = this.shippingInfo.dimensions;
  // Standard volumetric divisor is 5000 for most carriers
  return (length * width * height) / 5000;
});

// Define method to determine which weight to use (actual vs volumetric)
shipmentSchema.virtual("billableWeight").get(function () {
  const actualWeight = this.shippingInfo.packageWeight || 0;
  const volWeight = this.volumetricWeight || 0;

  // Use whichever is greater
  return Math.max(actualWeight, volWeight);
});

// Create models from schemas
const ShippingMethod = mongoose.model("ShippingMethod", shippingMethodSchema);
const ShippingZone = mongoose.model("ShippingZone", shippingZoneSchema);
const ShippingCarrier = mongoose.model(
  "ShippingCarrier",
  shippingCarrierSchema
);
const Shipment = mongoose.model("Shipment", shipmentSchema);

module.exports = {
  ShippingMethod,
  ShippingZone,
  ShippingCarrier,
  Shipment,
};
