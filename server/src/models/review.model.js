const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Review title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Review content is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
        },
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminReply: {
      content: String,
      createdAt: Date,
      updatedAt: Date,
      admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for unique user review per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Compound index for verified purchase status and date
reviewSchema.index({ isVerifiedPurchase: 1, createdAt: -1 });

// Index for status and date
reviewSchema.index({ status: 1, createdAt: -1 });

// Static method to update product review statistics
reviewSchema.statics.updateProductReviewStats = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, status: "approved" } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      "reviews.average": stats[0].averageRating,
      "reviews.count": stats[0].reviewCount,
    });
  } else {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      "reviews.average": 0,
      "reviews.count": 0,
    });
  }
};

// Post-save middleware to update product review stats
reviewSchema.post("save", async function () {
  await this.constructor.updateProductReviewStats(this.product);
});

// Post-remove middleware to update product review stats
reviewSchema.post("remove", async function () {
  await this.constructor.updateProductReviewStats(this.product);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review; 