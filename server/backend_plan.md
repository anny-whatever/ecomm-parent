# Advanced E-commerce Backend System

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Tech Stack & Requirements](#tech-stack--requirements)
4. [Complete File Structure](#complete-file-structure)
5. [Core Modules & Features](#core-modules--features)
   - [Authentication & Authorization](#authentication--authorization)
   - [Product & Catalog Management](#product--catalog-management)
   - [Inventory Management](#inventory-management)
   - [Order Processing](#order-processing)
   - [User Management](#user-management)
   - [CMS & Content](#cms--content)
   - [Marketing & Promotions](#marketing--promotions)
   - [Shipping & Logistics](#shipping--logistics)
   - [Analytics & Reporting](#analytics--reporting)
   - [Payment Processing](#payment-processing)
   - [Real-time Updates](#real-time-updates)
6. [Database Schema Design](#database-schema-design)
7. [API Endpoints](#api-endpoints)
   - [Customer API](#customer-api)
   - [Admin API](#admin-api)
   - [Webhooks](#webhooks)
8. [Implementation Plan](#implementation-plan)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)
11. [Extensibility & Reusability](#extensibility--reusability)
12. [Module Dependencies](#module-dependencies)
13. [Deployment Guidelines](#deployment-guidelines)

## Introduction

This document outlines a comprehensive plan for a modern, scalable e-commerce backend system designed to serve as a reusable foundation for various e-commerce applications. By implementing this architecture, developers gain a robust, feature-complete system that can be customized for diverse client needs with minimal additional development.

**Key Benefits:**

- **Modularity**: Independent modules that can be enabled/disabled based on business requirements
- **Scalability**: Designed to handle 1,000-5,000+ customers per month with horizontal scaling capability
- **Maintainability**: Clean architecture with separation of concerns for long-term maintenance
- **Security**: Comprehensive security measures built into the core system
- **Feature Completeness**: Includes all essential e-commerce functionality out of the box

**Implementation Overview for AI Developer:**

- You will be implementing a complete Node.js/Express.js/MongoDB backend system
- Follow the service-oriented architecture pattern throughout the implementation
- Create comprehensive data models, controllers, services, and utility functions as specified
- Implement proper error handling, validation, and security measures
- Develop using modern JavaScript practices (ES6+) with async/await patterns
- Include detailed comments and JSDoc documentation for all significant functions
- Implement comprehensive test cases for critical functionality

The system follows industry best practices in backend development and provides a solid foundation that reduces time-to-market for new e-commerce implementations.

## System Architecture

The system implements a modular, service-oriented architecture designed for maximum reusability:

```
E-commerce Backend
├── Core Services
│   ├── Authentication & Authorization
│   ├── Database Management
│   ├── Real-time Updates (Server-Sent Events)
│   ├── Payment Processing (Razorpay)
│   ├── Error Handling & Logging
│   └── Email Services
│
├── Feature Modules
│   ├── Products & Catalog
│   ├── Inventory Management
│   ├── Order Processing
│   ├── User Management
│   ├── CMS & Content
│   ├── Analytics & Reporting
│   ├── Marketing & Promotions
│   ├── Wishlist & Reviews
│   └── Shipping & Logistics
│
└── API Layer
    ├── Customer-facing API
    ├── Admin API
    ├── Content Delivery API
    └── Webhooks & Integrations
```

Each component is designed with clear interfaces, allowing for:

- Independent development and testing
- Feature toggling based on business requirements
- Replacement of individual modules without affecting the entire system
- Clear separation between business logic and API endpoints

## Tech Stack & Requirements

### Core Technologies to Implement

- **Runtime**: Node.js v16+ - Server-side JavaScript environment
- **Framework**: Express.js v4.17+ - Web application framework
- **Database**: MongoDB v5+ with Mongoose v6+ - NoSQL database with ODM
- **Authentication**: JWT with different expiration periods by role type
- **Payment**: Razorpay payment gateway integration
- **Real-time**: Server-Sent Events for live updates

### Required Dependencies with Implementation Notes

- **Validation**:

  ```
  // Example Joi validation implementation
  const Joi = require('joi');

  const productValidationSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    price: Joi.number().positive().required(),
    description: Joi.string().min(10).max(1000),
    categories: Joi.array().items(Joi.string())
  });

  // Use in validation middleware
  const validateProduct = (req, res, next) => {
    const { error } = productValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    next();
  };
  ```

- **Email**:

  ```
  // Nodemailer implementation example
  const nodemailer = require('nodemailer');

  // Create reusable transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Send email function
  const sendEmail = async ({ to, subject, html }) => {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Email sending failed', error);
      return { success: false, error };
    }
  };
  ```

- **Security**:

  ```
  // Security implementation examples

  // 1. Password hashing with bcrypt
  const bcrypt = require('bcrypt');
  const saltRounds = 10;

  const hashPassword = async (password) => {
    return await bcrypt.hash(password, saltRounds);
  };

  const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
  };

  // 2. HTTP security with Helmet
  const helmet = require('helmet');
  app.use(helmet()); // Apply sensible security headers

  // 3. CORS configuration
  const cors = require('cors');
  const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
  app.use(cors(corsOptions));

  // 4. Rate limiting
  const rateLimit = require('express-rate-limit');
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  });
  app.use('/api/', apiLimiter);
  ```

- **Logging**:

  ```
  // Winston logger implementation
  const winston = require('winston');

  const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });

  // Usage
  logger.info('Server started successfully', { port: process.env.PORT });
  logger.error('Database connection failed', { error: err.message });
  ```

File Storage & Media Management
This module handles file uploads, optimization, and storage for the e-commerce system.
Key Components to Implement:

Site-specific file storage structure for multi-tenant support
Image optimization and processing with multiple output formats
Secure file handling with validation and sanitization
Media library management for products, users, and content
Advanced file organization with dedicated product folders

Implementation Details:

Enhanced Site-Specific Storage Structure:

javascriptCopy// upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure directories exist
const createDirectory = (dirPath) => {
if (!fs.existsSync(dirPath)) {
fs.mkdirSync(dirPath, { recursive: true });
}
};

// Configure storage with site-specific structure
const storage = multer.diskStorage({
destination: (req, file, cb) => {
// Get site identifier from request
// This could come from subdomain, request parameter, or JWT token
const siteId = req.params.siteId || req.query.siteId || req.siteId || 'default';

    // Determine content type folder
    let contentType = 'misc';
    if (file.fieldname.includes('product')) contentType = 'products';
    else if (file.fieldname.includes('user')) contentType = 'users';
    else if (file.fieldname.includes('content')) contentType = 'content';

    // For products, add product ID subfolder if available
    let uploadPath = `uploads/${siteId}/${contentType}/`;

    if (contentType === 'products' && req.params.productId) {
      uploadPath += `${req.params.productId}/`;
    }

    // Create directory if it doesn't exist
    createDirectory(uploadPath);

    cb(null, uploadPath);

},
filename: (req, file, cb) => {
// Create unique filename
const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() \* 1E9);
const ext = path.extname(file.originalname).toLowerCase();
const filename = file.fieldname + '-' + uniqueSuffix + ext;
cb(null, filename);
}
});

const fileFilter = (req, file, cb) => {
// Define allowed file types based on upload context
let allowedTypes = /jpeg|jpg|png|gif|webp/;

if (file.fieldname.includes('document')) {
allowedTypes = /pdf|doc|docx|xls|xlsx|txt/;
} else if (file.fieldname.includes('avatar')) {
allowedTypes = /jpeg|jpg|png|webp/;
}

const extname = path.extname(file.originalname).toLowerCase();
const mimetype = file.mimetype;

if (allowedTypes.test(extname) && allowedTypes.test(mimetype)) {
cb(null, true);
} else {
cb(new Error('Unsupported file type'), false);
}
};

const upload = multer({
storage,
fileFilter,
limits: { fileSize: 10 _ 1024 _ 1024 } // 10MB limit
});

module.exports = { upload };

Image Processing and Optimization:

javascriptCopy// imageProcessor.middleware.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/\*\*

- Process uploaded images to optimize size and create variants
  \*/
  const processImages = async (req, res, next) => {
  // Skip if no files were uploaded
  if (!req.files || req.files.length === 0) return next();

const processedFiles = [];

try {
// Process each uploaded image
for (const file of req.files) {
// Only process image files
if (!file.mimetype.startsWith('image/')) {
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
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(optimizedPath);

      // Create thumbnail version
      const thumbName = `${fileName}-thumb.webp`;
      const thumbPath = path.join(fileDir, thumbName);

      await sharp(file.path)
        .resize(300, 300, { fit: 'cover' })
        .webp({ quality: 70 })
        .toFile(thumbPath);

      // Replace original file with optimized version if not needed
      // Or keep both if needed for compatibility
      if (process.env.KEEP_ORIGINAL_FILES !== 'true') {
        fs.unlinkSync(file.path);
      }

      // Update file information for database saving
      file.optimizedPath = path.relative(path.join(process.cwd(), 'uploads'), optimizedPath);
      file.thumbnailPath = path.relative(path.join(process.cwd(), 'uploads'), thumbPath);

      processedFiles.push(file);
    }

    req.processedFiles = processedFiles;
    next();

} catch (error) {
console.error('Image processing error:', error);
next(error);
}
};

module.exports = { processImages };

Product Image Upload Service:

javascriptCopy// product.service.js (add to existing service)

/\*\*

- Upload and process product images
- @param {String} productId - Product ID to update
- @param {Array} files - Processed image files
- @returns {Promise<Array>} Array of saved image objects
  \*/
  const uploadProductImages = async (productId, files) => {
  try {
  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
  throw new Error('Product not found');
  }
      // Process image data
      const imageObjects = files.map(file => ({
        original: {
          url: `/${file.optimizedPath}`,
          width: 1200,
          height: 1200,
          fileSize: fs.statSync(path.join(process.cwd(), file.optimizedPath)).size
        },
        thumbnail: {
          url: `/${file.thumbnailPath}`,
          width: 300,
          height: 300,
          fileSize: fs.statSync(path.join(process.cwd(), file.thumbnailPath)).size
        },
        alt: file.originalname || '',
        isDefault: product.images.length === 0 // First image is default
      }));

      // Add images to product
      product.images.push(...imageObjects);
      await product.save();

      return imageObjects;
  } catch (error) {
  logger.error(`Error uploading product images for ${productId}`, error);
  throw error;
  }
  };

Product Image Upload Controller:

javascriptCopy// product.controller.js (add to existing controller)

/\*\*

- Upload product images
- @route POST /api/v1/products/:productId/images
- @access Private (Admin)
  \*/
  const uploadProductImages = async (req, res) => {
  try {
  const { productId } = req.params;
      // Ensure files were processed by imageProcessor middleware
      if (!req.processedFiles || req.processedFiles.length === 0) {
        return res.status(400).json(responseFormatter(
          false,
          'No images were uploaded or processing failed'
        ));
      }

      // Upload and process images
      const imageObjects = await productService.uploadProductImages(productId, req.processedFiles);

      return res.status(200).json(responseFormatter(
        true,
        'Images uploaded and processed successfully',
        { images: imageObjects }
      ));
  } catch (error) {
  logger.error(`Error in uploadProductImages controller for ${req.params.productId}`, error);
  return res.status(500).json(responseFormatter(
  false,
  'Failed to upload product images',
  null,
  process.env.NODE_ENV === 'development' ? error.message : undefined
  ));
  }
  };

Product Image Routes:

javascriptCopy// product.routes.js (add to existing routes)

// Add image upload route
router.post(
'/:productId/images',
authMiddleware,
rbacMiddleware(['admin', 'manager']),
upload.array('product-images', 10),
processImages,
productController.uploadProductImages
);

// Delete product image route
router.delete(
'/:productId/images/:imageId',
authMiddleware,
rbacMiddleware(['admin', 'manager']),
productController.deleteProductImage
);

Environment Variables for File Storage:

Copy# File Storage Configuration
UPLOAD_DIRECTORY=uploads
MAX_FILE_SIZE=10485760 # 10MB in bytes
KEEP_ORIGINAL_FILES=false
IMAGE_COMPRESSION_QUALITY=80
THUMBNAIL_SIZE=300
OPTIMIZED_IMAGE_MAX_WIDTH=1200
Key Benefits:

Space Efficiency:

WebP format reduces file size by 25-35% compared to JPEG
Proper resizing eliminates unnecessarily large images
Structured file organization prevents duplication

Multi-Tenant Support:

Each site's files are in separate directories
Makes backups and migrations easier
Better security and data separation

Improved Performance:

Smaller file sizes for faster loading times
Pre-generated thumbnails for better UI performance
Optimized image dimensions for modern displays

Flexible Access Patterns:

Access optimized images: /uploads/site1/products/123/image-12345.webp
Access thumbnails: /uploads/site1/products/123/image-12345-thumb.webp
Support for product-specific organization

Implementation Complexity: Medium
Dependencies: Product model, Sharp library
Endpoints: Image upload, image deletion, image listing
API Endpoints to Implement:

POST /api/v1/products//images

Uploads and processes multiple product images
Creates optimized versions and thumbnails
Returns information about processed images

DELETE /api/v1/products//images/

Removes an image from a product
Deletes the image files from storage
Updates product image references

GET /api/v1/products//images

Lists all images associated with a product
Returns URLs and metadata for display# Advanced E-commerce Backend System

### Environment Variables to Configure

Create a comprehensive `.env` file with these variables:

```
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1
BASE_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ecommerce
MONGODB_TEST_URI=mongodb://localhost:27017/ecommerce_test

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_CUSTOMER_EXPIRY=30d
JWT_ADMIN_EXPIRY=3d

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=E-commerce Store <noreply@example.com>

# File Storage
UPLOAD_DIRECTORY=uploads
MAX_FILE_SIZE=5242880 # 5MB in bytes

# Security
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX=100 # Max requests per window

# Logging
LOG_LEVEL=debug
```

### Development Requirements for Implementation

- Node.js v16+
- npm v7+ or Yarn v1.22+
- MongoDB v5+
- Git for version control
- VSCode or similar code editor with ESLint integration
- Postman or similar tool for API testing

### Production Deployment Requirements

- Node.js runtime environment
- MongoDB database (self-hosted or Atlas)
- Secure file storage for uploads
- SSL certificate for HTTPS
- Environment variable management system (like Docker secrets or AWS Parameter Store)

## Complete File Structure

This section details the comprehensive file structure of the e-commerce backend system. Each file and directory serves a specific purpose within the architecture.

```
/
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore configuration
├── package.json                   # Project dependencies and scripts
├── README.md                      # Project documentation and setup instructions
├── src/
│   ├── app.js                     # Express app initialization
│   ├── server.js                  # Server entry point
│   │
│   ├── config/                    # Configuration files
│   │   ├── index.js               # Central export of all configurations
│   │   ├── database.js            # MongoDB connection setup
│   │   ├── env.js                 # Environment variables validation
│   │   ├── razorpay.js            # Payment gateway configuration
│   │   ├── email.js               # Email service setup
│   │   ├── logger.js              # Winston logger configuration
│   │   ├── sse.js                 # Server-Sent Events setup
│   │   └── corsOptions.js         # CORS configuration
│   │
│   ├── api/                       # API routes organized by domain
│   │   ├── index.js               # Central registration of all routes
│   │   ├── auth/                  # Authentication endpoints
│   │   ├── products/              # Product management endpoints
│   │   ├── categories/            # Category management endpoints
│   │   ├── orders/                # Order processing endpoints
│   │   ├── users/                 # User management endpoints
│   │   ├── cart/                  # Shopping cart endpoints
│   │   ├── wishlist/              # Wishlist management endpoints
│   │   ├── reviews/               # Product review endpoints
│   │   ├── checkout/              # Checkout process endpoints
│   │   ├── content/               # CMS endpoints
│   │   ├── promotions/            # Promotion and discount endpoints
│   │   ├── analytics/             # Analytics and reporting endpoints
│   │   ├── shipping/              # Shipping management endpoints
│   │   ├── inventory/             # Inventory management endpoints
│   │   ├── admin/                 # Admin-specific endpoints
│   │   └── webhooks/              # External service webhook handlers
│   │
│   ├── models/                    # MongoDB data models
│   │   ├── user.model.js          # User account schema
│   │   ├── product.model.js       # Product schema
│   │   ├── category.model.js      # Product category schema
│   │   ├── order.model.js         # Order schema
│   │   ├── cart.model.js          # Shopping cart schema
│   │   ├── review.model.js        # Product review schema
│   │   ├── content.model.js       # CMS content schema
│   │   ├── promotion.model.js     # Discount and promotion schema
│   │   ├── inventory.model.js     # Inventory tracking schema
│   │   ├── shipping.model.js      # Shipping methods schema
│   │   ├── payment.model.js       # Payment transaction schema
│   │   ├── location.model.js      # Warehouse and store location schema
│   │   ├── analytics.model.js     # Analytics data schema
│   │   ├── abandoned-cart.model.js # Abandoned cart schema
│   │   └── settings.model.js      # System configuration schema
│   │
│   ├── services/                  # Business logic layer
│   │   ├── auth.service.js        # Authentication business logic
│   │   ├── product.service.js     # Product management business logic
│   │   ├── category.service.js    # Category management business logic
│   │   ├── order.service.js       # Order processing logic
│   │   ├── user.service.js        # User management logic
│   │   ├── cart.service.js        # Shopping cart logic
│   │   ├── wishlist.service.js    # Wishlist management logic
│   │   ├── review.service.js      # Review management logic
│   │   ├── checkout.service.js    # Checkout process logic
│   │   ├── inventory.service.js   # Inventory management logic
│   │   ├── payment.service.js     # Payment processing logic
│   │   ├── email.service.js       # Email handling logic
│   │   ├── notification.service.js # Notification management
│   │   ├── shipping.service.js    # Shipping provider integration
│   │   ├── content.service.js     # CMS content management
│   │   ├── promotion.service.js   # Promotion management logic
│   │   ├── analytics.service.js   # Analytics and reporting logic
│   │   ├── reporting.service.js   # Report generation logic
│   │   └── sse.service.js         # Real-time updates logic
│   │
│   ├── middleware/                # Express middleware
│   │   ├── auth.middleware.js     # JWT authentication verification
│   │   ├── validation.middleware.js # Request data validation
│   │   ├── error.middleware.js    # Error handling
│   │   ├── rbac.middleware.js     # Role-based access control
│   │   ├── upload.middleware.js   # File upload handling
│   │   ├── cache.middleware.js    # Response caching
│   │   ├── logger.middleware.js   # Request logging
│   │   └── rateLimiter.middleware.js # API rate limiting
│   │
│   ├── utils/                     # Utility functions
│   │   ├── validators/            # Data validation schemas
│   │   ├── helpers/               # Helper functions
│   │   ├── templates/             # Email and document templates
│   │   ├── constants.js           # Application constants
│   │   ├── errorTypes.js          # Error types and messages
│   │   ├── responseFormatter.js   # API response formatting
│   │   └── paginationHelper.js    # Pagination utility
│   │
│   ├── events/                    # Event handlers
│   │   ├── eventEmitter.js        # Central event emitter
│   │   ├── orderEvents.js         # Order-related events
│   │   ├── userEvents.js          # User-related events
│   │   ├── inventoryEvents.js     # Inventory-related events
│   │   └── paymentEvents.js       # Payment-related events
│   │
│   └── jobs/                      # Scheduled background tasks
│       ├── scheduler.js           # Task scheduler
│       ├── abandoned-cart.job.js  # Cart recovery job
│       ├── inventory-check.job.js # Inventory notification job
│       ├── order-status-update.job.js # Order update job
│       └── report-generation.job.js # Report generation job
│
├── tests/                         # Testing directory
│   ├── setup.js                   # Test setup
│   ├── teardown.js                # Test cleanup
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── fixtures/                  # Test data
│
└── uploads/                       # File storage directory
    ├── products/                  # Product images
    ├── users/                     # User profile pictures
    └── content/                   # CMS media files
```

## Core Modules & Features

### Authentication & Authorization

This module provides secure user authentication and granular access control.

**Key Components to Implement:**

- JWT-based authentication with role-specific expiration (30 days for customers, 3 days for admins)
- Role-based access control (RBAC) system with predefined roles (customer, admin, manager, staff)
- Permissions framework with fine-grained action control
- Secure password management with bcrypt hashing
- Email verification workflow
- Token management with refresh capability

**Implementation Details:**

1. **JWT Configuration:**

```javascript
// auth.service.js
const jwt = require("jsonwebtoken");

/**
 * Generate JWT token based on user role
 * @param {Object} user - User document from database
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  // Set expiration based on role
  const expiresIn =
    user.role === "customer"
      ? process.env.JWT_CUSTOMER_EXPIRY
      : process.env.JWT_ADMIN_EXPIRY;

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
```

2. **RBAC Middleware:**

```javascript
// rbac.middleware.js
/**
 * Middleware to check if user has required role
 * @param {Array|String} roles - Required role(s) to access route
 * @returns {Function} Express middleware
 */
const checkRole = (roles) => {
  // Convert to array if string
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    // User should be attached by auth middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
  };
};
```

3. **Password Management:**

```javascript
// auth.service.js
const bcrypt = require("bcrypt");
const saltRounds = 10;

/**
 * Hash user password
 * @param {String} password - Plain text password
 * @returns {String} Hashed password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 * @param {String} password - Plain text password to check
 * @param {String} hash - Stored password hash
 * @returns {Boolean} True if password matches
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

4. **Email Verification Flow:**

```javascript
// auth.service.js
const crypto = require("crypto");
const emailService = require("../services/email.service");

/**
 * Generate verification token
 * @returns {String} Random verification token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Send verification email
 * @param {Object} user - User object with email and verification token
 * @returns {Promise} Email sending result
 */
const sendVerificationEmail = async (user) => {
  const verificationUrl = `${process.env.BASE_URL}/api/${process.env.API_VERSION}/auth/verify-email/${user.emailVerificationToken}`;

  const emailContent = {
    to: user.email,
    subject: "Please verify your email address",
    html: `<p>Hi ${user.profile.firstName || "there"},</p>
           <p>Please verify your email address by clicking the link below:</p>
           <p><a href="${verificationUrl}">Verify Email</a></p>
           <p>This link will expire in 24 hours.</p>`,
  };

  return await emailService.sendEmail(emailContent);
};
```

**API Endpoints to Implement:**

1. **User Registration:**

```javascript
// auth.controller.js
/**
 * Register a new user
 * @route POST /api/v1/auth/register
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @param {object} req.body.profile - User profile information
 * @returns {object} User object and token
 */
const register = async (req, res) => {
  try {
    const { email, password, profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create verification token
    const emailVerificationToken = generateVerificationToken();
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24); // 24 hour expiry

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      profile,
      emailVerificationToken,
      emailVerificationExpires: tokenExpires,
      emailVerified: false,
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(user);

    // Generate JWT token
    const token = generateToken(user);

    // Return user (excluding sensitive fields) and token
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.emailVerificationToken;

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: {
        user: userObject,
        token,
      },
    });
  } catch (error) {
    logger.error("Registration error", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
```

2. **User Login:**

```javascript
// auth.controller.js
/**
 * Login user
 * @route POST /api/v1/auth/login
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @returns {object} User object and token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return user (excluding sensitive fields) and token
    const userObject = user.toObject();
    delete userObject.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userObject,
        token,
      },
    });
  } catch (error) {
    logger.error("Login error", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
```

3. **Password Reset:**

```javascript
// auth.controller.js
/**
 * Request password reset
 * @route POST /api/v1/auth/forgot-password
 * @param {string} req.body.email - User email
 * @returns {object} Success message
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message:
          "If your email is registered, you will receive a password reset link",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    // Update user with reset token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await emailService.sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset.</p>
             <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
             <p>This link will expire in 1 hour.</p>
             <p>If you did not request this, please ignore this email.</p>`,
    });

    return res.status(200).json({
      success: true,
      message:
        "If your email is registered, you will receive a password reset link",
    });
  } catch (error) {
    logger.error("Forgot password error", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
```

**Example Routes Configuration:**

```javascript
// auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const validationMiddleware = require("../../middleware/validation.middleware");
const authValidators = require("../../utils/validators/auth.validator");

// Public routes
router.post(
  "/register",
  validationMiddleware(authValidators.register),
  authController.register
);
router.post(
  "/login",
  validationMiddleware(authValidators.login),
  authController.login
);
router.post(
  "/forgot-password",
  validationMiddleware(authValidators.forgotPassword),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validationMiddleware(authValidators.resetPassword),
  authController.resetPassword
);
router.get("/verify-email/:token", authController.verifyEmail);

// Protected routes
router.post("/refresh-token", authMiddleware, authController.refreshToken);
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
```

**Implementation Complexity:** Medium
**Dependencies:** User models, Email service
**Endpoints:** Registration, login, password reset, email verification, token refresh

### Product & Catalog Management

This module manages the complete product ecosystem including variants, categories, and metadata.

**Key Components to Implement:**

- Comprehensive product data model with support for:
  - Multiple variants (size, color, etc.) with individual inventory tracking
  - Rich content including multiple images and descriptions
  - Complete SEO metadata
  - Variant-specific pricing and SKUs
- Category system with unlimited nesting levels
- Product relationship management (related products, frequently bought together)
- Advanced search and filtering capabilities
- Product review and rating system
- Bulk operations for efficient management

**Implementation Details:**

1. **Product Model:**

```javascript
// product.model.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    regular: {
      type: Number,
      required: true,
      min: 0,
    },
    sale: {
      type: Number,
      min: 0,
    },
  },
  attributes: [
    {
      name: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
  ],
  inventory: {
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 1,
    },
  },
  images: [String],
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      short: {
        type: String,
        trim: true,
      },
      long: {
        type: String,
        trim: true,
      },
    },
    price: {
      regular: {
        type: Number,
        required: true,
        min: 0,
      },
      sale: {
        type: Number,
        min: 0,
      },
      cost: {
        type: Number,
        min: 0,
      },
      compareAt: {
        type: Number,
        min: 0,
      },
    },
    gstPercentage: {
      type: Number,
      default: 18,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        index: true,
      },
    ],
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    attributes: [
      {
        name: {
          type: String,
        },
        value: {
          type: String,
        },
        visible: {
          type: Boolean,
          default: true,
        },
      },
    ],
    variants: [variantSchema],
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    related: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    reviews: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    inventory: {
      quantity: {
        type: Number,
        default: 0,
        min: 0,
      },
      reserved: {
        type: Number,
        default: 0,
        min: 0,
      },
      lowStockThreshold: {
        type: Number,
        default: 5,
        min: 1,
      },
    },
    isBundle: {
      type: Boolean,
      default: false,
    },
    bundleProducts: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        discount: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "draft",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search
productSchema.index({
  name: "text",
  "description.short": "text",
  "description.long": "text",
  tags: "text",
});

// Pre-save middleware to generate slug from name
productSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
```

2. **Category Model:**

```javascript
// category.model.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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
      type: String,
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

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
```

3. **Product Service:**

```javascript
// product.service.js
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const inventoryService = require("./inventory.service");
const logger = require("../config/logger");

/**
 * Create a new product
 * @param {Object} productData - Data for the new product
 * @returns {Promise<Object>} Created product object
 */
const createProduct = async (productData) => {
  try {
    // If product has variants, ensure one is set as default
    if (productData.variants && productData.variants.length > 0) {
      const hasDefault = productData.variants.some(
        (variant) => variant.isDefault
      );
      if (!hasDefault) {
        productData.variants[0].isDefault = true;
      }
    }

    // If product has images, ensure one is set as default
    if (productData.images && productData.images.length > 0) {
      const hasDefault = productData.images.some((image) => image.isDefault);
      if (!hasDefault) {
        productData.images[0].isDefault = true;
      }
    }

    const product = new Product(productData);
    await product.save();

    // Initialize inventory if needed
    if (product.variants.length === 0 && product.inventory.quantity > 0) {
      await inventoryService.initializeInventory(
        product._id,
        product.inventory.quantity
      );
    }

    return product;
  } catch (error) {
    logger.error("Error creating product", error);
    throw error;
  }
};

/**
 * Update an existing product
 * @param {String} productId - Product ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated product object
 */
const updateProduct = async (productId, updateData) => {
  try {
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Handle inventory changes
    if (updateData.inventory && updateData.inventory.quantity !== undefined) {
      const currentQuantity = product.inventory.quantity;
      const newQuantity = updateData.inventory.quantity;

      if (newQuantity !== currentQuantity) {
        await inventoryService.adjustInventory(
          productId,
          newQuantity - currentQuantity,
          "manual-adjustment",
          "Product update"
        );
      }
    }

    // Handle variant inventory changes
    if (updateData.variants) {
      for (const variant of updateData.variants) {
        if (
          variant._id &&
          variant.inventory &&
          variant.inventory.quantity !== undefined
        ) {
          const existingVariant = product.variants.id(variant._id);
          if (existingVariant) {
            const currentQuantity = existingVariant.inventory.quantity;
            const newQuantity = variant.inventory.quantity;

            if (newQuantity !== currentQuantity) {
              await inventoryService.adjustVariantInventory(
                productId,
                variant._id,
                newQuantity - currentQuantity,
                "manual-adjustment",
                "Variant update"
              );
            }
          }
        }
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    return updatedProduct;
  } catch (error) {
    logger.error(`Error updating product ${productId}`, error);
    throw error;
  }
};

/**
 * Find products with advanced filtering
 * @param {Object} filters - Search and filter criteria
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Products and count
 */
const findProducts = async (filters = {}, options = {}) => {
  try {
    const query = {};

    // Handle text search
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Handle category filter (include all subcategories)
    if (filters.category) {
      // Find category and all its subcategories
      const category = await Category.findOne({ slug: filters.category });
      if (category) {
        // Get all subcategories recursively
        const subcategories = await Category.find({
          $or: [{ _id: category._id }, { "ancestors._id": category._id }],
        });

        const categoryIds = subcategories.map((cat) => cat._id);
        query.categories = { $in: categoryIds };
      }
    }

    // Handle price range filter
    if (filters.priceMin || filters.priceMax) {
      query.price = {};
      if (filters.priceMin) query.price.$gte = parseFloat(filters.priceMin);
      if (filters.priceMax) query.price.$lte = parseFloat(filters.priceMax);
    }

    // Handle status filter (only show active by default)
    query.status = filters.status || "active";

    // Handle tag filter
    if (filters.tags) {
      const tags = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      query.tags = { $in: tags };
    }

    // Handle attribute filters
    if (filters.attributes) {
      const attributeQueries = [];

      for (const [key, value] of Object.entries(filters.attributes)) {
        attributeQueries.push({
          attributes: {
            $elemMatch: {
              name: key,
              value: value,
            },
          },
        });
      }

      if (attributeQueries.length > 0) {
        query.$and = query.$and || [];
        query.$and.push(...attributeQueries);
      }
    }

    // Handle in-stock filter
    if (filters.inStock === "true") {
      query["inventory.quantity"] = { $gt: 0 };
    }

    // Handle featured filter
    if (filters.featured === "true") {
      query.isFeatured = true;
    }

    // Set up pagination options
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Set up sorting options
    let sort = {};
    if (options.sortBy) {
      const sortField = options.sortBy.startsWith("-")
        ? options.sortBy.substring(1)
        : options.sortBy;
      const sortOrder = options.sortBy.startsWith("-") ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      // Default sort by newest
      sort = { createdAt: -1 };
    }

    // Execute queries
    const products = await Product.find(query)
      .populate("categories", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error finding products", error);
    throw error;
  }
};

// Export all service functions
module.exports = {
  createProduct,
  updateProduct,
  findProducts,
  // Add other product service functions here
};
```

4. **Product Controller:**

```javascript
// product.controller.js
const productService = require("../../services/product.service");
const logger = require("../../config/logger");
const { responseFormatter } = require("../../utils/responseFormatter");

/**
 * Create a new product
 * @route POST /api/v1/products
 * @access Private (Admin)
 */
const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);

    return res
      .status(201)
      .json(
        responseFormatter(true, "Product created successfully", { product })
      );
  } catch (error) {
    logger.error("Error in createProduct controller", error);
    return res
      .status(500)
      .json(
        responseFormatter(
          false,
          "Failed to create product",
          null,
          process.env.NODE_ENV === "development" ? error.message : undefined
        )
      );
  }
};

/**
 * Get all products with filtering, sorting and pagination
 * @route GET /api/v1/products
 * @access Public
 */
const getProducts = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      category: req.query.category,
      priceMin: req.query.priceMin,
      priceMax: req.query.priceMax,
      status: req.query.status || "active",
      tags: req.query.tags,
      attributes: req.query.attributes, // Expects object like { color: 'red', size: 'large' }
      inStock: req.query.inStock,
      featured: req.query.featured,
    };

    const options = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
    };

    const result = await productService.findProducts(filters, options);

    return res
      .status(200)
      .json(responseFormatter(true, "Products retrieved successfully", result));
  } catch (error) {
    logger.error("Error in getProducts controller", error);
    return res
      .status(500)
      .json(
        responseFormatter(
          false,
          "Failed to retrieve products",
          null,
          process.env.NODE_ENV === "development" ? error.message : undefined
        )
      );
  }
};

/**
 * Get a single product by ID or slug
 * @route GET /api/v1/products/:idOrSlug
 * @access Public
 */
const getProductDetail = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Check if the parameter is a MongoDB ObjectId or a slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    let product;
    if (isObjectId) {
      product = await productService.getProductById(idOrSlug);
    } else {
      product = await productService.getProductBySlug(idOrSlug);
    }

    if (!product) {
      return res
        .status(404)
        .json(responseFormatter(false, "Product not found"));
    }

    return res
      .status(200)
      .json(
        responseFormatter(true, "Product retrieved successfully", { product })
      );
  } catch (error) {
    logger.error(
      `Error in getProductDetail controller for ${req.params.idOrSlug}`,
      error
    );
    return res
      .status(500)
      .json(
        responseFormatter(
          false,
          "Failed to retrieve product",
          null,
          process.env.NODE_ENV === "development" ? error.message : undefined
        )
      );
  }
};

/**
 * Update a product
 * @route PUT /api/v1/products/:id
 * @access Private (Admin)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await productService.updateProduct(id, req.body);

    if (!updatedProduct) {
      return res
        .status(404)
        .json(responseFormatter(false, "Product not found"));
    }

    return res.status(200).json(
      responseFormatter(true, "Product updated successfully", {
        product: updatedProduct,
      })
    );
  } catch (error) {
    logger.error(
      `Error in updateProduct controller for ${req.params.id}`,
      error
    );
    return res
      .status(500)
      .json(
        responseFormatter(
          false,
          "Failed to update product",
          null,
          process.env.NODE_ENV === "development" ? error.message : undefined
        )
      );
  }
};

/**
 * Delete a product
 * @route DELETE /api/v1/products/:id
 * @access Private (Admin)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await productService.deleteProduct(id);

    if (!deleted) {
      return res
        .status(404)
        .json(responseFormatter(false, "Product not found"));
    }

    return res
      .status(200)
      .json(responseFormatter(true, "Product deleted successfully"));
  } catch (error) {
    logger.error(
      `Error in deleteProduct controller for ${req.params.id}`,
      error
    );
    return res
      .status(500)
      .json(
        responseFormatter(
          false,
          "Failed to delete product",
          null,
          process.env.NODE_ENV === "development" ? error.message : undefined
        )
      );
  }
};

/**
 * Get related products for a specific product
 * @route GET /api/v1/products/:id/related
 * @access Public
 */
const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 4;

    const relatedProducts = await productService.getRelatedProducts(id, limit);

    return res.status(200).json(
      responseFormatter(true, "Related products retrieved successfully", {
        products: relatedProducts,
      })
    );
  } catch (error) {
    logger.error(
      `Error in getRelatedProducts controller for ${req.params.id}`,
      error
    );
    return res
      .status(500)
      .json(
        responseFormatter(
          false,
          "Failed to retrieve related products",
          null,
          process.env.NODE_ENV === "development" ? error.message : undefined
        )
      );
  }
};

// Export all controller functions
module.exports = {
  createProduct,
  getProducts,
  getProductDetail,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
};
```

5. **API Endpoint Implementation:**

```javascript
// product.routes.js
const express = require("express");
const router = express.Router();
const productController = require("./product.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const productValidator = require("../../utils/validators/product.validator");
const upload = require("../../middleware/upload.middleware");

// Public routes
router.get("/", productController.getProducts);
router.get("/:idOrSlug", productController.getProductDetail);
router.get("/:id/related", productController.getRelatedProducts);

// Protected routes (Admin only)
router.post(
  "/",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  upload.array("images", 10),
  validationMiddleware(productValidator.create),
  productController.createProduct
);

router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  upload.array("images", 10),
  validationMiddleware(productValidator.update),
  productController.updateProduct
);

router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware(["admin"]),
  productController.deleteProduct
);

// Export router
module.exports = router;
```

**API Endpoints to Implement:**

1. **GET /api/v1/products**

   - Query Parameters:
     - `search` (string): Search term for product name and description
     - `category` (string): Category slug to filter by
     - `priceMin` & `priceMax` (number): Price range
     - `tags` (array): Filter by tags
     - `attributes` (object): Filter by product attributes
     - `inStock` (boolean): Show only in-stock products
     - `featured` (boolean): Show only featured products
     - `page` & `limit` (number): Pagination
     - `sortBy` (string): Field to sort by (prefix with `-` for descending)
   - Response: Paginated list of products with category info

2. **GET /api/v1/products/:idOrSlug**

   - Response: Detailed product information with variants

3. **POST /api/v1/products** (Admin only)

   - Request Body: Complete product data
   - Response: Created product

4. **PUT /api/v1/products/:id** (Admin only)

   - Request Body: Fields to update
   - Response: Updated product

5. **DELETE /api/v1/products/:id** (Admin only)

   - Response: Success confirmation

6. **GET /api/v1/products/:id/related**

   - Query Parameters:
     - `limit` (number): Number of related products to return
   - Response: List of related products

7. **Category Endpoints:**
   - **GET /api/v1/categories**: List all categories
   - **GET /api/v1/categories/:slug**: Get category details with subcategories
   - **POST /api/v1/categories** (Admin only): Create new category
   - **PUT /api/v1/categories/:id** (Admin only): Update category
   - **DELETE /api/v1/categories/:id** (Admin only): Delete category

**Implementation Complexity:** High
**Dependencies:** Category models, Inventory system, Review system
**Endpoints:** Product CRUD, category management, product search, variant management

### Inventory Management

This module handles all aspects of stock tracking and management.

**Key Components:**

- Real-time inventory tracking at the variant level
- Low stock alerts with configurable thresholds
- Complete inventory history for auditing
- Temporary inventory reservation during checkout
- Automated inventory adjustments based on order events
- Admin tools for manual inventory correction with reason tracking

**Implementation Complexity:** Medium
**Dependencies:** Product models, Order events
**Endpoints:** Inventory status, adjustment, low stock reporting

### Order Processing

This module manages the entire order lifecycle from creation to fulfillment.

**Key Components:**

- Comprehensive order workflow with configurable statuses
- Detailed line items with variant and pricing information
- Integration with payment gateway for transaction processing
- Advanced address management and validation
- Automatic tax calculation based on product GST settings
- Dynamic discount application based on active promotions
- Professional invoice generation with customizable templates
- Complete order history and status change logging

**Implementation Complexity:** High
**Dependencies:** Cart system, Payment gateway, Inventory system, User profiles
**Endpoints:** Order creation, status updates, history, cancellation

### User Management

This module handles customer and administrative user accounts.

**Key Components:**

- User profiles with customizable fields
- Multiple address management with address validation
- Wishlist system with product tracking
- Complete order history with status tracking
- Recently viewed products tracking
- Loyalty points system with tiered rewards
- Administrative user management with role assignment

**Implementation Complexity:** Medium
**Dependencies:** Authentication system
**Endpoints:** Profile management, address book, wishlist, order history

### CMS & Content

This module provides content management capabilities for static and dynamic content.

**Key Components:**

- Page management for static content with WYSIWYG editing
- Blog system with categorization and tagging
- Media library for image and file management
- Landing page builder for marketing campaigns
- SEO optimization tools for all content types
- Content scheduling with future publishing
- Modular content blocks for flexible layouts

**Implementation Complexity:** Medium
**Dependencies:** Media storage, User authentication for authors
**Endpoints:** Content CRUD, media management, content search

### Marketing & Promotions

This module handles all discount and promotional activities.

**Key Components:**

- Flexible discount engine supporting:
  - Percentage discounts
  - Fixed amount discounts
  - Buy X Get Y promotions
  - Tiered discounts based on quantity or spend
- Coupon system with unique code generation and validation
- Bulk discount application by product, category, or tag
- Abandoned cart recovery with automated emails
- Customer loyalty program with points and rewards
- Time-limited flash sales with countdown functionality

**Implementation Complexity:** High
**Dependencies:** Product system, User system, Email service
**Endpoints:** Promotion CRUD, coupon validation, discount calculation

### Shipping & Logistics

This module manages shipping methods, carriers, and fulfillment processes.

**Key Components:**

- Integration with Delhivery and ShipRocket shipping providers
- Flexible shipping method configuration with rate calculation
- Order tracking with carrier status updates
- Shipping label generation and printing
- Fulfillment workflow management from picking to shipping
- Shipping rules based on product characteristics
- International shipping support with customs documentation

**Implementation Complexity:** High
**Dependencies:** Order system, External shipping APIs
**Endpoints:** Shipping method configuration, tracking, label generation

### Analytics & Reporting

This module provides business intelligence through data analysis and reporting.

**Key Components:**

- Real-time dashboard with key performance indicators
- Comprehensive sales analytics with trend identification
- Customer behavior analysis and segmentation
- Inventory performance metrics and optimization suggestions
- Product performance reporting with bestseller identification
- Geographic sales analysis with visualization
- Custom report builder with export functionality
- Scheduled report generation and distribution

**Implementation Complexity:** High
**Dependencies:** All other modules for data collection
**Endpoints:** Dashboard metrics, report generation, data export

### Payment Processing

This module handles secure payment processing through Razorpay integration.

**Key Components:**

- Complete Razorpay payment gateway integration
- Support for multiple payment methods (credit/debit cards, UPI, wallets)
- Secure payment verification with signature checking
- Comprehensive transaction record keeping
- Automated and manual refund processing
- Payment status tracking and notifications
- Webhook handling for payment events

**Implementation Complexity:** Medium
**Dependencies:** Order system, Razorpay API
**Endpoints:** Payment processing, verification, refunds, webhooks

### Real-time Updates

This module provides immediate updates to clients using Server-Sent Events.

**Key Components:**

- Server-Sent Events (SSE) implementation for push updates
- Event-based architecture with subscribers and publishers
- Client connection management with authentication
- Role-based event filtering and distribution
- Real-time notifications for:
  - Cart updates
  - Order status changes
  - Inventory alerts
  - Administrative notifications

**Implementation Complexity:** Medium
**Dependencies:** Event system, User authentication
**Endpoints:** SSE subscription, event publication

## Database Schema Design

This section details the optimized MongoDB schema designs with special attention to performance, query patterns, and relationships between collections.

### User Schema

```javascript
{
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true }, // Bcrypt hashed
  role: { type: String, enum: ['customer', 'admin', 'manager', 'staff'], default: 'customer', index: true },
  permissions: [{ type: String }],
  profile: {
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    avatar: { type: String } // URL to uploaded image
  },
  addresses: [{
    type: { type: String, enum: ['billing', 'shipping'], default: 'shipping' },
    isDefault: { type: Boolean, default: false },
    name: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    phone: { type: String }
  }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  recentlyViewed: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    viewedAt: { type: Date, default: Date.now }
  }],
  loyalty: {
    points: { type: Number, default: 0 },
    tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' }
  },
  preferences: {
    marketing: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes:**

- Email (unique) - Used for login and identification
- Role - Used for filtering by user type
- Compound index on firstName + lastName - Used for user search

### Product Schema

```javascript
{
  name: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  sku: { type: String, required: true, unique: true, index: true },
  description: {
    short: { type: String },
    long: { type: String }
  },
  price: {
    regular: { type: Number, required: true },
    sale: { type: Number },
    cost: { type: Number }, // Internal cost price
    compareAt: { type: Number } // "Compare at" price for showing savings
  },
  gstPercentage: { type: Number, default: 18 }, // GST tax rate
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],
  tags: [{ type: String, index: true }],
  attributes: [{
    name: { type: String }, // e.g., "Color", "Size"
    value: { type: String }, // e.g., "Red", "XL"
    visible: { type: Boolean, default: true } // Whether to show in filters
  }],
  variants: [{
    name: { type: String },
    sku: { type: String, unique: true },
    price: {
      regular: { type: Number },
      sale: { type: Number }
    },
    attributes: [{
      name: { type: String },
      value: { type: String }
    }],
    inventory: {
      quantity: { type: Number, default: 0 },
      reserved: { type: Number, default: 0 }, // Items in active carts
      lowStockThreshold: { type: Number, default: 5 }
    },
    images: [{ type: String }], // URLs to variant-specific images
    isDefault: { type: Boolean, default: false }
  }],
  images: [{
    url: { type: String },
    alt: { type: String },
    isDefault: { type: Boolean, default: false }
  }],
  seo: {
    title: { type: String },
    description: { type: String },
    keywords: [{ type: String }]
  },
  related: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  reviews: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  inventory: {
    quantity: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 }
  },
  isBundle: { type: Boolean, default: false },
  bundleProducts: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    discount: { type: Number, default: 0 } // Percentage discount on this item in bundle
  }],
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'draft', index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes:**

- SKU (unique) - Fast product lookup
- Slug (unique) - Used in URLs
- Name (text index) - Text search for products
- Categories - Filtering by category
- Tags - Filtering by tag
- Status + isFeatured - Common query pattern

### Order Schema

```javascript
{
  orderNumber: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variant: {
      sku: { type: String },
      name: { type: String },
      attributes: [{
        name: { type: String },
        value: { type: String }
      }]
    },
    name: { type: String }, // Product name at time of order
    sku: { type: String },  // SKU at time of order
    price: { type: Number },
    quantity: { type: Number },
    gstPercentage: { type: Number },
    gstAmount: { type: Number },
    subtotal: { type: Number }, // price * quantity
    total: { type: Number }     // subtotal + gstAmount
  }],
  billing: {
    address: {
      name: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      phone: { type: String }
    },
    email: { type: String }
  },
  shipping: {
    address: {
      name: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      phone: { type: String }
    },
    method: { type: String },
    cost: { type: Number },
    trackingNumber: { type: String },
    carrier: { type: String },
    estimatedDelivery: { type: Date }
  },
  pricing: {
    subtotal: { type: Number }, // Sum of all item subtotals
    shipping: { type: Number },
    tax: { type: Number },      // Sum of all GST amounts
    discount: { type: Number },
    total: { type: Number }     // Final amount
  },
  payment: {
    method: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String },
    paidAt: { type: Date }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Who made the change
  }],
  notes: [{
    text: { type: String },
    isPublic: { type: Boolean, default: false }, // Whether customer can see
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  invoiceUrl: { type: String }, // URL to generated invoice
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes:**

- OrderNumber (unique) - Primary lookup
- User - For user order history
- Status - For filtering by order status
- CreatedAt - For date-based queries and reporting

## API Endpoints

### Customer API

Endpoints for regular users (customers) with authentication requirements.

```
/api/v1
├── /auth                           # Authentication endpoints
├── /users                          # User profile management
├── /products                       # Product catalog access
├── /cart                           # Shopping cart operations
├── /checkout                       # Checkout process
├── /orders                         # Order management
├── /content                        # CMS content access
└── /events                         # Server-Sent Events
```

### Admin API

Secured endpoints for administrative functions.

```
/api/v1/admin
├── /auth                           # Admin authentication
├── /dashboard                      # Admin dashboard metrics
├── /users                          # User management
├── /products                       # Product management
├── /categories                     # Category management
├── /orders                         # Order management
├── /inventory                      # Inventory management
├── /content                        # Content management
├── /promotions                     # Promotion management
├── /reviews                        # Review moderation
├── /analytics                      # Analytics and reports
├── /settings                       # System configuration
└── /events                         # Admin SSE endpoint
```

### Webhooks

Endpoints for external service integrations.

```
/api/v1/webhooks
├── /razorpay                       # Payment gateway callbacks
├── /shipping                       # Shipping provider updates
└── /email                          # Email service webhooks
```

## Implementation Plan

This implementation plan is organized into logical phases with difficulty ratings and dependencies to help prioritize development.

### Phase 1: Foundation (2 weeks)

**Focus**: Core infrastructure and basic authentication

**Tasks**:

- Project structure setup
- Database connection configuration
- Environment variable management
- Basic middleware implementation
- User model creation
- JWT authentication setup
- Basic error handling

**Deliverables**:

- Working server with database connection
- User registration and login functionality
- JWT authentication middleware
- Basic API structure

**Complexity**: Medium
**Dependencies**: None

### Phase 2: Product Ecosystem (3 weeks)

**Focus**: Product and catalog management

**Tasks**:

- Product model implementation with variants
- Category system with hierarchy
- Product search and filtering
- Image upload handling
- Product relationships
- Basic inventory tracking

**Deliverables**:

- Complete product CRUD operations
- Category management
- Product search with filtering
- Image upload and management
- Variant handling

**Complexity**: High
**Dependencies**: Phase 1

### Phase 3: Shopping Experience (3 weeks)

**Focus**: Cart, checkout, and orders

**Tasks**:

- Shopping cart implementation
- Checkout process flow
- Order creation and management
- Payment integration with Razorpay
- Email notifications for orders
- Basic inventory adjustments

**Deliverables**:

- Cart functionality with persistent storage
- Complete checkout process
- Order management with status tracking
- Payment processing with Razorpay
- Order confirmation emails

**Complexity**: High
**Dependencies**: Phases 1-2

### Phase 4: Marketing & Engagement (2 weeks)

**Focus**: Customer engagement features

**Tasks**:

- Promotion and discount system
- Coupon management
- Wishlist functionality
- Product reviews and ratings
- Customer account management
- Recently viewed products

**Deliverables**:

- Discount engine with various rule types
- Coupon system with code validation
- Wishlist management
- Review submission and display
- Enhanced user profiles

**Complexity**: Medium
**Dependencies**: Phases 1-3

### Phase 5: Content & Administration (2 weeks)

**Focus**: CMS and admin functionality

**Tasks**:

- Content management system
- Blog functionality
- Media library
- Admin dashboard
- Role-based access control
- Settings management

**Deliverables**:

- Page and blog content management
- Media upload and organization
- Admin dashboard with key metrics
- User role management
- System configuration options

**Complexity**: Medium
**Dependencies**: Phases 1-2

### Phase 6: Advanced Features (3 weeks)

**Focus**: Enhanced functionality and integrations

**Tasks**:

- Advanced inventory management
- Shipping provider integration
- Server-Sent Events implementation
- Analytics and reporting
- Bulk operations for products and orders
- Scheduled jobs implementation

**Deliverables**:

- Complete inventory management system
- Shipping integration with tracking
- Real-time updates with SSE
- Comprehensive analytics dashboard
- Automated jobs for cart recovery, inventory checks

**Complexity**: High
**Dependencies**: Phases 1-5

### Phase 7: Optimization & Finalization (2 weeks)

**Focus**: Testing, optimization, and documentation

**Tasks**:

- Comprehensive testing
- Performance optimization
- Security hardening
- API documentation
- Deployment preparation

**Deliverables**:

- Test suite with high coverage
- Optimized database queries
- Security audit compliance
- Complete API documentation
- Deployment-ready application

**Complexity**: Medium
**Dependencies**: Phases 1-6

## Security Considerations

Security is a critical aspect of any e-commerce system. This section outlines comprehensive security measures implemented throughout the application.

### Authentication & Authorization Security

- **JWT Implementation**:
  - Different expiration times based on role (30 days for customers, 3 days for admins)
  - Secure token storage recommendations (HttpOnly cookies)
  - Token refresh mechanism with sliding expiration
  - Revocation capability for logout and security events
- **Password Security**:

  - bcrypt hashing with appropriate salt rounds (10+)
  - Password strength requirements (minimum 8 characters, mixed case, numbers, symbols)
  - Account lockout after failed attempts
  - Secure password reset flow with time-limited tokens

- **Access Control**:
  - Role-based access control for all endpoints
  - Permission-based actions within roles
  - IP-based restrictions for admin access
  - Two-factor authentication option for admins

### Data Protection

- **Input Validation**:

  - Comprehensive Joi validation schemas for all inputs
  - Sanitization of user-submitted data
  - Content-Security-Policy implementation
  - Protection against common injection attacks

- **Database Security**:

  - Mongoose schema validation for all documents
  - Principle of least privilege for database access
  - Data encryption for sensitive fields
  - Regular security audits of database access

- **API Security**:
  - Helmet.js for secure HTTP headers
  - Rate limiting to prevent brute force and DDoS attacks
  - CORS configuration with appropriate restrictions
  - API versioning for secure updates

### Payment Security

- **PCI Compliance Considerations**:

  - No storage of card details
  - Use of Razorpay's secure checkout
  - Tokenization for recurring payments
  - Secure webhook validation

- **Transaction Security**:
  - Signature verification for all payment callbacks
  - Idempotent operations to prevent duplicate charges
  - Comprehensive transaction logging
  - Automated anomaly detection

### General Security Best Practices

- **Environment Security**:

  - Separation of development and production environments
  - Secure handling of environment variables
  - No hardcoded secrets or credentials
  - Regular dependency audits and updates

- **Monitoring & Logging**:

  - Comprehensive security event logging
  - Failed authentication attempt tracking
  - Suspicious activity monitoring
  - Regular security log review

- **Error Handling**:
  - Sanitized error responses
  - No leakage of sensitive information in errors
  - Graceful failure modes
  - Detailed internal logging with limited external exposure

## Performance Optimization

This section outlines strategies for ensuring the system maintains high performance under load.

### Database Optimization

- **Indexing Strategy**:

  - Strategic indexes on frequently queried fields
  - Compound indexes for common query patterns
  - Text indexes for search functionality
  - Regular index utilization review

- **Query Optimization**:

  - Lean queries to return only necessary fields
  - Population limiting to reduce JOIN operations
  - Pagination for all list endpoints
  - Query execution time monitoring

- **Data Structure Optimization**:
  - Normalized schema design with strategic denormalization
  - Appropriate data types for storage efficiency
  - Array size limits to prevent document growth
  - TTL indexes for temporary data

### API Performance

- **Response Optimization**:

  - Compression for all responses
  - Conditional requests with ETag support
  - Response caching for static data
  - Content-based caching for dynamic but infrequently updated data

- **Request Handling**:
  - Asynchronous processing for long-running operations
  - Batch operations for bulk updates
  - Stream processing for large data sets
  - Request timeout handling

### Scalability Considerations

- **Horizontal Scaling**:

  - Stateless API design
  - Distributed cache options (Redis)
  - Load balancing preparation
  - Microservices architecture preparation

- **Resource Management**:
  - Connection pooling for database
  - Rate limiting for resource-intensive operations
  - Graceful degradation under high load
  - Resource utilization monitoring

### General Performance

- **Code Optimization**:

  - Efficient algorithms and data structures
  - Asynchronous operations where appropriate
  - Memory usage optimization
  - CPU-intensive task management

- **Monitoring & Profiling**:
  - Performance metric collection
  - Endpoint response time tracking
  - Resource utilization monitoring
  - Regular performance testing

## Extensibility & Reusability

This section outlines how the system is designed for easy adaptation across different e-commerce applications.

### Modular Architecture

- **Service-Based Design**:

  - Clear separation between data access, business logic, and API layers
  - Standalone services with defined interfaces
  - Event-driven communication between modules
  - Pluggable components that can be replaced or extended

- **Interface Standardization**:
  - Consistent API patterns across all endpoints
  - Standardized response formats
  - Uniform error handling
  - Versioned API design

### Configuration Management

- **Dynamic Configuration**:

  - Environment-based configuration
  - Database-stored settings for runtime changes
  - Feature flags for enabling/disabling functionality
  - Client-specific configuration options

- **Branding & Customization**:
  - White-label capability with brand configuration
  - Theme support for frontend integration
  - Customizable email templates
  - Localization support

### Extension Points

- **Plugin Architecture**:

  - Hooks for extending core functionality
  - Middleware insertion points
  - Event subscription for custom handlers
  - Custom field support across major entities

- **Integration Capabilities**:
  - Webhook support for external system notifications
  - API client for third-party integration
  - Import/export functionality
  - Authentication provider flexibility

## Module Dependencies

This new section clarifies the relationships and dependencies between different modules to assist in implementation planning.

### Core Dependencies

- **Authentication Module**: Required by all authenticated endpoints
- **User Module**: Required by Authentication, Orders, Wishlist
- **Product Module**: Required by Cart, Orders, Inventory, Wishlist
- **Database Module**: Required by all data-accessing modules

### Feature Dependencies

- **Cart Module**:
  - Depends on: Product, User, Pricing
  - Required by: Checkout, Order
- **Order Module**:
  - Depends on: User, Product, Cart, Payment, Shipping
  - Required by: Analytics, Inventory
- **Inventory Module**:
  - Depends on: Product
  - Required by: Order, Cart
- **Payment Module**:
  - Depends on: Order
  - Required by: Checkout
- **Analytics Module**:
  - Depends on: Orders, Products, Users, Inventory
  - No modules depend on it
- **Shipping Module**:
  - Depends on: Order, Product
  - Required by: Checkout
- **CMS Module**:
  - Minimal dependencies (User for author information)
  - No core modules depend on it

### Service Relationships

- **Email Service**: Used by Authentication, Orders, Marketing
- **Event Service**: Central to module communication, used by most modules
- **Cache Service**: Used by Products, CMS, and other high-read modules
- **Upload Service**: Used by Products, Users, and CMS modules

## Deployment Guidelines

This new section provides guidance on deploying the e-commerce backend system.

### Environment Setup

- **Development**: Local Node.js environment with MongoDB
- **Staging**: Docker containers with CI/CD pipeline
- **Production**: Kubernetes or managed Node.js hosting with MongoDB Atlas

### Deployment Checklist

1. Environment variables configuration
2. Database migration and seeding
3. Static asset storage configuration
4. SSL certificate installation
5. Domain configuration
6. Monitoring setup
7. Backup procedures
8. Rollback strategy

### Scaling Considerations

- Database connection pooling configuration
- Load balancer setup for multiple instances
- Memory and CPU allocation guidelines
- Horizontal vs. vertical scaling recommendations

### Monitoring Setup

- Application performance monitoring
- Error tracking and alerting
- Database query performance
- API endpoint response times
- Security event logging

## Implementation Workflow Across Chat Sessions

### Session Continuity Guidelines

1. **Starting Point Assessment**

   - At the beginning of each chat session, review which features/modules have been completed
   - If no GitHub repository is provided, start from the beginning with initial project setup
   - If a GitHub repository is provided, clone/examine it to determine progress

2. **Module-by-Module Implementation**

   - Follow the modular breakdown outlined in the documentation
   - Each chat session should focus on completing one or more logical modules
   - Begin each session by reviewing the current state of the codebase

3. **Implementation Order**

   - Start with Core Infrastructure if no prior work exists
   - Proceed to Authentication & User Management
   - Continue with Product & Catalog System
   - Follow with remaining modules based on dependencies and priorities

4. **Completion Criteria**

   - A module is considered complete when all its routes, controllers, models, and services are implemented
   - Each completed module should include appropriate error handling and validation
   - Tests should be written for critical functionality

5. **Session Handoff**
   - At the end of each session, summarize what was implemented
   - Identify the next modules/features to be addressed in subsequent sessions

### Implementation Instructions for AI Developer

1. **Code Standards**

   - Use modern JavaScript (ES6+) with async/await patterns
   - Follow the REST API design patterns consistently
   - Include comprehensive JSDoc comments for all significant functions
   - Implement proper error handling with try/catch blocks
   - Use consistent naming conventions (camelCase for variables/functions, PascalCase for classes/models)

2. **File and Directory Structure**

   - Create the exact directory structure as outlined in the documentation
   - Use appropriate file naming conventions (module.type.js pattern)
   - Group related files in their functional directories

3. **Testing Considerations**

   - Write unit tests for critical service functions
   - Create integration tests for API endpoints
   - Use test fixtures for consistent test data

4. **Documentation Requirements**

   - Include a comprehensive README.md with setup instructions
   - Document all environment variables in .env.example
   - Add inline comments for complex logic
   - Use JSDoc for function documentation

5. **Initial Setup Steps**

   - Initialize Node.js project with npm init
   - Install and configure Express.js framework
   - Set up MongoDB connection with Mongoose
   - Configure environment variables with dotenv
   - Implement basic error handling middleware
   - Create logging configuration with Winston

6. **Suggested Implementation Flow**

   - Core configuration and server setup
   - Database connection and basic middleware
   - User model and authentication system
   - Product and category models
   - Basic API endpoints for core functionality
   - Additional features in order of priority

7. **Code Review Checklist for Each Module**
   - All required functionality is implemented
   - Error handling is comprehensive
   - Input validation is in place
   - Security measures are implemented
   - Code is well-commented and documented
   - Tests are written for critical functions
