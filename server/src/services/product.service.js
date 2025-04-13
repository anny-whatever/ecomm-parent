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

/**
 * Get product price in specified currency
 * @param {String} productId - Product ID
 * @param {String} currencyCode - Currency code
 * @param {Boolean} includeVariants - Whether to include variant prices
 * @returns {Promise<Object>} Product with prices in specified currency
 */
const getProductPriceInCurrency = async (
  productId,
  currencyCode,
  includeVariants = true
) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // If requested currency is the product's base currency, return as is
    if (product.price.currency === currencyCode) {
      return product;
    }

    // Get the currency conversion service
    const currencyService = require("./currency.service");

    // Check if product has manual pricing for this currency
    const manualPricing = product.price.multiCurrency?.find(
      (p) => p.code === currencyCode
    );

    if (manualPricing) {
      // Return product with manual pricing
      const result = product.toObject();

      // Update with manual pricing
      result.price.convertedRegular = manualPricing.regular;
      result.price.convertedSale = manualPricing.sale;
      result.price.convertedOnSale = manualPricing.onSale;
      result.price.convertedCurrency = currencyCode;
      result.price.isManualConversion = true;

      // Update variants if required
      if (includeVariants && result.variants && result.variants.length > 0) {
        for (let i = 0; i < result.variants.length; i++) {
          const variant = result.variants[i];
          const variantManualPricing = variant.price.multiCurrency?.find(
            (p) => p.code === currencyCode
          );

          if (variantManualPricing) {
            variant.price.convertedRegular = variantManualPricing.regular;
            variant.price.convertedSale = variantManualPricing.sale;
            variant.price.convertedOnSale = variantManualPricing.onSale;
            variant.price.convertedCurrency = currencyCode;
            variant.price.isManualConversion = true;
          } else {
            // Convert automatically
            variant.price.convertedRegular =
              await currencyService.convertAmount(
                variant.price.regular,
                product.price.currency,
                currencyCode
              );

            if (variant.price.sale) {
              variant.price.convertedSale = await currencyService.convertAmount(
                variant.price.sale,
                product.price.currency,
                currencyCode
              );
            }

            variant.price.convertedOnSale = variant.price.onSale;
            variant.price.convertedCurrency = currencyCode;
            variant.price.isManualConversion = false;
          }
        }
      }

      return result;
    }

    // No manual pricing, do automatic conversion
    const result = product.toObject();

    result.price.convertedRegular = await currencyService.convertAmount(
      product.price.regular,
      product.price.currency,
      currencyCode
    );

    if (product.price.sale) {
      result.price.convertedSale = await currencyService.convertAmount(
        product.price.sale,
        product.price.currency,
        currencyCode
      );
    }

    result.price.convertedOnSale = product.price.onSale;
    result.price.convertedCurrency = currencyCode;
    result.price.isManualConversion = false;

    // Update variants if required
    if (includeVariants && result.variants && result.variants.length > 0) {
      for (let i = 0; i < result.variants.length; i++) {
        const variant = result.variants[i];
        const variantManualPricing = variant.price.multiCurrency?.find(
          (p) => p.code === currencyCode
        );

        if (variantManualPricing) {
          variant.price.convertedRegular = variantManualPricing.regular;
          variant.price.convertedSale = variantManualPricing.sale;
          variant.price.convertedOnSale = variantManualPricing.onSale;
          variant.price.convertedCurrency = currencyCode;
          variant.price.isManualConversion = true;
        } else {
          // Convert automatically
          variant.price.convertedRegular = await currencyService.convertAmount(
            variant.price.regular,
            product.price.currency,
            currencyCode
          );

          if (variant.price.sale) {
            variant.price.convertedSale = await currencyService.convertAmount(
              variant.price.sale,
              product.price.currency,
              currencyCode
            );
          }

          variant.price.convertedOnSale = variant.price.onSale;
          variant.price.convertedCurrency = currencyCode;
          variant.price.isManualConversion = false;
        }
      }
    }

    return result;
  } catch (error) {
    logger.error(
      `Error getting product price in currency ${currencyCode}:`,
      error
    );
    throw error;
  }
};

/**
 * Update product's multi-currency pricing
 * @param {String} productId - Product ID
 * @param {String} currencyCode - Currency code
 * @param {Object} priceData - Price data in specified currency
 * @returns {Promise<Object>} Updated product
 */
const updateProductCurrencyPricing = async (
  productId,
  currencyCode,
  priceData
) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // If updating the base currency, update main price
    if (product.price.currency === currencyCode) {
      product.price.regular = priceData.regular;

      if (priceData.sale !== undefined) {
        product.price.sale = priceData.sale;
      }

      if (priceData.onSale !== undefined) {
        product.price.onSale = priceData.onSale;
      }

      await product.save();
      return product;
    }

    // Otherwise, update multi-currency pricing
    if (!product.price.multiCurrency) {
      product.price.multiCurrency = [];
    }

    // Find existing currency pricing
    const existingPriceIndex = product.price.multiCurrency.findIndex(
      (p) => p.code === currencyCode
    );

    if (existingPriceIndex >= 0) {
      // Update existing
      product.price.multiCurrency[existingPriceIndex].regular =
        priceData.regular;

      if (priceData.sale !== undefined) {
        product.price.multiCurrency[existingPriceIndex].sale = priceData.sale;
      }

      if (priceData.onSale !== undefined) {
        product.price.multiCurrency[existingPriceIndex].onSale =
          priceData.onSale;
      }

      product.price.multiCurrency[existingPriceIndex].isManual = true;
      product.price.multiCurrency[existingPriceIndex].updatedAt = new Date();
    } else {
      // Add new
      product.price.multiCurrency.push({
        code: currencyCode,
        regular: priceData.regular,
        sale: priceData.sale,
        onSale: priceData.onSale || false,
        isManual: true,
        updatedAt: new Date(),
      });
    }

    // Update variant pricing if provided
    if (priceData.variants && product.variants && product.variants.length > 0) {
      for (const variantPricing of priceData.variants) {
        const variant = product.variants.id(variantPricing.variantId);

        if (!variant) {
          continue;
        }

        // Initialize multi-currency array if needed
        if (!variant.price.multiCurrency) {
          variant.price.multiCurrency = [];
        }

        // Find existing variant currency pricing
        const existingVariantPriceIndex = variant.price.multiCurrency.findIndex(
          (p) => p.code === currencyCode
        );

        if (existingVariantPriceIndex >= 0) {
          // Update existing
          variant.price.multiCurrency[existingVariantPriceIndex].regular =
            variantPricing.regular;

          if (variantPricing.sale !== undefined) {
            variant.price.multiCurrency[existingVariantPriceIndex].sale =
              variantPricing.sale;
          }

          if (variantPricing.onSale !== undefined) {
            variant.price.multiCurrency[existingVariantPriceIndex].onSale =
              variantPricing.onSale;
          }

          variant.price.multiCurrency[
            existingVariantPriceIndex
          ].isManual = true;
          variant.price.multiCurrency[existingVariantPriceIndex].updatedAt =
            new Date();
        } else {
          // Add new
          variant.price.multiCurrency.push({
            code: currencyCode,
            regular: variantPricing.regular,
            sale: variantPricing.sale,
            onSale: variantPricing.onSale || false,
            isManual: true,
            updatedAt: new Date(),
          });
        }
      }
    }

    await product.save();
    return product;
  } catch (error) {
    logger.error(`Error updating product currency pricing:`, error);
    throw error;
  }
};

/**
 * Update product base currency
 * @param {String} productId - Product ID
 * @param {String} newCurrencyCode - New base currency code
 * @returns {Promise<Object>} Updated product
 */
const updateProductBaseCurrency = async (productId, newCurrencyCode) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // If currency is already the base, do nothing
    if (product.price.currency === newCurrencyCode) {
      return product;
    }

    // Get the currency conversion service
    const currencyService = require("./currency.service");

    // Check if product has pricing for new base currency
    const existingPricing = product.price.multiCurrency?.find(
      (p) => p.code === newCurrencyCode
    );

    if (existingPricing) {
      // Store old base currency pricing
      const oldCurrency = product.price.currency;
      const oldRegular = product.price.regular;
      const oldSale = product.price.sale;
      const oldOnSale = product.price.onSale;

      // Update base currency with existing pricing
      product.price.currency = newCurrencyCode;
      product.price.regular = existingPricing.regular;
      product.price.sale = existingPricing.sale;
      product.price.onSale = existingPricing.onSale;

      // Remove new base from multi-currency
      product.price.multiCurrency = product.price.multiCurrency.filter(
        (p) => p.code !== newCurrencyCode
      );

      // Add old base to multi-currency
      product.price.multiCurrency.push({
        code: oldCurrency,
        regular: oldRegular,
        sale: oldSale,
        onSale: oldOnSale,
        isManual: true,
        updatedAt: new Date(),
      });
    } else {
      // Convert pricing to new currency
      const convertedRegular = await currencyService.convertAmount(
        product.price.regular,
        product.price.currency,
        newCurrencyCode
      );

      let convertedSale = null;
      if (product.price.sale) {
        convertedSale = await currencyService.convertAmount(
          product.price.sale,
          product.price.currency,
          newCurrencyCode
        );
      }

      // Store old base currency pricing
      const oldCurrency = product.price.currency;
      const oldRegular = product.price.regular;
      const oldSale = product.price.sale;
      const oldOnSale = product.price.onSale;

      // Update base currency
      product.price.currency = newCurrencyCode;
      product.price.regular = convertedRegular;
      product.price.sale = convertedSale;

      // Add old base to multi-currency
      if (!product.price.multiCurrency) {
        product.price.multiCurrency = [];
      }

      product.price.multiCurrency.push({
        code: oldCurrency,
        regular: oldRegular,
        sale: oldSale,
        onSale: oldOnSale,
        isManual: true,
        updatedAt: new Date(),
      });
    }

    // Now update all variants
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        // Check if variant has pricing for new base currency
        const existingVariantPricing = variant.price.multiCurrency?.find(
          (p) => p.code === newCurrencyCode
        );

        if (existingVariantPricing) {
          // Store old base currency pricing
          const oldCurrency = variant.price.currency;
          const oldRegular = variant.price.regular;
          const oldSale = variant.price.sale;
          const oldOnSale = variant.price.onSale;

          // Update base currency with existing pricing
          variant.price.currency = newCurrencyCode;
          variant.price.regular = existingVariantPricing.regular;
          variant.price.sale = existingVariantPricing.sale;
          variant.price.onSale = existingVariantPricing.onSale;

          // Remove new base from multi-currency
          variant.price.multiCurrency = variant.price.multiCurrency.filter(
            (p) => p.code !== newCurrencyCode
          );

          // Add old base to multi-currency
          variant.price.multiCurrency.push({
            code: oldCurrency,
            regular: oldRegular,
            sale: oldSale,
            onSale: oldOnSale,
            isManual: true,
            updatedAt: new Date(),
          });
        } else {
          // Convert pricing to new currency
          const convertedRegular = await currencyService.convertAmount(
            variant.price.regular,
            variant.price.currency,
            newCurrencyCode
          );

          let convertedSale = null;
          if (variant.price.sale) {
            convertedSale = await currencyService.convertAmount(
              variant.price.sale,
              variant.price.currency,
              newCurrencyCode
            );
          }

          // Store old base currency pricing
          const oldCurrency = variant.price.currency;
          const oldRegular = variant.price.regular;
          const oldSale = variant.price.sale;
          const oldOnSale = variant.price.onSale;

          // Update base currency
          variant.price.currency = newCurrencyCode;
          variant.price.regular = convertedRegular;
          variant.price.sale = convertedSale;

          // Add old base to multi-currency
          if (!variant.price.multiCurrency) {
            variant.price.multiCurrency = [];
          }

          variant.price.multiCurrency.push({
            code: oldCurrency,
            regular: oldRegular,
            sale: oldSale,
            onSale: oldOnSale,
            isManual: true,
            updatedAt: new Date(),
          });
        }
      }
    }

    await product.save();
    return product;
  } catch (error) {
    logger.error(`Error updating product base currency:`, error);
    throw error;
  }
};

/**
 * Enable subscriptions for a product
 * @param {String} productId - Product ID
 * @param {Object} subscriptionData - Subscription options
 * @returns {Promise<Object>} Updated product
 */
const enableSubscription = async (productId, subscriptionData) => {
  try {
    const product = await getProductById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Add subscription options
    product.subscription = {
      enabled: true,
      options: subscriptionData.options || [],
      termsAndConditions: subscriptionData.termsAndConditions,
    };

    // Make sure at least one option is set as default
    if (
      product.subscription.options.length > 0 &&
      !product.subscription.options.some((option) => option.isDefault)
    ) {
      product.subscription.options[0].isDefault = true;
    }

    await product.save();
    logger.info(`Subscriptions enabled for product ${productId}`);

    return product;
  } catch (error) {
    logger.error(
      `Error enabling subscriptions for product ${productId}:`,
      error
    );
    throw error;
  }
};

/**
 * Disable subscriptions for a product
 * @param {String} productId - Product ID
 * @returns {Promise<Object>} Updated product
 */
const disableSubscription = async (productId) => {
  try {
    const product = await getProductById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Check if product is used in any active subscriptions
    // This would require querying the Subscription model to see if any users
    // have active subscriptions for this product

    // Disable subscriptions
    product.subscription.enabled = false;

    await product.save();
    logger.info(`Subscriptions disabled for product ${productId}`);

    return product;
  } catch (error) {
    logger.error(
      `Error disabling subscriptions for product ${productId}:`,
      error
    );
    throw error;
  }
};

/**
 * Update subscription options for a product
 * @param {String} productId - Product ID
 * @param {Array} options - Subscription options
 * @returns {Promise<Object>} Updated product
 */
const updateSubscriptionOptions = async (productId, options) => {
  try {
    const product = await getProductById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (!product.subscription) {
      product.subscription = {
        enabled: true,
        options: [],
      };
    }

    product.subscription.options = options;

    // Make sure at least one option is set as default
    if (
      product.subscription.options.length > 0 &&
      !product.subscription.options.some((option) => option.isDefault)
    ) {
      product.subscription.options[0].isDefault = true;
    }

    await product.save();
    logger.info(`Subscription options updated for product ${productId}`);

    return product;
  } catch (error) {
    logger.error(
      `Error updating subscription options for product ${productId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get all subscription-enabled products
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of subscription-enabled products
 */
const getSubscriptionProducts = async (options = {}) => {
  try {
    const { limit = 20, skip = 0, status = "active" } = options;

    const query = {
      "subscription.enabled": true,
    };

    if (status) {
      query.status = status;
    }

    const products = await Product.find(query)
      .select("name slug price description images subscription")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const count = await Product.countDocuments(query);

    return { products, count };
  } catch (error) {
    logger.error("Error fetching subscription products:", error);
    throw new InternalServerError("Failed to fetch subscription products");
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
  getProductPriceInCurrency,
  updateProductCurrencyPricing,
  updateProductBaseCurrency,
  enableSubscription,
  disableSubscription,
  updateSubscriptionOptions,
  getSubscriptionProducts,
};
