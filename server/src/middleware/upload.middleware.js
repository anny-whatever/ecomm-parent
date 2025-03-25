// src/middleware/upload.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { responseFormatter } = require("../utils/responseFormatter");

// Maximum file size (from env or default to 5MB)
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 5 * 1024 * 1024; // 5MB in bytes

// Ensure uploads directory exists
const createDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage with site-specific structure
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get site identifier from request or use 'default'
    // This could come from subdomain, request parameter, or JWT token
    const siteId =
      req.params.siteId || req.query.siteId || req.siteId || "default";

    // Determine content type folder
    let contentType = "misc";
    if (file.fieldname.includes("product")) contentType = "products";
    else if (file.fieldname.includes("user")) contentType = "users";
    else if (file.fieldname.includes("category")) contentType = "categories";
    else if (file.fieldname.includes("content")) contentType = "content";

    // For products, add product ID subfolder if available
    let uploadPath = `uploads/${siteId}/${contentType}/`;

    if (contentType === "products" && req.params.productId) {
      uploadPath += `${req.params.productId}/`;
    }

    // Create directory if it doesn't exist
    createDirectory(uploadPath);

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = file.fieldname + "-" + uniqueSuffix + ext;
    cb(null, filename);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types based on upload context
  let allowedTypes = /jpeg|jpg|png|gif|webp/;

  if (file.fieldname.includes("document")) {
    allowedTypes = /pdf|doc|docx|xls|xlsx|txt/;
  } else if (file.fieldname.includes("avatar")) {
    allowedTypes = /jpeg|jpg|png|webp/;
  }

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (allowedTypes.test(extname) && allowedTypes.test(mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${extname}. Please upload allowed file types.`
      ),
      false
    );
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Multer error handler middleware
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json(
          responseFormatter(
            false,
            `File is too large. Maximum file size is ${
              MAX_FILE_SIZE / (1024 * 1024)
            }MB.`
          )
        );
    }
    return res
      .status(400)
      .json(responseFormatter(false, `Upload error: ${err.message}`));
  } else if (err) {
    // An unknown error occurred
    return res.status(400).json(responseFormatter(false, err.message));
  }
  next();
};

module.exports = { upload, multerErrorHandler };
