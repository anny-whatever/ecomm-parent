/**
 * Helper functions for email templates
 */

/**
 * Calculate the discounted total based on the original total and discount percentage
 * @param {Number} total - Original cart total
 * @param {Number} discountPercent - Discount percentage
 * @returns {String} Formatted discounted total
 */
const calculateDiscountedTotal = (total, discountPercent) => {
  const discount = (discountPercent / 100) * total;
  const discountedTotal = total - discount;
  return discountedTotal.toFixed(2);
};

/**
 * Calculate the savings amount based on the original total and discount percentage
 * @param {Number} total - Original cart total
 * @param {Number} discountPercent - Discount percentage
 * @returns {String} Formatted savings amount
 */
const calculateSavings = (total, discountPercent) => {
  const savings = (discountPercent / 100) * total;
  return savings.toFixed(2);
};

/**
 * Format a date for display in emails
 * @param {Date} date - Date to format
 * @param {String} format - Format type ('short', 'long', 'relative')
 * @returns {String} Formatted date string
 */
const formatDate = (date, format = "short") => {
  const dateObj = new Date(date);

  switch (format) {
    case "short":
      return dateObj.toLocaleDateString();
    case "long":
      return dateObj.toLocaleString();
    case "relative":
      const now = new Date();
      const diffInDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        return "Today";
      } else if (diffInDays === 1) {
        return "Yesterday";
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
      } else {
        return dateObj.toLocaleDateString();
      }
    default:
      return dateObj.toLocaleDateString();
  }
};

/**
 * Format currency for display in emails
 * @param {Number} amount - Amount to format
 * @param {String} currencyCode - Currency code (e.g., 'INR', 'USD')
 * @returns {String} Formatted currency string
 */
const formatCurrency = (amount, currencyCode = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
};

/**
 * Truncate text to a specific length and add ellipsis if needed
 * @param {String} text - Text to truncate
 * @param {Number} length - Maximum length
 * @returns {String} Truncated text
 */
const truncateText = (text, length = 100) => {
  if (!text || text.length <= length) {
    return text;
  }

  return text.substring(0, length) + "...";
};

module.exports = {
  calculateDiscountedTotal,
  calculateSavings,
  formatDate,
  formatCurrency,
  truncateText,
};
