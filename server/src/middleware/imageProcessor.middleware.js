// src/middleware/imageProcessor.middleware.js
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const logger = require("../config/logger");

/**
 * Process uploaded images to optimize size and create variants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const processImages = async (req, res, next) => {
  // Skip if no files were uploaded
  if (!req.files || req.files.length === 0) return next();

  const processedFiles = [];

  try {
    // Process each uploaded image
    for (const file of req.files) {
      // Only process image files
      if (!file.mimetype.startsWith("image/")) {
        processedFiles.push(file);
        continue;
      }

      const fileDir = path.dirname(file.path);
      const fileExt = path.extname(file.path);
      const fileName = path.basename(file.path, fileExt);

      // Create optimized main image (WebP for better compression)
      const optimizedName = `${fileName}.webp`;
      const optimizedPath = path.join(fileDir, optimizedName);

      await sharp(file.path)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(optimizedPath);

      // Create thumbnail version
      const thumbName = `${fileName}-thumb.webp`;
      const thumbPath = path.join(fileDir, thumbName);

      await sharp(file.path)
        .resize(300, 300, { fit: "cover" })
        .webp({ quality: 70 })
        .toFile(thumbPath);

      // Replace original file with optimized version if not needed
      if (process.env.KEEP_ORIGINAL_FILES !== "true") {
        fs.unlinkSync(file.path);
      }

      // Update file information for database saving
      file.optimizedPath = path.relative(
        path.join(process.cwd(), "uploads"),
        optimizedPath
      );
      file.thumbnailPath = path.relative(
        path.join(process.cwd(), "uploads"),
        thumbPath
      );
      file.originalName = file.originalname;

      processedFiles.push(file);
    }

    req.processedFiles = processedFiles;
    next();
  } catch (error) {
    logger.error("Image processing error:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing uploaded images",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { processImages };
