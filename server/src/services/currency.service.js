const Currency = require("../models/currency.model");
const logger = require("../config/logger");
const { NotFoundError, BadRequestError } = require("../utils/errorTypes");
const axios = require("axios");

/**
 * Currency Service - Handles multi-currency operations
 */
class CurrencyService {
  /**
   * Get all active currencies
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of currencies
   */
  async getAllCurrencies(options = {}) {
    try {
      const query = { isActive: true };

      // Apply additional filters if provided
      if (options.code) {
        query.code = options.code.toUpperCase();
      }

      const currencies = await Currency.find(query).sort({ code: 1 });
      return currencies;
    } catch (error) {
      logger.error("Error getting currencies:", error);
      throw error;
    }
  }

  /**
   * Get currency by code
   * @param {String} code - Currency code
   * @returns {Promise<Object>} Currency object
   */
  async getCurrencyByCode(code) {
    try {
      const currency = await Currency.findOne({
        code: code.toUpperCase(),
        isActive: true,
      });

      if (!currency) {
        throw new NotFoundError(`Currency with code ${code} not found`);
      }

      return currency;
    } catch (error) {
      logger.error(`Error getting currency by code ${code}:`, error);
      throw error;
    }
  }

  /**
   * Get base currency
   * @returns {Promise<Object>} Base currency
   */
  async getBaseCurrency() {
    try {
      const baseCurrency = await Currency.findOne({ isBaseCurrency: true });

      if (!baseCurrency) {
        // If no base currency is set, use the first active currency
        const firstCurrency = await Currency.findOne({ isActive: true });

        if (!firstCurrency) {
          throw new Error("No active currencies found");
        }

        // Set this as the base currency
        firstCurrency.isBaseCurrency = true;
        await firstCurrency.save();

        return firstCurrency;
      }

      return baseCurrency;
    } catch (error) {
      logger.error("Error getting base currency:", error);
      throw error;
    }
  }

  /**
   * Create a new currency
   * @param {Object} currencyData - Currency data
   * @returns {Promise<Object>} Created currency
   */
  async createCurrency(currencyData) {
    try {
      // Check if currency with this code already exists
      const existingCurrency = await Currency.findOne({
        code: currencyData.code.toUpperCase(),
      });

      if (existingCurrency) {
        throw new BadRequestError(
          `Currency with code ${currencyData.code} already exists`
        );
      }

      // Create new currency
      const currency = new Currency({
        ...currencyData,
        code: currencyData.code.toUpperCase(),
      });

      // If this is the first currency, make it the base currency
      const currencyCount = await Currency.countDocuments();
      if (currencyCount === 0) {
        currency.isBaseCurrency = true;
        currency.exchangeRate = 1.0;
      }

      await currency.save();
      return currency;
    } catch (error) {
      logger.error("Error creating currency:", error);
      throw error;
    }
  }

  /**
   * Update a currency
   * @param {String} code - Currency code
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated currency
   */
  async updateCurrency(code, updateData) {
    try {
      const currency = await Currency.findOne({ code: code.toUpperCase() });

      if (!currency) {
        throw new NotFoundError(`Currency with code ${code} not found`);
      }

      // Don't allow changing the code
      delete updateData.code;

      // Update fields
      Object.keys(updateData).forEach((key) => {
        if (key !== "_id" && key !== "createdAt" && key !== "updatedAt") {
          currency[key] = updateData[key];
        }
      });

      // If setting as base currency, reset exchange rate to 1.0
      if (updateData.isBaseCurrency) {
        currency.exchangeRate = 1.0;
      }

      await currency.save();
      return currency;
    } catch (error) {
      logger.error(`Error updating currency ${code}:`, error);
      throw error;
    }
  }

  /**
   * Delete a currency
   * @param {String} code - Currency code
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCurrency(code) {
    try {
      const currency = await Currency.findOne({ code: code.toUpperCase() });

      if (!currency) {
        throw new NotFoundError(`Currency with code ${code} not found`);
      }

      // Don't allow deleting the base currency
      if (currency.isBaseCurrency) {
        throw new BadRequestError("Cannot delete the base currency");
      }

      await currency.deleteOne();

      return {
        success: true,
        message: `Currency ${code} deleted successfully`,
      };
    } catch (error) {
      logger.error(`Error deleting currency ${code}:`, error);
      throw error;
    }
  }

  /**
   * Update exchange rates from an external API
   * @param {String} apiKey - API key for exchange rate service
   * @returns {Promise<Object>} Update result
   */
  async updateExchangeRates(apiKey) {
    try {
      const baseCurrency = await this.getBaseCurrency();

      // Only update currencies set for auto-update
      const currencies = await Currency.find({
        autoUpdateRate: true,
        isActive: true,
        isBaseCurrency: false,
      });

      if (currencies.length === 0) {
        return { success: true, message: "No currencies set for auto-update" };
      }

      // Get currency codes to update
      const currencyCodes = currencies.map((c) => c.code);

      // Call exchange rate API (example using exchangerate-api.com)
      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency.code}`
      );

      if (!response.data || !response.data.conversion_rates) {
        throw new Error("Invalid response from exchange rate API");
      }

      const rates = response.data.conversion_rates;
      let updatedCount = 0;

      // Update rates for each currency
      for (const currency of currencies) {
        if (rates[currency.code]) {
          currency.exchangeRate = rates[currency.code];
          currency.lastRateUpdate = new Date();
          await currency.save();
          updatedCount++;
        } else {
          logger.warn(`Exchange rate not found for ${currency.code}`);
        }
      }

      return {
        success: true,
        message: `Updated exchange rates for ${updatedCount} currencies`,
        updatedCount,
      };
    } catch (error) {
      logger.error("Error updating exchange rates:", error);
      throw error;
    }
  }

  /**
   * Convert amount between currencies
   * @param {Number} amount - Amount to convert
   * @param {String} fromCurrency - Source currency code
   * @param {String} toCurrency - Target currency code
   * @returns {Promise<Number>} Converted amount
   */
  async convertAmount(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      const sourceCurrency = await this.getCurrencyByCode(fromCurrency);
      const targetCurrency = await this.getCurrencyByCode(toCurrency);

      // Convert to base currency first, then to target currency
      const baseAmount = sourceCurrency.toBase(amount);
      const convertedAmount = targetCurrency.fromBase(baseAmount);

      return convertedAmount;
    } catch (error) {
      logger.error(
        `Error converting amount from ${fromCurrency} to ${toCurrency}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Format amount according to currency formatting rules
   * @param {Number} amount - Amount to format
   * @param {String} currencyCode - Currency code
   * @returns {Promise<String>} Formatted amount
   */
  async formatAmount(amount, currencyCode) {
    try {
      const currency = await this.getCurrencyByCode(currencyCode);
      return currency.format(amount);
    } catch (error) {
      logger.error(`Error formatting amount in ${currencyCode}:`, error);
      throw error;
    }
  }
}

module.exports = new CurrencyService();
