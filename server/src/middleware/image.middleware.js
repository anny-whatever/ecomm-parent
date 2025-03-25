const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

/**
 * Middleware to process uploaded images
 * - Resizes images 
 * - Converts to webp format
 * - Saves in a structured directory
 */
const processImages = async (req, res, next) => {
  try {
    // Skip if no file was uploaded
    if (!req.file && !req.files) {
      return next();
    }

    // Process single file upload
    if (req.file) {
      const processed = await processImage(req.file);
      req.processedImage = processed;
    }
    
    // Process multiple file uploads
    if (req.files) {
      req.processedImages = [];
      for (const file of req.files) {
        const processed = await processImage(file);
        req.processedImages.push(processed);
      }
    }
    
    next();
  } catch (error) {
    logger.error('Error processing image:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing uploaded image',
      error: error.message
    });
  }
};

/**
 * Helper function to process a single image
 */
const processImage = async (file) => {
  const uploadDir = process.env.UPLOADS_DIR || './uploads';
  const fileName = `${uuidv4()}.webp`;
  const relativePath = path.join('images', fileName);
  const outputPath = path.join(uploadDir, relativePath);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Process image with sharp
  await sharp(file.buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outputPath);
    
  // Return image details
  return {
    path: relativePath,
    url: `${process.env.BASE_URL || 'http://localhost:3001'}/uploads/${relativePath}`,
    filename: fileName,
    mimetype: 'image/webp',
    size: fs.statSync(outputPath).size
  };
};

module.exports = {
  processImages
}; 