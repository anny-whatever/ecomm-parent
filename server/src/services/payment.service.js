// src/services/payment.service.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const logger = require("../config/logger");
const { BadRequestError, InternalServerError, NotFoundError } = require("../utils/errorTypes");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");

// Initialize Razorpay only if keys are available (not in test environment)
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else if (process.env.NODE_ENV === 'test') {
  // Mock Razorpay for tests
  razorpay = {
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_mockrazorpay123',
        amount: 10000,
        currency: 'INR',
        receipt: 'receipt_mock123',
        status: 'created'
      })
    },
    payments: {
      fetch: jest.fn().mockResolvedValue({
        id: 'pay_mockrazorpay123',
        amount: 10000,
        currency: 'INR',
        status: 'authorized',
        order_id: 'order_mockrazorpay123',
        method: 'card'
      }),
      capture: jest.fn().mockResolvedValue({
        id: 'pay_mockrazorpay123',
        amount: 10000,
        currency: 'INR',
        status: 'captured',
        order_id: 'order_mockrazorpay123',
        method: 'card'
      })
    }
  };
} else {
  logger.warn('Razorpay API keys missing! Payment features will not work correctly.');
  // Create a mock object that will log errors if used
  razorpay = new Proxy({}, {
    get: (target, prop) => {
      return new Proxy({}, {
        get: () => () => {
          throw new Error('Razorpay not properly initialized. Check API keys.');
        }
      });
    }
  });
}

/**
 * Create a new Razorpay order
 * @param {Object} orderData - Order data for payment
 * @param {Number} orderData.amount - Amount in smallest currency unit (paise for INR)
 * @param {String} orderData.currency - Currency code (INR)
 * @param {String} orderData.receipt - Receipt ID (usually your system's order ID)
 * @param {Object} orderData.notes - Additional notes for order
 * @returns {Promise<Object>} Razorpay order object and saved payment record
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
    const razorpayOrder = await razorpay.orders.create(options);

    // Extract order ID from receipt
    const orderId = options.receipt.split('_')[1];
    
    // Create a payment record in our database
    const paymentRecord = await Payment.createPaymentRecord({
      orderId,
      userId: orderData.notes.userId !== "guest" ? orderData.notes.userId : null,
      guestId: orderData.notes.userId === "guest" ? orderData.notes.guestId : null,
      amount: options.amount / 100, // Convert back to regular units
      currency: options.currency,
      razorpayOrderId: razorpayOrder.id,
      status: "created",
      notes: options.notes,
    });

    return {
      razorpayOrder,
      paymentRecord
    };
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
 * @returns {Promise<Object>} Verification result and updated payment record
 */
const verifyPaymentSignature = async (paymentData) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      paymentData;

    // Create signature verification string
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    // Compare signatures
    const isValid = expectedSignature === razorpaySignature;
    
    // Update payment record in our database
    const paymentRecord = await Payment.updatePaymentRecord(razorpayOrderId, {
      razorpayPaymentId,
      signatureVerified: isValid,
      status: isValid ? "authorized" : "failed",
      errorMessage: isValid ? null : "Signature verification failed",
    });
    
    if (!paymentRecord) {
      throw new NotFoundError("Payment record not found");
    }
    
    // If signature is valid, capture the payment
    let capturedPayment = null;
    if (isValid) {
      capturedPayment = await capturePayment(razorpayPaymentId);
      
      // Update order status
      await Order.findByIdAndUpdate(paymentRecord.orderId, {
        paymentStatus: "paid",
        paymentId: paymentRecord._id
      });
    }
    
    return {
      isValid,
      paymentRecord,
      capturedPayment
    };
  } catch (error) {
    logger.error("Error verifying payment signature:", error);
    throw new BadRequestError(`Invalid payment signature: ${error.message}`);
  }
};

/**
 * Capture an authorized payment
 * @param {String} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Captured payment details
 */
const capturePayment = async (paymentId) => {
  try {
    // Fetch payment details to get amount
    const paymentDetails = await razorpay.payments.fetch(paymentId);
    
    // Capture the payment
    const capturedPayment = await razorpay.payments.capture(paymentId, paymentDetails.amount, paymentDetails.currency);
    
    // Update payment record in our database
    await Payment.updatePaymentRecord(capturedPayment.order_id, {
      status: "captured",
      paymentMethod: capturedPayment.method,
      metadata: {
        card: capturedPayment.card,
        bank: capturedPayment.bank,
        wallet: capturedPayment.wallet,
        vpa: capturedPayment.vpa
      }
    });
    
    return capturedPayment;
  } catch (error) {
    logger.error(`Error capturing payment ${paymentId}:`, error);
    throw new InternalServerError(`Failed to capture payment: ${error.message}`);
  }
};

/**
 * Get payment details
 * @param {String} paymentId - Razorpay payment ID or internal payment ID
 * @returns {Promise<Object>} Merged payment details from Razorpay and our database
 */
const getPaymentDetails = async (paymentId) => {
  try {
    // Check if the ID is a MongoDB ObjectId (our internal ID) or a Razorpay ID
    let paymentRecord;
    let razorpayData;
    
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(paymentId);
    
    if (isMongoId) {
      // Fetch by our internal payment ID
      paymentRecord = await Payment.findById(paymentId);
      if (!paymentRecord) {
        throw new NotFoundError("Payment record not found");
      }
      
      // If we have a Razorpay payment ID, fetch from Razorpay too
      if (paymentRecord.razorpayPaymentId) {
        razorpayData = await razorpay.payments.fetch(paymentRecord.razorpayPaymentId);
      }
    } else {
      // Assumed to be a Razorpay payment ID
      razorpayData = await razorpay.payments.fetch(paymentId);
      
      // Find our internal record
      paymentRecord = await Payment.findOne({ razorpayPaymentId: paymentId });
    }
    
    // Merge data
    return {
      internal: paymentRecord,
      razorpay: razorpayData
    };
  } catch (error) {
    logger.error(`Error fetching payment details for ${paymentId}:`, error);
    throw new BadRequestError(`Failed to retrieve payment details: ${error.message}`);
  }
};

/**
 * Get all payment records with pagination
 * @param {Object} options - Query options
 * @param {Number} options.page - Page number
 * @param {Number} options.limit - Items per page
 * @param {String} options.userId - Filter by user ID
 * @param {String} options.status - Filter by payment status
 * @returns {Promise<Object>} Paginated payment records
 */
const getAllPayments = async (options) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Build query
  const query = {};
  if (options.userId) query.userId = options.userId;
  if (options.status) query.status = options.status;
  
  try {
    // Count total records
    const total = await Payment.countDocuments(query);
    
    // Get payment records
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId', 'orderNumber total');
    
    // Return paginated results
    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error("Error fetching payment records:", error);
    throw new InternalServerError(`Failed to retrieve payment records: ${error.message}`);
  }
};

/**
 * Process refund for payment
 * @param {String} paymentId - Razorpay payment ID
 * @param {Number} amount - Refund amount
 * @param {String} reason - Refund reason
 * @param {Boolean} fullRefund - Whether this is a full refund
 * @returns {Promise<Object>} Refund details and updated payment record
 */
const processRefund = async (paymentId, amount, reason, fullRefund = false) => {
  try {
    // Get payment details to validate
    const paymentDetails = await getPaymentDetails(paymentId);
    
    if (!paymentDetails.razorpay) {
      throw new BadRequestError("Cannot process refund: No Razorpay payment data found");
    }
    
    if (paymentDetails.razorpay.status !== "captured") {
      throw new BadRequestError(`Cannot refund payment in ${paymentDetails.razorpay.status} status`);
    }
    
    // If full refund is requested, use the original amount
    const amountToRefund = fullRefund 
      ? paymentDetails.razorpay.amount 
      : Math.round(amount * 100); // Convert to paise
    
    // Create refund options
    const options = {
      payment_id: paymentDetails.razorpay.id,
      amount: amountToRefund,
      notes: {
        reason: reason,
        refundedAt: new Date().toISOString(),
        orderId: paymentDetails.internal.orderId,
      },
    };

    // Process refund
    const refund = await razorpay.payments.refund(options);

    // Record the refund in our database
    const refundData = {
      razorpayRefundId: refund.id,
      amount: refund.amount / 100, // Convert back to regular units
      status: "pending",
      reason: reason,
    };
    
    const updatedPayment = await Payment.recordRefund(
      paymentDetails.razorpay.id, 
      refundData
    );
    
    // If it's a full refund, update the order status
    if (fullRefund) {
      await Order.findByIdAndUpdate(paymentDetails.internal.orderId, {
        status: "refunded",
      });
    }

    return {
      refund,
      paymentRecord: updatedPayment
    };
  } catch (error) {
    logger.error(`Error processing refund for payment ${paymentId}:`, error);
    throw new InternalServerError(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Create a recurring payment plan
 * @param {Object} planData - Plan details
 * @returns {Promise<Object>} Created plan
 */
const createSubscriptionPlan = async (planData) => {
  try {
    const plan = await razorpay.plans.create({
      period: planData.period,
      interval: planData.interval,
      item: {
        name: planData.name,
        amount: Math.round(planData.amount * 100), // Convert to paise
        currency: planData.currency || "INR",
        description: planData.description || '',
      },
      notes: planData.notes || {}
    });
    
    return plan;
  } catch (error) {
    logger.error("Error creating subscription plan:", error);
    throw new InternalServerError(`Failed to create subscription plan: ${error.message}`);
  }
};

/**
 * Create a subscription
 * @param {Object} subscriptionData - Subscription details
 * @returns {Promise<Object>} Created subscription
 */
const createSubscription = async (subscriptionData) => {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: subscriptionData.planId,
      total_count: subscriptionData.totalCycles,
      customer_notify: subscriptionData.notifyCustomer || 1,
      start_at: subscriptionData.startAt || Math.floor(Date.now() / 1000) + 60, // Default to 1 minute from now
      notes: subscriptionData.notes || {}
    });
    
    return subscription;
  } catch (error) {
    logger.error("Error creating subscription:", error);
    throw new InternalServerError(`Failed to create subscription: ${error.message}`);
  }
};

/**
 * Verify and authenticate payment from a UPI app
 * @param {Object} upiData - UPI verification data
 * @returns {Promise<Object>} UPI verification result
 */
const verifyUpi = async (upiData) => {
  try {
    // Simulate UPI verification - in a real app you'd call Razorpay API
    // This is a placeholder since Razorpay doesn't have a direct UPI verification API
    
    // Validate that the VPA (UPI ID) is correctly formatted
    const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!vpaRegex.test(upiData.vpa)) {
      throw new BadRequestError("Invalid UPI ID format");
    }
    
    return {
      verified: true,
      vpa: upiData.vpa,
      paymentMethod: "upi"
    };
  } catch (error) {
    logger.error("Error verifying UPI:", error);
    throw new BadRequestError(`UPI verification failed: ${error.message}`);
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
    let result;

    switch (event) {
      case "payment.authorized":
        result = await handlePaymentAuthorized(payload);
        break;

      case "payment.captured":
        result = await handlePaymentCaptured(payload);
        break;

      case "payment.failed":
        result = await handlePaymentFailed(payload);
        break;

      case "refund.processed":
        result = await handleRefundProcessed(payload);
        break;
        
      case "refund.failed":
        result = await handleRefundFailed(payload);
        break;
        
      case "payment.dispute.created":
        result = await handleDisputeCreated(payload);
        break;
        
      case "order.paid":
        result = await handleOrderPaid(payload);
        break;

      default:
        logger.info(`Unhandled Razorpay webhook event: ${event}`);
        result = { handled: false, event };
    }
    
    // Record webhook event in our payment record
    if (payload.payment && payload.payment.entity && payload.payment.entity.order_id) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: payload.payment.entity.order_id },
        {
          $push: {
            webhookEvents: {
              eventId: webhookData.id,
              eventType: event,
              data: payload,
            }
          }
        }
      );
    }

    return result;
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
    // Update payment record
    await Payment.updatePaymentRecord(payload.payment.entity.order_id, {
      razorpayPaymentId: payload.payment.entity.id,
      status: "authorized",
      paymentMethod: payload.payment.entity.method,
      metadata: {
        card: payload.payment.entity.card,
        bank: payload.payment.entity.bank,
        wallet: payload.payment.entity.wallet,
        vpa: payload.payment.entity.vpa
      }
    });

    logger.info(`Payment authorized for order ${payload.payment.entity.order_id}`);

    return {
      handled: true,
      event: "payment.authorized",
      paymentId: payload.payment.entity.id,
      orderId: payload.payment.entity.order_id,
    };
  } catch (error) {
    logger.error(
      `Error handling payment authorized for order ${payload.payment.entity.order_id}:`,
      error
    );
    throw error;
  }
};

/**
 * Handle payment captured webhook
 * @param {Object} payload - Webhook payload
 * @returns {Promise<Object>} Processing result
 */
const handlePaymentCaptured = async (payload) => {
  try {
    // Update payment record
    const payment = await Payment.updatePaymentRecord(payload.payment.entity.order_id, {
      status: "captured"
    });
    
    // Update order status
    if (payment && payment.orderId) {
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: "paid",
        paymentId: payment._id
      });
    }

    logger.info(`Payment captured for order ${payload.payment.entity.order_id}`);

    return {
      handled: true,
      event: "payment.captured",
      paymentId: payload.payment.entity.id,
      orderId: payload.payment.entity.order_id,
    };
  } catch (error) {
    logger.error(
      `Error handling payment captured for order ${payload.payment.entity.order_id}:`,
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
    // Update payment record
    const payment = await Payment.updatePaymentRecord(payload.payment.entity.order_id, {
      status: "failed",
      errorMessage: payload.payment.entity.error_description,
      errorCode: payload.payment.entity.error_code
    });
    
    // Update order status
    if (payment && payment.orderId) {
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: "failed"
      });
    }

    logger.info(`Payment failed for order ${payload.payment.entity.order_id}`);

    return {
      handled: true,
      event: "payment.failed",
      paymentId: payload.payment.entity.id,
      orderId: payload.payment.entity.order_id,
    };
  } catch (error) {
    logger.error(
      `Error handling payment failed for order ${payload.payment.entity.order_id}:`,
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
    // Get payment record
    const payment = await Payment.findOne({ 
      razorpayPaymentId: payload.refund.entity.payment_id 
    });
    
    if (!payment) {
      throw new NotFoundError("Payment record not found");
    }
    
    // Update refund status
    await Payment.findOneAndUpdate(
      { 
        razorpayPaymentId: payload.refund.entity.payment_id,
        "refunds.razorpayRefundId": payload.refund.entity.id
      },
      {
        $set: {
          "refunds.$.status": "processed",
          status: payload.refund.entity.amount === payment.amount * 100 ? "refunded" : "partially_refunded"
        }
      }
    );
    
    // If it's a full refund, update the order
    if (payload.refund.entity.amount === payment.amount * 100) {
      await Order.findByIdAndUpdate(payment.orderId, {
        status: "refunded"
      });
    }

    logger.info(`Refund processed for payment ${payload.refund.entity.payment_id}`);

    return {
      handled: true,
      event: "refund.processed",
      refundId: payload.refund.entity.id,
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

/**
 * Handle refund failed webhook
 * @param {Object} payload - Webhook payload
 * @returns {Promise<Object>} Processing result
 */
const handleRefundFailed = async (payload) => {
  try {
    // Update refund status
    await Payment.findOneAndUpdate(
      { 
        razorpayPaymentId: payload.refund.entity.payment_id,
        "refunds.razorpayRefundId": payload.refund.entity.id
      },
      {
        $set: {
          "refunds.$.status": "failed"
        }
      }
    );

    logger.info(`Refund failed for payment ${payload.refund.entity.payment_id}`);

    return {
      handled: true,
      event: "refund.failed",
      refundId: payload.refund.entity.id,
      paymentId: payload.refund.entity.payment_id,
    };
  } catch (error) {
    logger.error(
      `Error handling refund failed for payment ${payload.refund.entity.payment_id}:`,
      error
    );
    throw error;
  }
};

/**
 * Handle dispute created webhook
 * @param {Object} payload - Webhook payload
 * @returns {Promise<Object>} Processing result
 */
const handleDisputeCreated = async (payload) => {
  try {
    // Update payment status
    await Payment.findOneAndUpdate(
      { razorpayPaymentId: payload.payment.entity.id },
      {
        $set: {
          status: "disputed"
        }
      }
    );

    logger.info(`Dispute created for payment ${payload.payment.entity.id}`);

    return {
      handled: true,
      event: "payment.dispute.created",
      paymentId: payload.payment.entity.id,
    };
  } catch (error) {
    logger.error(
      `Error handling dispute created for payment ${payload.payment.entity.id}:`,
      error
    );
    throw error;
  }
};

/**
 * Handle order paid webhook
 * @param {Object} payload - Webhook payload
 * @returns {Promise<Object>} Processing result
 */
const handleOrderPaid = async (payload) => {
  try {
    // This is a fallback to ensure order is marked as paid
    const payment = await Payment.findOne({
      razorpayOrderId: payload.order.entity.id
    });
    
    if (payment && payment.orderId) {
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: "paid",
        paymentId: payment._id
      });
    }

    logger.info(`Order paid: ${payload.order.entity.id}`);

    return {
      handled: true,
      event: "order.paid",
      orderId: payload.order.entity.id,
    };
  } catch (error) {
    logger.error(
      `Error handling order paid event for ${payload.order.entity.id}:`,
      error
    );
    throw error;
  }
};

module.exports = {
  Payment,
  createRazorpayOrder,
  verifyPaymentSignature,
  capturePayment,
  getPaymentDetails,
  getAllPayments,
  processRefund,
  createSubscriptionPlan,
  createSubscription,
  verifyUpi,
  handleWebhook,
  verifyWebhookSignature,
};
