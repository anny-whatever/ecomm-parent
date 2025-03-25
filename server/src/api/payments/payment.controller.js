// src/api/payments/payment.controller.js
const paymentService = require("../../services/payment.service");
const cartService = require("../../services/cart.service");
const orderService = require("../../services/order.service");
const { responseFormatter } = require("../../utils/responseFormatter");
const logger = require("../../config/logger");

/**
 * Create a Razorpay order
 * @route POST /api/v1/payments/razorpay/order
 * @access Private
 */
const createPaymentOrder = async (req, res, next) => {
  try {
    // Get the cart for the user
    const cart = await cartService.getOrCreateCart({
      userId: req.user ? req.user._id : null,
      guestId: req.cookies.guestId,
    });

    // Ensure cart has items
    if (!cart.items || cart.items.length === 0) {
      return res
        .status(400)
        .json(responseFormatter(false, "Cannot create payment for empty cart"));
    }

    // Convert cart total to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(cart.total * 100);

    // Create order reference
    const receipt = `cart_${cart._id}_${Date.now()}`;

    // Prepare notes
    const notes = {
      cartId: cart._id.toString(),
      userId: req.user ? req.user._id.toString() : "guest",
      guestId: req.cookies.guestId || null,
      items: cart.items.length,
      total: cart.total,
    };

    // Create Razorpay order
    const { razorpayOrder, paymentRecord } = await paymentService.createRazorpayOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes,
    });

    return res.status(200).json(
      responseFormatter(true, "Payment order created successfully", {
        order: razorpayOrder,
        paymentRecord: {
          id: paymentRecord._id,
          status: paymentRecord.status
        },
        cart: {
          total: cart.total,
          items: cart.items.length,
        },
        key_id: process.env.RAZORPAY_KEY_ID, // For frontend integration
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a Razorpay order for an existing order
 * @route POST /api/v1/payments/razorpay/order/:orderId
 * @access Private
 */
const createPaymentOrderForOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Get the order
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res
        .status(404)
        .json(responseFormatter(false, "Order not found"));
    }

    // Verify the order belongs to the user
    if (order.user && req.user && order.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json(responseFormatter(false, "You are not authorized to access this order"));
    }

    // Convert order total to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(order.total * 100);

    // Create order reference
    const receipt = `order_${order._id}_${Date.now()}`;

    // Prepare notes
    const notes = {
      orderId: order._id.toString(),
      userId: req.user ? req.user._id.toString() : "guest",
      guestId: req.cookies.guestId || null,
      orderNumber: order.orderNumber,
      total: order.total,
    };

    // Create Razorpay order
    const { razorpayOrder, paymentRecord } = await paymentService.createRazorpayOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes,
    });

    // Update order with payment record
    await orderService.updateOrder(orderId, {
      paymentId: paymentRecord._id,
    });

    return res.status(200).json(
      responseFormatter(true, "Payment order created successfully", {
        order: razorpayOrder,
        paymentRecord: {
          id: paymentRecord._id,
          status: paymentRecord.status
        },
        orderDetails: {
          id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
        },
        key_id: process.env.RAZORPAY_KEY_ID, // For frontend integration
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify payment
 * @route POST /api/v1/payments/razorpay/verify
 * @access Private
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify signature
    const verificationResult = await paymentService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!verificationResult.isValid) {
      return res
        .status(400)
        .json(responseFormatter(false, "Invalid payment signature"));
    }

    return res.status(200).json(
      responseFormatter(true, "Payment verified successfully", {
        verified: true,
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        paymentRecord: {
          id: verificationResult.paymentRecord._id,
          status: verificationResult.paymentRecord.status
        },
        capturedPayment: verificationResult.capturedPayment
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Razorpay webhook
 * @route POST /api/v1/payments/razorpay/webhook
 * @access Public (secured by signature)
 */
const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];

    if (!webhookSignature) {
      return res
        .status(400)
        .json(responseFormatter(false, "Missing webhook signature"));
    }

    // Process webhook
    const result = await paymentService.handleWebhook(
      req.body,
      webhookSignature
    );

    return res.status(200).json({
      success: true,
      message: "Webhook received and processed",
      data: result,
    });
  } catch (error) {
    logger.error("Error handling Razorpay webhook:", error);
    // Always return 200 response to Razorpay, even on error
    // This prevents them from retrying the webhook which might cause duplicate processing
    return res.status(200).json({
      success: false,
      message: "Error processing webhook",
      error: error.message,
    });
  }
};

/**
 * Get payment details
 * @route GET /api/v1/payments/:paymentId
 * @access Private (Admin)
 */
const getPaymentDetails = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const paymentDetails = await paymentService.getPaymentDetails(paymentId);

    return res.status(200).json(
      responseFormatter(true, "Payment details retrieved", {
        payment: paymentDetails,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payments (paginated)
 * @route GET /api/v1/payments
 * @access Private (Admin)
 */
const getAllPayments = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      userId: req.query.userId,
    };

    const paymentsData = await paymentService.getAllPayments(options);

    return res.status(200).json(
      responseFormatter(true, "Payments retrieved successfully", {
        payments: paymentsData.payments,
        pagination: paymentsData.pagination,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund
 * @route POST /api/v1/payments/:paymentId/refund
 * @access Private (Admin)
 */
const processRefund = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason, fullRefund } = req.body;

    if (!fullRefund && !amount) {
      return res.status(400).json(
        responseFormatter(false, "Amount is required for partial refunds")
      );
    }

    const refundResult = await paymentService.processRefund(
      paymentId, 
      amount, 
      reason, 
      fullRefund === true
    );

    return res.status(200).json(
      responseFormatter(true, "Refund processed successfully", {
        refund: refundResult.refund,
        payment: {
          id: refundResult.paymentRecord._id,
          status: refundResult.paymentRecord.status,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a subscription plan
 * @route POST /api/v1/payments/plans
 * @access Private (Admin)
 */
const createSubscriptionPlan = async (req, res, next) => {
  try {
    const planData = req.body;
    
    const plan = await paymentService.createSubscriptionPlan(planData);
    
    return res.status(201).json(
      responseFormatter(true, "Subscription plan created successfully", {
        plan
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a subscription
 * @route POST /api/v1/payments/subscriptions
 * @access Private
 */
const createSubscription = async (req, res, next) => {
  try {
    const subscriptionData = req.body;
    
    const subscription = await paymentService.createSubscription(subscriptionData);
    
    return res.status(201).json(
      responseFormatter(true, "Subscription created successfully", {
        subscription
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify UPI ID
 * @route POST /api/v1/payments/upi/verify
 * @access Private
 */
const verifyUpiId = async (req, res, next) => {
  try {
    const { vpa } = req.body;
    
    const verification = await paymentService.verifyUpi({ vpa });
    
    return res.status(200).json(
      responseFormatter(true, "UPI ID verified successfully", {
        verification
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  createPaymentOrderForOrder,
  verifyPayment,
  handleRazorpayWebhook,
  getPaymentDetails,
  getAllPayments,
  processRefund,
  createSubscriptionPlan,
  createSubscription,
  verifyUpiId,
};
