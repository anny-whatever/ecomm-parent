const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // Guest ID for non-logged in users
    guestId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true, // Allow multiple null values but enforce uniqueness for non-null values
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: [
        "created",       // Initial state when order is created
        "authorized",    // Payment authorized but not captured
        "captured",      // Payment successfully completed
        "failed",        // Payment failed
        "refunded",      // Payment refunded (full)
        "partially_refunded", // Payment partially refunded
        "disputed",      // Payment disputed/chargebacked
        "expired"        // Payment order expired
      ],
      default: "created",
    },
    paymentMethod: {
      type: String,
      enum: [
        "card",
        "netbanking",
        "wallet",
        "upi",
        "emi",
        "cardless_emi",
        "paylater",
        "other"
      ],
    },
    refunds: [
      {
        razorpayRefundId: {
          type: String,
        },
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: [
            "pending",
            "processed",
            "failed"
          ],
          default: "pending"
        },
        reason: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],
    notes: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    // For payment verification
    signatureVerified: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
    },
    errorCode: {
      type: String,
    },
    // Webhook notification tracking
    webhookEvents: [
      {
        eventId: String,
        eventType: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        processed: {
          type: Boolean,
          default: true,
        },
        data: Schema.Types.Mixed,
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: 1 });

/**
 * Create a new payment record
 */
paymentSchema.statics.createPaymentRecord = async function (paymentData) {
  return this.create(paymentData);
};

/**
 * Update payment record with payment details after successful payment
 */
paymentSchema.statics.updatePaymentRecord = async function (razorpayOrderId, updateData) {
  return this.findOneAndUpdate(
    { razorpayOrderId },
    { $set: updateData },
    { new: true }
  );
};

/**
 * Record a refund in the payment
 */
paymentSchema.statics.recordRefund = async function (razorpayPaymentId, refundData) {
  return this.findOneAndUpdate(
    { razorpayPaymentId },
    { 
      $push: { refunds: refundData },
      $set: {
        status: refundData.amount === this.amount ? "refunded" : "partially_refunded"
      }
    },
    { new: true }
  );
};

/**
 * Get payment statistics for a date range
 */
paymentSchema.statics.getPaymentStats = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ["captured", "refunded", "partially_refunded"] }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" }
      }
    }
  ]);
};

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment; 