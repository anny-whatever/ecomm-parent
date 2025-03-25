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

// Register routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);

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
