import api from './api';

/**
 * Product service for managing product data
 */
const productService = {
  /**
   * Get all products with optional filtering
   * @param {Object} params - Query parameters for filtering products
   * @returns {Promise<Object>} - Paginated product list
   */
  getProducts: async (params = {}) => {
    try {
      return await api.get('/products', { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a single product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Product details
   */
  getProductById: async (productId) => {
    try {
      return await api.get(`/products/${productId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get top-rated products
   * @param {number} limit - Number of products to return
   * @returns {Promise<Object>} - Top products
   */
  getTopProducts: async (limit = 4) => {
    try {
      return await api.get('/products/top', { params: { limit } });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get featured products
   * @param {number} limit - Number of products to return
   * @returns {Promise<Object>} - Featured products
   */
  getFeaturedProducts: async (limit = 8) => {
    try {
      return await api.get('/products/featured', { params: { limit } });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Object>} - Products in category
   */
  getProductsByCategory: async (categoryId, params = {}) => {
    try {
      return await api.get(`/categories/${categoryId}/products`, { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Object>} - Search results
   */
  searchProducts: async (query, params = {}) => {
    try {
      return await api.get('/products/search', { 
        params: { 
          q: query,
          ...params 
        } 
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get product reviews
   * @param {string} productId - Product ID
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise<Object>} - Product reviews
   */
  getProductReviews: async (productId, params = {}) => {
    try {
      return await api.get(`/products/${productId}/reviews`, { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add a review to a product
   * @param {string} productId - Product ID
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} - Created review
   */
  addProductReview: async (productId, reviewData) => {
    try {
      return await api.post(`/products/${productId}/reviews`, reviewData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get product variants
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Product variants
   */
  getProductVariants: async (productId) => {
    try {
      return await api.get(`/products/${productId}/variants`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all categories
   * @returns {Promise<Object>} - Categories list
   */
  getCategories: async () => {
    try {
      return await api.get('/categories');
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get similar products
   * @param {string} productId - Product ID
   * @param {number} limit - Number of products to return
   * @returns {Promise<Object>} - Similar products
   */
  getSimilarProducts: async (productId, limit = 4) => {
    try {
      return await api.get(`/products/${productId}/similar`, { params: { limit } });
    } catch (error) {
      throw error;
    }
  }
};

export default productService; 