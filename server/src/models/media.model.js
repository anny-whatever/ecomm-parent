// src/models/media.model.js
const mongoose = require("mongoose");

/**
 * Media Schema
 * For managing media files like images, videos, documents, etc.
 */
const mediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    thumbnailPath: {
      type: String,
    },
    optimizedPath: {
      type: String,
    },
    type: {
      type: String,
      enum: ["image", "video", "document", "audio", "other"],
      required: true,
    },
    alt: {
      type: String,
      default: "",
    },
    caption: {
      type: String,
    },
    title: {
      type: String,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    duration: {
      type: Number, // For videos and audio (in seconds)
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // For additional file metadata
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    folder: {
      type: String,
      default: "uploads",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    relatedContent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
    },
    relatedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
mediaSchema.index({ type: 1, createdAt: -1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ isPublic: 1 });

// Get URL for serving media
mediaSchema.virtual("url").get(function () {
  return `/${this.path}`; // Assuming the file is served from the root path
});

// Get thumbnail URL for image types
mediaSchema.virtual("thumbnailUrl").get(function () {
  if (this.thumbnailPath) {
    return `/${this.thumbnailPath}`;
  }
  return this.type === "image" ? this.url : null;
});

// Get file extension
mediaSchema.virtual("extension").get(function () {
  return this.filename.split(".").pop().toLowerCase();
});

// Instance method to update metadata
mediaSchema.methods.updateMetadata = async function (metadata) {
  this.metadata = { ...this.metadata, ...metadata };
  return this.save();
};

// Static method to find images
mediaSchema.statics.findImages = async function (options = {}) {
  const query = { type: "image", ...options };
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find by tag
mediaSchema.statics.findByTag = async function (tag, limit = 20) {
  return this.find({ tags: tag, isPublic: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

const Media = mongoose.model("Media", mediaSchema);

module.exports = Media;
