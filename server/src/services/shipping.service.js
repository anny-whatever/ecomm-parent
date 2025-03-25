// src/services/shipping.service.js
const axios = require("axios");
const crypto = require("crypto");
const {
  ShippingMethod,
  ShippingZone,
  ShippingCarrier,
  Shipment,
} = require("../models/shipping-method.model");
const Order = require("../models/order.model");
const logger = require("../config/logger");
const { NotFoundError, BadRequestError } = require("../utils/errorTypes");

/**
 * Main Shipping Service
 * Handles shipping rate calculations, carrier integrations, and shipment processing
 */
class ShippingService {
  /**
   * Calculate available shipping methods and rates for a cart or order
   * @param {Object} params - Parameters for calculation
   * @param {Object} params.destination - Shipping destination address
   * @param {Number} params.totalWeight - Total weight in kg
   * @param {Number} params.totalValue - Cart/order total value
   * @param {Array} params.items - Cart/order items
   * @param {String} params.countryCode - Country code for delivery
   * @returns {Promise<Array>} Available shipping methods with rates
   */
  async calculateShippingRates({
    destination,
    totalWeight,
    totalValue,
    items,
    countryCode = "IN",
  }) {
    try {
      // Find applicable shipping zones for this destination
      const zones = await this.findApplicableZones(destination);

      if (!zones || zones.length === 0) {
        logger.warn(
          `No shipping zones found for destination: ${JSON.stringify(
            destination
          )}`
        );
        return [];
      }

      // Get all active shipping methods that include the applicable zones
      const activeMethods = await ShippingMethod.find({
        isActive: true,
        "zones.zone": { $in: zones.map((zone) => zone._id) },
      })
        .populate("carrier")
        .populate("zones.zone");

      // Filter methods based on rules (weight, order value, etc.)
      const applicableMethods = activeMethods.filter((method) => {
        // Check weight restrictions
        if (method.rules.maxWeight > 0 && totalWeight > method.rules.maxWeight)
          return false;
        if (totalWeight < method.rules.minWeight) return false;

        // Check order value restrictions
        if (
          method.rules.maxOrderValue > 0 &&
          totalValue > method.rules.maxOrderValue
        )
          return false;
        if (totalValue < method.rules.minOrderValue) return false;

        // Additional filtering logic as needed
        return true;
      });

      // Calculate rate for each applicable method
      const calculatedRates = await Promise.all(
        applicableMethods.map(async (method) => {
          const rate = await this.calculateRateForMethod(method, {
            weight: totalWeight,
            value: totalValue,
            destination,
            items,
            countryCode,
          });

          return {
            methodId: method._id,
            name: method.name,
            code: method.code,
            carrier: method.carrier ? method.carrier.name : null,
            description: method.description,
            rate: rate.price,
            estimatedDelivery: {
              min: method.estimatedDelivery.min,
              max: method.estimatedDelivery.max,
            },
            freeShipping: rate.freeShipping,
            carrierCode: method.carrier ? method.carrier.code : null,
            methodType: method.type,
          };
        })
      );

      // Sort by price ascending
      return calculatedRates.sort((a, b) => a.rate - b.rate);
    } catch (error) {
      logger.error("Error calculating shipping rates:", error);
      throw error;
    }
  }

  /**
   * Find shipping zones applicable to a destination address
   * @param {Object} destination - Address information
   * @returns {Promise<Array>} Matching shipping zones
   */
  async findApplicableZones(destination) {
    try {
      const { country, state, city, postalCode } = destination;

      // Start with all zones that match the country
      const matchingZones = await ShippingZone.find({
        $or: [
          { countries: country },
          { countries: { $size: 0 } }, // Empty countries array means "all countries"
        ],
      });

      // Filter zones by other criteria (regions, postcodes)
      return matchingZones.filter((zone) => {
        // If zone has regions defined, check if state matches
        if (zone.regions && zone.regions.length > 0) {
          if (!zone.regions.includes(state)) return false;
        }

        // Check postcode ranges if defined
        if (zone.postcodes && zone.postcodes.length > 0) {
          const inRange = zone.postcodes.some((range) => {
            // Simple numeric comparison - could be enhanced for alphanumeric postcodes
            const postNum = parseInt(postalCode, 10);
            const fromNum = parseInt(range.from, 10);
            const toNum = parseInt(range.to, 10);
            return postNum >= fromNum && postNum <= toNum;
          });
          if (!inRange) return false;
        }

        // Check flat postcodes if defined
        if (zone.postcodesFlat && zone.postcodesFlat.length > 0) {
          if (!zone.postcodesFlat.includes(postalCode)) return false;
        }

        return true;
      });
    } catch (error) {
      logger.error("Error finding applicable shipping zones:", error);
      throw error;
    }
  }

  /**
   * Calculate shipping rate for a specific method
   * @param {Object} method - Shipping method
   * @param {Object} params - Calculation parameters
   * @returns {Promise<Object>} Calculated rate
   */
  async calculateRateForMethod(
    method,
    { weight, value, destination, items, countryCode }
  ) {
    try {
      // Find the appropriate zone rate
      const zoneRate = method.zones.find((zoneItem) =>
        this.matchesZone(zoneItem.zone, destination)
      );

      if (!zoneRate) {
        return { price: 0, freeShipping: false, available: false };
      }

      // Check for free shipping threshold
      if (
        zoneRate.rates.freeShippingThreshold > 0 &&
        value >= zoneRate.rates.freeShippingThreshold
      ) {
        return { price: 0, freeShipping: true, available: true };
      }

      // Calculate based on base price + additional weight
      let price = zoneRate.rates.basePrice;

      // If weight exceeds what's covered by base price, add additional cost
      const additionalWeight = Math.max(0, weight - 0.5); // Assuming base covers first 500g
      if (additionalWeight > 0 && zoneRate.rates.additionalPrice > 0) {
        // Round up to nearest 500g or kg depending on carrier
        const additionalUnits = Math.ceil(additionalWeight / 0.5);
        price += additionalUnits * zoneRate.rates.additionalPrice;
      }

      return {
        price,
        freeShipping: false,
        available: true,
        details: {
          basePrice: zoneRate.rates.basePrice,
          additionalWeight,
          additionalCost: price - zoneRate.rates.basePrice,
        },
      };
    } catch (error) {
      logger.error(`Error calculating rate for method ${method._id}:`, error);
      throw error;
    }
  }

  /**
   * Check if a shipping zone matches a destination
   * @param {Object} zone - Shipping zone
   * @param {Object} destination - Destination address
   * @returns {Boolean} Whether zone applies to destination
   */
  matchesZone(zone, destination) {
    // This is a simplification - would need full implementation based on zone structure
    return (
      zone.countries.includes(destination.country) ||
      zone.countries.length === 0
    ); // Empty means all countries
  }

  /**
   * Create a new shipment for an order
   * @param {String} orderId - Order ID
   * @param {Object} shippingInfo - Shipping information
   * @returns {Promise<Object>} Created shipment
   */
  async createShipment(orderId, shippingInfo) {
    try {
      // Get order details
      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Get shipping method details
      const shippingMethod = await ShippingMethod.findOne({
        code: shippingInfo.methodCode || order.shipping.method,
      });

      if (!shippingMethod) {
        throw new NotFoundError("Shipping method not found");
      }

      // Create new shipment
      const shipment = new Shipment({
        order: orderId,
        shippingMethod: shippingMethod._id,
        carrier: shippingMethod.carrier,
        shippingInfo: {
          packageWeight: shippingInfo.weight || 0.5, // Default if not provided
          dimensions: shippingInfo.dimensions || {
            length: 15, // Default dimensions in cm
            width: 15,
            height: 5,
          },
          packageCount: shippingInfo.packageCount || 1,
          shippingDate: new Date(),
          estimatedDelivery: this.calculateEstimatedDelivery(shippingMethod),
        },
        recipient: {
          name: order.shipping.address.name,
          address: {
            street: order.shipping.address.street,
            city: order.shipping.address.city,
            state: order.shipping.address.state,
            postalCode: order.shipping.address.postalCode,
            country: order.shipping.address.country,
          },
          phone: order.shipping.address.phone,
          email: order.billing.email,
        },
        notes: shippingInfo.notes || "",
        createdBy: shippingInfo.userId,
      });

      // Save the basic shipment
      const savedShipment = await shipment.save();

      // If we have carrier integration, create the shipment with the carrier
      if (shippingMethod.carrier) {
        const carrier = await ShippingCarrier.findById(shippingMethod.carrier);
        if (carrier && carrier.isActive) {
          // Create shipment with carrier
          const carrierShipment = await this.createCarrierShipment(
            savedShipment,
            carrier
          );

          // Update shipment with carrier data
          savedShipment.trackingNumber = carrierShipment.trackingNumber;
          savedShipment.status = "label_created";
          savedShipment.labels.shippingLabel = carrierShipment.labelUrl;
          savedShipment.carrierData = carrierShipment.carrierData;

          // Add status history
          savedShipment.statusHistory.push({
            status: "label_created",
            timestamp: new Date(),
            description: "Shipping label created",
          });

          await savedShipment.save();
        }
      }

      return savedShipment;
    } catch (error) {
      logger.error(`Error creating shipment for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate estimated delivery date based on shipping method
   * @param {Object} shippingMethod - Shipping method
   * @returns {Date} Estimated delivery date
   */
  calculateEstimatedDelivery(shippingMethod) {
    const today = new Date();
    const maxDays = shippingMethod.estimatedDelivery.max || 3;
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + maxDays);

    // Adjust for weekends and holidays if needed
    // This is a simplified version

    return deliveryDate;
  }

  /**
   * Create shipment with carrier API
   * @param {Object} shipment - Shipment object
   * @param {Object} carrier - Carrier object
   * @returns {Promise<Object>} Carrier response data
   */
  async createCarrierShipment(shipment, carrier) {
    try {
      // Switch based on carrier type for different integrations
      switch (carrier.type) {
        case "delhivery":
          return await this.createDelhiveryShipment(shipment, carrier);
        case "shiprocket":
          return await this.createShiprocketShipment(shipment, carrier);
        default:
          throw new BadRequestError(
            `Unsupported carrier type: ${carrier.type}`
          );
      }
    } catch (error) {
      logger.error(`Error creating carrier shipment:`, error);
      throw error;
    }
  }

  /**
   * Create shipment with Delhivery API
   * @param {Object} shipment - Shipment object
   * @param {Object} carrier - Carrier credentials
   * @returns {Promise<Object>} Delhivery response data
   */
  async createDelhiveryShipment(shipment, carrier) {
    try {
      // Get order details for the shipment
      const order = await Order.findById(shipment.order).populate(
        "items.product"
      );

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Set up API request to Delhivery
      const apiUrl = carrier.sandbox
        ? "https://staging-express.delhivery.com/api/cmu/create.json"
        : "https://track.delhivery.com/api/cmu/create.json";

      // Format the shipment data according to Delhivery's API requirements
      const shipmentData = {
        format: "json",
        data: {
          shipments: [
            {
              name: shipment.recipient.name,
              add: shipment.recipient.address.street,
              city: shipment.recipient.address.city,
              state: shipment.recipient.address.state,
              pin: shipment.recipient.address.postalCode,
              country: shipment.recipient.address.country,
              phone: shipment.recipient.phone,
              order: order.orderNumber,
              payment_mode: order.payment.method === "cod" ? "COD" : "Prepaid",
              cod_amount:
                order.payment.method === "cod" ? order.pricing.total : "0",
              total_amount: order.pricing.total.toString(),
              weight: shipment.shippingInfo.packageWeight.toString(),
              shipment_width: shipment.shippingInfo.dimensions.width.toString(),
              shipment_height:
                shipment.shippingInfo.dimensions.height.toString(),
              shipment_length:
                shipment.shippingInfo.dimensions.length.toString(),
            },
          ],
          pickup_location: {
            name: "Warehouse", // This would come from your warehouse settings
          },
          products: order.items.map((item) => ({
            name: item.name,
            sku: item.sku,
            units: item.quantity.toString(),
            price: item.price.toString(),
          })),
        },
      };

      // Make API call to Delhivery
      const response = await axios.post(apiUrl, shipmentData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${carrier.credentials.apiKey}`,
        },
      });

      // Process response
      if (response.data && response.data.success) {
        const packages = response.data.packages;
        if (packages && packages.length > 0) {
          // Return tracking information
          return {
            trackingNumber: packages[0].waybill,
            labelUrl: packages[0].label_url || null,
            carrierData: response.data,
          };
        }
      }

      // If we get here, something went wrong with the API call
      throw new Error(
        `Failed to create Delhivery shipment: ${JSON.stringify(response.data)}`
      );
    } catch (error) {
      logger.error("Error creating Delhivery shipment:", error);
      throw error;
    }
  }

  /**
   * Create shipment with ShipRocket API
   * @param {Object} shipment - Shipment object
   * @param {Object} carrier - Carrier credentials
   * @returns {Promise<Object>} ShipRocket response data
   */
  async createShiprocketShipment(shipment, carrier) {
    try {
      // First, we need to authenticate with ShipRocket to get a token
      const tokenResponse = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
          email: carrier.credentials.username,
          password: carrier.credentials.password,
        }
      );

      const token = tokenResponse.data.token;

      // Get order details for the shipment
      const order = await Order.findById(shipment.order).populate(
        "items.product"
      );

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Format the order data according to ShipRocket's API requirements
      const orderData = {
        order_id: order.orderNumber,
        order_date: order.createdAt.toISOString().split("T")[0],
        pickup_location: "Warehouse", // This would come from your warehouse settings
        billing_customer_name: order.billing.address.name,
        billing_address: order.billing.address.street,
        billing_city: order.billing.address.city,
        billing_state: order.billing.address.state,
        billing_country: order.billing.address.country,
        billing_pincode: order.billing.address.postalCode,
        billing_email: order.billing.email,
        billing_phone: order.billing.address.phone,
        shipping_is_billing: true,
        shipping_customer_name: shipment.recipient.name,
        shipping_address: shipment.recipient.address.street,
        shipping_city: shipment.recipient.address.city,
        shipping_state: shipment.recipient.address.state,
        shipping_country: shipment.recipient.address.country,
        shipping_pincode: shipment.recipient.address.postalCode,
        shipping_email: shipment.recipient.email || order.billing.email,
        shipping_phone: shipment.recipient.phone,
        order_items: order.items.map((item) => ({
          name: item.name,
          sku: item.sku,
          units: item.quantity,
          selling_price: item.price,
        })),
        payment_method: order.payment.method === "cod" ? "COD" : "Prepaid",
        sub_total: order.pricing.subtotal,
        weight: shipment.shippingInfo.packageWeight,
        length: shipment.shippingInfo.dimensions.length,
        breadth: shipment.shippingInfo.dimensions.width,
        height: shipment.shippingInfo.dimensions.height,
      };

      // Create the order in ShipRocket
      const orderResponse = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
        orderData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Now generate the shipment
      const shipmentResponse = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/shipments/create/forward-shipment",
        {
          order_id: [orderResponse.data.order_id],
          // Can specify courier_id if needed
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Generate the label
      const labelResponse = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/courier/generate/label",
        {
          shipment_id: [shipmentResponse.data.shipment_id],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Return tracking information
      return {
        trackingNumber: shipmentResponse.data.awbs?.[0]?.awb_code || null,
        labelUrl: labelResponse.data.label_url || null,
        carrierData: {
          shiprocket_order_id: orderResponse.data.order_id,
          shiprocket_shipment_id: shipmentResponse.data.shipment_id,
        },
      };
    } catch (error) {
      logger.error("Error creating ShipRocket shipment:", error);
      throw error;
    }
  }

  /**
   * Get tracking information for a shipment
   * @param {String} trackingNumber - Tracking number
   * @param {String} carrierId - Carrier ID
   * @returns {Promise<Object>} Tracking information
   */
  async getTrackingInfo(trackingNumber, carrierId) {
    try {
      if (!trackingNumber) {
        throw new BadRequestError("Tracking number is required");
      }

      // Find shipment
      const shipment = await Shipment.findOne({ trackingNumber }).populate(
        "carrier"
      );

      if (!shipment) {
        throw new NotFoundError("Shipment not found");
      }

      const carrier = carrierId
        ? await ShippingCarrier.findById(carrierId)
        : shipment.carrier;

      if (!carrier) {
        throw new NotFoundError("Carrier not found");
      }

      // Check tracking info based on carrier
      switch (carrier.type) {
        case "delhivery":
          return await this.getDelhiveryTracking(trackingNumber, carrier);
        case "shiprocket":
          return await this.getShiprocketTracking(
            trackingNumber,
            carrier,
            shipment.carrierData
          );
        default:
          throw new BadRequestError(
            `Unsupported carrier type: ${carrier.type}`
          );
      }
    } catch (error) {
      logger.error(`Error getting tracking info for ${trackingNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get tracking information from Delhivery
   * @param {String} trackingNumber - Tracking number
   * @param {Object} carrier - Carrier object
   * @returns {Promise<Object>} Tracking information
   */
  async getDelhiveryTracking(trackingNumber, carrier) {
    try {
      const apiUrl = `https://track.delhivery.com/api/v1/packages/json/?waybill=${trackingNumber}`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Token ${carrier.credentials.apiKey}`,
        },
      });

      if (
        response.data &&
        response.data.ShipmentData &&
        response.data.ShipmentData.length > 0
      ) {
        const shipmentData = response.data.ShipmentData[0];

        // Extract status from Delhivery response
        let status = "in_transit";
        if (shipmentData.Delivered) {
          status = "delivered";
        } else if (shipmentData.RTO) {
          status = "returned";
        } else if (shipmentData.Cancellation) {
          status = "cancelled";
        }

        // Update status in our database
        await Shipment.findOneAndUpdate(
          { trackingNumber },
          {
            status,
            $push: {
              statusHistory: {
                status,
                timestamp: new Date(),
                description:
                  shipmentData.Status?.Instructions ||
                  "Status updated from Delhivery",
              },
            },
          }
        );

        return {
          trackingNumber,
          status,
          carrier: carrier.name,
          lastUpdate: shipmentData.StatusDateTime || new Date(),
          estimatedDelivery: null, // Delhivery might not provide this
          currentLocation: shipmentData.StatusLocation,
          history:
            shipmentData.Scans?.map((scan) => ({
              status: scan.ScanDetail,
              timestamp: scan.ScanDateTime,
              location: scan.ScannedLocation,
              description: scan.Instructions || "",
            })) || [],
          carrierTrackingUrl: `https://www.delhivery.com/track/?trackingId=${trackingNumber}`,
        };
      }

      // If no detailed information is returned
      return {
        trackingNumber,
        status: "pending",
        carrier: carrier.name,
        carrierTrackingUrl: `https://www.delhivery.com/track/?trackingId=${trackingNumber}`,
      };
    } catch (error) {
      logger.error(
        `Error getting Delhivery tracking for ${trackingNumber}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get tracking information from ShipRocket
   * @param {String} trackingNumber - Tracking number
   * @param {Object} carrier - Carrier object
   * @param {Object} carrierData - Additional carrier data
   * @returns {Promise<Object>} Tracking information
   */
  async getShiprocketTracking(trackingNumber, carrier, carrierData) {
    try {
      // First, authenticate with ShipRocket
      const tokenResponse = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
          email: carrier.credentials.username,
          password: carrier.credentials.password,
        }
      );

      const token = tokenResponse.data.token;

      // ShipRocket API requires shipment ID for tracking
      const shipmentId = carrierData?.shiprocket_shipment_id;

      if (!shipmentId) {
        throw new BadRequestError("Missing ShipRocket shipment ID");
      }

      // Get tracking info
      const response = await axios.get(
        `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.data &&
        response.data.tracking_data &&
        response.data.tracking_data.shipment_track
      ) {
        const trackData = response.data.tracking_data.shipment_track[0];

        // Map ShipRocket status to our status
        let status = "in_transit";
        if (trackData.current_status === "Delivered") {
          status = "delivered";
        } else if (trackData.current_status === "RTO Delivered") {
          status = "returned";
        } else if (trackData.current_status === "Cancelled") {
          status = "cancelled";
        } else if (trackData.current_status === "Out For Delivery") {
          status = "out_for_delivery";
        }

        // Update status in our database
        await Shipment.findOneAndUpdate(
          { trackingNumber },
          {
            status,
            $push: {
              statusHistory: {
                status,
                timestamp: new Date(),
                description:
                  trackData.current_status || "Status updated from ShipRocket",
              },
            },
          }
        );

        return {
          trackingNumber,
          status,
          carrier: carrier.name,
          lastUpdate: new Date(),
          estimatedDelivery: trackData.etd || null,
          currentLocation: trackData.current_location || "",
          history:
            response.data.tracking_data.shipment_track_activities?.map(
              (activity) => ({
                status: activity.activity,
                timestamp: activity.date,
                location: activity.location || "",
                description: activity.activity || "",
              })
            ) || [],
          carrierTrackingUrl: trackData.track_url || null,
        };
      }

      // If no detailed information is returned
      return {
        trackingNumber,
        status: "pending",
        carrier: carrier.name,
      };
    } catch (error) {
      logger.error(
        `Error getting ShipRocket tracking for ${trackingNumber}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Generate shipping label for a shipment
   * @param {String} shipmentId - Shipment ID
   * @returns {Promise<Object>} Label URL and information
   */
  async generateLabel(shipmentId) {
    try {
      const shipment = await Shipment.findById(shipmentId).populate("carrier");

      if (!shipment) {
        throw new NotFoundError("Shipment not found");
      }

      // If label already exists, return it
      if (shipment.labels.shippingLabel) {
        return {
          labelUrl: shipment.labels.shippingLabel,
          trackingNumber: shipment.trackingNumber,
        };
      }

      // If no carrier integration, can't generate label
      if (!shipment.carrier) {
        throw new BadRequestError("No carrier associated with this shipment");
      }

      // Based on carrier type, generate label
      switch (shipment.carrier.type) {
        case "delhivery":
          // Delhivery provides label URL in the initial shipment creation
          // But we could re-generate it if needed
          if (!shipment.trackingNumber) {
            throw new BadRequestError(
              "Cannot generate label without tracking number"
            );
          }

          // Generate new label by calling Delhivery API
          // This is simplified - actual implementation would depend on Delhivery's API
          return {
            labelUrl: `https://track.delhivery.com/api/p/packing-slip?wbns=${shipment.trackingNumber}`,
            trackingNumber: shipment.trackingNumber,
          };

        case "shiprocket":
          // Re-generate ShipRocket label
          const tokenResponse = await axios.post(
            "https://apiv2.shiprocket.in/v1/external/auth/login",
            {
              email: shipment.carrier.credentials.username,
              password: shipment.carrier.credentials.password,
            }
          );

          const token = tokenResponse.data.token;

          // Generate the label
          const labelResponse = await axios.post(
            "https://apiv2.shiprocket.in/v1/external/courier/generate/label",
            {
              shipment_id: [shipment.carrierData.shiprocket_shipment_id],
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Update shipment with label URL
          shipment.labels.shippingLabel = labelResponse.data.label_url;
          await shipment.save();

          return {
            labelUrl: labelResponse.data.label_url,
            trackingNumber: shipment.trackingNumber,
          };

        default:
          throw new BadRequestError(
            `Unsupported carrier type: ${shipment.carrier.type}`
          );
      }
    } catch (error) {
      logger.error(`Error generating label for shipment ${shipmentId}:`, error);
      throw error;
    }
  }

  /**
   * Update shipment status manually
   * @param {String} shipmentId - Shipment ID
   * @param {Object} statusUpdate - Status update info
   * @returns {Promise<Object>} Updated shipment
   */
  async updateShipmentStatus(shipmentId, statusUpdate) {
    try {
      const shipment = await Shipment.findById(shipmentId);

      if (!shipment) {
        throw new NotFoundError("Shipment not found");
      }

      // Update status
      shipment.status = statusUpdate.status;

      // Add to status history
      shipment.statusHistory.push({
        status: statusUpdate.status,
        timestamp: new Date(),
        description: statusUpdate.description || "Status updated manually",
        location: statusUpdate.location,
      });

      // If status is delivered, update actual delivery date
      if (statusUpdate.status === "delivered") {
        shipment.shippingInfo.actualDelivery = new Date();
      }

      await shipment.save();

      return shipment;
    } catch (error) {
      logger.error(`Error updating shipment status for ${shipmentId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new shipping method
   * @param {Object} methodData - Shipping method data
   * @returns {Promise<Object>} Created shipping method
   */
  async createShippingMethod(methodData) {
    try {
      const method = new ShippingMethod(methodData);
      return await method.save();
    } catch (error) {
      logger.error("Error creating shipping method:", error);
      throw error;
    }
  }

  /**
   * Create a new shipping zone
   * @param {Object} zoneData - Shipping zone data
   * @returns {Promise<Object>} Created shipping zone
   */
  async createShippingZone(zoneData) {
    try {
      const zone = new ShippingZone(zoneData);
      return await zone.save();
    } catch (error) {
      logger.error("Error creating shipping zone:", error);
      throw error;
    }
  }

  /**
   * Create a new shipping carrier
   * @param {Object} carrierData - Shipping carrier data
   * @returns {Promise<Object>} Created shipping carrier
   */
  async createShippingCarrier(carrierData) {
    try {
      // Encrypt sensitive information if needed
      if (carrierData.credentials) {
        // In a production environment, these should be encrypted
        // This is just a simple example
        carrierData.credentials.apiKey = this.encryptSensitiveData(
          carrierData.credentials.apiKey
        );
        carrierData.credentials.apiSecret = this.encryptSensitiveData(
          carrierData.credentials.apiSecret
        );
        carrierData.credentials.password = this.encryptSensitiveData(
          carrierData.credentials.password
        );
      }

      const carrier = new ShippingCarrier(carrierData);
      return await carrier.save();
    } catch (error) {
      logger.error("Error creating shipping carrier:", error);
      throw error;
    }
  }

  /**
   * Simple encryption for sensitive data
   * In production, use a more secure method
   * @param {String} data - Data to encrypt
   * @returns {String} Encrypted data
   */
  encryptSensitiveData(data) {
    if (!data) return data;

    // This is just a placeholder - in production use a proper encryption method
    // For example, using environment variables for the encryption key
    const encryptionKey = process.env.ENCRYPTION_KEY || "your-secret-key";
    const cipher = crypto.createCipher("aes-256-cbc", encryptionKey);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  /**
   * Decrypt sensitive data
   * @param {String} encryptedData - Encrypted data
   * @returns {String} Decrypted data
   */
  decryptSensitiveData(encryptedData) {
    if (!encryptedData) return encryptedData;

    // This is just a placeholder - in production use a proper decryption method
    const encryptionKey = process.env.ENCRYPTION_KEY || "your-secret-key";
    const decipher = crypto.createDecipher("aes-256-cbc", encryptionKey);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}

module.exports = new ShippingService();
