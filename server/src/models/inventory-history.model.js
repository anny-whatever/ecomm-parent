// src/models/inventory-history.model.js
const mongoose = require("mongoose");

const inventoryHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product.variants",
      index: true,
    },
    adjustment: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "initialize", // Initial setup
        "manual-adjustment", // Manual adjustment by admin
        "purchase", // Stock purchase
        "return", // Customer return
        "reserve", // Reserved during checkout
        "release", // Released from reservation
        "commit", // Committed (sold) from reservation
        "correction", // Inventory correction
        "loss", // Inventory loss (damaged, missing, etc.)
      ],
      required: true,
      index: true,
    },
    note: {
      type: String,
    },
    reference: {
      type: {
        type: String,
        enum: ["order", "purchase", "return", "manual"],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Create a compound index for quick lookups
inventoryHistorySchema.index({ product: 1, timestamp: -1 });
inventoryHistorySchema.index({ product: 1, variant: 1, timestamp: -1 });

const InventoryHistory = mongoose.model(
  "InventoryHistory",
  inventoryHistorySchema
);

module.exports = InventoryHistory;
