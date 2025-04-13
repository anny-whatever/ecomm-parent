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
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

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
        case "fedex":
          return await this.createFedExShipment(shipment, carrier);
        case "dhl":
          return await this.createDHLShipment(shipment, carrier);
        case "ups":
          return await this.createUPSShipment(shipment, carrier);
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
   * Create a FedEx shipment
   * @param {Object} shipment - Shipment object
   * @param {Object} carrier - Carrier object with credentials
   * @returns {Promise<Object>} Shipment data from FedEx
   */
  async createFedExShipment(shipment, carrier) {
    try {
      const { credentials } = carrier;

      if (
        !credentials ||
        !credentials.apiKey ||
        !credentials.apiSecret ||
        !credentials.accountNumber
      ) {
        throw new BadRequestError("Missing FedEx API credentials");
      }

      logger.info(`Creating FedEx shipment for order ${shipment.orderId}`);

      // Prepare FedEx API parameters
      const params = {
        shipment: {
          shipper: {
            contact: {
              personName: shipment.sender.name,
              phoneNumber: shipment.sender.phone,
              emailAddress: shipment.sender.email,
            },
            address: {
              streetLines: [
                shipment.sender.addressLine1,
                shipment.sender.addressLine2,
              ].filter(Boolean),
              city: shipment.sender.city,
              stateOrProvinceCode: shipment.sender.state,
              postalCode: shipment.sender.postalCode,
              countryCode: shipment.sender.countryCode,
            },
          },
          recipients: [
            {
              contact: {
                personName: shipment.recipient.name,
                phoneNumber: shipment.recipient.phone,
                emailAddress: shipment.recipient.email,
              },
              address: {
                streetLines: [
                  shipment.recipient.addressLine1,
                  shipment.recipient.addressLine2,
                ].filter(Boolean),
                city: shipment.recipient.city,
                stateOrProvinceCode: shipment.recipient.state,
                postalCode: shipment.recipient.postalCode,
                countryCode: shipment.recipient.countryCode,
              },
            },
          ],
          requestedShipment: {
            shipTimestamp: new Date().toISOString(),
            dropoffType: "REGULAR_PICKUP",
            serviceType: shipment.serviceType || "STANDARD_OVERNIGHT",
            packagingType: shipment.packagingType || "YOUR_PACKAGING",
            totalWeight: shipment.weight,
            preferredCurrency: shipment.currency || "INR",
            shipmentSpecialServices: shipment.specialServices || [],
          },
          labelSpecification: {
            labelFormatType: "PDF",
            imageType: "PDF",
          },
        },
      };

      // Call FedEx API
      const fedexApi = `https://apis-sandbox.fedex.com/ship/v1/shipments`;

      // Get authentication token first
      const authResponse = await axios.post(
        "https://apis-sandbox.fedex.com/oauth/token",
        {
          grant_type: "client_credentials",
          client_id: credentials.apiKey,
          client_secret: credentials.apiSecret,
        }
      );

      const token = authResponse.data.access_token;

      // Create shipment with token
      const response = await axios.post(fedexApi, params, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.data || !response.data.output) {
        throw new Error("Invalid response from FedEx API");
      }

      // Save FedEx tracking info and response
      const trackingInfo = {
        trackingNumber:
          response.data.output.transactionShipments[0].trackingNumber,
        trackingUrl: `https://www.fedex.com/fedextrack/?trknbr=${response.data.output.transactionShipments[0].trackingNumber}`,
        labelUrl:
          response.data.output.transactionShipments[0].pieceResponses[0]
            .packageDocuments[0].url,
        carrierData: response.data,
      };

      // Update shipment with tracking info
      await Shipment.findByIdAndUpdate(shipment._id, {
        tracking: trackingInfo,
        status: "created",
      });

      return trackingInfo;
    } catch (error) {
      logger.error("Error creating FedEx shipment:", error);
      throw new Error(`Failed to create FedEx shipment: ${error.message}`);
    }
  }

  /**
   * Create a DHL shipment
   * @param {Object} shipment - Shipment object
   * @param {Object} carrier - Carrier object with credentials
   * @returns {Promise<Object>} Shipment data from DHL
   */
  async createDHLShipment(shipment, carrier) {
    try {
      const { credentials } = carrier;

      if (!credentials || !credentials.apiKey || !credentials.accountNumber) {
        throw new BadRequestError("Missing DHL API credentials");
      }

      logger.info(`Creating DHL shipment for order ${shipment.orderId}`);

      // Prepare DHL API parameters
      const params = {
        pickup: {
          isRequested: false,
        },
        productCode: shipment.serviceType || "P",
        outputImageProperties: {
          printerDPI: 300,
          encodingFormat: "pdf",
        },
        customerDetails: {
          shipperDetails: {
            postalAddress: {
              postalCode: shipment.sender.postalCode,
              cityName: shipment.sender.city,
              countryCode: shipment.sender.countryCode,
              addressLine1: shipment.sender.addressLine1,
              addressLine2: shipment.sender.addressLine2 || "",
              provinceCode: shipment.sender.state,
            },
            contactInformation: {
              email: shipment.sender.email,
              phone: shipment.sender.phone,
              companyName: shipment.sender.company || "Your Store",
              fullName: shipment.sender.name,
            },
          },
          receiverDetails: {
            postalAddress: {
              postalCode: shipment.recipient.postalCode,
              cityName: shipment.recipient.city,
              countryCode: shipment.recipient.countryCode,
              addressLine1: shipment.recipient.addressLine1,
              addressLine2: shipment.recipient.addressLine2 || "",
              provinceCode: shipment.recipient.state,
            },
            contactInformation: {
              email: shipment.recipient.email,
              phone: shipment.recipient.phone,
              companyName: shipment.recipient.company || "",
              fullName: shipment.recipient.name,
            },
          },
        },
        content: {
          packages: [
            {
              weight: shipment.weight,
              dimensions: {
                length: shipment.dimensions.length,
                width: shipment.dimensions.width,
                height: shipment.dimensions.height,
              },
            },
          ],
          isCustomsDeclarable: shipment.isInternational,
          description: shipment.description || "Merchandise",
          incoterm: "DAP",
          unitOfMeasurement: "metric",
        },
      };

      // For international shipments, add customs info
      if (shipment.isInternational && shipment.customsInfo) {
        params.content.exportDeclaration = {
          lineItems: shipment.items.map((item) => ({
            number: 1,
            description: item.name,
            price: item.price,
            quantity: {
              value: item.quantity,
              unitOfMeasurement: "EA",
            },
            commodityCodes: [
              {
                typeCode: "HS",
                value: item.hsCode || "000000",
              },
            ],
            exportReasonType: "PERMANENT",
            manufacturerCountry: item.originCountry || "IN",
            weight: {
              netValue: item.weight,
              grossValue: item.weight,
            },
          })),
          invoice: {
            number: shipment.invoiceNumber || `INV-${shipment.orderId}`,
            date: new Date().toISOString().split("T")[0],
          },
        };
      }

      // Call DHL API
      const dhlApi = "https://api-mock.dhl.com/mydhlapi/shipments";

      const response = await axios.post(dhlApi, params, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            credentials.apiKey + ":" + (credentials.apiSecret || "")
          ).toString("base64")}`,
          "Content-Type": "application/json",
          "Message-Reference": uuidv4(),
          "Message-Reference-Date": new Date().toISOString(),
        },
      });

      if (!response.data || !response.data.shipmentTrackingNumber) {
        throw new Error("Invalid response from DHL API");
      }

      // Save DHL tracking info and response
      const trackingInfo = {
        trackingNumber: response.data.shipmentTrackingNumber,
        trackingUrl: `https://www.dhl.com/in-en/home/tracking.html?tracking-id=${response.data.shipmentTrackingNumber}`,
        labelUrl: response.data.documents[0].url,
        carrierData: response.data,
      };

      // Update shipment with tracking info
      await Shipment.findByIdAndUpdate(shipment._id, {
        tracking: trackingInfo,
        status: "created",
      });

      return trackingInfo;
    } catch (error) {
      logger.error("Error creating DHL shipment:", error);
      throw new Error(`Failed to create DHL shipment: ${error.message}`);
    }
  }

  /**
   * Create a UPS shipment
   * @param {Object} shipment - Shipment object
   * @param {Object} carrier - Carrier object with credentials
   * @returns {Promise<Object>} Shipment data from UPS
   */
  async createUPSShipment(shipment, carrier) {
    try {
      const { credentials } = carrier;

      if (!credentials || !credentials.apiKey || !credentials.accountNumber) {
        throw new BadRequestError("Missing UPS API credentials");
      }

      logger.info(`Creating UPS shipment for order ${shipment.orderId}`);

      // Format addresses for UPS
      const shipperAddress = {
        AddressLine: [
          shipment.sender.addressLine1,
          shipment.sender.addressLine2,
        ].filter(Boolean),
        City: shipment.sender.city,
        StateProvinceCode: shipment.sender.state,
        PostalCode: shipment.sender.postalCode,
        CountryCode: shipment.sender.countryCode,
      };

      const shipToAddress = {
        AddressLine: [
          shipment.recipient.addressLine1,
          shipment.recipient.addressLine2,
        ].filter(Boolean),
        City: shipment.recipient.city,
        StateProvinceCode: shipment.recipient.state,
        PostalCode: shipment.recipient.postalCode,
        CountryCode: shipment.recipient.countryCode,
      };

      // Prepare UPS API parameters
      const params = {
        ShipmentRequest: {
          Request: {
            RequestOption: "validate",
            TransactionReference: { CustomerContext: shipment.orderId },
          },
          Shipment: {
            Description: shipment.description || "Order Shipment",
            Shipper: {
              Name: shipment.sender.name,
              ShipperNumber: credentials.accountNumber,
              Address: shipperAddress,
              Phone: { Number: shipment.sender.phone },
            },
            ShipTo: {
              Name: shipment.recipient.name,
              Address: shipToAddress,
              Phone: { Number: shipment.recipient.phone },
            },
            ShipFrom: {
              Name: shipment.sender.name,
              Address: shipperAddress,
            },
            PaymentInformation: {
              ShipmentCharge: {
                Type: "01",
                BillShipper: { AccountNumber: credentials.accountNumber },
              },
            },
            Service: { Code: shipment.serviceType || "11" },
            Package: {
              PackagingType: { Code: shipment.packagingType || "02" },
              PackageWeight: {
                UnitOfMeasurement: { Code: "KGS" },
                Weight: shipment.weight.toString(),
              },
              Dimensions: {
                UnitOfMeasurement: { Code: "CM" },
                Length: shipment.dimensions.length.toString(),
                Width: shipment.dimensions.width.toString(),
                Height: shipment.dimensions.height.toString(),
              },
            },
          },
          LabelSpecification: {
            LabelImageFormat: { Code: "PDF" },
            HTTPUserAgent: "Mozilla/5.0",
          },
        },
      };

      // Call UPS API
      const upsApi = "https://onlinetools.ups.com/api/shipments/v1/ship";

      const response = await axios.post(upsApi, params, {
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (
        !response.data ||
        !response.data.ShipmentResponse ||
        !response.data.ShipmentResponse.ShipmentResults
      ) {
        throw new Error("Invalid response from UPS API");
      }

      const results = response.data.ShipmentResponse.ShipmentResults;

      // Save UPS tracking info and response
      const trackingInfo = {
        trackingNumber: results.ShipmentIdentificationNumber,
        trackingUrl: `https://www.ups.com/track?tracknum=${results.ShipmentIdentificationNumber}`,
        labelUrl: results.PackageResults.ShippingLabel.GraphicImage,
        carrierData: response.data,
      };

      // Update shipment with tracking info
      await Shipment.findByIdAndUpdate(shipment._id, {
        tracking: trackingInfo,
        status: "created",
      });

      return trackingInfo;
    } catch (error) {
      logger.error("Error creating UPS shipment:", error);
      throw new Error(`Failed to create UPS shipment: ${error.message}`);
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
        case "fedex":
          return await this.getFedExTracking(trackingNumber, carrier);
        case "dhl":
          return await this.getDHLTracking(trackingNumber, carrier);
        case "ups":
          return await this.getUPSTracking(trackingNumber, carrier);
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
   * Get tracking info from FedEx
   * @param {String} trackingNumber - Tracking number
   * @param {Object} carrier - Carrier object with credentials
   * @returns {Promise<Object>} Tracking info
   */
  async getFedExTracking(trackingNumber, carrier) {
    try {
      const { credentials } = carrier;

      if (!credentials || !credentials.apiKey || !credentials.apiSecret) {
        throw new BadRequestError("Missing FedEx API credentials");
      }

      // Get authentication token first
      const authResponse = await axios.post(
        "https://apis-sandbox.fedex.com/oauth/token",
        {
          grant_type: "client_credentials",
          client_id: credentials.apiKey,
          client_secret: credentials.apiSecret,
        }
      );

      const token = authResponse.data.access_token;

      // Call tracking API
      const response = await axios.post(
        "https://apis-sandbox.fedex.com/track/v1/trackingnumbers",
        {
          trackingInfo: [
            {
              trackingNumberInfo: {
                trackingNumber: trackingNumber,
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        !response.data ||
        !response.data.output ||
        !response.data.output.completeTrackResults
      ) {
        throw new Error("Invalid response from FedEx tracking API");
      }

      const trackResult = response.data.output.completeTrackResults[0];
      const trackDetail = trackResult.trackResults[0];

      return {
        trackingNumber,
        carrier: "FedEx",
        status: this.mapFedExStatus(trackDetail.latestStatusDetail.code),
        estimatedDelivery: trackDetail.dateAndTimes
          .filter((dt) => dt.type === "ESTIMATED_DELIVERY")
          .map((dt) => dt.dateTime)[0],
        currentLocation: trackDetail.latestStatusDetail.scanLocation,
        events: trackDetail.scanEvents.map((event) => ({
          timestamp: event.date,
          status: event.eventDescription,
          location: event.scanLocation,
          details: event.eventDescription,
        })),
        carrierData: response.data,
      };
    } catch (error) {
      logger.error(
        `Error getting FedEx tracking for ${trackingNumber}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Map FedEx status code to standardized status
   * @param {String} statusCode - FedEx status code
   * @returns {String} Standardized status
   */
  mapFedExStatus(statusCode) {
    const statusMap = {
      DL: "delivered",
      OD: "out_for_delivery",
      IT: "in_transit",
      AP: "available_for_pickup",
      DP: "departed",
      AR: "arrived",
      PU: "picked_up",
    };

    return statusMap[statusCode] || "unknown";
  }

  /**
   * Get tracking info from DHL
   * @param {String} trackingNumber - Tracking number
   * @param {Object} carrier - Carrier object with credentials
   * @returns {Promise<Object>} Tracking info
   */
  async getDHLTracking(trackingNumber, carrier) {
    try {
      const { credentials } = carrier;

      if (!credentials || !credentials.apiKey) {
        throw new BadRequestError("Missing DHL API credentials");
      }

      // Call DHL tracking API
      const response = await axios.get(
        `https://api-mock.dhl.com/track/shipments?trackingNumber=${trackingNumber}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              credentials.apiKey + ":" + (credentials.apiSecret || "")
            ).toString("base64")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        !response.data ||
        !response.data.shipments ||
        response.data.shipments.length === 0
      ) {
        throw new Error("Invalid response from DHL tracking API");
      }

      const shipment = response.data.shipments[0];

      return {
        trackingNumber,
        carrier: "DHL",
        status: this.mapDHLStatus(shipment.status.statusCode),
        estimatedDelivery: shipment.estimatedDeliveryTimeFrame?.estimatedFrom,
        currentLocation: shipment.status.location?.address?.addressLocality,
        events: shipment.events.map((event) => ({
          timestamp: event.timestamp,
          status: event.description,
          location: event.location?.address?.addressLocality,
          details: event.description,
        })),
        carrierData: response.data,
      };
    } catch (error) {
      logger.error(`Error getting DHL tracking for ${trackingNumber}:`, error);
      throw error;
    }
  }

  /**
   * Map DHL status code to standardized status
   * @param {String} statusCode - DHL status code
   * @returns {String} Standardized status
   */
  mapDHLStatus(statusCode) {
    const statusMap = {
      delivered: "delivered",
      "shipment-delivered": "delivered",
      transit: "in_transit",
      "out-for-delivery": "out_for_delivery",
      processed: "processed",
      "departed-facility": "departed",
    };

    return statusMap[statusCode] || "unknown";
  }

  /**
   * Get tracking info from UPS
   * @param {String} trackingNumber - Tracking number
   * @param {Object} carrier - Carrier object with credentials
   * @returns {Promise<Object>} Tracking info
   */
  async getUPSTracking(trackingNumber, carrier) {
    try {
      const { credentials } = carrier;

      if (!credentials || !credentials.apiKey) {
        throw new BadRequestError("Missing UPS API credentials");
      }

      // Call UPS tracking API
      const response = await axios.get(
        `https://onlinetools.ups.com/api/track/v1/details/${trackingNumber}`,
        {
          headers: {
            Authorization: `Bearer ${credentials.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        !response.data ||
        !response.data.trackResponse ||
        !response.data.trackResponse.shipment
      ) {
        throw new Error("Invalid response from UPS tracking API");
      }

      const shipment = response.data.trackResponse.shipment[0];

      return {
        trackingNumber,
        carrier: "UPS",
        status: this.mapUPSStatus(shipment.currentStatus.code),
        estimatedDelivery: shipment.deliveryDate[0].date,
        currentLocation: shipment.currentStatus.location,
        events: shipment.activity.map((activity) => ({
          timestamp: `${activity.date}T${activity.time}`,
          status: activity.status.description,
          location: activity.location.address.city,
          details: activity.status.description,
        })),
        carrierData: response.data,
      };
    } catch (error) {
      logger.error(`Error getting UPS tracking for ${trackingNumber}:`, error);
      throw error;
    }
  }

  /**
   * Map UPS status code to standardized status
   * @param {String} statusCode - UPS status code
   * @returns {String} Standardized status
   */
  mapUPSStatus(statusCode) {
    const statusMap = {
      D: "delivered",
      I: "in_transit",
      O: "out_for_delivery",
      P: "picked_up",
      X: "exception",
    };

    return statusMap[statusCode] || "unknown";
  }

  /**
   * Generate shipping label for a shipment
   * @param {String} shipmentId - Shipment ID
   * @param {Object} options - Label generation options
   * @returns {Promise<Object>} Label information
   */
  async generateShippingLabel(shipmentId, options = {}) {
    try {
      const shipment = await Shipment.findById(shipmentId)
        .populate("order")
        .populate("carrier");

      if (!shipment) {
        throw new NotFoundError("Shipment not found");
      }

      // Default options
      const labelOptions = {
        format: options.format || "PDF",
        size: options.size || "4x6",
        includeReturn:
          options.includeReturn !== undefined ? options.includeReturn : true,
        includeCustoms:
          options.includeCustoms !== undefined
            ? options.includeCustoms
            : shipment.isInternational,
      };

      // Check if we need to call carrier API or generate locally
      if (
        shipment.carrier &&
        shipment.carrier.capabilities.includes("labelGeneration")
      ) {
        // Use carrier API
        return await this.generateCarrierLabel(shipment, labelOptions);
      } else {
        // Generate locally
        return await this.generateLocalLabel(shipment, labelOptions);
      }
    } catch (error) {
      logger.error("Error generating shipping label:", error);
      throw error;
    }
  }

  /**
   * Generate international customs documentation for a shipment
   * @param {String} shipmentId - Shipment ID
   * @param {Object} customsData - Customs information
   * @returns {Promise<Object>} Generated customs document info
   */
  async generateCustomsDocumentation(shipmentId, customsData) {
    try {
      const shipment = await Shipment.findById(shipmentId)
        .populate("order")
        .populate("carrier");

      if (!shipment) {
        throw new NotFoundError("Shipment not found");
      }

      // Verify this is an international shipment
      if (!shipment.isInternational) {
        throw new BadRequestError(
          "Customs documentation only required for international shipments"
        );
      }

      const order = shipment.order;

      // Default customs data if not provided
      const customs = {
        contentType: customsData.contentType || "MERCHANDISE",
        contentDescription: customsData.contentDescription || "Retail products",
        exporterReference: customsData.exporterReference || order.orderNumber,
        importerReference: customsData.importerReference || "",
        invoiceNumber: customsData.invoiceNumber || order.orderNumber,
        termsOfTrade: customsData.termsOfTrade || "DDU", // Delivered Duty Unpaid
        comment: customsData.comment || "",
        declarationStatement:
          customsData.declarationStatement ||
          "I certify that all information contained in this invoice is true and correct.",
        senderEIN: customsData.senderEIN || process.env.COMPANY_EIN || "",
        recipientTaxID: customsData.recipientTaxID || "",
        items:
          customsData.items ||
          shipment.items.map((item) => ({
            description: item.name,
            hsCode: item.hsCode || "",
            countryOfOrigin: process.env.ORIGIN_COUNTRY_CODE || "IN",
            quantity: item.quantity,
            weight: item.weight, // in kg
            value: item.price,
            skuNumber: item.sku || "",
          })),
      };

      // Create customs documentation file
      const customsDocPath = await this.createCustomsDocPDF(shipment, customs);

      // Update shipment with customs information
      shipment.customs = {
        documentPath: customsDocPath,
        contentType: customs.contentType,
        contentDescription: customs.contentDescription,
        exporterReference: customs.exporterReference,
        createdAt: new Date(),
      };

      await shipment.save();

      // If using a carrier API, also submit customs electronically
      if (
        shipment.carrier &&
        shipment.carrier.capabilities.includes("customsIntegration")
      ) {
        const carrierCustomsResult = await this.submitCustomsToCarrier(
          shipment,
          customs
        );

        if (carrierCustomsResult.success) {
          shipment.customs.carrierReference = carrierCustomsResult.referenceId;
          await shipment.save();
        }
      }

      return {
        success: true,
        shipmentId: shipment._id,
        documentPath: customsDocPath,
        ...shipment.customs,
      };
    } catch (error) {
      logger.error("Error generating customs documentation:", error);
      throw error;
    }
  }

  /**
   * Create a PDF document for customs declaration
   * @param {Object} shipment - Shipment object
   * @param {Object} customs - Customs data
   * @returns {Promise<String>} Path to generated PDF
   */
  async createCustomsDocPDF(shipment, customs) {
    return new Promise((resolve, reject) => {
      try {
        const order = shipment.order;
        const uploadsDir = path.join(__dirname, "../../uploads/customs");

        // Ensure directory exists
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `customs_${shipment._id}_${Date.now()}.pdf`;
        const outputPath = path.join(uploadsDir, filename);

        // Create a new PDF document
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
          info: {
            Title: "Customs Declaration",
            Author: "E-commerce System",
          },
        });

        // Pipe output to file
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add content to PDF
        // Header
        doc.fontSize(18).text("CUSTOMS DECLARATION FORM", { align: "center" });
        doc.moveDown();

        // Sender and Recipient
        doc.fontSize(12).text("FROM:", { underline: true });
        doc
          .fontSize(10)
          .text(`${order.shippingAddress.company || ""}`)
          .text(
            `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
          )
          .text(`${order.shippingAddress.addressLine1}`)
          .text(`${order.shippingAddress.addressLine2 || ""}`)
          .text(
            `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`
          )
          .text(`${order.shippingAddress.country}`)
          .text(`Phone: ${order.shippingAddress.phone}`);

        doc.moveDown();

        doc.fontSize(12).text("TO:", { underline: true });
        doc
          .fontSize(10)
          .text(`${order.shippingAddress.company || ""}`)
          .text(
            `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
          )
          .text(`${order.shippingAddress.addressLine1}`)
          .text(`${order.shippingAddress.addressLine2 || ""}`)
          .text(
            `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`
          )
          .text(`${order.shippingAddress.country}`)
          .text(`Phone: ${order.shippingAddress.phone}`);

        doc.moveDown();

        // Shipment details
        doc.fontSize(12).text("SHIPMENT DETAILS:", { underline: true });
        doc
          .fontSize(10)
          .text(`Order Number: ${order.orderNumber}`)
          .text(`Tracking Number: ${shipment.trackingNumber || "Pending"}`)
          .text(`Ship Date: ${shipment.createdAt.toLocaleDateString()}`)
          .text(`Package Weight: ${shipment.weight} kg`)
          .text(`Content Type: ${customs.contentType}`)
          .text(`Content Description: ${customs.contentDescription}`)
          .text(`Terms of Trade: ${customs.termsOfTrade}`);

        doc.moveDown();

        // Items table
        doc.fontSize(12).text("ITEM DETAILS:", { underline: true });
        doc.moveDown();

        // Table header
        const tableTop = doc.y;
        const itemX = 50;
        const descriptionX = 100;
        const hsCodeX = 250;
        const originX = 300;
        const qtyX = 350;
        const valueX = 400;
        const weightX = 450;

        doc.fontSize(8);
        doc.text("Item", itemX, tableTop);
        doc.text("Description", descriptionX, tableTop);
        doc.text("HS Code", hsCodeX, tableTop);
        doc.text("Origin", originX, tableTop);
        doc.text("Qty", qtyX, tableTop);
        doc.text("Value", valueX, tableTop);
        doc.text("Weight", weightX, tableTop);

        doc
          .moveTo(itemX, tableTop + 15)
          .lineTo(weightX + 50, tableTop + 15)
          .stroke();

        // Table rows
        let y = tableTop + 20;

        // Track totals
        let totalQuantity = 0;
        let totalValue = 0;
        let totalWeight = 0;

        customs.items.forEach((item, index) => {
          // Check if we need a new page
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          doc.text((index + 1).toString(), itemX, y);
          doc.text(item.description.substring(0, 25), descriptionX, y);
          doc.text(item.hsCode, hsCodeX, y);
          doc.text(item.countryOfOrigin, originX, y);
          doc.text(item.quantity.toString(), qtyX, y);
          doc.text(`$${item.value.toFixed(2)}`, valueX, y);
          doc.text(`${item.weight} kg`, weightX, y);

          totalQuantity += item.quantity;
          totalValue += item.value * item.quantity;
          totalWeight += item.weight * item.quantity;

          y += 20;
        });

        // Totals row
        doc
          .moveTo(itemX, y)
          .lineTo(weightX + 50, y)
          .stroke();

        y += 10;
        doc.text("TOTALS:", descriptionX, y);
        doc.text(totalQuantity.toString(), qtyX, y);
        doc.text(`$${totalValue.toFixed(2)}`, valueX, y);
        doc.text(`${totalWeight.toFixed(2)} kg`, weightX, y);

        doc.moveDown(2);

        // Declaration and signature
        doc.fontSize(10).text("DECLARATION:", { underline: true });
        doc.fontSize(8).text(customs.declarationStatement);

        doc.moveDown();

        // Signature line
        const signatureY = doc.y + 30;
        doc.moveTo(50, signatureY).lineTo(200, signatureY).stroke();
        doc.text("Signature", 100, signatureY + 5);

        // Date line
        doc.moveTo(300, signatureY).lineTo(450, signatureY).stroke();
        doc.text("Date", 360, signatureY + 5);

        // Finalize PDF and end stream
        doc.end();

        stream.on("finish", () => {
          resolve(`uploads/customs/${filename}`);
        });

        stream.on("error", (err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Submit customs information to carrier API
   * @param {Object} shipment - Shipment record
   * @param {Object} customs - Customs data
   * @returns {Promise<Object>} Carrier response
   */
  async submitCustomsToCarrier(shipment, customs) {
    try {
      const carrier = shipment.carrier;

      if (!carrier) {
        throw new Error("No carrier information found for shipment");
      }

      switch (carrier.code.toLowerCase()) {
        case "delhivery":
          return await this.submitDelhiveryCustoms(shipment, customs);

        case "shiprocket":
          return await this.submitShiprocketCustoms(shipment, customs);

        default:
          throw new Error(
            `Carrier ${carrier.code} does not support electronic customs submission`
          );
      }
    } catch (error) {
      logger.error("Error submitting customs to carrier:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit customs data to Delhivery for international shipment
   * @param {Object} shipment - Shipment record
   * @param {Object} customs - Customs data
   * @returns {Promise<Object>} API response
   */
  async submitDelhiveryCustoms(shipment, customs) {
    try {
      const order = shipment.order;
      const credentials = JSON.parse(
        crypto
          .createDecipheriv(
            "aes-256-cbc",
            Buffer.from(process.env.ENCRYPTION_KEY),
            Buffer.from(shipment.carrier.credentials.initVector, "hex")
          )
          .update(shipment.carrier.credentials.encryptedData, "hex", "utf8")
      );

      const apiKey = credentials.apiKey;

      // Format items for Delhivery
      const items = customs.items.map((item) => ({
        name: item.description,
        sku: item.skuNumber,
        quantity: item.quantity,
        price: item.value,
        weight: item.weight,
        origin_country: item.countryOfOrigin,
        hs_code: item.hsCode,
      }));

      // API call to Delhivery
      const response = await axios.post(
        `${process.env.DELHIVERY_BASE_URL}/customs/international`,
        {
          waybill: shipment.trackingNumber,
          order_id: order.orderNumber,
          shipment_id: shipment._id.toString(),
          declared_value: customs.items.reduce(
            (sum, item) => sum + item.value * item.quantity,
            0
          ),
          content_type: customs.contentType,
          description: customs.contentDescription,
          origin_country: process.env.ORIGIN_COUNTRY_CODE || "IN",
          destination_country: order.shippingAddress.country,
          eori_number: customs.senderEIN,
          vat_number: customs.recipientTaxID,
          incoterms: customs.termsOfTrade,
          items,
        },
        {
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        return {
          success: true,
          referenceId: response.data.customs_id || response.data.reference_id,
        };
      } else {
        throw new Error(
          response.data.error || "Unknown error from Delhivery API"
        );
      }
    } catch (error) {
      logger.error("Error submitting customs to Delhivery:", error);
      throw error;
    }
  }

  /**
   * Submit customs data to Shiprocket for international shipment
   * @param {Object} shipment - Shipment record
   * @param {Object} customs - Customs data
   * @returns {Promise<Object>} API response
   */
  async submitShiprocketCustoms(shipment, customs) {
    try {
      const order = shipment.order;
      const credentials = JSON.parse(
        crypto
          .createDecipheriv(
            "aes-256-cbc",
            Buffer.from(process.env.ENCRYPTION_KEY),
            Buffer.from(shipment.carrier.credentials.initVector, "hex")
          )
          .update(shipment.carrier.credentials.encryptedData, "hex", "utf8")
      );

      // Get token first
      const tokenResponse = await axios.post(
        `${process.env.SHIPROCKET_BASE_URL}/auth/login`,
        {
          email: credentials.email,
          password: credentials.password,
        }
      );

      if (!tokenResponse.data || !tokenResponse.data.token) {
        throw new Error("Failed to authenticate with Shiprocket");
      }

      const token = tokenResponse.data.token;

      // Format items for Shiprocket
      const items = customs.items.map((item) => ({
        item_name: item.description,
        sku: item.skuNumber,
        quantity: item.quantity,
        price: item.value,
        item_weight: item.weight,
        origin_country: item.countryOfOrigin,
        hs_code: item.hsCode,
      }));

      // API call to Shiprocket for customs
      const response = await axios.post(
        `${process.env.SHIPROCKET_BASE_URL}/international/customs-declaration`,
        {
          order_id: order.orderNumber,
          shipment_id: shipment.externalShipmentId || shipment._id.toString(),
          awb_number: shipment.trackingNumber,
          declared_value: customs.items.reduce(
            (sum, item) => sum + item.value * item.quantity,
            0
          ),
          content_type: customs.contentType,
          description: customs.contentDescription,
          origin_country: process.env.ORIGIN_COUNTRY_CODE || "IN",
          destination_country: order.shippingAddress.country,
          incoterms: customs.termsOfTrade,
          eori_number: customs.senderEIN,
          recipientTaxID: customs.recipientTaxID,
          items,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.customs_id) {
        return {
          success: true,
          referenceId: response.data.customs_id,
        };
      } else {
        throw new Error(
          response.data.message || "Unknown error from Shiprocket API"
        );
      }
    } catch (error) {
      logger.error("Error submitting customs to Shiprocket:", error);
      throw error;
    }
  }
}

module.exports = new ShippingService();
