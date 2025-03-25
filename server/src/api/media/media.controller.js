// src/api/media/media.controller.js
const mediaService = require("../../services/media.service");
const logger = require("../../config/logger");
const { responseFormatter } = require("../../utils/responseFormatter");

/**
 * Upload a new media file
 * @route POST /api/v1/media
 * @access Private (Admin)
 */
const uploadMedia = async (req, res, next) => {
  try {
    // Make sure file was uploaded
    if (!req.file) {
      return res.status(400).json(responseFormatter(false, "No file uploaded"));
    }

    // Get metadata from request body
    const metadata = {
      alt: req.body.alt,
      title: req.body.title,
      caption: req.body.caption,
      tags: req.body.tags
        ? req.body.tags.split(",").map((tag) => tag.trim())
        : [],
      folder: req.body.folder || "uploads",
      isPublic: req.body.isPublic === "true",
      relatedContent: req.body.contentId,
      relatedProduct: req.body.productId,
    };

    // Create media record
    const media = await mediaService.createMedia(
      req.file,
      metadata,
      req.user._id
    );

    return res.status(201).json(
      responseFormatter(true, "Media uploaded successfully", {
        media,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get media by ID
 * @route GET /api/v1/media/:id
 * @access Private (Admin)
 */
const getMediaById = async (req, res, next) => {
  try {
    const media = await mediaService.getMediaById(req.params.id);

    return res.status(200).json(
      responseFormatter(true, "Media retrieved successfully", {
        media,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update media metadata
 * @route PUT /api/v1/media/:id
 * @access Private (Admin)
 */
const updateMedia = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Convert tags string to array if provided
    if (req.body.tags && typeof req.body.tags === "string") {
      req.body.tags = req.body.tags.split(",").map((tag) => tag.trim());
    }

    const updatedMedia = await mediaService.updateMedia(id, req.body);

    return res.status(200).json(
      responseFormatter(true, "Media updated successfully", {
        media: updatedMedia,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete media
 * @route DELETE /api/v1/media/:id
 * @access Private (Admin)
 */
const deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    await mediaService.deleteMedia(id);

    return res
      .status(200)
      .json(responseFormatter(true, "Media deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * List media with filtering
 * @route GET /api/v1/media
 * @access Private (Admin)
 */
const listMedia = async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type,
      folder: req.query.folder,
      tag: req.query.tag,
      uploadedBy: req.query.uploadedBy,
      isPublic: req.query.isPublic,
      search: req.query.search,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      minSize: req.query.minSize,
      maxSize: req.query.maxSize,
    };

    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
      sortBy: req.query.sortBy || "-createdAt",
    };

    const result = await mediaService.listMedia(filters, options);

    return res
      .status(200)
      .json(responseFormatter(true, "Media retrieved successfully", result));
  } catch (error) {
    next(error);
  }
};

/**
 * Get media by related content
 * @route GET /api/v1/media/content/:contentId
 * @access Private (Admin)
 */
const getMediaByContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const media = await mediaService.getMediaByContent(contentId);

    return res.status(200).json(
      responseFormatter(true, "Media retrieved successfully", {
        media,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get media by related product
 * @route GET /api/v1/media/product/:productId
 * @access Private (Admin)
 */
const getMediaByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const media = await mediaService.getMediaByProduct(productId);

    return res.status(200).json(
      responseFormatter(true, "Media retrieved successfully", {
        media,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get media folders
 * @route GET /api/v1/media/folders
 * @access Private (Admin)
 */
const getMediaFolders = async (req, res, next) => {
  try {
    const folders = await mediaService.getMediaFolders();

    return res.status(200).json(
      responseFormatter(true, "Media folders retrieved successfully", {
        folders,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get media tags
 * @route GET /api/v1/media/tags
 * @access Private (Admin)
 */
const getMediaTags = async (req, res, next) => {
  try {
    const tags = await mediaService.getMediaTags();

    return res.status(200).json(
      responseFormatter(true, "Media tags retrieved successfully", {
        tags,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get media stats
 * @route GET /api/v1/media/stats
 * @access Private (Admin)
 */
const getMediaStats = async (req, res, next) => {
  try {
    const stats = await mediaService.getMediaStats();

    return res.status(200).json(
      responseFormatter(true, "Media stats retrieved successfully", {
        stats,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete media
 * @route DELETE /api/v1/media/bulk
 * @access Private (Admin)
 */
const bulkDeleteMedia = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json(responseFormatter(false, "No media IDs provided"));
    }

    // Delete each media item
    const results = await Promise.allSettled(
      ids.map((id) => mediaService.deleteMedia(id))
    );

    // Count successes and failures
    const successes = results.filter(
      (result) => result.status === "fulfilled"
    ).length;
    const failures = results.filter(
      (result) => result.status === "rejected"
    ).length;

    return res.status(200).json(
      responseFormatter(
        true,
        `${successes} media items deleted successfully, ${failures} failed`,
        {
          successes,
          failures,
        }
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  listMedia,
  getMediaByContent,
  getMediaByProduct,
  getMediaFolders,
  getMediaTags,
  getMediaStats,
  bulkDeleteMedia,
};
