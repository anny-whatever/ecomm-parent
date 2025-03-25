// src/api/inventory/inventory.controller.js
const inventoryService = require("../../services/inventory.service");
const productService = require("../../services/product.service");
const { responseFormatter } = require("../../utils/responseFormatter");
const logger = require("../../config/logger");

/**
 * Adjust product inventory
 * @route PUT /api/v1/inventory/products/:productId
 * @access Private (Admin)
 */
const adjustProductInventory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { adjustment, reason, note } = req.body;

    const product = await inventoryService.adjustInventory(
      productId,
      adjustment,
      reason || "manual-adjustment",
      note || `Manual adjustment by ${req.user.email}`
    );

    return res.status(200).json(
      responseFormatter(true, "Inventory adjusted successfully", {
        product: {
          _id: product._id,
          name: product.name,
          inventory: product.inventory,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust variant inventory
 * @route PUT /api/v1/inventory/products/:productId/variants/:variantId
 * @access Private (Admin)
 */
const adjustVariantInventory = async (req, res, next) => {
  try {
    const { productId, variantId } = req.params;
    const { adjustment, reason, note } = req.body;

    const product = await inventoryService.adjustVariantInventory(
      productId,
      variantId,
      adjustment,
      reason || "manual-adjustment",
      note || `Manual adjustment by ${req.user.email}`
    );

    // Find the specific variant
    const variant = product.variants.id(variantId);

    return res.status(200).json(
      responseFormatter(true, "Variant inventory adjusted successfully", {
        product: {
          _id: product._id,
          name: product.name,
        },
        variant: {
          _id: variant._id,
          name: variant.name,
          inventory: variant.inventory,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory history for a product
 * @route GET /api/v1/inventory/products/:productId/history
 * @access Private (Admin)
 */
const getProductInventoryHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
      variantId: req.query.variantId,
    };

    // First check if product exists
    const product = await productService.getProductById(productId);

    // Get inventory history
    const result = await inventoryService.getInventoryHistory(
      productId,
      options
    );

    return res.status(200).json(
      responseFormatter(true, "Inventory history retrieved successfully", {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
        },
        ...result,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock products
 * @route GET /api/v1/inventory/low-stock
 * @access Private (Admin)
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
    };

    const result = await inventoryService.getLowStockProducts(options);

    return res
      .status(200)
      .json(responseFormatter(true, "Low stock products retrieved", result));
  } catch (error) {
    next(error);
  }
};

/**
 * Get product inventory summary
 * @route GET /api/v1/inventory/products/:productId/summary
 * @access Private (Admin)
 */
const getProductInventorySummary = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Get product with inventory details
    const product = await productService.getProductById(productId);

    // Calculate available inventory
    const mainInventory = {
      total: product.inventory.quantity,
      reserved: product.inventory.reserved,
      available: product.inventory.quantity - product.inventory.reserved,
      lowStockThreshold: product.inventory.lowStockThreshold,
      isLowStock:
        product.inventory.quantity - product.inventory.reserved <=
        product.inventory.lowStockThreshold,
    };

    // Calculate variant inventory if applicable
    const variantInventory = product.variants.map((variant) => ({
      _id: variant._id,
      name: variant.name,
      sku: variant.sku,
      total: variant.inventory.quantity,
      reserved: variant.inventory.reserved,
      available: variant.inventory.quantity - variant.inventory.reserved,
      lowStockThreshold: variant.inventory.lowStockThreshold,
      isLowStock:
        variant.inventory.quantity - variant.inventory.reserved <=
        variant.inventory.lowStockThreshold,
    }));

    return res.status(200).json(
      responseFormatter(true, "Inventory summary retrieved", {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
        },
        mainInventory,
        variantInventory,
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adjustProductInventory,
  adjustVariantInventory,
  getProductInventoryHistory,
  getLowStockProducts,
  getProductInventorySummary,
};
