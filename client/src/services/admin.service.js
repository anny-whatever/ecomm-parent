import api from './api';

/**
 * Admin service for admin panel operations
 */
const adminService = {
  // Dashboard & Analytics
  /**
   * Get dashboard analytics
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise<Object>} - Dashboard analytics data
   */
  getDashboardAnalytics: async (params = {}) => {
    try {
      return await api.get('/admin/dashboard', { params });
    } catch (error) {
      throw error;
    }
  },

  // Customer Management
  /**
   * Get all customers
   * @param {Object} params - Query parameters for pagination and filtering
   * @returns {Promise<Object>} - Paginated customer list
   */
  getCustomers: async (params = {}) => {
    try {
      return await api.get('/admin/customers', { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a customer by ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} - Customer details
   */
  getCustomerById: async (customerId) => {
    try {
      return await api.get(`/admin/customers/${customerId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a customer
   * @param {string} customerId - Customer ID
   * @param {Object} customerData - Updated customer data
   * @returns {Promise<Object>} - Updated customer
   */
  updateCustomer: async (customerId, customerData) => {
    try {
      return await api.put(`/admin/customers/${customerId}`, customerData);
    } catch (error) {
      throw error;
    }
  },

  // Order Management
  /**
   * Get all orders (admin view)
   * @param {Object} params - Query parameters for pagination and filtering
   * @returns {Promise<Object>} - Paginated order list
   */
  getOrders: async (params = {}) => {
    try {
      return await api.get('/admin/orders', { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get an order by ID (admin view)
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Order details
   */
  getOrderById: async (orderId) => {
    try {
      return await api.get(`/admin/orders/${orderId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {Object} updateData - Status update data
   * @returns {Promise<Object>} - Updated order
   */
  updateOrderStatus: async (orderId, updateData) => {
    try {
      return await api.put(`/admin/orders/${orderId}/status`, updateData);
    } catch (error) {
      throw error;
    }
  },

  // Product Management
  /**
   * Create a new product
   * @param {Object} productData - New product data
   * @returns {Promise<Object>} - Created product
   */
  createProduct: async (productData) => {
    try {
      return await api.post('/admin/products', productData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a product
   * @param {string} productId - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} - Updated product
   */
  updateProduct: async (productId, productData) => {
    try {
      return await api.put(`/admin/products/${productId}`, productData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a product
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteProduct: async (productId) => {
    try {
      return await api.delete(`/admin/products/${productId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload product images
   * @param {string} productId - Product ID
   * @param {FormData} formData - Form data with image files
   * @returns {Promise<Object>} - Upload result
   */
  uploadProductImages: async (productId, formData) => {
    try {
      return await api.post(`/admin/products/${productId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      throw error;
    }
  },

  // Category Management
  /**
   * Create a new category
   * @param {Object} categoryData - New category data
   * @returns {Promise<Object>} - Created category
   */
  createCategory: async (categoryData) => {
    try {
      return await api.post('/admin/categories', categoryData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a category
   * @param {string} categoryId - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise<Object>} - Updated category
   */
  updateCategory: async (categoryId, categoryData) => {
    try {
      return await api.put(`/admin/categories/${categoryId}`, categoryData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteCategory: async (categoryId) => {
    try {
      return await api.delete(`/admin/categories/${categoryId}`);
    } catch (error) {
      throw error;
    }
  },

  // Marketing Management
  /**
   * Create a discount coupon
   * @param {Object} couponData - Coupon data
   * @returns {Promise<Object>} - Created coupon
   */
  createCoupon: async (couponData) => {
    try {
      return await api.post('/admin/coupons', couponData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all coupons
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Coupon list
   */
  getCoupons: async (params = {}) => {
    try {
      return await api.get('/admin/coupons', { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a coupon
   * @param {string} couponId - Coupon ID
   * @param {Object} couponData - Updated coupon data
   * @returns {Promise<Object>} - Updated coupon
   */
  updateCoupon: async (couponId, couponData) => {
    try {
      return await api.put(`/admin/coupons/${couponId}`, couponData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a coupon
   * @param {string} couponId - Coupon ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteCoupon: async (couponId) => {
    try {
      return await api.delete(`/admin/coupons/${couponId}`);
    } catch (error) {
      throw error;
    }
  },

  // CMS Management
  /**
   * Create a banner
   * @param {Object} bannerData - Banner data
   * @returns {Promise<Object>} - Created banner
   */
  createBanner: async (bannerData) => {
    try {
      return await api.post('/admin/banners', bannerData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all banners
   * @returns {Promise<Object>} - Banner list
   */
  getBanners: async () => {
    try {
      return await api.get('/admin/banners');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a banner
   * @param {string} bannerId - Banner ID
   * @param {Object} bannerData - Updated banner data
   * @returns {Promise<Object>} - Updated banner
   */
  updateBanner: async (bannerId, bannerData) => {
    try {
      return await api.put(`/admin/banners/${bannerId}`, bannerData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a banner
   * @param {string} bannerId - Banner ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteBanner: async (bannerId) => {
    try {
      return await api.delete(`/admin/banners/${bannerId}`);
    } catch (error) {
      throw error;
    }
  }
};

export default adminService; 