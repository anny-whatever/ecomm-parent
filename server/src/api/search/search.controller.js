const searchService = require("../../services/search.service");
const { responseFormatter } = require("../../utils/responseFormatter");
const logger = require("../../config/logger");

/**
 * Search products with advanced filtering
 * @route GET /api/v1/search/products
 * @access Public
 */
const searchProducts = async (req, res, next) => {
  try {
    // Normalize query parameters to handle arrays
    const queryParams = { ...req.query };
    
    // Handle potential array parameters that might come as comma-separated
    ['category', 'tags'].forEach(param => {
      if (queryParams[param] && typeof queryParams[param] === 'string' && queryParams[param].includes(',')) {
        queryParams[param] = queryParams[param].split(',');
      }
    });

    // Parse attributes if provided
    if (req.query.attributes) {
      try {
        queryParams.attributes = JSON.parse(req.query.attributes);
      } catch (error) {
        // If not valid JSON, try to parse as key-value pairs
        queryParams.attributes = req.query.attributes.split(',').reduce((acc, pair) => {
          const [key, value] = pair.split(':');
          if (key && value) {
            acc[key.trim()] = value.trim();
          }
          return acc;
        }, {});
      }
    }

    const result = await searchService.searchProducts(queryParams);

    return res.status(200).json(
      responseFormatter(true, "Search results retrieved successfully", result)
    );
  } catch (error) {
    logger.error(`Error in searchProducts: ${error.message}`);
    next(error);
  }
};

/**
 * Global search across multiple entities
 * @route GET /api/v1/search
 * @access Public (limited) / Private (full)
 */
const globalSearch = async (req, res, next) => {
  try {
    const { keyword, entities, limit } = req.query;
    
    // Parse entities if it comes as a comma-separated string
    let parsedEntities = entities;
    if (typeof entities === 'string' && entities.includes(',')) {
      parsedEntities = entities.split(',');
    }

    // If not authenticated, restrict searchable entities
    const user = req.user;
    let allowedEntities = parsedEntities;
    
    if (!user) {
      // Public users can only search products, categories and reviews
      allowedEntities = Array.isArray(parsedEntities) 
        ? parsedEntities.filter(e => ['products', 'categories', 'reviews'].includes(e))
        : ['products', 'categories'].includes(parsedEntities) ? parsedEntities : 'products';
    } else if (user.role !== 'admin' && user.role !== 'manager') {
      // Regular users can't search all users
      allowedEntities = Array.isArray(parsedEntities)
        ? parsedEntities.filter(e => e !== 'users')
        : parsedEntities === 'users' ? 'products' : parsedEntities;
    }

    const results = await searchService.globalSearch(keyword, allowedEntities, parseInt(limit));

    return res.status(200).json(
      responseFormatter(true, "Search results retrieved successfully", results)
    );
  } catch (error) {
    logger.error(`Error in globalSearch: ${error.message}`);
    next(error);
  }
};

/**
 * Autocomplete product search
 * @route GET /api/v1/search/autocomplete
 * @access Public
 */
const autocompleteProducts = async (req, res, next) => {
  try {
    const { query, limit } = req.query;
    const results = await searchService.autocompleteProducts(query, parseInt(limit));

    return res.status(200).json(
      responseFormatter(true, "Autocomplete results retrieved successfully", {
        suggestions: results,
      })
    );
  } catch (error) {
    logger.error(`Error in autocompleteProducts: ${error.message}`);
    next(error);
  }
};

module.exports = {
  searchProducts,
  globalSearch,
  autocompleteProducts,
}; 