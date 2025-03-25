// src/utils/constants.js

/**
 * Application-wide constants
 */

// User roles
const USER_ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
};

// User status
const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
};

// Product status
const PRODUCT_STATUS = {
  ACTIVE: "active",
  DRAFT: "draft",
  ARCHIVED: "archived",
};

// Order status
const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

// Payment status
const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
};

// Payment methods
const PAYMENT_METHODS = {
  RAZORPAY: "razorpay",
  COD: "cod", // Cash on delivery
};

// Loyalty tiers
const LOYALTY_TIERS = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Date formats
const DATE_FORMATS = {
  DEFAULT: "YYYY-MM-DD",
  DISPLAY: "MMM DD, YYYY",
  DATETIME: "YYYY-MM-DD HH:mm:ss",
};

// GST rates
const GST_RATES = {
  DEFAULT: 18, // 18%
  REDUCED: 12, // 12%
  LOW: 5, // 5%
  ZERO: 0, // 0%
};

// File upload limits
const FILE_LIMITS = {
  PRODUCT_IMAGES: 10,
  PROFILE_IMAGES: 1,
  CATEGORY_IMAGES: 1,
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  PRODUCT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  LOYALTY_TIERS,
  PAGINATION,
  DATE_FORMATS,
  GST_RATES,
  FILE_LIMITS,
};
