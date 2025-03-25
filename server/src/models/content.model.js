// src/models/content.model.js
const mongoose = require("mongoose");
const slugify = require("slugify");

/**
 * Content Schema
 * For managing CMS content like pages, blog posts, etc.
 */
const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, "Content type is required"],
      enum: ["page", "post", "banner", "announcement", "custom"],
      default: "page",
      index: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    excerpt: {
      type: String,
      trim: true,
    },
    featuredImage: {
      type: String, // URL to uploaded image
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    seo: {
      title: String,
      description: String,
      keywords: [String],
      ogImage: String, // Open Graph image URL
    },
    template: {
      type: String, // For custom page templates
      default: "default",
    },
    order: {
      type: Number, // For controlling display order
      default: 0,
    },
    sections: [
      {
        name: {
          type: String,
          required: true,
        },
        content: {
          type: String,
        },
        settings: {
          type: mongoose.Schema.Types.Mixed, // For any section-specific settings
        },
      },
    ],
    metaData: {
      type: mongoose.Schema.Types.Mixed, // For any additional metadata
    },
    isHomepage: {
      type: Boolean,
      default: false,
    },
    includeInMenu: {
      type: Boolean,
      default: false,
    },
    includeInFooter: {
      type: Boolean,
      default: false,
    },
    displayInSitemap: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
contentSchema.index({ title: "text", content: "text", excerpt: "text" });
contentSchema.index({ type: 1, status: 1 });
contentSchema.index({ slug: 1, type: 1 }, { unique: true }); // Unique constraint on slug per content type

// Pre-save middleware to generate slug from title
contentSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("title")) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
    });
  }

  // Set published date when status changes to published
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  // Ensure only one homepage exists
  if (this.isHomepage) {
    this.constructor
      .findOne({ isHomepage: true, _id: { $ne: this._id } })
      .then((existingHomepage) => {
        if (existingHomepage) {
          existingHomepage.isHomepage = false;
          return existingHomepage.save();
        }
      })
      .catch((err) => console.error("Error updating homepage flag:", err));
  }

  next();
});

// Virtual for word count
contentSchema.virtual("wordCount").get(function () {
  if (!this.content) return 0;
  return this.content.split(/\s+/).filter(Boolean).length;
});

// Virtual for read time (assuming average reading speed of 200 words per minute)
contentSchema.virtual("readTimeMinutes").get(function () {
  const wordCount = this.wordCount;
  const readTimeMinutes = Math.ceil(wordCount / 200);
  return Math.max(1, readTimeMinutes); // At least 1 minute
});

// Instance method to increment view count
contentSchema.methods.incrementViewCount = async function () {
  this.viewCount += 1;
  return this.save();
};

// Static method to find recent published content
contentSchema.statics.findRecent = async function (type, limit = 5) {
  return this.find({ type, status: "published" })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("title slug excerpt featuredImage publishedAt viewCount");
};

// Static method to find popular content
contentSchema.statics.findPopular = async function (type, limit = 5) {
  return this.find({ type, status: "published" })
    .sort({ viewCount: -1 })
    .limit(limit)
    .select("title slug excerpt featuredImage publishedAt viewCount");
};

const Content = mongoose.model("Content", contentSchema);

module.exports = Content;
