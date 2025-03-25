// src/models/category.model.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    ancestors: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        slug: {
          type: String,
          required: true,
        },
      },
    ],
    image: {
      type: String, // URL to uploaded image
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add virtual field for subcategories
categorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

// Add virtual field for products in this category
categorySchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "categories",
});

// Pre-save middleware to generate slug from name
categorySchema.pre("save", function (next) {
  if (this.isNew || this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
  next();
});

// Pre-save middleware to update ancestors array when parent changes
categorySchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("parent")) {
    if (!this.parent) {
      // No parent means this is a root category
      this.ancestors = [];
    } else {
      // Find parent and get its ancestors
      try {
        const parent = await this.constructor.findById(this.parent);
        if (!parent) {
          return next(new Error("Parent category not found"));
        }
        this.ancestors = [
          ...parent.ancestors,
          {
            _id: parent._id,
            name: parent.name,
            slug: parent.slug,
          },
        ];
      } catch (error) {
        return next(error);
      }
    }
  }
  next();
});

// Static method to build full category path
categorySchema.statics.buildPath = function (category) {
  if (!category.ancestors || category.ancestors.length === 0) {
    return category.name;
  }

  const ancestorNames = category.ancestors.map((a) => a.name);
  return [...ancestorNames, category.name].join(" > ");
};

// Static method to get full category tree
categorySchema.statics.getTree = async function () {
  // Get all categories
  const categories = await this.find({}).sort({ order: 1 });

  // Root categories (no parent)
  const rootCategories = categories.filter((c) => !c.parent);

  // Build tree recursively
  const buildTree = (parentId) => {
    const children = categories.filter(
      (c) => c.parent && c.parent.toString() === parentId.toString()
    );

    if (children.length === 0) {
      return [];
    }

    return children.map((child) => ({
      _id: child._id,
      name: child.name,
      slug: child.slug,
      children: buildTree(child._id),
    }));
  };

  // Start with root categories
  return rootCategories.map((root) => ({
    _id: root._id,
    name: root.name,
    slug: root.slug,
    children: buildTree(root._id),
  }));
};

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
