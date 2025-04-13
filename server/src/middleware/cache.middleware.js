const logger = require("../config/logger");

/**
 * In-memory cache store
 * This is a simple implementation - in production, Redis would be preferable
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };
  }

  /**
   * Get item from cache
   * @param {String} key - Cache key
   * @returns {*} Cached value or undefined if not found or expired
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Set item in cache
   * @param {String} key - Cache key
   * @param {*} value - Value to cache
   * @param {Object} options - Cache options
   * @param {Number} options.ttl - Time to live in seconds
   * @returns {Boolean} Success indicator
   */
  set(key, value, options = {}) {
    const ttl = options.ttl || 60; // Default 60 seconds

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });

    this.stats.sets++;
    return true;
  }

  /**
   * Delete item from cache
   * @param {String} key - Cache key
   * @returns {Boolean} Success indicator
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Delete all items matching a pattern
   * @param {RegExp} pattern - Regular expression pattern
   * @returns {Number} Number of items deleted
   */
  deletePattern(pattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate:
        this.stats.hits + this.stats.misses > 0
          ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
          : 0,
    };
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
  }
}

// Create cache instance
const cache = new MemoryCache();

/**
 * Response caching middleware
 * Caches API responses to improve performance
 * @param {Object} options - Caching options
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 60, // Default TTL in seconds
    keyPrefix = "api:",
    methods = ["GET"], // Default to only cache GET requests
    keyGenerator = null, // Custom key generator function
    condition = null, // Custom condition function to determine if request should be cached
    cacheableStatusCodes = [200, 304], // HTTP status codes that should be cached
  } = options;

  return (req, res, next) => {
    // Skip caching for non-cacheable methods
    if (!methods.includes(req.method)) {
      return next();
    }

    // Skip based on custom condition if provided
    if (condition && !condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : generateCacheKey(req, keyPrefix);

    // Try to get from cache
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      // Send cached response
      logger.debug(`Cache hit for ${cacheKey}`);

      // Set headers to indicate response is from cache
      res.set("X-Cache", "HIT");

      // Send the cached response
      res.contentType(cachedResponse.contentType);
      return res.status(cachedResponse.status).send(cachedResponse.body);
    }

    // Cache miss, capture the response
    logger.debug(`Cache miss for ${cacheKey}`);
    res.set("X-Cache", "MISS");

    // Store original methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    // Override send method
    res.send = function (body) {
      // Only cache successful responses
      if (cacheableStatusCodes.includes(res.statusCode)) {
        cache.set(
          cacheKey,
          {
            body,
            status: res.statusCode,
            contentType: res.get("Content-Type") || "application/json",
          },
          { ttl }
        );

        logger.debug(`Cached response for ${cacheKey} (TTL: ${ttl}s)`);
      }

      // Call original method
      return originalSend.apply(res, arguments);
    };

    // Override json method
    res.json = function (body) {
      // Only cache successful responses
      if (cacheableStatusCodes.includes(res.statusCode)) {
        cache.set(
          cacheKey,
          {
            body: JSON.stringify(body),
            status: res.statusCode,
            contentType: "application/json",
          },
          { ttl }
        );

        logger.debug(`Cached JSON response for ${cacheKey} (TTL: ${ttl}s)`);
      }

      // Call original method
      return originalJson.apply(res, arguments);
    };

    next();
  };
};

/**
 * Generate a cache key from the request
 * @param {Object} req - Express request object
 * @param {String} prefix - Key prefix
 * @returns {String} Cache key
 */
const generateCacheKey = (req, prefix = "api:") => {
  const url = req.originalUrl || req.url;

  // Typically we'd hash the URL for a shorter key, but for simplicity
  // we'll just use the URL directly with a prefix
  return `${prefix}${req.method}:${url}`;
};

/**
 * Clear cache for specific routes
 * @param {String|RegExp} pattern - Pattern to match cache keys
 * @returns {Function} Express middleware
 */
const clearCache = (pattern) => {
  return (req, res, next) => {
    let patternObj;

    if (typeof pattern === "string") {
      patternObj = new RegExp(pattern);
    } else if (pattern instanceof RegExp) {
      patternObj = pattern;
    } else {
      // Default to clearing based on route path
      patternObj = new RegExp(`^api:.*${req.path}`);
    }

    const count = cache.deletePattern(patternObj);
    logger.info(`Cleared ${count} cache entries matching ${patternObj}`);
    next();
  };
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
const getCacheStats = () => {
  return cache.getStats();
};

/**
 * Clear the entire cache
 */
const clearAllCache = () => {
  cache.clear();
  logger.info("Cleared all cache entries");
};

module.exports = {
  cacheMiddleware,
  clearCache,
  getCacheStats,
  clearAllCache,
};
