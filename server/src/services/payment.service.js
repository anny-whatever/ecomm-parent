// src/services/payment.service.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const logger = require("../config/logger");
const { BadRequestError, InternalServerError } = require("../utils/errorTypes");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a new Razorpay order
 * @param {Object} orderData - Order data for payment
 * @param {Number} orderData.amount - Amount in smallest currency unit (paise for INR)
 * @param {String} orderData.currency - Currency code (INR)
 * @param {String} orderData.receipt - Receipt ID (usually your system's order ID)
 * @param {Object} orderData.notes - Additional notes for order
 * @returns {Promise<Object>} Razorpay order object
 */
const createRazorpayOrder = async (orderData) => {
  try {
    // Create order options
    const options = {
      amount: orderData.amount, // amount in the smallest currency unit (paise for INR)
      currency: orderData.currency || "INR",
      receipt: orderData.receipt,
      notes: orderData.notes || {},
    };

    // Create Razorpay order
    const order = await razorpay.orders.create(options);

    return order;
  } catch (error) {
    logger.error("Error creating Razorpay order:", error);
    throw new InternalServerError("Failed to create payment order");
  }
};

/**
 * Verify Razorpay payment signature
 * @param {Object} paymentData - Payment data
 * @param {String} paymentData.razorpayOrderId - Razorpay order ID
 * @param {String} paymentData.razorpayPaymentId - Razorpay payment ID
 * @param {String} paymentData.razorpaySignature - Razorpay signature
 * @returns {Boolean} Whether signature is valid
 */
const verifyPaymentSignature = (paymentData) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      paymentData;

    // Create signature verification string
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    // Compare signatures
    return expectedSignature === razorpaySignature;
  } catch (error) {
    logger.error("Error verifying payment signature:", error);
    throw new BadRequestError("Invalid payment signature");
  }
};

/**
 * Get Razorpay payment details
 * @param {String} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    logger.error(`Error fetching payment details for ${paymentId}:`, error);
    throw new BadRequestError("Failed to retrieve payment details");
  }
};

/**
 * Process refund for payment
 * @param {String} paymentId - Razorpay payment ID
 * @param {Number} amount - Refund amount
 * @param {String} reason - Refund reason
 * @returns {Promise<Object>} Refund details
 */
const processRefund = async (paymentId, amount, reason) => {
  try {
    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create refund options
    const options = {
      payment_id: paymentId,
      amount: amountInPaise,
      notes: {
        reason: reason,
        refundedAt: new Date().toISOString(),
      },
    };

    // Process refund
    const refund = await razorpay.payments.refund(options);

    return refund;
  } catch (error) {
    logger.error(`Error processing refund for payment ${paymentId}:`, error);
    throw new InternalServerError(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Handle Razorpay webhook event
 * @param {Object} webhookData - Webhook data from Razorpay
 * @param {String} signature - Webhook signature
 * @returns {Promise<Object>} Processing result
 */
const handleWebhook = async (webhookData, signature) => {
  try {
    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(webhookData, signature);

    if (!isValidSignature) {
      throw new BadRequestError("Invalid webhook signature");
    }

    // Process webhook based on event
    const { event, payload } = webhookData;

    switch (event) {
      case "payment.authorized":
        return await handlePaymentAuthorized(payload);

      case "payment.failed":
        return await handlePaymentFailed(payload);

      case "refund.processed":
        return await handleRefundProcessed(payload);

      default:
        logger.info(`Unhandled Razorpay webhook event: ${event}`);
        return { handled: false, event };
    }
  } catch (error) {
    logger.error("Error handling webhook:", error);
    throw error;
  }
};

/**
 * Verify Razorpay webhook signature
 * @param {Object} webhookData - Webhook data
 * @param {String} signature - Webhook signature
 * @returns {Boolean} Whether signature is valid
 */
const verifyWebhookSignature = (webhookData, signature) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(webhookData))
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch (error) {
    logger.error("Error verifying webhook signature:", error);
    return false;
  }
};

/**
 * Handle payment authorized webhook
 * @param {Object} payload - Webhook payload
 * @returns {Promise<Object>} Processing result
 */
const handlePaymentAuthorized = async (payload) => {
  try {
    // In a real implementation, you would update your order status here
    // For example: await orderService.updatePaymentStatus(payload.order.receipt, 'paid', payload);

    logger.info(`Payment authorized for order ${payload.order.receipt}`);

    return {
      handled: true,
      event: "payment.authorized",
      orderId: payload.order.receipt,
    };
  } catch (error) {
    logger.error(
      `Error handling payment authorized for order ${payload.order.receipt}:`,
      error
    );
    throw error;
  }
};

/**
 * Handle payment failed webhook
 * @param {Object} payload - Webhook payload
 * @returns {Promise<Object>} Processing result
 */
const handlePaymentFailed = async (payload) => {
  try {
    // In a real implementation, you would update your order status here
    // For example: await orderService.updatePaymentStatus(payload.order.receipt, 'failed', payload);

    logger.info(`Payment failed for order ${payload.order.receipt}`);

    return {
      handled: true,
      event: "payment.failed",
      orderId: payload.order.receipt,
    };
  } catch (error) {
    logger.error(
      `Error handling payment failed for order ${payload.order.receipt}:`,
      error
    );
    throw error;
  }
};

/**
 * Handle refund processed webhook
 * @param {Object} payload - Webhook payload
 * @returns {Promise<Object>} Processing result
 */
const handleRefundProcessed = async (payload) => {
  try {
    // In a real implementation, you would update your order with refund details
    // For example: await orderService.updateRefundStatus(payload.payment.entity.notes.orderId, 'refunded', payload);

    logger.info(
      `Refund processed for payment ${payload.refund.entity.payment_id}`
    );

    return {
      handled: true,
      event: "refund.processed",
      paymentId: payload.refund.entity.payment_id,
    };
  } catch (error) {
    logger.error(
      `Error handling refund processed for payment ${payload.refund.entity.payment_id}:`,
      error
    );
    throw error;
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  processRefund,
  handleWebhook,
};
