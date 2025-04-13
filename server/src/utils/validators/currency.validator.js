const Joi = require("joi");

// Get all currencies validation
const getAllCurrencies = Joi.object({
  query: Joi.object({
    code: Joi.string().max(3),
  }),
});

// Get currency by code validation
const getCurrencyByCode = Joi.object({
  params: Joi.object({
    code: Joi.string().required().max(3).messages({
      "any.required": "Currency code is required",
      "string.max": "Currency code must not exceed 3 characters",
    }),
  }),
});

// Create currency validation
const createCurrency = Joi.object({
  body: Joi.object({
    code: Joi.string().required().max(3).messages({
      "any.required": "Currency code is required",
      "string.max": "Currency code must not exceed 3 characters",
    }),
    name: Joi.string().required().messages({
      "any.required": "Currency name is required",
    }),
    symbol: Joi.string().required().max(3).messages({
      "any.required": "Currency symbol is required",
      "string.max": "Currency symbol must not exceed 3 characters",
    }),
    exchangeRate: Joi.number().min(0).default(1.0).messages({
      "number.base": "Exchange rate must be a number",
      "number.min": "Exchange rate must be a non-negative number",
    }),
    decimalPlaces: Joi.number().integer().min(0).max(4).default(2).messages({
      "number.base": "Decimal places must be a number",
      "number.integer": "Decimal places must be an integer",
      "number.min": "Decimal places must be a non-negative number",
      "number.max": "Decimal places must not exceed 4",
    }),
    symbolPosition: Joi.string()
      .valid("prefix", "suffix")
      .default("prefix")
      .messages({
        "any.only": "Symbol position must be either prefix or suffix",
      }),
    thousandSeparator: Joi.string().max(1).default(",").messages({
      "string.max": "Thousand separator must be a single character",
    }),
    decimalSeparator: Joi.string().max(1).default(".").messages({
      "string.max": "Decimal separator must be a single character",
    }),
    isBaseCurrency: Joi.boolean().default(false),
    isActive: Joi.boolean().default(true),
    autoUpdateRate: Joi.boolean().default(false),
    metadata: Joi.object(),
  }),
});

// Update currency validation
const updateCurrency = Joi.object({
  params: Joi.object({
    code: Joi.string().required().max(3).messages({
      "any.required": "Currency code is required",
      "string.max": "Currency code must not exceed 3 characters",
    }),
  }),
  body: Joi.object({
    name: Joi.string(),
    symbol: Joi.string().max(3).messages({
      "string.max": "Currency symbol must not exceed 3 characters",
    }),
    exchangeRate: Joi.number().min(0).messages({
      "number.base": "Exchange rate must be a number",
      "number.min": "Exchange rate must be a non-negative number",
    }),
    decimalPlaces: Joi.number().integer().min(0).max(4).messages({
      "number.base": "Decimal places must be a number",
      "number.integer": "Decimal places must be an integer",
      "number.min": "Decimal places must be a non-negative number",
      "number.max": "Decimal places must not exceed 4",
    }),
    symbolPosition: Joi.string().valid("prefix", "suffix").messages({
      "any.only": "Symbol position must be either prefix or suffix",
    }),
    thousandSeparator: Joi.string().max(1).messages({
      "string.max": "Thousand separator must be a single character",
    }),
    decimalSeparator: Joi.string().max(1).messages({
      "string.max": "Decimal separator must be a single character",
    }),
    isBaseCurrency: Joi.boolean(),
    isActive: Joi.boolean(),
    autoUpdateRate: Joi.boolean(),
    metadata: Joi.object(),
  }),
});

// Delete currency validation
const deleteCurrency = Joi.object({
  params: Joi.object({
    code: Joi.string().required().max(3).messages({
      "any.required": "Currency code is required",
      "string.max": "Currency code must not exceed 3 characters",
    }),
  }),
});

// Update exchange rates validation
const updateExchangeRates = Joi.object({
  body: Joi.object({
    apiKey: Joi.string().required().messages({
      "any.required": "API key is required",
    }),
  }),
});

// Convert amount validation
const convertAmount = Joi.object({
  query: Joi.object({
    amount: Joi.number().required().min(0).messages({
      "any.required": "Amount is required",
      "number.base": "Amount must be a number",
      "number.min": "Amount must be a non-negative number",
    }),
    from: Joi.string().required().max(3).messages({
      "any.required": "Source currency code is required",
      "string.max": "Source currency code must not exceed 3 characters",
    }),
    to: Joi.string().required().max(3).messages({
      "any.required": "Target currency code is required",
      "string.max": "Target currency code must not exceed 3 characters",
    }),
  }),
});

module.exports = {
  getAllCurrencies,
  getCurrencyByCode,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  updateExchangeRates,
  convertAmount,
};
