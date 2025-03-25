// src/services/media.service.js
const Media = require("../models/media.model");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { NotFoundError, BadRequestError } = require("../utils/errorTypes");
const logger = require("../config/logger");

// Make sure fs functions exist before promisifying them
const unlinkAsync = fs.unlink ? promisify(fs.unlink) : null;
const statAsync = fs.stat ? promisify(fs.stat) : null;

/**
 * Create a new media record
 * @param {Object} fileData - File data from multer
 * @param {Object} metadata - Additional metadata
 * @param {String} userId - ID of the uploading user
 * @returns {Promise<Object>} Created media
 */
const createMedia = async (fileData, metadata = {}, userId = null) => {
  try {
    // Determine media type from mimetype
    let type = "other";
    if (fileData.mimetype.startsWith("image/")) {
      type = "image";
    } else if (fileData.mimetype.startsWith("video/")) {
      type = "video";
    } else if (fileData.mimetype.startsWith("audio/")) {
      type = "audio";
    } else if (
      fileData.mimetype.includes("pdf") ||
      fileData.mimetype.includes("word") ||
      fileData.mimetype.includes("excel") ||
      fileData.mimetype.includes("text") ||
      fileData.mimetype.includes("presentation")
    ) {
      type = "document";
    }

    // Create media object
    const mediaData = {
      filename: path.basename(fileData.path),
      originalFilename: fileData.originalname,
      mimetype: fileData.mimetype,
      size: fileData.size,
      path: fileData.path.replace(/^uploads\//, ""), // Removing leading "uploads/" if present
      type,
      uploadedBy: userId,
      metadata: metadata || {},
    };

    // Add optional fields from fileData if present
    if (fileData.optimizedPath) {
      mediaData.optimizedPath = fileData.optimizedPath;
    }

    if (fileData.thumbnailPath) {
      mediaData.thumbnailPath = fileData.thumbnailPath;
    }

    // Add other metadata
    if (metadata.alt) mediaData.alt = metadata.alt;
    if (metadata.title) mediaData.title = metadata.title;
    if (metadata.caption) mediaData.caption = metadata.caption;
    if (metadata.tags) mediaData.tags = metadata.tags;
    if (metadata.folder) mediaData.folder = metadata.folder;
    if (metadata.isPublic !== undefined) mediaData.isPublic = metadata.isPublic;
    if (metadata.relatedContent)
      mediaData.relatedContent = metadata.relatedContent;
    if (metadata.relatedProduct)
      mediaData.relatedProduct = metadata.relatedProduct;

    // For image dimensions
    if (type === "image" && metadata.width && metadata.height) {
      mediaData.width = metadata.width;
      mediaData.height = metadata.height;
    }

    // For video/audio duration
    if ((type === "video" || type === "audio") && metadata.duration) {
      mediaData.duration = metadata.duration;
    }

    const media = new Media(mediaData);
    await media.save();

    return media;
  } catch (error) {
    logger.error("Error creating media record:", error);
    throw error;
  }
};

/**
 * Get media by ID
 * @param {String} mediaId - Media ID
 * @returns {Promise<Object>} Media object
 */
const getMediaById = async (mediaId) => {
  try {
    const media = await Media.findById(mediaId).populate(
      "uploadedBy",
      "email profile.firstName profile.lastName"
    );

    if (!media) {
      throw new NotFoundError("Media not found");
    }

    return media;
  } catch (error) {
    logger.error(`Error getting media ${mediaId}:`, error);
    throw error;
  }
};

/**
 * Update media metadata
 * @param {String} mediaId - Media ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated media
 */
const updateMedia = async (mediaId, updateData) => {
  try {
    const media = await Media.findById(mediaId);

    if (!media) {
      throw new NotFoundError("Media not found");
    }

    // Fields that can be updated
    const allowedUpdates = [
      "alt",
      "title",
      "caption",
      "tags",
      "folder",
      "isPublic",
      "relatedContent",
      "relatedProduct",
      "metadata",
    ];

    // Filter to only allowed updates
    const updates = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    // Special handling for metadata (merge instead of replace)
    if (updateData.metadata) {
      updates.metadata = { ...media.metadata, ...updateData.metadata };
    }

    const updatedMedia = await Media.findByIdAndUpdate(mediaId, updates, {
      new: true,
      runValidators: true,
    });

    return updatedMedia;
  } catch (error) {
    logger.error(`Error updating media ${mediaId}:`, error);
    throw error;
  }
};

/**
 * Delete media
 * @param {String} mediaId - Media ID
 * @returns {Promise<Boolean>} Success status
 */
const deleteMedia = async (mediaId) => {
  try {
    const media = await Media.findById(mediaId);

    if (!media) {
      throw new NotFoundError("Media not found");
    }

    // Delete the file from storage
    const uploadsDir = path.join(process.cwd(), "uploads");

    try {
      // Delete main file
      const filePath = path.join(uploadsDir, media.path);
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
      }

      // Delete thumbnail if exists
      if (media.thumbnailPath) {
        const thumbnailPath = path.join(uploadsDir, media.thumbnailPath);
        if (fs.existsSync(thumbnailPath)) {
          await unlinkAsync(thumbnailPath);
        }
      }

      // Delete optimized version if exists
      if (media.optimizedPath) {
        const optimizedPath = path.join(uploadsDir, media.optimizedPath);
        if (fs.existsSync(optimizedPath)) {
          await unlinkAsync(optimizedPath);
        }
      }
    } catch (error) {
      // Log but continue with database deletion
      logger.warn(`Error deleting file for media ${mediaId}:`, error);
    }

    // Delete from database
    await Media.findByIdAndDelete(mediaId);

    return true;
  } catch (error) {
    logger.error(`Error deleting media ${mediaId}:`, error);
    throw error;
  }
};

/**
 * List media with filtering, pagination and sorting
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Media list with pagination info
 */
const listMedia = async (filters = {}, options = {}) => {
  try {
    const query = {};

    // Apply filters
    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.folder) {
      query.folder = filters.folder;
    }

    if (filters.tag) {
      query.tags = filters.tag;
    }

    if (filters.uploadedBy) {
      query.uploadedBy = filters.uploadedBy;
    }

    if (filters.isPublic !== undefined) {
      query.isPublic = filters.isPublic === "true";
    }

    if (filters.search) {
      query.$or = [
        { originalFilename: { $regex: filters.search, $options: "i" } },
        { alt: { $regex: filters.search, $options: "i" } },
        { title: { $regex: filters.search, $options: "i" } },
        { caption: { $regex: filters.search, $options: "i" } },
        { tags: { $regex: filters.search, $options: "i" } },
      ];
    }

    // Date range filter
    if (filters.fromDate || filters.toDate) {
      query.createdAt = {};

      if (filters.fromDate) {
        query.createdAt.$gte = new Date(filters.fromDate);
      }

      if (filters.toDate) {
        query.createdAt.$lte = new Date(filters.toDate);
      }
    }

    // Size range filter
    if (filters.minSize || filters.maxSize) {
      query.size = {};

      if (filters.minSize) {
        query.size.$gte = parseInt(filters.minSize, 10);
      }

      if (filters.maxSize) {
        query.size.$lte = parseInt(filters.maxSize, 10);
      }
    }

    // Set up pagination
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Set up sorting
    let sort = {};
    if (options.sortBy) {
      if (options.sortBy.startsWith("-")) {
        sort[options.sortBy.substring(1)] = -1;
      } else {
        sort[options.sortBy] = 1;
      }
    } else {
      // Default sort by newest first
      sort = { createdAt: -1 };
    }

    // Execute query
    const mediaList = await Media.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "email profile.firstName profile.lastName");

    // Get total count
    const total = await Media.countDocuments(query);

    return {
      media: mediaList,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error listing media:", error);
    throw error;
  }
};

/**
 * Get media by related content
 * @param {String} contentId - Content ID
 * @returns {Promise<Array>} Media list
 */
const getMediaByContent = async (contentId) => {
  try {
    const media = await Media.find({ relatedContent: contentId }).sort({
      createdAt: -1,
    });

    return media;
  } catch (error) {
    logger.error(`Error getting media for content ${contentId}:`, error);
    throw error;
  }
};

/**
 * Get media by related product
 * @param {String} productId - Product ID
 * @returns {Promise<Array>} Media list
 */
const getMediaByProduct = async (productId) => {
  try {
    const media = await Media.find({ relatedProduct: productId }).sort({
      createdAt: -1,
    });

    return media;
  } catch (error) {
    logger.error(`Error getting media for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Get media folders
 * @returns {Promise<Array>} List of folder names
 */
const getMediaFolders = async () => {
  try {
    const folders = await Media.distinct("folder");
    return folders.filter(Boolean).sort();
  } catch (error) {
    logger.error("Error getting media folders:", error);
    throw error;
  }
};

/**
 * Get media tags
 * @returns {Promise<Array>} List of tag names
 */
const getMediaTags = async () => {
  try {
    const media = await Media.find({
      tags: { $exists: true, $not: { $size: 0 } },
    }).select("tags");

    // Flatten and get unique tags
    const allTags = media.reduce((tags, item) => [...tags, ...item.tags], []);
    const uniqueTags = [...new Set(allTags)].sort();

    return uniqueTags;
  } catch (error) {
    logger.error("Error getting media tags:", error);
    throw error;
  }
};

/**
 * Get media storage usage statistics
 * @returns {Promise<Object>} Storage usage stats
 */
const getMediaStats = async () => {
  try {
    // Get total count and size by type
    const stats = await Media.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" },
        },
      },
    ]);

    // Get overall totals
    const totalCount = await Media.countDocuments();
    const totalSize = stats.reduce((sum, stat) => sum + stat.totalSize, 0);

    // Format stats by type
    const typeStats = {};
    stats.forEach((stat) => {
      typeStats[stat._id] = {
        count: stat.count,
        totalSize: stat.totalSize,
        percentOfTotal: ((stat.count / totalCount) * 100).toFixed(2),
      };
    });

    return {
      totalCount,
      totalSize,
      byType: typeStats,
    };
  } catch (error) {
    logger.error("Error getting media stats:", error);
    throw error;
  }
};

module.exports = {
  createMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  listMedia,
  getMediaByContent,
  getMediaByProduct,
  getMediaFolders,
  getMediaTags,
  getMediaStats,
};
