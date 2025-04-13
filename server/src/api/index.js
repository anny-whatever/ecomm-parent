// src/api/index.js
const express = require("express");
const router = express.Router();

// Import routes
const authRoutes = require("./auth/auth.routes");
const userRoutes = require("./users/user.routes");
const productRoutes = require("./products/product.routes");
const categoryRoutes = require("./categories/category.routes");
const orderRoutes = require("./orders/order.routes");
const cartRoutes = require("./cart/cart.routes");
const inventoryRoutes = require("./inventory/inventory.routes");
const paymentRoutes = require("./payments/payment.routes");
const promotionRoutes = require("./promotions/promotion.routes"); // New promotion routes
const shippingRoutes = require("./shipping/shipping.routes"); // Shipping routes
const analyticsRoutes = require("./analytics/analytics.routes"); // Analytics routes
const eventRoutes = require("./events/event.routes"); // New event routes
const reviewRoutes = require("./reviews/review.routes"); // Review routes
const searchRoutes = require("./search/search.routes"); // Search routes
const abandonedCartRoutes = require("./abandoned-cart/abandoned-cart.routes"); // Abandoned cart routes
const currencyRoutes = require("./currency/currency.routes"); // Currency routes
const loyaltyRoutes = require("./loyalty/loyalty.routes"); // Loyalty routes
const {
  subscriptionRoutes,
  adminSubscriptionRoutes,
} = require("./subscriptions/subscription.routes"); // Subscription routes

// Register routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/payments", paymentRoutes);
router.use("/promotions", promotionRoutes); // Register promotion routes
router.use("/shipping", shippingRoutes); // Register shipping routes
router.use("/analytics", analyticsRoutes); // Register analytics routes
router.use("/events", eventRoutes); // Register event routes
router.use("/reviews", reviewRoutes); // Register review routes
router.use("/search", searchRoutes); // Register search routes
router.use("/currencies", currencyRoutes); // Register currency routes
router.use("/loyalty", loyaltyRoutes); // Register loyalty routes
router.use("/subscriptions", subscriptionRoutes); // Register subscription routes

// Admin routes
router.use("/admin/abandoned-cart", abandonedCartRoutes); // Register abandoned cart admin routes
router.use("/admin/currencies", currencyRoutes); // Register currency admin routes
router.use("/admin/subscriptions", adminSubscriptionRoutes); // Register admin subscription routes

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

module.exports = router;
