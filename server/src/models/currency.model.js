const mongoose = require("mongoose");

/**
 * Currency model for supporting multi-currency pricing and transactions
 */
const currencySchema = new mongoose.Schema(
  {
    // ISO 4217 currency code (e.g., USD, EUR, INR)
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    // Currency name (e.g., US Dollar, Euro, Indian Rupee)
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Currency symbol (e.g., $, €, ₹)
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    // Exchange rate relative to base currency (default is 1.0 for base currency)
    exchangeRate: {
      type: Number,
      required: true,
      min: 0,
      default: 1.0,
    },
    // Number of decimal places to display
    decimalPlaces: {
      type: Number,
      required: true,
      min: 0,
      max: 4,
      default: 2,
    },
    // Position of symbol (prefix or suffix)
    symbolPosition: {
      type: String,
      enum: ["prefix", "suffix"],
      default: "prefix",
    },
    // Thousand separator (e.g., comma, period, space)
    thousandSeparator: {
      type: String,
      default: ",",
      maxlength: 1,
    },
    // Decimal separator (e.g., period, comma)
    decimalSeparator: {
      type: String,
      default: ".",
      maxlength: 1,
    },
    // Whether this is the base currency
    isBaseCurrency: {
      type: Boolean,
      default: false,
    },
    // Whether this currency is active
    isActive: {
      type: Boolean,
      default: true,
    },
    // Whether this currency's exchange rate is automatically updated
    autoUpdateRate: {
      type: Boolean,
      default: false,
    },
    // Last update of exchange rate
    lastRateUpdate: {
      type: Date,
    },
    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Method to format a value in this currency
currencySchema.methods.format = function (value) {
  // Format the number with correct decimal places
  const formattedNumber = Number(value).toFixed(this.decimalPlaces);

  // Split into whole and decimal parts
  const [wholePart, decimalPart] = formattedNumber.split(".");

  // Add thousand separators to whole part
  const wholeWithSeparators = wholePart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    this.thousandSeparator
  );

  // Combine with decimal part
  const formattedValue = decimalPart
    ? `${wholeWithSeparators}${this.decimalSeparator}${decimalPart}`
    : wholeWithSeparators;

  // Add currency symbol according to position
  return this.symbolPosition === "prefix"
    ? `${this.symbol}${formattedValue}`
    : `${formattedValue}${this.symbol}`;
};

// Method to convert a value from the base currency to this currency
currencySchema.methods.fromBase = function (baseValue) {
  return baseValue * this.exchangeRate;
};

// Method to convert a value in this currency to the base currency
currencySchema.methods.toBase = function (value) {
  return value / this.exchangeRate;
};

// Enforce unique base currency
currencySchema.pre("save", async function (next) {
  if (this.isBaseCurrency) {
    // Check if another currency is already set as base
    const existingBase = await this.constructor.findOne({
      isBaseCurrency: true,
      _id: { $ne: this._id },
    });

    if (existingBase) {
      existingBase.isBaseCurrency = false;
      await existingBase.save();
    }
  }
  next();
});

const Currency = mongoose.model("Currency", currencySchema);

module.exports = Currency;
