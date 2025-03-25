// src/api/shipping/shipping.controller.js
const shippingService = require("../../services/shipping.service");
const { responseFormatter } = require("../../utils/responseFormatter");
const logger = require("../../config/logger");

/**
 * Calculate shipping rates
 * @route POST /api/v1/shipping/rates
 * @access Public
 */
const calculateShippingRates = async (req, res, next) => {
  try {
    const { destination, totalWeight, totalValue, items, countryCode } =
      req.body;

    // Validate required fields
    if (!destination || !destination.country) {
      return res
        .status(400)
        .json(responseFormatter(false, "Destination address is required"));
    }

    if (!totalWeight || !totalValue) {
      return res
        .status(400)
        .json(responseFormatter(false, "Total weight and value are required"));
    }

    // Calculate shipping rates
    const rates = await shippingService.calculateShippingRates({
      destination,
      totalWeight,
      totalValue,
      items,
      countryCode: countryCode || "IN",
    });

    return res.status(200).json(
      responseFormatter(true, "Shipping rates calculated successfully", {
        rates,
      })
    );
  } catch (error) {
    logger.error("Error calculating shipping rates:", error);
    next(error);
  }
};

/**
 * Create a new shipment
 * @route POST /api/v1/shipping/shipments
 * @access Private (Admin)
 */
const createShipment = async (req, res, next) => {
  try {
    const { orderId, shippingInfo } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json(responseFormatter(false, "Order ID is required"));
    }

    // Add user ID to shipping info
    const shippingData = {
      ...shippingInfo,
      userId: req.user._id,
    };

    // Create shipment
    const shipment = await shippingService.createShipment(
      orderId,
      shippingData
    );

    return res.status(201).json(
      responseFormatter(true, "Shipment created successfully", {
        shipment,
      })
    );
  } catch (error) {
    logger.error("Error creating shipment:", error);
    next(error);
  }
};

/**
 * Get tracking information
 * @route GET /api/v1/shipping/track/:trackingNumber
 * @access Public
 */
const getTrackingInfo = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;
    const { carrierId } = req.query;

    if (!trackingNumber) {
      return res
        .status(400)
        .json(responseFormatter(false, "Tracking number is required"));
    }

    // Get tracking info
    const trackingInfo = await shippingService.getTrackingInfo(
      trackingNumber,
      carrierId
    );

    return res.status(200).json(
      responseFormatter(true, "Tracking information retrieved successfully", {
        tracking: trackingInfo,
      })
    );
  } catch (error) {
    logger.error(
      `Error getting tracking info for ${req.params.trackingNumber}:`,
      error
    );
    next(error);
  }
};

/**
 * Generate shipping label
 * @route GET /api/v1/shipping/labels/:shipmentId
 * @access Private (Admin)
 */
const generateShippingLabel = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;

    if (!shipmentId) {
      return res
        .status(400)
        .json(responseFormatter(false, "Shipment ID is required"));
    }

    // Generate label
    const labelInfo = await shippingService.generateLabel(shipmentId);

    return res.status(200).json(
      responseFormatter(true, "Shipping label generated successfully", {
        label: labelInfo,
      })
    );
  } catch (error) {
    logger.error(
      `Error generating label for shipment ${req.params.shipmentId}:`,
      error
    );
    next(error);
  }
};

/**
 * Update shipment status
 * @route PUT /api/v1/shipping/shipments/:shipmentId/status
 * @access Private (Admin)
 */
const updateShipmentStatus = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const statusUpdate = req.body;

    if (!shipmentId) {
      return res
        .status(400)
        .json(responseFormatter(false, "Shipment ID is required"));
    }

    if (!statusUpdate.status) {
      return res
        .status(400)
        .json(responseFormatter(false, "Status is required"));
    }

    // Update status
    const shipment = await shippingService.updateShipmentStatus(
      shipmentId,
      statusUpdate
    );

    return res.status(200).json(
      responseFormatter(true, "Shipment status updated successfully", {
        shipment,
      })
    );
  } catch (error) {
    logger.error(
      `Error updating shipment status for ${req.params.shipmentId}:`,
      error
    );
    next(error);
  }
};

/**
 * Get shipment by ID
 * @route GET /api/v1/shipping/shipments/:shipmentId
 * @access Private (Admin)
 */
const getShipmentById = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;

    if (!shipmentId) {
      return res
        .status(400)
        .json(responseFormatter(false, "Shipment ID is required"));
    }

    // Get shipment
    const shipment = await shippingService.getShipmentById(shipmentId);

    return res.status(200).json(
      responseFormatter(true, "Shipment retrieved successfully", {
        shipment,
      })
    );
  } catch (error) {
    logger.error(`Error getting shipment ${req.params.shipmentId}:`, error);
    next(error);
  }
};

/**
 * Get all shipments with filtering and pagination
 * @route GET /api/v1/shipping/shipments
 * @access Private (Admin)
 */
const getShipments = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      carrier: req.query.carrier,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      orderId: req.query.orderId,
    };

    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sortBy: req.query.sortBy || "-createdAt",
    };

    // Get shipments
    const result = await shippingService.getShipments(filters, options);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Shipments retrieved successfully", result)
      );
  } catch (error) {
    logger.error("Error getting shipments:", error);
    next(error);
  }
};

/**
 * Create a new shipping method
 * @route POST /api/v1/shipping/methods
 * @access Private (Admin)
 */
const createShippingMethod = async (req, res, next) => {
  try {
    const methodData = req.body;

    // Create shipping method
    const method = await shippingService.createShippingMethod(methodData);

    return res.status(201).json(
      responseFormatter(true, "Shipping method created successfully", {
        method,
      })
    );
  } catch (error) {
    logger.error("Error creating shipping method:", error);
    next(error);
  }
};

/**
 * Get all shipping methods
 * @route GET /api/v1/shipping/methods
 * @access Private (Admin)
 */
const getShippingMethods = async (req, res, next) => {
  try {
    const filters = {
      isActive: req.query.isActive === "true" ? true : undefined,
      carrier: req.query.carrier,
    };

    // Get shipping methods
    const methods = await shippingService.getShippingMethods(filters);

    return res.status(200).json(
      responseFormatter(true, "Shipping methods retrieved successfully", {
        methods,
      })
    );
  } catch (error) {
    logger.error("Error getting shipping methods:", error);
    next(error);
  }
};

/**
 * Get shipping method by ID
 * @route GET /api/v1/shipping/methods/:methodId
 * @access Private (Admin)
 */
const getShippingMethodById = async (req, res, next) => {
  try {
    const { methodId } = req.params;

    // Get shipping method
    const method = await shippingService.getShippingMethodById(methodId);

    return res.status(200).json(
      responseFormatter(true, "Shipping method retrieved successfully", {
        method,
      })
    );
  } catch (error) {
    logger.error(
      `Error getting shipping method ${req.params.methodId}:`,
      error
    );
    next(error);
  }
};

/**
 * Update shipping method
 * @route PUT /api/v1/shipping/methods/:methodId
 * @access Private (Admin)
 */
const updateShippingMethod = async (req, res, next) => {
  try {
    const { methodId } = req.params;
    const updateData = req.body;

    // Update shipping method
    const method = await shippingService.updateShippingMethod(
      methodId,
      updateData
    );

    return res.status(200).json(
      responseFormatter(true, "Shipping method updated successfully", {
        method,
      })
    );
  } catch (error) {
    logger.error(
      `Error updating shipping method ${req.params.methodId}:`,
      error
    );
    next(error);
  }
};

/**
 * Delete shipping method
 * @route DELETE /api/v1/shipping/methods/:methodId
 * @access Private (Admin)
 */
const deleteShippingMethod = async (req, res, next) => {
  try {
    const { methodId } = req.params;

    // Delete shipping method
    await shippingService.deleteShippingMethod(methodId);

    return res
      .status(200)
      .json(responseFormatter(true, "Shipping method deleted successfully"));
  } catch (error) {
    logger.error(
      `Error deleting shipping method ${req.params.methodId}:`,
      error
    );
    next(error);
  }
};

/**
 * Create a new shipping zone
 * @route POST /api/v1/shipping/zones
 * @access Private (Admin)
 */
const createShippingZone = async (req, res, next) => {
  try {
    const zoneData = req.body;

    // Create shipping zone
    const zone = await shippingService.createShippingZone(zoneData);

    return res.status(201).json(
      responseFormatter(true, "Shipping zone created successfully", {
        zone,
      })
    );
  } catch (error) {
    logger.error("Error creating shipping zone:", error);
    next(error);
  }
};

/**
 * Get all shipping zones
 * @route GET /api/v1/shipping/zones
 * @access Private (Admin)
 */
const getShippingZones = async (req, res, next) => {
  try {
    // Get shipping zones
    const zones = await shippingService.getShippingZones();

    return res.status(200).json(
      responseFormatter(true, "Shipping zones retrieved successfully", {
        zones,
      })
    );
  } catch (error) {
    logger.error("Error getting shipping zones:", error);
    next(error);
  }
};

/**
 * Get shipping zone by ID
 * @route GET /api/v1/shipping/zones/:zoneId
 * @access Private (Admin)
 */
const getShippingZoneById = async (req, res, next) => {
  try {
    const { zoneId } = req.params;

    // Get shipping zone
    const zone = await shippingService.getShippingZoneById(zoneId);

    return res.status(200).json(
      responseFormatter(true, "Shipping zone retrieved successfully", {
        zone,
      })
    );
  } catch (error) {
    logger.error(`Error getting shipping zone ${req.params.zoneId}:`, error);
    next(error);
  }
};

/**
 * Update shipping zone
 * @route PUT /api/v1/shipping/zones/:zoneId
 * @access Private (Admin)
 */
const updateShippingZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const updateData = req.body;

    // Update shipping zone
    const zone = await shippingService.updateShippingZone(zoneId, updateData);

    return res.status(200).json(
      responseFormatter(true, "Shipping zone updated successfully", {
        zone,
      })
    );
  } catch (error) {
    logger.error(`Error updating shipping zone ${req.params.zoneId}:`, error);
    next(error);
  }
};

/**
 * Delete shipping zone
 * @route DELETE /api/v1/shipping/zones/:zoneId
 * @access Private (Admin)
 */
const deleteShippingZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;

    // Delete shipping zone
    await shippingService.deleteShippingZone(zoneId);

    return res
      .status(200)
      .json(responseFormatter(true, "Shipping zone deleted successfully"));
  } catch (error) {
    logger.error(`Error deleting shipping zone ${req.params.zoneId}:`, error);
    next(error);
  }
};

/**
 * Create a new shipping carrier
 * @route POST /api/v1/shipping/carriers
 * @access Private (Admin)
 */
const createShippingCarrier = async (req, res, next) => {
  try {
    const carrierData = req.body;

    // Create shipping carrier
    const carrier = await shippingService.createShippingCarrier(carrierData);

    return res.status(201).json(
      responseFormatter(true, "Shipping carrier created successfully", {
        carrier,
      })
    );
  } catch (error) {
    logger.error("Error creating shipping carrier:", error);
    next(error);
  }
};

/**
 * Get all shipping carriers
 * @route GET /api/v1/shipping/carriers
 * @access Private (Admin)
 */
const getShippingCarriers = async (req, res, next) => {
  try {
    const filters = {
      isActive: req.query.isActive === "true" ? true : undefined,
      type: req.query.type,
    };

    // Get shipping carriers
    const carriers = await shippingService.getShippingCarriers(filters);

    return res.status(200).json(
      responseFormatter(true, "Shipping carriers retrieved successfully", {
        carriers,
      })
    );
  } catch (error) {
    logger.error("Error getting shipping carriers:", error);
    next(error);
  }
};

/**
 * Get shipping carrier by ID
 * @route GET /api/v1/shipping/carriers/:carrierId
 * @access Private (Admin)
 */
const getShippingCarrierById = async (req, res, next) => {
  try {
    const { carrierId } = req.params;

    // Get shipping carrier
    const carrier = await shippingService.getShippingCarrierById(carrierId);

    return res.status(200).json(
      responseFormatter(true, "Shipping carrier retrieved successfully", {
        carrier,
      })
    );
  } catch (error) {
    logger.error(
      `Error getting shipping carrier ${req.params.carrierId}:`,
      error
    );
    next(error);
  }
};

/**
 * Update shipping carrier
 * @route PUT /api/v1/shipping/carriers/:carrierId
 * @access Private (Admin)
 */
const updateShippingCarrier = async (req, res, next) => {
  try {
    const { carrierId } = req.params;
    const updateData = req.body;

    // Update shipping carrier
    const carrier = await shippingService.updateShippingCarrier(
      carrierId,
      updateData
    );

    return res.status(200).json(
      responseFormatter(true, "Shipping carrier updated successfully", {
        carrier,
      })
    );
  } catch (error) {
    logger.error(
      `Error updating shipping carrier ${req.params.carrierId}:`,
      error
    );
    next(error);
  }
};

/**
 * Delete shipping carrier
 * @route DELETE /api/v1/shipping/carriers/:carrierId
 * @access Private (Admin)
 */
const deleteShippingCarrier = async (req, res, next) => {
  try {
    const { carrierId } = req.params;

    // Delete shipping carrier
    await shippingService.deleteShippingCarrier(carrierId);

    return res
      .status(200)
      .json(responseFormatter(true, "Shipping carrier deleted successfully"));
  } catch (error) {
    logger.error(
      `Error deleting shipping carrier ${req.params.carrierId}:`,
      error
    );
    next(error);
  }
};

/**
 * Handle shipping carrier webhook
 * @route POST /api/v1/shipping/webhooks/:carrier
 * @access Public (secured by signature)
 */
const handleShippingWebhook = async (req, res, next) => {
  try {
    const { carrier } = req.params;
    const webhookData = req.body;
    const signature = req.headers["x-webhook-signature"];

    // Process webhook
    const result = await shippingService.processCarrierWebhook(
      carrier,
      webhookData,
      signature
    );

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      data: result,
    });
  } catch (error) {
    logger.error(`Error processing ${req.params.carrier} webhook:`, error);
    // Always return 200 to the webhook source
    return res.status(200).json({
      success: false,
      message: "Error processing webhook",
      error: error.message,
    });
  }
};

module.exports = {
  calculateShippingRates,
  createShipment,
  getTrackingInfo,
  generateShippingLabel,
  updateShipmentStatus,
  getShipmentById,
  getShipments,
  createShippingMethod,
  getShippingMethods,
  getShippingMethodById,
  updateShippingMethod,
  deleteShippingMethod,
  createShippingZone,
  getShippingZones,
  getShippingZoneById,
  updateShippingZone,
  deleteShippingZone,
  createShippingCarrier,
  getShippingCarriers,
  getShippingCarrierById,
  updateShippingCarrier,
  deleteShippingCarrier,
  handleShippingWebhook,
};
