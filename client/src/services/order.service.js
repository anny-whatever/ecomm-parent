import api from './api';

/**
 * Order service for managing orders
 */
const orderService = {
  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} - Created order
   */
  createOrder: async (orderData) => {
    try {
      return await api.post('/orders', orderData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all orders for the current user
   * @param {Object} params - Query parameters for pagination and filtering
   * @returns {Promise<Object>} - List of orders
   */
  getUserOrders: async (params = {}) => {
    try {
      return await api.get('/orders', { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a specific order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Order details
   */
  getOrderById: async (orderId) => {
    try {
      return await api.get(`/orders/${orderId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @param {Object} data - Cancellation reasons and details
   * @returns {Promise<Object>} - Cancelled order
   */
  cancelOrder: async (orderId, data = {}) => {
    try {
      return await api.post(`/orders/${orderId}/cancel`, data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Track an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Tracking information
   */
  trackOrder: async (orderId) => {
    try {
      return await api.get(`/orders/${orderId}/track`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get invoice for an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Invoice data
   */
  getInvoice: async (orderId) => {
    try {
      return await api.get(`/orders/${orderId}/invoice`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a return request
   * @param {string} orderId - Order ID
   * @param {Object} returnData - Return request data
   * @returns {Promise<Object>} - Return request
   */
  createReturnRequest: async (orderId, returnData) => {
    try {
      return await api.post(`/orders/${orderId}/return`, returnData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check order status by tracking number
   * @param {string} trackingNumber - Order tracking number
   * @returns {Promise<Object>} - Order tracking details
   */
  checkOrderStatus: async (trackingNumber) => {
    try {
      return await api.get(`/orders/track/${trackingNumber}`);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Create payment for order using Razorpay
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Payment initialization data
   */
  createPayment: async (orderId) => {
    try {
      return await api.post(`/orders/${orderId}/payment`);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Verify payment for order
   * @param {string} orderId - Order ID
   * @param {Object} paymentData - Payment verification data
   * @returns {Promise<Object>} - Payment verification result
   */
  verifyPayment: async (orderId, paymentData) => {
    try {
      return await api.post(`/orders/${orderId}/payment/verify`, paymentData);
    } catch (error) {
      throw error;
    }
  }
};

export default orderService; 