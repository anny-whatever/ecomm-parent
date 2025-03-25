// src/services/content.service.js
const Content = require("../models/content.model");
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
} = require("../utils/errorTypes");
const logger = require("../config/logger");
const slugify = require("slugify");

/**
 * Create a new content item
 * @param {Object} contentData - Content data
 * @returns {Promise<Object>} Created content
 */
const createContent = async (contentData) => {
  try {
    // Generate a slug if not provided
    if (!contentData.slug) {
      contentData.slug = slugify(contentData.title, {
        lower: true,
        strict: true,
      });
    }

    // Check if slug is unique for this content type
    const existingContent = await Content.findOne({
      slug: contentData.slug,
      type: contentData.type,
    });

    if (existingContent) {
      throw new ConflictError(
        `A ${contentData.type} with this slug already exists`
      );
    }

    // If this is marked as homepage, ensure no other page is set as homepage
    if (contentData.isHomepage) {
      await Content.updateMany(
        { isHomepage: true },
        { $set: { isHomepage: false } }
      );
    }

    // If publishing now, set publishedAt date
    if (contentData.status === "published" && !contentData.publishedAt) {
      contentData.publishedAt = new Date();
    }

    // Create the content
    const content = new Content(contentData);
    await content.save();

    return content;
  } catch (error) {
    logger.error("Error creating content:", error);
    throw error;
  }
};

/**
 * Get content by ID
 * @param {String} contentId - Content ID
 * @returns {Promise<Object>} Content object
 */
const getContentById = async (contentId) => {
  try {
    const content = await Content.findById(contentId).populate(
      "author",
      "email profile.firstName profile.lastName"
    );

    if (!content) {
      throw new NotFoundError("Content not found");
    }

    return content;
  } catch (error) {
    logger.error(`Error getting content ${contentId}:`, error);
    throw error;
  }
};

/**
 * Get content by slug and type
 * @param {String} slug - Content slug
 * @param {String} type - Content type
 * @returns {Promise<Object>} Content object
 */
const getContentBySlug = async (slug, type = "page") => {
  try {
    const content = await Content.findOne({
      slug,
      type,
      status: "published",
    }).populate("author", "email profile.firstName profile.lastName");

    if (!content) {
      throw new NotFoundError(
        `${type.charAt(0).toUpperCase() + type.slice(1)} not found`
      );
    }

    // Increment view count
    content.viewCount += 1;
    await content.save();

    return content;
  } catch (error) {
    logger.error(`Error getting content by slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Get homepage content
 * @returns {Promise<Object>} Homepage content
 */
const getHomepage = async () => {
  try {
    const homepage = await Content.findOne({
      isHomepage: true,
      status: "published",
    }).populate("author", "email profile.firstName profile.lastName");

    if (!homepage) {
      throw new NotFoundError("Homepage not found");
    }

    // Increment view count
    homepage.viewCount += 1;
    await homepage.save();

    return homepage;
  } catch (error) {
    logger.error("Error getting homepage:", error);
    throw error;
  }
};

/**
 * Update content
 * @param {String} contentId - Content ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated content
 */
const updateContent = async (contentId, updateData) => {
  try {
    const content = await Content.findById(contentId);

    if (!content) {
      throw new NotFoundError("Content not found");
    }

    // Check slug uniqueness if changing
    if (updateData.slug && updateData.slug !== content.slug) {
      const existingContent = await Content.findOne({
        slug: updateData.slug,
        type: updateData.type || content.type,
        _id: { $ne: contentId },
      });

      if (existingContent) {
        throw new ConflictError(
          `A ${updateData.type || content.type} with this slug already exists`
        );
      }
    }

    // If changing to published status, set publishedAt date
    if (
      updateData.status === "published" &&
      content.status !== "published" &&
      !updateData.publishedAt
    ) {
      updateData.publishedAt = new Date();
    }

    // If setting as homepage, ensure no other page is homepage
    if (updateData.isHomepage && !content.isHomepage) {
      await Content.updateMany(
        { isHomepage: true, _id: { $ne: contentId } },
        { $set: { isHomepage: false } }
      );
    }

    // Update the content
    const updatedContent = await Content.findByIdAndUpdate(
      contentId,
      updateData,
      { new: true, runValidators: true }
    ).populate("author", "email profile.firstName profile.lastName");

    return updatedContent;
  } catch (error) {
    logger.error(`Error updating content ${contentId}:`, error);
    throw error;
  }
};

/**
 * Delete content
 * @param {String} contentId - Content ID
 * @returns {Promise<Boolean>} Success status
 */
const deleteContent = async (contentId) => {
  try {
    const content = await Content.findById(contentId);

    if (!content) {
      throw new NotFoundError("Content not found");
    }

    await Content.findByIdAndDelete(contentId);
    return true;
  } catch (error) {
    logger.error(`Error deleting content ${contentId}:`, error);
    throw error;
  }
};

/**
 * List content with filtering, pagination and sorting
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Content list with pagination info
 */
const listContent = async (filters = {}, options = {}) => {
  try {
    const query = {};

    // Apply filters
    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.tag) {
      query.tags = filters.tag;
    }

    if (filters.author) {
      query.author = filters.author;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
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

    // Menu or footer filter
    if (filters.includeInMenu === "true") {
      query.includeInMenu = true;
    }

    if (filters.includeInFooter === "true") {
      query.includeInFooter = true;
    }

    // Set up pagination
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
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
    const contentList = await Content.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("author", "email profile.firstName profile.lastName");

    // Get total count
    const total = await Content.countDocuments(query);

    return {
      content: contentList,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error listing content:", error);
    throw error;
  }
};

/**
 * Get categories list from existing content
 * @param {String} type - Content type
 * @returns {Promise<Array>} Categories list
 */
const getContentCategories = async (type = "post") => {
  try {
    const categories = await Content.distinct("category", {
      type,
      category: { $ne: null, $ne: "" },
    });

    return categories.filter(Boolean).sort();
  } catch (error) {
    logger.error(`Error getting ${type} categories:`, error);
    throw error;
  }
};

/**
 * Get tags list from existing content
 * @param {String} type - Content type
 * @returns {Promise<Array>} Tags list
 */
const getContentTags = async (type = "post") => {
  try {
    const content = await Content.find({
      type,
      tags: { $exists: true, $not: { $size: 0 } },
    }).select("tags");

    // Flatten and get unique tags
    const allTags = content.reduce((tags, item) => [...tags, ...item.tags], []);
    const uniqueTags = [...new Set(allTags)].sort();

    return uniqueTags;
  } catch (error) {
    logger.error(`Error getting ${type} tags:`, error);
    throw error;
  }
};

/**
 * Get recent published content
 * @param {String} type - Content type
 * @param {Number} limit - Number of items to return
 * @returns {Promise<Array>} Recent content
 */
const getRecentContent = async (type = "post", limit = 5) => {
  try {
    return await Content.findRecent(type, limit);
  } catch (error) {
    logger.error(`Error getting recent ${type}:`, error);
    throw error;
  }
};

/**
 * Get popular content based on view count
 * @param {String} type - Content type
 * @param {Number} limit - Number of items to return
 * @returns {Promise<Array>} Popular content
 */
const getPopularContent = async (type = "post", limit = 5) => {
  try {
    return await Content.findPopular(type, limit);
  } catch (error) {
    logger.error(`Error getting popular ${type}:`, error);
    throw error;
  }
};

/**
 * Get related content
 * @param {String} contentId - Content ID
 * @param {Number} limit - Number of items to return
 * @returns {Promise<Array>} Related content
 */
const getRelatedContent = async (contentId, limit = 3) => {
  try {
    const content = await Content.findById(contentId);

    if (!content) {
      throw new NotFoundError("Content not found");
    }

    // Get content with the same category and tags
    const query = {
      _id: { $ne: contentId },
      type: content.type,
      status: "published",
      $or: [],
    };

    if (content.category) {
      query.$or.push({ category: content.category });
    }

    if (content.tags && content.tags.length > 0) {
      query.$or.push({ tags: { $in: content.tags } });
    }

    // If no category or tags, just get latest content of same type
    if (query.$or.length === 0) {
      delete query.$or;
    }

    const relatedContent = await Content.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select("title slug excerpt featuredImage publishedAt");

    return relatedContent;
  } catch (error) {
    logger.error(`Error getting related content for ${contentId}:`, error);
    throw error;
  }
};

module.exports = {
  createContent,
  getContentById,
  getContentBySlug,
  getHomepage,
  updateContent,
  deleteContent,
  listContent,
  getContentCategories,
  getContentTags,
  getRecentContent,
  getPopularContent,
  getRelatedContent,
};
