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

/**
 * Enhanced inventory reservation system with timeout and priority levels
 * @param {String} productId - Product ID
 * @param {String} variantId - Variant ID (optional)
 * @param {Number} quantity - Quantity to reserve
 * @param {String} orderId - Order ID
 * @param {Object} options - Additional options
 * @param {Number} options.priority - Priority level (1-10, 10 being highest)
 * @param {Number} options.timeoutMinutes - Minutes until reservation expires (default: 60)
 * @returns {Promise<Object>} Reservation details with expiration time
 */
const enhancedReserveInventory = async (
  productId,
  variantId,
  quantity,
  orderId,
  options = {}
) => {
  try {
    const priority = options.priority || 5; // Default priority
    const timeoutMinutes = options.timeoutMinutes || 60; // Default 60 minutes
    const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    let availableQuantity;
    let reservationTarget;

    if (variantId) {
      // Reserve variant inventory
      const variant = product.variants.id(variantId);

      if (!variant) {
        throw new NotFoundError("Variant not found");
      }

      availableQuantity =
        variant.inventory.quantity - variant.inventory.reserved;

      if (availableQuantity < quantity) {
        throw new BadRequestError(
          `Not enough inventory available. Only ${availableQuantity} units available.`
        );
      }

      variant.inventory.reserved += quantity;
      reservationTarget = variant;
    } else {
      // Reserve product inventory
      availableQuantity =
        product.inventory.quantity - product.inventory.reserved;

      if (availableQuantity < quantity) {
        throw new BadRequestError(
          `Not enough inventory available. Only ${availableQuantity} units available.`
        );
      }

      product.inventory.reserved += quantity;
      reservationTarget = product.inventory;
    }

    // Add expiration and priority metadata to the reservation
    if (!reservationTarget.reservations) {
      reservationTarget.reservations = [];
    }

    const reservation = {
      orderId,
      quantity,
      priority,
      createdAt: new Date(),
      expiresAt,
    };

    reservationTarget.reservations.push(reservation);

    await product.save();

    // Record inventory change
    await recordInventoryChange(
      productId,
      variantId,
      -quantity, // Negative because it's reserved
      "reserve",
      `Reserved for order ${orderId} with priority ${priority}, expires at ${expiresAt}`
    );

    return {
      productId,
      variantId,
      quantity,
      orderId,
      priority,
      expiresAt,
      availableQuantity: availableQuantity - quantity,
    };
  } catch (error) {
    logger.error(
      `Error in enhanced inventory reservation for product ${productId}:`,
      error
    );
    throw error;
  }
};

/**
 * Clear expired inventory reservations
 * @returns {Promise<Object>} Statistics about cleared reservations
 */
const clearExpiredReservations = async () => {
  try {
    const now = new Date();
    const stats = {
      productsProcessed: 0,
      reservationsCleared: 0,
      quantityReleased: 0,
    };

    // Get all products with reservations
    const products = await Product.find({
      $or: [
        { "inventory.reserved": { $gt: 0 } },
        { "variants.inventory.reserved": { $gt: 0 } },
      ],
    });

    for (const product of products) {
      stats.productsProcessed++;
      let productModified = false;

      // Check main product inventory
      if (product.inventory && product.inventory.reservations) {
        const expiredReservations = product.inventory.reservations.filter(
          (reservation) => reservation.expiresAt < now
        );

        if (expiredReservations.length > 0) {
          // Calculate total quantity to release
          const releaseQuantity = expiredReservations.reduce(
            (total, reservation) => total + reservation.quantity,
            0
          );

          // Update reserved quantity
          product.inventory.reserved -= releaseQuantity;

          // Remove expired reservations
          product.inventory.reservations =
            product.inventory.reservations.filter(
              (reservation) => reservation.expiresAt >= now
            );

          stats.reservationsCleared += expiredReservations.length;
          stats.quantityReleased += releaseQuantity;
          productModified = true;

          // Log this inventory change
          await recordInventoryChange(
            product._id,
            null,
            releaseQuantity,
            "reservation_expired",
            `${expiredReservations.length} expired reservations released`
          );
        }
      }

      // Check variant inventories
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          if (variant.inventory && variant.inventory.reservations) {
            const expiredReservations = variant.inventory.reservations.filter(
              (reservation) => reservation.expiresAt < now
            );

            if (expiredReservations.length > 0) {
              // Calculate total quantity to release
              const releaseQuantity = expiredReservations.reduce(
                (total, reservation) => total + reservation.quantity,
                0
              );

              // Update reserved quantity
              variant.inventory.reserved -= releaseQuantity;

              // Remove expired reservations
              variant.inventory.reservations =
                variant.inventory.reservations.filter(
                  (reservation) => reservation.expiresAt >= now
                );

              stats.reservationsCleared += expiredReservations.length;
              stats.quantityReleased += releaseQuantity;
              productModified = true;

              // Log this inventory change
              await recordInventoryChange(
                product._id,
                variant._id,
                releaseQuantity,
                "reservation_expired",
                `${expiredReservations.length} expired variant reservations released`
              );
            }
          }
        }
      }

      // Save product if modified
      if (productModified) {
        await product.save();
      }
    }

    return stats;
  } catch (error) {
    logger.error("Error clearing expired reservations:", error);
    throw error;
  }
};

/**
 * Generate enhanced inventory reports with more detailed analytics
 * @param {Object} options - Report options
 * @param {String} options.reportType - Type of report (turnover, forecast, etc.)
 * @param {Number} options.timeframeInDays - Days of data to analyze
 * @param {Array<String>} options.categories - Filter by categories
 * @returns {Promise<Object>} Generated report
 */
const generateInventoryReport = async (options = {}) => {
  const {
    reportType = "status",
    timeframeInDays = 30,
    categories = [],
  } = options;

  try {
    // Base query
    let query = { isActive: true };

    // Apply category filter if provided
    if (categories && categories.length > 0) {
      query.categories = { $in: categories };
    }

    const products = await Product.find(query);
    const now = new Date();
    const timeframeStart = new Date(
      now.getTime() - timeframeInDays * 24 * 60 * 60 * 1000
    );

    // Get inventory change history for the timeframe
    const historyQuery = {
      createdAt: { $gte: timeframeStart },
    };

    if (categories && categories.length > 0) {
      // We need to get product IDs in these categories first
      const productIds = products.map((p) => p._id);
      historyQuery.productId = { $in: productIds };
    }

    const inventoryHistory = await InventoryHistory.find(historyQuery);

    // Choose report type
    switch (reportType) {
      case "status":
        return generateStatusReport(products);

      case "turnover":
        return generateTurnoverReport(
          products,
          inventoryHistory,
          timeframeInDays
        );

      case "forecast":
        return generateForecastReport(
          products,
          inventoryHistory,
          timeframeInDays
        );

      case "movements":
        return generateMovementsReport(inventoryHistory);

      default:
        throw new BadRequestError(`Unknown report type: ${reportType}`);
    }
  } catch (error) {
    logger.error(`Error generating inventory report:`, error);
    throw error;
  }
};

/**
 * Generate inventory status report
 * @param {Array} products - Array of products
 * @returns {Object} Status report
 */
const generateStatusReport = (products) => {
  // Current inventory status
  const status = {
    totalProducts: products.length,
    totalUnits: 0,
    unitsReserved: 0,
    unitsAvailable: 0,
    outOfStock: 0,
    lowStock: 0,
    healthyStock: 0,
    overStock: 0,
    stockValue: 0,
    reservedValue: 0,
    categorySummary: {},
  };

  products.forEach((product) => {
    // Main product inventory
    const mainQuantity = product.inventory.quantity || 0;
    const mainReserved = product.inventory.reserved || 0;
    const mainAvailable = mainQuantity - mainReserved;
    const mainValue = mainQuantity * (product.price?.base || 0);
    const mainReservedValue = mainReserved * (product.price?.base || 0);

    status.totalUnits += mainQuantity;
    status.unitsReserved += mainReserved;
    status.unitsAvailable += mainAvailable;
    status.stockValue += mainValue;
    status.reservedValue += mainReservedValue;

    // Stock level status
    if (mainAvailable <= 0) {
      status.outOfStock++;
    } else if (mainAvailable <= product.inventory.lowStockThreshold) {
      status.lowStock++;
    } else if (mainAvailable <= product.inventory.lowStockThreshold * 3) {
      status.healthyStock++;
    } else {
      status.overStock++;
    }

    // Process variant inventory if any
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant) => {
        const varQuantity = variant.inventory.quantity || 0;
        const varReserved = variant.inventory.reserved || 0;
        const varAvailable = varQuantity - varReserved;
        const varValue =
          varQuantity * (variant.price || product.price?.base || 0);
        const varReservedValue =
          varReserved * (variant.price || product.price?.base || 0);

        status.totalUnits += varQuantity;
        status.unitsReserved += varReserved;
        status.unitsAvailable += varAvailable;
        status.stockValue += varValue;
        status.reservedValue += varReservedValue;
      });
    }

    // Process by category
    if (product.categories && product.categories.length > 0) {
      product.categories.forEach((category) => {
        if (!status.categorySummary[category]) {
          status.categorySummary[category] = {
            totalProducts: 0,
            totalUnits: 0,
            unitsReserved: 0,
            unitsAvailable: 0,
            stockValue: 0,
          };
        }

        status.categorySummary[category].totalProducts++;
        status.categorySummary[category].totalUnits += mainQuantity;
        status.categorySummary[category].unitsReserved += mainReserved;
        status.categorySummary[category].unitsAvailable += mainAvailable;
        status.categorySummary[category].stockValue += mainValue;
      });
    }
  });

  return {
    reportType: "status",
    generatedAt: new Date(),
    data: status,
  };
};

/**
 * Generate inventory turnover report
 * @param {Array} products - Array of products
 * @param {Array} history - Inventory history
 * @param {Number} timeframeInDays - Timeframe in days
 * @returns {Object} Turnover report
 */
const generateTurnoverReport = (products, history, timeframeInDays) => {
  // Group history by product and action type
  const productMovements = {};

  history.forEach((entry) => {
    const productId = entry.productId.toString();

    if (!productMovements[productId]) {
      productMovements[productId] = {
        sold: 0,
        returned: 0,
        received: 0,
        adjusted: 0,
      };
    }

    const adjustment = Math.abs(entry.adjustment);

    switch (entry.type) {
      case "sale":
        productMovements[productId].sold += adjustment;
        break;
      case "return":
        productMovements[productId].returned += adjustment;
        break;
      case "receive":
        productMovements[productId].received += adjustment;
        break;
      case "adjust":
        productMovements[productId].adjusted += adjustment;
        break;
    }
  });

  // Calculate turnover metrics
  const turnoverData = products.map((product) => {
    const productId = product._id.toString();
    const movements = productMovements[productId] || {
      sold: 0,
      returned: 0,
      received: 0,
      adjusted: 0,
    };

    const currentStock = product.inventory.quantity;
    const netSales = movements.sold - movements.returned;

    // Turnover rate (annualized)
    const turnoverRate =
      currentStock > 0
        ? (netSales / currentStock) * (365 / timeframeInDays)
        : 0;

    // Days of inventory
    const dailySales = netSales / timeframeInDays;
    const daysOfInventory =
      dailySales > 0 ? currentStock / dailySales : currentStock > 0 ? 999 : 0; // If we have stock but no sales, mark as 999 days

    return {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      currentStock,
      sold: movements.sold,
      returned: movements.returned,
      netSales,
      received: movements.received,
      adjusted: movements.adjusted,
      turnoverRate: parseFloat(turnoverRate.toFixed(2)),
      daysOfInventory: Math.round(daysOfInventory),
      stockValue: currentStock * (product.price?.base || 0),
    };
  });

  // Sort by turnover rate (highest first)
  turnoverData.sort((a, b) => b.turnoverRate - a.turnoverRate);

  // Calculate overall metrics
  const totalCurrentStock = turnoverData.reduce(
    (sum, item) => sum + item.currentStock,
    0
  );
  const totalNetSales = turnoverData.reduce(
    (sum, item) => sum + item.netSales,
    0
  );
  const totalStockValue = turnoverData.reduce(
    (sum, item) => sum + item.stockValue,
    0
  );

  const overallTurnoverRate =
    totalCurrentStock > 0
      ? (totalNetSales / totalCurrentStock) * (365 / timeframeInDays)
      : 0;

  const overallDaysOfInventory =
    totalNetSales > 0
      ? totalCurrentStock / (totalNetSales / timeframeInDays)
      : totalCurrentStock > 0
      ? 999
      : 0;

  return {
    reportType: "turnover",
    generatedAt: new Date(),
    timeframeDays: timeframeInDays,
    summary: {
      totalProducts: products.length,
      totalCurrentStock,
      totalNetSales,
      totalStockValue,
      overallTurnoverRate: parseFloat(overallTurnoverRate.toFixed(2)),
      overallDaysOfInventory: Math.round(overallDaysOfInventory),
    },
    data: turnoverData,
  };
};

/**
 * Generate inventory forecast report
 * @param {Array} products - Array of products
 * @param {Array} history - Inventory history
 * @param {Number} timeframeInDays - Timeframe in days
 * @returns {Object} Forecast report
 */
const generateForecastReport = (products, history, timeframeInDays) => {
  // Calculate daily sales rate for each product
  const productForecast = {};

  // Group history by product and calculate sales
  history.forEach((entry) => {
    if (entry.type !== "sale") return;

    const productId = entry.productId.toString();

    if (!productForecast[productId]) {
      productForecast[productId] = {
        totalSold: 0,
        salesByDay: {},
      };
    }

    productForecast[productId].totalSold += Math.abs(entry.adjustment);

    // Group by day for sales trend
    const day = entry.createdAt.toISOString().split("T")[0];
    if (!productForecast[productId].salesByDay[day]) {
      productForecast[productId].salesByDay[day] = 0;
    }
    productForecast[productId].salesByDay[day] += Math.abs(entry.adjustment);
  });

  // Generate forecast data
  const forecastData = products.map((product) => {
    const productId = product._id.toString();
    const forecast = productForecast[productId];

    const currentStock = product.inventory.quantity;
    const lowStockThreshold = product.inventory.lowStockThreshold;

    // If we have sales data
    if (forecast && forecast.totalSold > 0) {
      const dailySalesRate = forecast.totalSold / timeframeInDays;

      // Calculate days until out of stock
      const daysUntilOutOfStock =
        dailySalesRate > 0 ? Math.floor(currentStock / dailySalesRate) : 999;

      // Calculate days until low stock
      const daysUntilLowStock =
        dailySalesRate > 0
          ? Math.floor((currentStock - lowStockThreshold) / dailySalesRate)
          : 999;

      // Recommended reorder quantity (30 days of stock)
      const recommendedReorderQty = Math.ceil(dailySalesRate * 30);

      // Get 7-day sales trend
      const salesDays = Object.keys(forecast.salesByDay).sort();
      const recentSalesDays = salesDays.slice(-7);
      const salesTrend = recentSalesDays.map((day) => ({
        date: day,
        quantity: forecast.salesByDay[day],
      }));

      return {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        currentStock,
        lowStockThreshold,
        dailySalesRate: parseFloat(dailySalesRate.toFixed(2)),
        daysUntilOutOfStock,
        daysUntilLowStock,
        outOfStockDate:
          daysUntilOutOfStock < 999
            ? new Date(Date.now() + daysUntilOutOfStock * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            : null,
        lowStockDate:
          daysUntilLowStock < 999
            ? new Date(Date.now() + daysUntilLowStock * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            : null,
        recommendedReorderQty,
        reorderNeeded: daysUntilLowStock <= 15, // Flag if reorder needed within 15 days
        salesTrend,
      };
    } else {
      // No sales data available
      return {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        currentStock,
        lowStockThreshold,
        dailySalesRate: 0,
        daysUntilOutOfStock: currentStock > 0 ? 999 : 0,
        daysUntilLowStock: currentStock > lowStockThreshold ? 999 : 0,
        outOfStockDate: null,
        lowStockDate: null,
        recommendedReorderQty: 0,
        reorderNeeded: currentStock <= lowStockThreshold,
        salesTrend: [],
      };
    }
  });

  // Sort by days until out of stock (ascending)
  forecastData.sort((a, b) => a.daysUntilOutOfStock - b.daysUntilOutOfStock);

  // Generate summary data
  const needReorder = forecastData.filter((item) => item.reorderNeeded);
  const criticalItems = forecastData.filter(
    (item) => item.daysUntilOutOfStock <= 7
  );

  return {
    reportType: "forecast",
    generatedAt: new Date(),
    timeframeDays: timeframeInDays,
    summary: {
      totalProducts: products.length,
      reorderNeeded: needReorder.length,
      criticalStock: criticalItems.length,
      productsCategorizedByDaysOfStock: {
        lessThan7Days: forecastData.filter((p) => p.daysUntilOutOfStock <= 7)
          .length,
        lessThan30Days: forecastData.filter(
          (p) => p.daysUntilOutOfStock > 7 && p.daysUntilOutOfStock <= 30
        ).length,
        lessThan90Days: forecastData.filter(
          (p) => p.daysUntilOutOfStock > 30 && p.daysUntilOutOfStock <= 90
        ).length,
        moreThan90Days: forecastData.filter((p) => p.daysUntilOutOfStock > 90)
          .length,
      },
    },
    reorderNeeded: needReorder,
    criticalItems,
    data: forecastData,
  };
};

/**
 * Generate inventory movements report
 * @param {Array} history - Inventory history
 * @returns {Object} Movements report
 */
const generateMovementsReport = (history) => {
  // Group by date and action type
  const movementsByDate = {};

  history.forEach((entry) => {
    const date = entry.createdAt.toISOString().split("T")[0];

    if (!movementsByDate[date]) {
      movementsByDate[date] = {
        sales: 0,
        returns: 0,
        receives: 0,
        adjustments: 0,
        reservations: 0,
        releases: 0,
      };
    }

    const quantity = Math.abs(entry.adjustment);

    switch (entry.type) {
      case "sale":
        movementsByDate[date].sales += quantity;
        break;
      case "return":
        movementsByDate[date].returns += quantity;
        break;
      case "receive":
        movementsByDate[date].receives += quantity;
        break;
      case "adjust":
        movementsByDate[date].adjustments += quantity;
        break;
      case "reserve":
        movementsByDate[date].reservations += quantity;
        break;
      case "release":
      case "reservation_expired":
        movementsByDate[date].releases += quantity;
        break;
    }
  });

  // Convert to array and sort by date
  const dailyMovements = Object.keys(movementsByDate)
    .sort()
    .map((date) => ({
      date,
      ...movementsByDate[date],
    }));

  // Calculate totals
  const totals = dailyMovements.reduce(
    (acc, day) => {
      return {
        sales: acc.sales + day.sales,
        returns: acc.returns + day.returns,
        receives: acc.receives + day.receives,
        adjustments: acc.adjustments + day.adjustments,
        reservations: acc.reservations + day.reservations,
        releases: acc.releases + day.releases,
      };
    },
    {
      sales: 0,
      returns: 0,
      receives: 0,
      adjustments: 0,
      reservations: 0,
      releases: 0,
    }
  );

  return {
    reportType: "movements",
    generatedAt: new Date(),
    summary: {
      timeframeDays: dailyMovements.length,
      totals,
    },
    data: dailyMovements,
  };
};

module.exports = {
  initializeInventory,
  adjustInventory,
  adjustVariantInventory,
  reserveInventory,
  commitInventory,
  releaseInventory,
  recordInventoryChange,
  checkLowStockAlert,
  checkVariantLowStockAlert,
  getInventoryHistory,
  getLowStockProducts,
  enhancedReserveInventory,
  clearExpiredReservations,
  generateInventoryReport,
  generateStatusReport,
  generateTurnoverReport,
  generateForecastReport,
  generateMovementsReport,
};
