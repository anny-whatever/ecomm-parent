// src/api/content/content.controller.js
const contentService = require("../../services/content.service");
const mediaService = require("../../services/media.service");
const logger = require("../../config/logger");
const { responseFormatter } = require("../../utils/responseFormatter");

/**
 * Create a new content item
 * @route POST /api/v1/content
 * @access Private (Admin)
 */
const createContent = async (req, res, next) => {
  try {
    const content = await contentService.createContent({
      ...req.body,
      author: req.user._id,
    });

    return res.status(201).json(
      responseFormatter(true, "Content created successfully", {
        content,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get content by ID
 * @route GET /api/v1/content/:id
 * @access Private (Admin)
 */
const getContentById = async (req, res, next) => {
  try {
    const content = await contentService.getContentById(req.params.id);

    return res.status(200).json(
      responseFormatter(true, "Content retrieved successfully", {
        content,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get content by slug and type
 * @route GET /api/v1/content/:type/:slug
 * @access Public
 */
const getContentBySlug = async (req, res, next) => {
  try {
    const { type, slug } = req.params;
    const content = await contentService.getContentBySlug(slug, type);

    return res.status(200).json(
      responseFormatter(true, "Content retrieved successfully", {
        content,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get homepage
 * @route GET /api/v1/content/homepage
 * @access Public
 */
const getHomepage = async (req, res, next) => {
  try {
    const homepage = await contentService.getHomepage();

    return res.status(200).json(
      responseFormatter(true, "Homepage retrieved successfully", {
        content: homepage,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update content
 * @route PUT /api/v1/content/:id
 * @access Private (Admin)
 */
const updateContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedContent = await contentService.updateContent(id, req.body);

    return res.status(200).json(
      responseFormatter(true, "Content updated successfully", {
        content: updatedContent,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete content
 * @route DELETE /api/v1/content/:id
 * @access Private (Admin)
 */
const deleteContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    await contentService.deleteContent(id);

    return res
      .status(200)
      .json(responseFormatter(true, "Content deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * List content with filtering
 * @route GET /api/v1/content
 * @access Private (Admin)
 */
const listContent = async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status,
      category: req.query.category,
      tag: req.query.tag,
      author: req.query.author,
      search: req.query.search,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      includeInMenu: req.query.includeInMenu,
      includeInFooter: req.query.includeInFooter,
    };

    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sortBy: req.query.sortBy || "-createdAt",
    };

    const result = await contentService.listContent(filters, options);

    return res
      .status(200)
      .json(responseFormatter(true, "Content retrieved successfully", result));
  } catch (error) {
    next(error);
  }
};

/**
 * List published content for public access
 * @route GET /api/v1/content/published/:type
 * @access Public
 */
const listPublishedContent = async (req, res, next) => {
  try {
    const { type } = req.params;

    const filters = {
      type,
      status: "published",
      category: req.query.category,
      tag: req.query.tag,
      search: req.query.search,
    };

    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sortBy: req.query.sortBy || "-publishedAt",
    };

    const result = await contentService.listContent(filters, options);

    return res
      .status(200)
      .json(
        responseFormatter(true, `${type} list retrieved successfully`, result)
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Get content categories
 * @route GET /api/v1/content/categories/:type
 * @access Public
 */
const getContentCategories = async (req, res, next) => {
  try {
    const { type } = req.params;
    const categories = await contentService.getContentCategories(type);

    return res.status(200).json(
      responseFormatter(true, "Categories retrieved successfully", {
        categories,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get content tags
 * @route GET /api/v1/content/tags/:type
 * @access Public
 */
const getContentTags = async (req, res, next) => {
  try {
    const { type } = req.params;
    const tags = await contentService.getContentTags(type);

    return res.status(200).json(
      responseFormatter(true, "Tags retrieved successfully", {
        tags,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent content
 * @route GET /api/v1/content/recent/:type
 * @access Public
 */
const getRecentContent = async (req, res, next) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit, 10) || 5;

    const recentContent = await contentService.getRecentContent(type, limit);

    return res.status(200).json(
      responseFormatter(true, `Recent ${type} retrieved successfully`, {
        content: recentContent,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular content
 * @route GET /api/v1/content/popular/:type
 * @access Public
 */
const getPopularContent = async (req, res, next) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit, 10) || 5;

    const popularContent = await contentService.getPopularContent(type, limit);

    return res.status(200).json(
      responseFormatter(true, `Popular ${type} retrieved successfully`, {
        content: popularContent,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get related content
 * @route GET /api/v1/content/:id/related
 * @access Public
 */
const getRelatedContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 3;

    const relatedContent = await contentService.getRelatedContent(id, limit);

    return res.status(200).json(
      responseFormatter(true, "Related content retrieved successfully", {
        content: relatedContent,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get menu items
 * @route GET /api/v1/content/menu
 * @access Public
 */
const getMenuItems = async (req, res, next) => {
  try {
    const filters = {
      status: "published",
      includeInMenu: "true",
    };

    const options = {
      sortBy: "order",
      limit: 100, // High limit to get all menu items
    };

    const result = await contentService.listContent(filters, options);

    return res.status(200).json(
      responseFormatter(true, "Menu items retrieved successfully", {
        items: result.content,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get footer items
 * @route GET /api/v1/content/footer
 * @access Public
 */
const getFooterItems = async (req, res, next) => {
  try {
    const filters = {
      status: "published",
      includeInFooter: "true",
    };

    const options = {
      sortBy: "order",
      limit: 100, // High limit to get all footer items
    };

    const result = await contentService.listContent(filters, options);

    return res.status(200).json(
      responseFormatter(true, "Footer items retrieved successfully", {
        items: result.content,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Upload content image
 * @route POST /api/v1/content/:id/image
 * @access Private (Admin)
 */
const uploadContentImage = async (req, res, next) => {
  try {
    // Make sure file was uploaded
    if (!req.file) {
      return res
        .status(400)
        .json(responseFormatter(false, "No image file uploaded"));
    }

    const { id } = req.params;
    const content = await contentService.getContentById(id);

    // Create media record
    const metadata = {
      alt: req.body.alt || content.title,
      title: req.body.title || content.title,
      caption: req.body.caption,
      relatedContent: id,
      isPublic: true,
      folder: `content/${content.type}`,
    };

    const media = await mediaService.createMedia(
      req.file,
      metadata,
      req.user._id
    );

    // Update content with the new featured image
    const updatedContent = await contentService.updateContent(id, {
      featuredImage: `/${req.file.optimizedPath || req.file.path}`,
    });

    return res.status(200).json(
      responseFormatter(true, "Content image uploaded successfully", {
        content: updatedContent,
        media,
      })
    );
  } catch (error) {
    next(error);
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
  listPublishedContent,
  getContentCategories,
  getContentTags,
  getRecentContent,
  getPopularContent,
  getRelatedContent,
  getMenuItems,
  getFooterItems,
  uploadContentImage,
};
