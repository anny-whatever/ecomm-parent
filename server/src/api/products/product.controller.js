// src/api/products/product.controller.js
const productService = require("../../services/product.service");
const userService = require("../../services/user.service");
const logger = require("../../config/logger");
const { responseFormatter } = require("../../utils/responseFormatter");

/**
 * Create a new product
 * @route POST /api/v1/products
 * @access Private (Admin)
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);

    return res
      .status(201)
      .json(
        responseFormatter(true, "Product created successfully", { product })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all products with filtering, sorting and pagination
 * @route GET /api/v1/products
 * @access Public
 */
const getProducts = async (req, res, next) => {
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
    next(error);
  }
};

/**
 * Get a single product by ID or slug
 * @route GET /api/v1/products/:idOrSlug
 * @access Public
 */
const getProductDetail = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let product;

    // Check if the parameter is a MongoDB ObjectId or a slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    if (isObjectId) {
      product = await productService.getProductById(idOrSlug);
    } else {
      product = await productService.getProductBySlug(idOrSlug);
    }

    // Track recently viewed if user is authenticated
    if (req.user) {
      await userService.trackRecentlyViewed(req.user._id, product._id);
    }

    return res
      .status(200)
      .json(
        responseFormatter(true, "Product retrieved successfully", { product })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Update a product
 * @route PUT /api/v1/products/:id
 * @access Private (Admin)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedProduct = await productService.updateProduct(id, req.body);

    return res.status(200).json(
      responseFormatter(true, "Product updated successfully", {
        product: updatedProduct,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a product
 * @route DELETE /api/v1/products/:id
 * @access Private (Admin)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);

    return res
      .status(200)
      .json(responseFormatter(true, "Product deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get related products for a specific product
 * @route GET /api/v1/products/:id/related
 * @access Public
 */
const getRelatedProducts = async (req, res, next) => {
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
    next(error);
  }
};

/**
 * Upload product images
 * @route POST /api/v1/products/:productId/images
 * @access Private (Admin)
 */
const uploadProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Ensure files were processed by imageProcessor middleware
    if (!req.processedFiles || req.processedFiles.length === 0) {
      return res
        .status(400)
        .json(
          responseFormatter(
            false,
            "No images were uploaded or processing failed"
          )
        );
    }

    // Upload and process images
    const imageObjects = await productService.uploadProductImages(
      productId,
      req.processedFiles
    );

    return res.status(200).json(
      responseFormatter(true, "Images uploaded and processed successfully", {
        images: imageObjects,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product image
 * @route DELETE /api/v1/products/:productId/images/:imageIndex
 * @access Private (Admin)
 */
const deleteProductImage = async (req, res, next) => {
  try {
    const { productId, imageIndex } = req.params;

    // Convert imageIndex to number
    const index = parseInt(imageIndex, 10);
    if (isNaN(index)) {
      return res
        .status(400)
        .json(responseFormatter(false, "Invalid image index"));
    }

    // Delete image
    const updatedProduct = await productService.deleteProductImage(
      productId,
      index
    );

    return res.status(200).json(
      responseFormatter(true, "Image deleted successfully", {
        product: updatedProduct,
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductDetail,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  uploadProductImages,
  deleteProductImage,
};
