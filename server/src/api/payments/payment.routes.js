// src/api/payments/payment.routes.js
const express = require("express");
const paymentController = require("./payment.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const paymentValidator = require("../../utils/validators/payment.validator");

const router = express.Router();

/**
 * @route   POST /api/v1/payments/razorpay/order
 * @desc    Create a Razorpay order
 * @access  Private
 */
router.post(
  "/razorpay/order",
  authMiddleware,
  validationMiddleware(paymentValidator.createOrder),
  paymentController.createPaymentOrder
);

/**
 * @route   POST /api/v1/payments/razorpay/verify
 * @desc    Verify payment
 * @access  Private
 */
router.post(
  "/razorpay/verify",
  authMiddleware,
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
 * @route   GET /api/v1/payments/:paymentId
 * @desc    Get payment details
 * @access  Private (Admin)
 */
router.get(
  "/:paymentId",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(paymentValidator.getPaymentDetails),
  paymentController.getPaymentDetails
);

module.exports = router;
