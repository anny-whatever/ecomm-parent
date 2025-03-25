// src/utils/paginationHelper.js
const { PAGINATION } = require("./constants");

/**
 * Parse pagination parameters from request query
 *
 * @param {Object} query - Express request query object
 * @returns {Object} Pagination configuration
 */
const getPaginationOptions = (query) => {
  const page = Math.max(parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE, 1);

  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT
  );

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/**
 * Create pagination result with metadata
 *
 * @param {Array} data - Data array
 * @param {number} totalItems - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
const paginationResult = (data, totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = {
  getPaginationOptions,
  paginationResult,
};
