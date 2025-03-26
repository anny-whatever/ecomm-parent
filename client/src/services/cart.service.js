import api from './api';

/**
 * Cart service for managing shopping cart
 */
const cartService = {
  /**
   * Get the current user's cart
   * @returns {Promise<Object>} - Cart data
   */
  getCart: async () => {
    try {
      return await api.get('/cart');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add an item to the cart
   * @param {Object} item - Item to add to cart
   * @returns {Promise<Object>} - Updated cart
   */
  addToCart: async (item) => {
    try {
      return await api.post('/cart/items', item);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an item in the cart
   * @param {string} itemId - Cart item ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated cart
   */
  updateCartItem: async (itemId, updates) => {
    try {
      return await api.put(`/cart/items/${itemId}`, updates);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove an item from the cart
   * @param {string} itemId - Cart item ID
   * @returns {Promise<Object>} - Updated cart
   */
  removeFromCart: async (itemId) => {
    try {
      return await api.delete(`/cart/items/${itemId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Clear the entire cart
   * @returns {Promise<Object>} - Empty cart
   */
  clearCart: async () => {
    try {
      return await api.delete('/cart/items');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Apply a coupon code to the cart
   * @param {string} code - Coupon code
   * @returns {Promise<Object>} - Updated cart with discount
   */
  applyCoupon: async (code) => {
    try {
      return await api.post('/cart/coupon', { code });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove coupon from the cart
   * @returns {Promise<Object>} - Updated cart without discount
   */
  removeCoupon: async () => {
    try {
      return await api.delete('/cart/coupon');
    } catch (error) {
      throw error;
    }
  }
};

export default cartService; 