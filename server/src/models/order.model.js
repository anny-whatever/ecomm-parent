// src/models/order.model.js
const mongoose = require("mongoose");
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
} = require("../utils/constants");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variant: {
    sku: {
      type: String,
    },
    name: {
      type: String,
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
  },
  name: {
    type: String, // Product name at time of order
    required: true,
  },
  sku: {
    type: String, // SKU at time of order
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
  },
  gstPercentage: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number, // price * quantity
    required: true,
  },
  total: {
    type: Number, // subtotal + gstAmount
    required: true,
  },
  image: {
    type: String, // URL to product image
  },
});

const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
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
  phone: {
    type: String,
    required: true,
  },
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const orderNoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    items: [orderItemSchema],
    billing: {
      address: addressSchema,
      email: {
        type: String,
        required: true,
      },
    },
    shipping: {
      address: addressSchema,
      method: {
        type: String,
        required: true,
      },
      cost: {
        type: Number,
        required: true,
        default: 0,
      },
      trackingNumber: String,
      carrier: String,
      estimatedDelivery: Date,
    },
    pricing: {
      subtotal: {
        type: Number, // Sum of all item subtotals
        required: true,
      },
      shipping: {
        type: Number,
        required: true,
      },
      tax: {
        type: Number, // Sum of all GST amounts
        required: true,
      },
      discount: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number, // Final amount
        required: true,
      },
    },
    payment: {
      method: {
        type: String,
        enum: Object.values(PAYMENT_METHODS),
        default: PAYMENT_METHODS.RAZORPAY,
      },
      status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
      },
      transactionId: String,
      paidAt: Date,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
    },
    couponApplied: {
      code: String,
      discount: Number,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    statusHistory: [statusHistorySchema],
    notes: [orderNoteSchema],
    invoiceUrl: String,
    cancelReason: String,
    refundAmount: Number,
    refundedAt: Date,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Generate unique order number before saving
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    // Format: ORDER-YEAR-MONTH-DAYOFMONTH-RANDOMNUMBER
    const now = new Date();
    const year = now.getFullYear().toString().slice(2); // Get last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    this.orderNumber = `ORD-${year}${month}${day}-${random}`;

    // Ensure uniqueness
    const existingOrder = await this.constructor.findOne({
      orderNumber: this.orderNumber,
    });
    if (existingOrder) {
      // If duplicate, try again with different random number
      return this.pre("save", next);
    }
  }

  // Add status history entry for new orders
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: "Order created",
    });
  } else if (this.isModified("status")) {
    // If status changed, add to history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }

  next();
});

// Static method to get orders with status counts
orderSchema.statics.getOrdersWithStatusCounts = async function (query = {}) {
  const orders = await this.find(query).sort({ createdAt: -1 });

  // Count orders by status
  const statusCounts = {};
  for (const status of Object.values(ORDER_STATUS)) {
    statusCounts[status] = await this.countDocuments({ ...query, status });
  }

  return { orders, statusCounts };
};

// Method to add note to order
orderSchema.methods.addNote = function (note, user = null) {
  this.notes.push({
    text: note.text,
    isPublic: note.isPublic || false,
    createdAt: new Date(),
    createdBy: user,
  });
  return this.save();
};

// Method to update status with note
orderSchema.methods.updateStatus = function (status, note, user = null) {
  this.status = status;
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
    user,
  });
  return this.save();
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
