const express = require("express");
const router = express.Router();
const currencyController = require("./currency.controller");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const currencyValidator = require("../../utils/validators/currency.validator");

/*
 * Public currency routes
 */

/**
 * @route   GET /api/v1/currencies
 * @desc    Get all currencies
 * @access  Public
 */
router.get(
  "/",
  validationMiddleware(currencyValidator.getAllCurrencies),
  currencyController.getAllCurrencies
);

/**
 * @route   GET /api/v1/currencies/base
 * @desc    Get base currency
 * @access  Public
 */
router.get("/base", currencyController.getBaseCurrency);

/**
 * @route   GET /api/v1/currencies/:code
 * @desc    Get currency by code
 * @access  Public
 */
router.get(
  "/:code",
  validationMiddleware(currencyValidator.getCurrencyByCode),
  currencyController.getCurrencyByCode
);

/**
 * @route   GET /api/v1/currencies/convert
 * @desc    Convert amount between currencies
 * @access  Public
 */
router.get(
  "/convert",
  validationMiddleware(currencyValidator.convertAmount),
  currencyController.convertAmount
);

/*
 * Admin currency routes - these are registered in admin router
 */

/**
 * @route   POST /api/v1/admin/currencies
 * @desc    Create a new currency
 * @access  Private (Admin)
 */
router.post(
  "/",
  rbacMiddleware(["admin"]),
  validationMiddleware(currencyValidator.createCurrency),
  currencyController.createCurrency
);

/**
 * @route   PUT /api/v1/admin/currencies/:code
 * @desc    Update a currency
 * @access  Private (Admin)
 */
router.put(
  "/:code",
  rbacMiddleware(["admin"]),
  validationMiddleware(currencyValidator.updateCurrency),
  currencyController.updateCurrency
);

/**
 * @route   DELETE /api/v1/admin/currencies/:code
 * @desc    Delete a currency
 * @access  Private (Admin)
 */
router.delete(
  "/:code",
  rbacMiddleware(["admin"]),
  validationMiddleware(currencyValidator.deleteCurrency),
  currencyController.deleteCurrency
);

/**
 * @route   POST /api/v1/admin/currencies/update-rates
 * @desc    Update exchange rates
 * @access  Private (Admin)
 */
router.post(
  "/update-rates",
  rbacMiddleware(["admin"]),
  validationMiddleware(currencyValidator.updateExchangeRates),
  currencyController.updateExchangeRates
);

module.exports = router;
