import api from './api';

/**
 * User service for managing user profiles and related data
 */
const userService = {
  /**
   * Get user profile
   * @returns {Promise<Object>} - User profile data
   */
  getProfile: async () => {
    try {
      return await api.get('/users/profile');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} - Updated user profile
   */
  updateProfile: async (profileData) => {
    try {
      return await api.put('/users/profile', profileData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload profile avatar
   * @param {FormData} formData - Form data with image file
   * @returns {Promise<Object>} - Response with avatar URL
   */
  uploadAvatar: async (formData) => {
    try {
      return await api.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user addresses
   * @returns {Promise<Object>} - User addresses
   */
  getAddresses: async () => {
    try {
      return await api.get('/users/addresses');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add a new address
   * @param {Object} addressData - New address data
   * @returns {Promise<Object>} - Created address
   */
  addAddress: async (addressData) => {
    try {
      return await api.post('/users/addresses', addressData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an existing address
   * @param {string} addressId - Address ID
   * @param {Object} addressData - Updated address data
   * @returns {Promise<Object>} - Updated address
   */
  updateAddress: async (addressId, addressData) => {
    try {
      return await api.put(`/users/addresses/${addressId}`, addressData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete an address
   * @param {string} addressId - Address ID
   * @returns {Promise<Object>} - Delete confirmation
   */
  deleteAddress: async (addressId) => {
    try {
      return await api.delete(`/users/addresses/${addressId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Set default address
   * @param {string} addressId - Address ID
   * @returns {Promise<Object>} - Updated address list
   */
  setDefaultAddress: async (addressId) => {
    try {
      return await api.put(`/users/addresses/${addressId}/default`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user's wishlist
   * @returns {Promise<Object>} - Wishlist items
   */
  getWishlist: async () => {
    try {
      return await api.get('/users/wishlist');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add product to wishlist
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Updated wishlist
   */
  addToWishlist: async (productId) => {
    try {
      return await api.post('/users/wishlist', { productId });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove product from wishlist
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Updated wishlist
   */
  removeFromWishlist: async (productId) => {
    try {
      return await api.delete(`/users/wishlist/${productId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user notifications
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise<Object>} - User notifications
   */
  getNotifications: async (params = {}) => {
    try {
      return await api.get('/users/notifications', { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Updated notification
   */
  markNotificationAsRead: async (notificationId) => {
    try {
      return await api.put(`/users/notifications/${notificationId}/read`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} - Updated preferences
   */
  updateNotificationPreferences: async (preferences) => {
    try {
      return await api.put('/users/notifications/preferences', preferences);
    } catch (error) {
      throw error;
    }
  }
};

export default userService; 