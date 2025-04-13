const currencyService = require("../../services/currency.service");
const logger = require("../../config/logger");
const { responseFormatter } = require("../../utils/responseFormatter");

/**
 * Get all currencies
 * @route GET /api/v1/currencies
 * @access Public
 */
const getAllCurrencies = async (req, res, next) => {
  try {
    const options = {
      code: req.query.code,
    };

    const currencies = await currencyService.getAllCurrencies(options);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Currencies retrieved successfully", {
          currencies,
        })
      );
  } catch (error) {
    logger.error("Error retrieving currencies:", error);
    next(error);
  }
};

/**
 * Get currency by code
 * @route GET /api/v1/currencies/:code
 * @access Public
 */
const getCurrencyByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const currency = await currencyService.getCurrencyByCode(code);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Currency retrieved successfully", { currency })
      );
  } catch (error) {
    logger.error(`Error retrieving currency ${req.params.code}:`, error);
    next(error);
  }
};

/**
 * Get base currency
 * @route GET /api/v1/currencies/base
 * @access Public
 */
const getBaseCurrency = async (req, res, next) => {
  try {
    const currency = await currencyService.getBaseCurrency();

    return res
      .status(200)
      .json(
        responseFormatter(true, "Base currency retrieved successfully", {
          currency,
        })
      );
  } catch (error) {
    logger.error("Error retrieving base currency:", error);
    next(error);
  }
};

/**
 * Create a new currency
 * @route POST /api/v1/admin/currencies
 * @access Private (Admin)
 */
const createCurrency = async (req, res, next) => {
  try {
    const currency = await currencyService.createCurrency(req.body);

    return res
      .status(201)
      .json(
        responseFormatter(true, "Currency created successfully", { currency })
      );
  } catch (error) {
    logger.error("Error creating currency:", error);
    next(error);
  }
};

/**
 * Update a currency
 * @route PUT /api/v1/admin/currencies/:code
 * @access Private (Admin)
 */
const updateCurrency = async (req, res, next) => {
  try {
    const { code } = req.params;

    const currency = await currencyService.updateCurrency(code, req.body);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Currency updated successfully", { currency })
      );
  } catch (error) {
    logger.error(`Error updating currency ${req.params.code}:`, error);
    next(error);
  }
};

/**
 * Delete a currency
 * @route DELETE /api/v1/admin/currencies/:code
 * @access Private (Admin)
 */
const deleteCurrency = async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await currencyService.deleteCurrency(code);

    return res.status(200).json(responseFormatter(true, result.message, {}));
  } catch (error) {
    logger.error(`Error deleting currency ${req.params.code}:`, error);
    next(error);
  }
};

/**
 * Update exchange rates
 * @route POST /api/v1/admin/currencies/update-rates
 * @access Private (Admin)
 */
const updateExchangeRates = async (req, res, next) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res
        .status(400)
        .json(responseFormatter(false, "API key is required", {}));
    }

    const result = await currencyService.updateExchangeRates(apiKey);

    return res
      .status(200)
      .json(responseFormatter(true, result.message, { result }));
  } catch (error) {
    logger.error("Error updating exchange rates:", error);
    next(error);
  }
};

/**
 * Convert amount between currencies
 * @route GET /api/v1/currencies/convert
 * @access Public
 */
const convertAmount = async (req, res, next) => {
  try {
    const { amount, from, to } = req.query;

    if (!amount || !from || !to) {
      return res
        .status(400)
        .json(
          responseFormatter(
            false,
            "Amount, source currency and target currency are required",
            {}
          )
        );
    }

    const convertedAmount = await currencyService.convertAmount(
      parseFloat(amount),
      from,
      to
    );

    // Also get formatted amounts
    const sourceFormatted = await currencyService.formatAmount(
      parseFloat(amount),
      from
    );
    const targetFormatted = await currencyService.formatAmount(
      convertedAmount,
      to
    );

    return res.status(200).json(
      responseFormatter(true, "Amount converted successfully", {
        sourceAmount: parseFloat(amount),
        sourceFormatted,
        sourceCode: from,
        convertedAmount,
        targetFormatted,
        targetCode: to,
      })
    );
  } catch (error) {
    logger.error("Error converting amount:", error);
    next(error);
  }
};

module.exports = {
  getAllCurrencies,
  getCurrencyByCode,
  getBaseCurrency,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  updateExchangeRates,
  convertAmount,
};
