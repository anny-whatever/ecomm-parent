/**
 * Utility for generating unique codes for various purposes like
 * referral codes, voucher codes, discount codes, etc.
 */

const crypto = require("crypto");

/**
 * Generate a unique alphanumeric code of specified length
 *
 * @param {number} length - Length of the code to generate (default: 8)
 * @param {string} prefix - Optional prefix for the code
 * @returns {string} - Generated unique code
 */
const generateUniqueCode = (length = 8, prefix = "") => {
  // Define characters to use (alphanumeric, without confusing characters like 0,O,1,I,l)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  // Generate random bytes and map to our character set
  const randomBytes = crypto.randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    // Use modulo to ensure we get a valid index in our chars string
    const randomIndex = randomBytes[i] % chars.length;
    result += chars.charAt(randomIndex);
  }

  // Add prefix if provided
  return prefix ? `${prefix}${result}` : result;
};

/**
 * Generate a referral code with a specific prefix
 *
 * @param {string} userId - User ID to incorporate into the code
 * @returns {string} - Referral code
 */
const generateReferralCode = (userId) => {
  // Use first 4 chars of userId (or a hash of it) + 6 random chars
  const userHash = crypto
    .createHash("md5")
    .update(userId.toString())
    .digest("hex")
    .substring(0, 4)
    .toUpperCase();

  return `${userHash}${generateUniqueCode(6)}`;
};

module.exports = {
  generateUniqueCode,
  generateReferralCode,
};
