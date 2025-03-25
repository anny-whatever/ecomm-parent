// src/models/product.model.js
const mongoose = require("mongoose");
const slugify = require("slugify");
const { PRODUCT_STATUS, GST_RATES } = require("../utils/constants");

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    regular: {
      type: Number,
      required: true,
      min: 0,
    },
    sale: {
      type: Number,
      min: 0,
    },
  },
  attributes: [
    {
      name: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
  ],
  inventory: {
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 1,
    },
  },
  images: [String],
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      index: true,
    },
    description: {
      short: {
        type: String,
        trim: true,
      },
      long: {
        type: String,
        trim: true,
      },
    },
    price: {
      regular: {
        type: Number,
        required: [true, "Regular price is required"],
        min: 0,
      },
      sale: {
        type: Number,
        min: 0,
      },
      cost: {
        type: Number,
        min: 0,
      },
      compareAt: {
        type: Number,
        min: 0,
      },
    },
    gstPercentage: {
      type: Number,
      default: GST_RATES.DEFAULT,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        index: true,
      },
    ],
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    attributes: [
      {
        name: {
          type: String,
        },
        value: {
          type: String,
        },
        visible: {
          type: Boolean,
          default: true,
        },
      },
    ],
    variants: [variantSchema],
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    related: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    reviews: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    inventory: {
      quantity: {
        type: Number,
        default: 0,
        min: 0,
      },
      reserved: {
        type: Number,
        default: 0,
        min: 0,
      },
      lowStockThreshold: {
        type: Number,
        default: 5,
        min: 1,
      },
    },
    isBundle: {
      type: Boolean,
      default: false,
    },
    bundleProducts: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        discount: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
      },
    ],
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.DRAFT,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add text index for search
productSchema.index({
  name: "text",
  "description.short": "text",
  "description.long": "text",
  tags: "text",
});

// Compound index on status and isFeatured
productSchema.index({ status: 1, isFeatured: 1 });

// Pre-save middleware to generate slug from name
productSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
  next();
});

// Pre-save middleware to ensure one default image
productSchema.pre("save", function (next) {
  if (this.images && this.images.length > 0) {
    // Check if there's a default image
    const hasDefault = this.images.some((img) => img.isDefault);

    // If no default, set the first one as default
    if (!hasDefault) {
      this.images[0].isDefault = true;
    }
  }

  // Ensure one default variant
  if (this.variants && this.variants.length > 0) {
    const hasDefault = this.variants.some((variant) => variant.isDefault);

    if (!hasDefault) {
      this.variants[0].isDefault = true;
    }
  }

  next();
});

// Virtual for effective price (sale price if available, otherwise regular price)
productSchema.virtual("price.effective").get(function () {
  return this.price.sale && this.price.sale < this.price.regular
    ? this.price.sale
    : this.price.regular;
});

// Virtual for discount percentage
productSchema.virtual("price.discountPercentage").get(function () {
  if (this.price.sale && this.price.regular) {
    const discount = this.price.regular - this.price.sale;
    return Math.round((discount / this.price.regular) * 100);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual("stockStatus").get(function () {
  const availableQuantity = this.inventory.quantity - this.inventory.reserved;

  if (availableQuantity <= 0) {
    return "out_of_stock";
  }

  if (availableQuantity <= this.inventory.lowStockThreshold) {
    return "low_stock";
  }

  return "in_stock";
});

// Virtual for product reviews
productSchema.virtual("reviewsData", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
