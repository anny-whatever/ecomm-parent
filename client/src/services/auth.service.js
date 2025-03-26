import api from './api';

/**
 * Authentication service for managing user login, registration, and related operations
 */
const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration response
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login a user
   * @param {Object} credentials - User login credentials
   * @returns {Promise<Object>} - Login response with user data and token
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout the current user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Optionally call the logout endpoint if needed
    // return api.post('/auth/logout');
  },

  /**
   * Get the current authenticated user
   * @returns {Promise<Object>} - User data
   */
  getCurrentUser: async () => {
    try {
      return await api.get('/auth/me');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Send a forgot password request
   * @param {Object} email - User's email
   * @returns {Promise<Object>} - Response
   */
  forgotPassword: async (email) => {
    try {
      return await api.post('/auth/forgot-password', { email });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param {Object} data - Reset password data including token
   * @returns {Promise<Object>} - Response
   */
  resetPassword: async (data) => {
    try {
      return await api.post('/auth/reset-password', data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Change password for authenticated user
   * @param {Object} passwordData - Password change data
   * @returns {Promise<Object>} - Response
   */
  changePassword: async (passwordData) => {
    try {
      return await api.post('/auth/change-password', passwordData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<Object>} - Response
   */
  verifyEmail: async (token) => {
    try {
      return await api.get(`/auth/verify-email/${token}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Get current user from localStorage
   * @returns {Object|null} - User object or null
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default authService; 