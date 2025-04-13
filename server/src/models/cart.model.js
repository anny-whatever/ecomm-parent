// src/models/cart.model.js
const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product.variants",
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  attributes: [
    {
      name: {
        type: String,
      },
      value: {
        type: String,
      },
    },
  ],
  gstPercentage: {
    type: Number,
    required: true,
    default: 18,
  },
  image: {
    type: String,
  },
});

cartItemSchema.virtual("subtotal").get(function () {
  return this.price * this.quantity;
});

cartItemSchema.virtual("gstAmount").get(function () {
  return (this.price * this.quantity * this.gstPercentage) / 100;
});

cartItemSchema.virtual("total").get(function () {
  return this.subtotal + this.gstAmount;
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true, // Allows null but enforces uniqueness when exists
    },
    guestId: {
      type: String,
      sparse: true, // Allows null but enforces uniqueness when exists
    },
    items: [cartItemSchema],
    appliedCoupon: {
      code: {
        type: String,
      },
      discountType: {
        type: String,
        enum: ["percentage", "fixed", "shipping"],
      },
      discountValue: {
        type: Number,
        min: 0,
      },
      minimumOrderValue: {
        type: Number,
        min: 0,
      },
    },
    shipping: {
      method: {
        type: String,
      },
      cost: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    notes: {
      type: String,
    },
    // Abandoned cart recovery fields
    status: {
      type: String,
      enum: ["active", "ordered", "abandoned", "expired"],
      default: "active",
    },
    isAbandoned: {
      type: Boolean,
      default: false,
      index: true,
    },
    recoveryEmails: {
      emailsSent: {
        type: Number,
        default: 0,
      },
      firstEmailSent: {
        type: Date,
      },
      lastEmailSent: {
        type: Date,
      },
      token: {
        type: String,
      },
      discountCodeSent: {
        type: String,
      },
      recovered: {
        type: Boolean,
        default: false,
      },
      recoveredAt: {
        type: Date,
      },
      convertedOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Either user or guestId must be present
cartSchema.pre("validate", function (next) {
  if (!this.user && !this.guestId) {
    this.invalidate("user", "Either user or guestId must be provided");
  }
  next();
});

// Virtuals for cart totals
cartSchema.virtual("subtotal").get(function () {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
});

cartSchema.virtual("taxTotal").get(function () {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity * item.gstPercentage) / 100;
  }, 0);
});

cartSchema.virtual("discountAmount").get(function () {
  if (!this.appliedCoupon) return 0;

  const { discountType, discountValue, minimumOrderValue } = this.appliedCoupon;
  const subtotal = this.subtotal;

  if (minimumOrderValue && subtotal < minimumOrderValue) return 0;

  if (discountType === "percentage") {
    return Math.min(subtotal * (discountValue / 100), subtotal);
  } else if (discountType === "fixed") {
    return Math.min(discountValue, subtotal);
  } else if (discountType === "shipping") {
    return Math.min(this.shipping.cost, discountValue);
  }

  return 0;
});

cartSchema.virtual("total").get(function () {
  const subtotal = this.subtotal || 0;
  const tax = this.taxTotal || 0;
  const shipping = (this.shipping && this.shipping.cost) || 0;
  const discount = this.discountAmount || 0;

  return subtotal + tax + shipping - discount;
});

cartSchema.virtual("itemCount").get(function () {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((count, item) => count + item.quantity, 0);
});

// Method to clear the cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  this.appliedCoupon = undefined;
  this.shipping = { cost: 0 };
  this.notes = "";
  return this.save();
};

// Method to merge guest cart with user cart
cartSchema.statics.mergeGuestCart = async function (guestId, userId) {
  try {
    // Find guest cart
    const guestCart = await this.findOne({ guestId });
    if (!guestCart || !guestCart.items.length) return null;

    // Find or create user cart
    let userCart = await this.findOne({ user: userId });
    if (!userCart) {
      userCart = new this({ user: userId, items: [] });
    }

    // Add items from guest cart
    for (const guestItem of guestCart.items) {
      // Check if product is already in user cart
      const existingItemIndex = userCart.items.findIndex(
        (item) =>
          item.product.toString() === guestItem.product.toString() &&
          (!item.variant ||
            !guestItem.variant ||
            item.variant.toString() === guestItem.variant.toString())
      );

      if (existingItemIndex > -1) {
        // Update quantity if product exists
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        // Add new item if product doesn't exist
        userCart.items.push(guestItem);
      }
    }

    // Copy coupon if user cart doesn't have one
    if (guestCart.appliedCoupon && !userCart.appliedCoupon) {
      userCart.appliedCoupon = guestCart.appliedCoupon;
    }

    // Save user cart
    await userCart.save();

    // Delete guest cart
    await guestCart.remove();

    return userCart;
  } catch (error) {
    throw error;
  }
};

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
