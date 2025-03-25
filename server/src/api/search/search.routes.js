const express = require("express");
const searchController = require("./search.controller");
const { optionalAuth } = require("../../middleware/auth.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const searchValidator = require("../../utils/validators/search.validator");

const router = express.Router();

/**
 * @route   GET /api/v1/search/products
 * @desc    Search products with advanced filtering
 * @access  Public
 */
router.get(
  "/products",
  validationMiddleware(searchValidator.searchProducts),
  searchController.searchProducts
);

/**
 * @route   GET /api/v1/search
 * @desc    Global search across multiple entities
 * @access  Public (limited) / Private (full)
 */
router.get(
  "/",
  optionalAuth,
  validationMiddleware(searchValidator.globalSearch),
  searchController.globalSearch
);

/**
 * @route   GET /api/v1/search/autocomplete
 * @desc    Autocomplete product search
 * @access  Public
 */
router.get(
  "/autocomplete",
  validationMiddleware(searchValidator.autocomplete),
  searchController.autocompleteProducts
);

module.exports = router; 