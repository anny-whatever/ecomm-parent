// src/api/payments/payment.routes.js
const express = require("express");
const paymentController = require("./payment.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const paymentValidator = require("../../utils/validators/payment.validator");

const router = express.Router();

// Optional auth middleware for guest checkout
const optionalAuth = (req, res, next) => {
  if (req.cookies && req.cookies.authToken) {
    return authMiddleware(req, res, next);
  }
  next();
};

/**
 * @route   POST /api/v1/payments/razorpay/order
 * @desc    Create a Razorpay order from cart
 * @access  Private or Guest
 */
router.post(
  "/razorpay/order",
  optionalAuth,
  validationMiddleware(paymentValidator.createOrder),
  paymentController.createPaymentOrder
);

/**
 * @route   POST /api/v1/payments/razorpay/order/:orderId
 * @desc    Create a Razorpay order for an existing order
 * @access  Private or Guest
 */
router.post(
  "/razorpay/order/:orderId",
  optionalAuth,
  validationMiddleware(paymentValidator.getById),
  paymentController.createPaymentOrderForOrder
);

/**
 * @route   POST /api/v1/payments/razorpay/verify
 * @desc    Verify payment
 * @access  Private or Guest
 */
router.post(
  "/razorpay/verify",
  optionalAuth,
  validationMiddleware(paymentValidator.verifyPayment),
  paymentController.verifyPayment
);

/**
 * @route   POST /api/v1/payments/razorpay/webhook
 * @desc    Handle Razorpay webhook
 * @access  Public (secured by signature)
 */
router.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }), // Raw body for signature verification
  paymentController.handleRazorpayWebhook
);

/**
 * @route   GET /api/v1/payments
 * @desc    Get all payments (paginated)
 * @access  Private (Admin)
 */
router.get(
  "/",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(paymentValidator.getPayments),
  paymentController.getAllPayments
);

/**
 * @route   GET /api/v1/payments/:paymentId
 * @desc    Get payment details
 * @access  Private (Admin/User - if own payment)
 */
router.get(
  "/:paymentId",
  authMiddleware,
  validationMiddleware(paymentValidator.getById),
  paymentController.getPaymentDetails
);

/**
 * @route   POST /api/v1/payments/:paymentId/refund
 * @desc    Process refund
 * @access  Private (Admin)
 */
router.post(
  "/:paymentId/refund",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(paymentValidator.processRefund),
  paymentController.processRefund
);

/**
 * @route   POST /api/v1/payments/upi/verify
 * @desc    Verify UPI ID
 * @access  Private or Guest
 */
router.post(
  "/upi/verify",
  optionalAuth,
  validationMiddleware(paymentValidator.verifyUpi),
  paymentController.verifyUpiId
);

/**
 * @route   POST /api/v1/payments/plans
 * @desc    Create a subscription plan
 * @access  Private (Admin)
 */
router.post(
  "/plans",
  authMiddleware,
  rbacMiddleware(["admin"]),
  validationMiddleware(paymentValidator.createPlan),
  paymentController.createSubscriptionPlan
);

/**
 * @route   POST /api/v1/payments/subscriptions
 * @desc    Create a subscription
 * @access  Private
 */
router.post(
  "/subscriptions",
  authMiddleware,
  validationMiddleware(paymentValidator.createSubscription),
  paymentController.createSubscription
);

module.exports = router;
