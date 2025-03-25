// src/services/inventory.service.js
const Product = require("../models/product.model");
const InventoryHistory = require("../models/inventory-history.model");
const { NotFoundError, BadRequestError } = require("../utils/errorTypes");
const logger = require("../config/logger");

/**
 * Initialize inventory for a product
 * @param {String} productId - Product ID
 * @param {Number} quantity - Initial quantity
 * @returns {Promise<Object>} Updated product
 */
const initializeInventory = async (productId, quantity) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    product.inventory.quantity = quantity;
    await product.save();

    // Record inventory history
    await recordInventoryChange(
      productId,
      null, // No variant
      quantity,
      "initialize",
      "Initial inventory setup"
    );

    return product;
  } catch (error) {
    logger.error(
      `Error initializing inventory for product ${productId}:`,
      error
    );
    throw error;
  }
};

/**
 * Adjust inventory quantity
 * @param {String} productId - Product ID
 * @param {Number} adjustment - Adjustment amount (positive or negative)
 * @param {String} reason - Reason for adjustment
 * @param {String} note - Additional notes
 * @returns {Promise<Object>} Updated product
 */
const adjustInventory = async (productId, adjustment, reason, note) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Calculate new quantity
    const newQuantity = product.inventory.quantity + adjustment;

    // Ensure we don't go negative unless allowed in settings
    if (newQuantity < 0) {
      throw new BadRequestError(
        "Adjustment would result in negative inventory"
      );
    }

    // Update product inventory
    product.inventory.quantity = newQuantity;
    await product.save();

    // Record inventory change
    await recordInventoryChange(
      productId,
      null, // No variant
      adjustment,
      reason,
      note
    );

    // Check if we need to send low stock alert
    await checkLowStockAlert(product);

    return product;
  } catch (error) {
    logger.error(`Error adjusting inventory for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Adjust variant inventory quantity
 * @param {String} productId - Product ID
 * @param {String} variantId - Variant ID
 * @param {Number} adjustment - Adjustment amount (positive or negative)
 * @param {String} reason - Reason for adjustment
 * @param {String} note - Additional notes
 * @returns {Promise<Object>} Updated product
 */
const adjustVariantInventory = async (
  productId,
  variantId,
  adjustment,
  reason,
  note
) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const variant = product.variants.id(variantId);

    if (!variant) {
      throw new NotFoundError("Variant not found");
    }

    // Calculate new quantity
    const newQuantity = variant.inventory.quantity + adjustment;

    // Ensure we don't go negative unless allowed in settings
    if (newQuantity < 0) {
      throw new BadRequestError(
        "Adjustment would result in negative inventory"
      );
    }

    // Update variant inventory
    variant.inventory.quantity = newQuantity;
    await product.save();

    // Record inventory change
    await recordInventoryChange(productId, variantId, adjustment, reason, note);

    // Check if we need to send low stock alert
    await checkVariantLowStockAlert(product, variant);

    return product;
  } catch (error) {
    logger.error(
      `Error adjusting inventory for variant ${variantId} of product ${productId}:`,
      error
    );
    throw error;
  }
};

/**
 * Reserve inventory during checkout
 * @param {String} productId - Product ID
 * @param {String} variantId - Variant ID (optional)
 * @param {Number} quantity - Quantity to reserve
 * @param {String} orderId - Order ID
 * @returns {Promise<Boolean>} Success indicator
 */
const reserveInventory = async (productId, variantId, quantity, orderId) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (variantId) {
      // Reserve variant inventory
      const variant = product.variants.id(variantId);

      if (!variant) {
        throw new NotFoundError("Variant not found");
      }

      const availableQuantity =
        variant.inventory.quantity - variant.inventory.reserved;

      if (availableQuantity < quantity) {
        throw new BadRequestError(
          `Not enough inventory available. Only ${availableQuantity} units available.`
        );
      }

      variant.inventory.reserved += quantity;
      await product.save();

      // Record reservation
      await recordInventoryChange(
        productId,
        variantId,
        -quantity, // Negative because it's reserved
        "reserve",
        `Reserved for order ${orderId}`
      );
    } else {
      // Reserve product inventory
      const availableQuantity =
        product.inventory.quantity - product.inventory.reserved;

      if (availableQuantity < quantity) {
        throw new BadRequestError(
          `Not enough inventory available. Only ${availableQuantity} units available.`
        );
      }

      product.inventory.reserved += quantity;
      await product.save();

      // Record reservation
      await recordInventoryChange(
        productId,
        null,
        -quantity, // Negative because it's reserved
        "reserve",
        `Reserved for order ${orderId}`
      );
    }

    return true;
  } catch (error) {
    logger.error(`Error reserving inventory for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Commit reserved inventory (convert reservation to actual deduction)
 * @param {String} productId - Product ID
 * @param {String} variantId - Variant ID (optional)
 * @param {Number} quantity - Quantity to commit
 * @param {String} orderId - Order ID
 * @returns {Promise<Boolean>} Success indicator
 */
const commitInventory = async (productId, variantId, quantity, orderId) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (variantId) {
      // Commit variant inventory
      const variant = product.variants.id(variantId);

      if (!variant) {
        throw new NotFoundError("Variant not found");
      }

      // Check if enough is reserved
      if (variant.inventory.reserved < quantity) {
        throw new BadRequestError(
          `Not enough inventory reserved. Only ${variant.inventory.reserved} units reserved.`
        );
      }

      // Reduce reserved and actual quantity
      variant.inventory.reserved -= quantity;
      variant.inventory.quantity -= quantity;
      await product.save();

      // Record commitment
      await recordInventoryChange(
        productId,
        variantId,
        -quantity,
        "commit",
        `Committed for order ${orderId}`
      );
    } else {
      // Commit product inventory
      // Check if enough is reserved
      if (product.inventory.reserved < quantity) {
        throw new BadRequestError(
          `Not enough inventory reserved. Only ${product.inventory.reserved} units reserved.`
        );
      }

      // Reduce reserved and actual quantity
      product.inventory.reserved -= quantity;
      product.inventory.quantity -= quantity;
      await product.save();

      // Record commitment
      await recordInventoryChange(
        productId,
        null,
        -quantity,
        "commit",
        `Committed for order ${orderId}`
      );
    }

    return true;
  } catch (error) {
    logger.error(`Error committing inventory for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Release reserved inventory (for cancelled orders or expired carts)
 * @param {String} productId - Product ID
 * @param {String} variantId - Variant ID (optional)
 * @param {Number} quantity - Quantity to release
 * @param {String} orderId - Order ID
 * @returns {Promise<Boolean>} Success indicator
 */
const releaseInventory = async (productId, variantId, quantity, orderId) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (variantId) {
      // Release variant inventory
      const variant = product.variants.id(variantId);

      if (!variant) {
        throw new NotFoundError("Variant not found");
      }

      // Check if enough is reserved
      if (variant.inventory.reserved < quantity) {
        logger.warn(
          `Attempting to release more than reserved for variant ${variantId} of product ${productId}. Adjusting to release all reserved.`
        );
        quantity = variant.inventory.reserved;
      }

      // Reduce reserved
      variant.inventory.reserved -= quantity;
      await product.save();

      // Record release
      await recordInventoryChange(
        productId,
        variantId,
        quantity, // Positive because it's being released back to available
        "release",
        `Released from order ${orderId}`
      );
    } else {
      // Release product inventory
      // Check if enough is reserved
      if (product.inventory.reserved < quantity) {
        logger.warn(
          `Attempting to release more than reserved for product ${productId}. Adjusting to release all reserved.`
        );
        quantity = product.inventory.reserved;
      }

      // Reduce reserved
      product.inventory.reserved -= quantity;
      await product.save();

      // Record release
      await recordInventoryChange(
        productId,
        null,
        quantity, // Positive because it's being released back to available
        "release",
        `Released from order ${orderId}`
      );
    }

    return true;
  } catch (error) {
    logger.error(`Error releasing inventory for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Record inventory change in history
 * @param {String} productId - Product ID
 * @param {String} variantId - Variant ID (optional)
 * @param {Number} adjustment - Adjustment amount
 * @param {String} type - Type of adjustment
 * @param {String} note - Notes about the adjustment
 */
const recordInventoryChange = async (
  productId,
  variantId,
  adjustment,
  type,
  note
) => {
  try {
    const history = new InventoryHistory({
      product: productId,
      variant: variantId,
      adjustment,
      type,
      note,
      timestamp: new Date(),
    });

    await history.save();
  } catch (error) {
    // Log but don't throw error to prevent transaction failure
    logger.error(
      `Error recording inventory history for product ${productId}:`,
      error
    );
  }
};

/**
 * Check if product is below low stock threshold and send alert if needed
 * @param {Object} product - Product object
 */
const checkLowStockAlert = async (product) => {
  try {
    const availableQuantity =
      product.inventory.quantity - product.inventory.reserved;

    if (availableQuantity <= product.inventory.lowStockThreshold) {
      // In a real implementation, we would send notifications or emails here
      logger.info(
        `Low stock alert for product ${product._id} (${product.name}): ${availableQuantity} units available`
      );

      // Here you would call notification service or email service
      // For example: await notificationService.sendLowStockAlert(product);
    }
  } catch (error) {
    logger.error(
      `Error checking low stock alert for product ${product._id}:`,
      error
    );
  }
};

/**
 * Check if variant is below low stock threshold and send alert if needed
 * @param {Object} product - Product object
 * @param {Object} variant - Variant object
 */
const checkVariantLowStockAlert = async (product, variant) => {
  try {
    const availableQuantity =
      variant.inventory.quantity - variant.inventory.reserved;

    if (availableQuantity <= variant.inventory.lowStockThreshold) {
      // In a real implementation, we would send notifications or emails here
      logger.info(
        `Low stock alert for variant ${variant._id} of product ${product._id} (${product.name} - ${variant.name}): ${availableQuantity} units available`
      );

      // Here you would call notification service or email service
      // For example: await notificationService.sendLowStockAlert(product, variant);
    }
  } catch (error) {
    logger.error(
      `Error checking low stock alert for variant ${variant._id} of product ${product._id}:`,
      error
    );
  }
};

/**
 * Get inventory history for a product
 * @param {String} productId - Product ID
 * @param {Object} options - Pagination and filtering options
 * @returns {Promise<Object>} Inventory history entries with pagination
 */
const getInventoryHistory = async (productId, options = {}) => {
  try {
    const { page = 1, limit = 20, variantId = null } = options;
    const skip = (page - 1) * limit;

    // Build query
    const query = { product: productId };

    if (variantId) {
      query.variant = variantId;
    }

    // Execute query with pagination
    const history = await InventoryHistory.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await InventoryHistory.countDocuments(query);

    return {
      history,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(
      `Error getting inventory history for product ${productId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get low stock products
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Low stock products with pagination
 */
const getLowStockProducts = async (options = {}) => {
  try {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // Find products with main inventory below threshold
    const productQuery = {
      $expr: {
        $lte: [
          { $subtract: ["$inventory.quantity", "$inventory.reserved"] },
          "$inventory.lowStockThreshold",
        ],
      },
    };

    const products = await Product.find(productQuery)
      .select("name sku inventory images")
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const totalProducts = await Product.countDocuments(productQuery);

    // Find products with variant inventory below threshold
    const variantLowStockProducts = await Product.aggregate([
      { $unwind: "$variants" },
      {
        $match: {
          $expr: {
            $lte: [
              {
                $subtract: [
                  "$variants.inventory.quantity",
                  "$variants.inventory.reserved",
                ],
              },
              "$variants.inventory.lowStockThreshold",
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          sku: 1,
          "variant._id": "$variants._id",
          "variant.name": "$variants.name",
          "variant.sku": "$variants.sku",
          "variant.inventory": "$variants.inventory",
        },
      },
    ]);

    // Combine results
    return {
      products,
      variantLowStockProducts,
      pagination: {
        total: totalProducts,
        page,
        limit,
        pages: Math.ceil(totalProducts / limit),
      },
    };
  } catch (error) {
    logger.error("Error getting low stock products:", error);
    throw error;
  }
};

module.exports = {
  initializeInventory,
  adjustInventory,
  adjustVariantInventory,
  reserveInventory,
  commitInventory,
  releaseInventory,
  getInventoryHistory,
  getLowStockProducts,
};
