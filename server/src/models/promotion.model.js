// src/models/promotion.model.js
const mongoose = require("mongoose");

/**
 * Promotion Schema
 * Handles various types of discounts and promotional offers
 */
const promotionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Promotion name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows null values to not trigger uniqueness validation
      uppercase: true,
    },
    type: {
      type: String,
      required: [true, "Promotion type is required"],
      enum: [
        "percentage", // Percentage off entire order
        "fixed", // Fixed amount off entire order
        "shipping", // Free or discounted shipping
        "buy_x_get_y", // Buy X get Y free or discounted
        "product_percentage", // Percentage off specific products
        "product_fixed", // Fixed amount off specific products
        "category_percentage", // Percentage off product categories
        "category_fixed", // Fixed amount off product categories
      ],
    },
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    buyXGetYConfig: {
      buyQuantity: Number, // Buy X quantity
      getQuantity: Number, // Get Y quantity
      discountPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 100, // 100% means free
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      min: 0, // 0 means unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userUsageLimit: {
      type: Number,
      min: 0, // 0 means unlimited
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
    customerType: {
      type: String,
      enum: ["all", "new", "existing"],
      default: "all",
    },
    minimumItems: {
      type: Number,
      min: 0,
      default: 0,
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        count: {
          type: Number,
          default: 1,
        },
        lastUsed: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Indexes for efficient queries
promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
promotionSchema.index({ type: 1, isActive: 1 });

/**
 * Check if promotion is valid and active
 * @returns {Boolean} Whether promotion is currently valid
 */
promotionSchema.methods.isValid = function () {
  const now = new Date();

  // Check if promotion is active
  if (!this.isActive) return false;

  // Check date validity
  if (this.validFrom && this.validFrom > now) return false;
  if (this.validUntil && this.validUntil < now) return false;

  // Check usage limit
  if (this.usageLimit > 0 && this.usageCount >= this.usageLimit) return false;

  return true;
};

/**
 * Check if promotion can be used by a specific user
 * @param {ObjectId} userId - User ID to check
 * @returns {Boolean} Whether user can use this promotion
 */
promotionSchema.methods.canBeUsedByUser = function (userId) {
  // If no user usage limit, or if no user provided, just check general validity
  if (!userId || this.userUsageLimit === 0) return this.isValid();

  // Find user in usedBy array
  const userUsage = this.usedBy.find(
    (usage) => usage.user.toString() === userId.toString()
  );

  // If user hasn't used promotion yet, or is under limit
  return (
    this.isValid() && (!userUsage || userUsage.count < this.userUsageLimit)
  );
};

/**
 * Calculate discount amount for a cart
 * @param {Object} cart - Cart object with items, subtotal etc.
 * @param {Object} userData - User data for user-specific promotions
 * @returns {Object} Discount information
 */
promotionSchema.methods.calculateDiscount = function (cart, userData = {}) {
  // Check if promotion is valid and can be used
  if (!this.isValid()) {
    return {
      applicable: false,
      message: "Promotion is not valid or has expired",
    };
  }

  // Check minimum order value
  if (cart.subtotal < this.minOrderValue) {
    return {
      applicable: false,
      message: `Minimum order value of ₹${this.minOrderValue} required`,
    };
  }

  // Check minimum item quantity
  if (cart.itemCount < this.minimumItems) {
    return {
      applicable: false,
      message: `Minimum ${this.minimumItems} items required in cart`,
    };
  }

  // Check customer type requirement
  if (
    this.customerType !== "all" &&
    ((this.customerType === "new" && userData.isExisting) ||
      (this.customerType === "existing" && !userData.isExisting))
  ) {
    return {
      applicable: false,
      message: `Promotion only applicable for ${this.customerType} customers`,
    };
  }

  // Calculate discount based on promotion type
  switch (this.type) {
    case "percentage":
      return this.calculatePercentageDiscount(cart);

    case "fixed":
      return this.calculateFixedDiscount(cart);

    case "shipping":
      return this.calculateShippingDiscount(cart);

    case "product_percentage":
    case "product_fixed":
      return this.calculateProductDiscount(cart);

    case "category_percentage":
    case "category_fixed":
      return this.calculateCategoryDiscount(cart);

    case "buy_x_get_y":
      return this.calculateBuyXGetYDiscount(cart);

    default:
      return {
        applicable: false,
        message: "Unknown promotion type",
      };
  }
};

/**
 * Calculate percentage discount on entire cart
 * @param {Object} cart - Cart object
 * @returns {Object} Discount information
 */
promotionSchema.methods.calculatePercentageDiscount = function (cart) {
  const discountAmount = (cart.subtotal * this.value) / 100;

  // Apply maximum discount cap if specified
  const finalDiscount = this.maxDiscount
    ? Math.min(discountAmount, this.maxDiscount)
    : discountAmount;

  return {
    applicable: true,
    type: "percentage",
    value: this.value,
    amount: finalDiscount,
    message: `${this.value}% off applied`,
  };
};

/**
 * Calculate fixed discount on entire cart
 * @param {Object} cart - Cart object
 * @returns {Object} Discount information
 */
promotionSchema.methods.calculateFixedDiscount = function (cart) {
  // Fixed discount cannot be greater than cart subtotal
  const discountAmount = Math.min(this.value, cart.subtotal);

  return {
    applicable: true,
    type: "fixed",
    value: this.value,
    amount: discountAmount,
    message: `₹${this.value} off applied`,
  };
};

/**
 * Calculate shipping discount
 * @param {Object} cart - Cart object
 * @returns {Object} Discount information
 */
promotionSchema.methods.calculateShippingDiscount = function (cart) {
  if (!cart.shipping || !cart.shipping.cost) {
    return {
      applicable: false,
      message: "No shipping cost found in cart",
    };
  }

  // If value is 100, it means free shipping
  if (this.value === 100) {
    return {
      applicable: true,
      type: "shipping",
      value: this.value,
      amount: cart.shipping.cost,
      message: "Free shipping applied",
    };
  }

  // Otherwise calculate discount on shipping cost
  const discountAmount = (cart.shipping.cost * this.value) / 100;

  return {
    applicable: true,
    type: "shipping",
    value: this.value,
    amount: discountAmount,
    message: `${this.value}% off shipping applied`,
  };
};

/**
 * Calculate discount for specific products
 * @param {Object} cart - Cart object
 * @returns {Object} Discount information
 */
promotionSchema.methods.calculateProductDiscount = function (cart) {
  // Check if applicable products are defined
  if (!this.applicableProducts || this.applicableProducts.length === 0) {
    return {
      applicable: false,
      message: "No applicable products defined for this promotion",
    };
  }

  // Convert applicable products to string array for easier comparison
  const applicableProductIds = this.applicableProducts.map((id) =>
    id.toString()
  );

  // Find matching items in cart
  const matchingItems = cart.items.filter((item) =>
    applicableProductIds.includes(item.product.toString())
  );

  if (matchingItems.length === 0) {
    return {
      applicable: false,
      message: "No applicable products found in cart",
    };
  }

  // Calculate subtotal of matching items
  const matchingSubtotal = matchingItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discountAmount;
  let message;

  // Calculate discount based on type
  if (this.type === "product_percentage") {
    discountAmount = (matchingSubtotal * this.value) / 100;
    message = `${this.value}% off selected products`;
  } else {
    // Fixed discount per applicable product item
    discountAmount = Math.min(
      this.value * matchingItems.reduce((sum, item) => sum + item.quantity, 0),
      matchingSubtotal
    );
    message = `₹${this.value} off selected products`;
  }

  // Apply maximum discount cap if specified
  const finalDiscount = this.maxDiscount
    ? Math.min(discountAmount, this.maxDiscount)
    : discountAmount;

  return {
    applicable: true,
    type: this.type,
    value: this.value,
    amount: finalDiscount,
    message,
    appliedItems: matchingItems.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    })),
  };
};

/**
 * Calculate discount for product categories
 * @param {Object} cart - Cart object
 * @returns {Object} Discount information
 */
promotionSchema.methods.calculateCategoryDiscount = function (cart) {
  // Check if applicable categories are defined
  if (!this.applicableCategories || this.applicableCategories.length === 0) {
    return {
      applicable: false,
      message: "No applicable categories defined for this promotion",
    };
  }

  // Need products with populated categories to check category discounts
  if (!cart.populatedItems) {
    return {
      applicable: false,
      message: "Cart items not populated with product data",
    };
  }

  // Convert applicable categories to string array for easier comparison
  const applicableCategoryIds = this.applicableCategories.map((id) =>
    id.toString()
  );

  // Find items in applicable categories
  const matchingItems = cart.populatedItems.filter((item) => {
    // If product has categories and they match any applicable category
    if (item.productData && item.productData.categories) {
      return item.productData.categories.some((category) =>
        applicableCategoryIds.includes(category._id.toString())
      );
    }
    return false;
  });

  if (matchingItems.length === 0) {
    return {
      applicable: false,
      message: "No products from applicable categories found in cart",
    };
  }

  // Calculate subtotal of matching items
  const matchingSubtotal = matchingItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discountAmount;
  let message;

  // Calculate discount based on type
  if (this.type === "category_percentage") {
    discountAmount = (matchingSubtotal * this.value) / 100;
    message = `${this.value}% off selected categories`;
  } else {
    // Fixed discount per applicable product item
    discountAmount = Math.min(
      this.value * matchingItems.reduce((sum, item) => sum + item.quantity, 0),
      matchingSubtotal
    );
    message = `₹${this.value} off selected categories`;
  }

  // Apply maximum discount cap if specified
  const finalDiscount = this.maxDiscount
    ? Math.min(discountAmount, this.maxDiscount)
    : discountAmount;

  return {
    applicable: true,
    type: this.type,
    value: this.value,
    amount: finalDiscount,
    message,
    appliedCategories: this.applicableCategories,
  };
};

/**
 * Calculate buy X get Y discount
 * @param {Object} cart - Cart object
 * @returns {Object} Discount information
 */
promotionSchema.methods.calculateBuyXGetYDiscount = function (cart) {
  // Check if buy X get Y config is defined
  if (!this.buyXGetYConfig) {
    return {
      applicable: false,
      message: "Buy X Get Y configuration not defined",
    };
  }

  const { buyQuantity, getQuantity, discountPercent } = this.buyXGetYConfig;

  // Must have applicable products defined
  if (!this.applicableProducts || this.applicableProducts.length === 0) {
    return {
      applicable: false,
      message: "No applicable products defined for this promotion",
    };
  }

  // Convert applicable products to string array for easier comparison
  const applicableProductIds = this.applicableProducts.map((id) =>
    id.toString()
  );

  // Find matching items in cart
  const matchingItems = cart.items.filter((item) =>
    applicableProductIds.includes(item.product.toString())
  );

  if (matchingItems.length === 0) {
    return {
      applicable: false,
      message: "No applicable products found in cart",
    };
  }

  // Calculate total quantity of applicable items
  const totalQuantity = matchingItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Check if enough quantity to apply promotion
  if (totalQuantity < buyQuantity) {
    return {
      applicable: false,
      message: `Add ${
        buyQuantity - totalQuantity
      } more qualifying items to get discount`,
    };
  }

  // Sort items by price (ascending) to apply discount to cheapest items
  const sortedItems = [...matchingItems].sort((a, b) => a.price - b.price);

  // Calculate how many sets of "buy X get Y" can be applied
  const sets = Math.floor(totalQuantity / (buyQuantity + getQuantity));

  if (sets === 0) {
    return {
      applicable: false,
      message: `Not enough qualifying items to apply buy ${buyQuantity} get ${getQuantity} discount`,
    };
  }

  // Calculate total discount
  let discountAmount = 0;
  let remainingDiscountQuantity = sets * getQuantity;
  let currentItemIndex = 0;

  // Apply discount to cheapest items first
  while (
    remainingDiscountQuantity > 0 &&
    currentItemIndex < sortedItems.length
  ) {
    const currentItem = sortedItems[currentItemIndex];
    const quantityToDiscount = Math.min(
      remainingDiscountQuantity,
      currentItem.quantity
    );

    discountAmount +=
      (currentItem.price * quantityToDiscount * discountPercent) / 100;

    remainingDiscountQuantity -= quantityToDiscount;
    currentItemIndex++;
  }

  return {
    applicable: true,
    type: "buy_x_get_y",
    value: this.buyXGetYConfig,
    amount: discountAmount,
    message: `Buy ${buyQuantity} get ${getQuantity} at ${discountPercent}% off`,
    appliedItems: matchingItems.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    })),
  };
};

/**
 * Record usage of promotion by a user
 * @param {ObjectId} userId - User ID that used the promotion
 * @returns {Promise<Boolean>} Success status
 */
promotionSchema.methods.recordUsage = async function (userId) {
  // Increment global usage counter
  this.usageCount += 1;

  // If userId provided, record specific user usage
  if (userId) {
    const userIndex = this.usedBy.findIndex(
      (usage) => usage.user.toString() === userId.toString()
    );

    if (userIndex >= 0) {
      // User has used this promotion before, increment counter
      this.usedBy[userIndex].count += 1;
      this.usedBy[userIndex].lastUsed = new Date();
    } else {
      // First time user is using this promotion
      this.usedBy.push({
        user: userId,
        count: 1,
        lastUsed: new Date(),
      });
    }
  }

  await this.save();
  return true;
};

const Promotion = mongoose.model("Promotion", promotionSchema);

module.exports = Promotion;
