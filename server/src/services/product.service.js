// src/services/product.service.js
const fs = require("fs");
const path = require("path");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const { NotFoundError, BadRequestError } = require("../utils/errorTypes");
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
      throw new NotFoundError("Product not found");
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
 * Get product by ID
 * @param {String} productId - Product ID
 * @returns {Promise<Object>} Product object
 */
const getProductById = async (productId) => {
  try {
    const product = await Product.findById(productId)
      .populate("categories", "name slug")
      .populate("related", "name slug images price status");

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return product;
  } catch (error) {
    logger.error(`Error getting product by ID ${productId}`, error);
    throw error;
  }
};

/**
 * Get product by slug
 * @param {String} slug - Product slug
 * @returns {Promise<Object>} Product object
 */
const getProductBySlug = async (slug) => {
  try {
    const product = await Product.findOne({ slug })
      .populate("categories", "name slug")
      .populate("related", "name slug images price status");

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return product;
  } catch (error) {
    logger.error(`Error getting product by slug ${slug}`, error);
    throw error;
  }
};

/**
 * Delete product
 * @param {String} productId - Product ID
 * @returns {Promise<Boolean>} Success status
 */
const deleteProduct = async (productId) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Delete the product
    await Product.findByIdAndDelete(productId);

    return true;
  } catch (error) {
    logger.error(`Error deleting product ${productId}`, error);
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
      query["price.regular"] = {};
      if (filters.priceMin)
        query["price.regular"].$gte = parseFloat(filters.priceMin);
      if (filters.priceMax)
        query["price.regular"].$lte = parseFloat(filters.priceMax);
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

/**
 * Get related products
 * @param {String} productId - Product ID
 * @param {Number} limit - Maximum number of related products to return
 * @returns {Promise<Array>} Array of related products
 */
const getRelatedProducts = async (productId, limit = 4) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // If product has explicitly defined related products, use those
    if (product.related && product.related.length > 0) {
      const relatedProducts = await Product.find({
        _id: { $in: product.related },
        status: "active",
      })
        .select("name slug price images")
        .limit(limit);

      return relatedProducts;
    }

    // Otherwise, find products in the same categories
    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      categories: { $in: product.categories },
      status: "active",
    })
      .select("name slug price images")
      .limit(limit);

    return relatedProducts;
  } catch (error) {
    logger.error(`Error getting related products for ${productId}`, error);
    throw error;
  }
};

/**
 * Upload and process product images
 * @param {String} productId - Product ID to update
 * @param {Array} files - Processed image files
 * @returns {Promise<Array>} Array of saved image objects
 */
const uploadProductImages = async (productId, files) => {
  try {
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Process image data
    const imageObjects = files.map((file) => ({
      url: `/${file.optimizedPath}`,
      alt: file.originalName || "",
      isDefault: product.images.length === 0, // First image is default
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

/**
 * Delete product image
 * @param {String} productId - Product ID
 * @param {String} imageIndex - Image index to delete
 * @returns {Promise<Object>} Updated product
 */
const deleteProductImage = async (productId, imageIndex) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Check if image exists
    if (!product.images[imageIndex]) {
      throw new NotFoundError("Image not found");
    }

    // Get image URL to delete the file
    const imageUrl = product.images[imageIndex].url;

    // Check if image is the default one
    const isDefault = product.images[imageIndex].isDefault;

    // Remove image from array
    product.images.splice(imageIndex, 1);

    // If deleted image was default and there are other images, set a new default
    if (isDefault && product.images.length > 0) {
      product.images[0].isDefault = true;
    }

    await product.save();

    // Try to delete the physical file (do not fail if this fails)
    try {
      if (imageUrl) {
        // Convert URL to file path
        const imagePath = path.join(process.cwd(), imageUrl);

        // Check if file exists
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);

          // Also try to delete thumbnail
          const thumbPath = imagePath.replace(".webp", "-thumb.webp");
          if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
          }
        }
      }
    } catch (fileError) {
      // Just log the error, don't fail the request
      logger.warn(`Could not delete image file for ${productId}:`, fileError);
    }

    return product;
  } catch (error) {
    logger.error(`Error deleting product image for ${productId}`, error);
    throw error;
  }
};

module.exports = {
  createProduct,
  updateProduct,
  getProductById,
  getProductBySlug,
  deleteProduct,
  findProducts,
  getRelatedProducts,
  uploadProductImages,
  deleteProductImage,
};
