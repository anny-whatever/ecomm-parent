// src/api/payments/payment.controller.js
const paymentService = require("../../services/payment.service");
const cartService = require("../../services/cart.service");
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
      items: cart.items.length,
      total: cart.total,
    };

    // Create Razorpay order
    const order = await paymentService.createRazorpayOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes,
    });

    return res.status(200).json(
      responseFormatter(true, "Payment order created successfully", {
        order,
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
 * Verify payment
 * @route POST /api/v1/payments/razorpay/verify
 * @access Private
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify signature
    const isValid = paymentService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return res
        .status(400)
        .json(responseFormatter(false, "Invalid payment signature"));
    }

    // Get payment details
    const paymentDetails = await paymentService.getPaymentDetails(
      razorpayPaymentId
    );

    return res.status(200).json(
      responseFormatter(true, "Payment verified successfully", {
        verified: true,
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        paymentDetails,
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

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
  getPaymentDetails,
};
