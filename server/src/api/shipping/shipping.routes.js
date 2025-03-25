// src/api/shipping/shipping.routes.js
const express = require("express");
const shippingController = require("./shipping.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const shippingValidator = require("../../utils/validators/shipping.validator");

const router = express.Router();

/*
 * Public routes
 */

/**
 * @route   POST /api/v1/shipping/rates
 * @desc    Calculate shipping rates for cart
 * @access  Public
 */
router.post(
  "/rates",
  validationMiddleware(shippingValidator.calculateRates),
  shippingController.calculateShippingRates
);

/**
 * @route   GET /api/v1/shipping/track/:trackingNumber
 * @desc    Get tracking information
 * @access  Public
 */
router.get(
  "/track/:trackingNumber",
  validationMiddleware(shippingValidator.getTracking),
  shippingController.getTrackingInfo
);

/**
 * @route   POST /api/v1/shipping/webhooks/:carrier
 * @desc    Handle carrier webhooks
 * @access  Public (secured by signature)
 */
router.post(
  "/webhooks/:carrier",
  express.raw({ type: "application/json" }),
  shippingController.handleShippingWebhook
);

/*
 * Admin routes
 */

// Shipment management routes
router.use(authMiddleware);

/**
 * @route   POST /api/v1/shipping/shipments
 * @desc    Create a new shipment
 * @access  Private (Admin)
 */
router.post(
  "/shipments",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(shippingValidator.createShipment),
  shippingController.createShipment
);

/**
 * @route   GET /api/v1/shipping/shipments
 * @desc    Get all shipments with filtering
 * @access  Private (Admin)
 */
router.get(
  "/shipments",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(shippingValidator.getShipments),
  shippingController.getShipments
);

/**
 * @route   GET /api/v1/shipping/shipments/:shipmentId
 * @desc    Get shipment by ID
 * @access  Private (Admin)
 */
router.get(
  "/shipments/:shipmentId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(shippingValidator.getById),
  shippingController.getShipmentById
);

/**
 * @route   PUT /api/v1/shipping/shipments/:shipmentId/status
 * @desc    Update shipment status
 * @access  Private (Admin)
 */
router.put(
  "/shipments/:shipmentId/status",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(shippingValidator.updateStatus),
  shippingController.updateShipmentStatus
);

/**
 * @route   GET /api/v1/shipping/labels/:shipmentId
 * @desc    Generate shipping label
 * @access  Private (Admin)
 */
router.get(
  "/labels/:shipmentId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(shippingValidator.getById),
  shippingController.generateShippingLabel
);

// Shipping method configuration routes

/**
 * @route   POST /api/v1/shipping/methods
 * @desc    Create a new shipping method
 * @access  Private (Admin)
 */
router.post(
  "/methods",
  rbacMiddleware(["admin"]),
  validationMiddleware(shippingValidator.createMethod),
  shippingController.createShippingMethod
);

/**
 * @route   GET /api/v1/shipping/methods
 * @desc    Get all shipping methods
 * @access  Private (Admin)
 */
router.get(
  "/methods",
  rbacMiddleware(["admin", "manager"]),
  shippingController.getShippingMethods
);

/**
 * @route   GET /api/v1/shipping/methods/:methodId
 * @desc    Get shipping method by ID
 * @access  Private (Admin)
 */
router.get(
  "/methods/:methodId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(shippingValidator.getById),
  shippingController.getShippingMethodById
);

/**
 * @route   PUT /api/v1/shipping/methods/:methodId
 * @desc    Update shipping method
 * @access  Private (Admin)
 */
router.put(
  "/methods/:methodId",
  rbacMiddleware(["admin"]),
  validationMiddleware(shippingValidator.updateMethod),
  shippingController.updateShippingMethod
);

/**
 * @route   DELETE /api/v1/shipping/methods/:methodId
 * @desc    Delete shipping method
 * @access  Private (Admin)
 */
router.delete(
  "/methods/:methodId",
  rbacMiddleware(["admin"]),
  validationMiddleware(shippingValidator.getById),
  shippingController.deleteShippingMethod
);

// Shipping zone configuration routes

/**
 * @route   POST /api/v1/shipping/zones
 * @desc    Create a new shipping zone
 * @access  Private (Admin)
 */
router.post(
  "/zones",
  rbacMiddleware(["admin"]),
  validationMiddleware(shippingValidator.createZone),
  shippingController.createShippingZone
);

/**
 * @route   GET /api/v1/shipping/zones
 * @desc    Get all shipping zones
 * @access  Private (Admin)
 */
router.get(
  "/zones",
  rbacMiddleware(["admin", "manager"]),
  shippingController.getShippingZones
);

/**
 * @route   GET /api/v1/shipping/zones/:zoneId
 * @desc    Get shipping zone by ID
 * @access  Private (Admin)
 */
router.get(
  "/zones/:zoneId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(shippingValidator.getById),
  shippingController.getShippingZoneById
);

/**
 * @route   PUT /api/v1/shipping/zones/:zoneId
 * @desc    Update shipping zone
 * @access  Private (Admin)
 */
router.put(
  "/zones/:zoneId",
  rbacMiddleware(["admin"]),
  validationMiddleware(shippingValidator.updateZone),
  shippingController.updateShippingZone
);

/**
 * @route   DELETE /api/v1/shipping/zones/:zoneId
 * @desc    Delete shipping zone
 * @access  Private (Admin)
 */
router.delete(
  "/zones/:zoneId",
  rbacMiddleware(["admin"]),
  validationMiddleware(shippingValidator.getById),
  shippingController.deleteShippingZone
);

// Shipping carrier configuration routes

/**
 * @route   POST /api/v1/shipping/carriers
 * @desc    Create a new shipping carrier
 * @access  Private (Admin)
 */
router.post(
  "/carriers",
  rbacMiddleware(["admin"]),
  validationMiddleware(shippingValidator.createCarrier),
  shippingController.createShippingCarrier
);

/**
 * @route   GET /api/v1/shipping/carriers
 * @desc    Get all shipping carriers
 * @access  Private (Admin)
 */
router.get(
  "/carriers",
  rbacMiddleware(["admin", "manager"]),
  shippingController.getShippingCarriers
);

/**
 * @route   GET /api/v1/shipping/carriers/:carrierId
 * @desc    Get shipping carrier by ID
 * @access  Private (Admin)
 */
router.get(
  "/carriers/:carrierId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(shippingValidator.getById),
  shippingController.getShippingCarrierById
);

/**
 * @route   PUT /api/v1/shipping/carriers/:carrierId
 * @desc    Update shipping carrier
 * @access  Private (Admin)
 */
router.put(
  "/carriers/:carrierId",
  rbacMiddleware(["admin"]),
  validationMiddleware(shippingValidator.updateCarrier),
  shippingController.updateShippingCarrier
);

/**
 * @route   DELETE /api/v1/shipping/carriers/:carrierId
 * @desc    Delete shipping carrier
 * @access  Private (Admin)
 */
router.delete(
  "/carriers/:carrierId",
  rbacMiddleware(["admin"]),
  validationMiddleware(shippingValidator.getById),
  shippingController.deleteShippingCarrier
);

module.exports = router;
