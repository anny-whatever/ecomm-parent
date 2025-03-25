// tests/mocks/services.mock.js
const { NotFoundError } = require('../../src/utils/errorTypes');

// Mock PDF Service
const pdfService = {
  generateInvoice: jest.fn().mockImplementation(async (order) => {
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    // Simulate successful PDF generation
    return {
      filePath: `/uploads/invoices/invoice-${order._id || 'test'}.pdf`,
      fileName: `invoice-${order._id || 'test'}.pdf`,
      url: `http://localhost:3001/uploads/invoices/invoice-${order._id || 'test'}.pdf`
    };
  })
};

// Mock Media Service
const mockMediaService = {
  createMedia: jest.fn().mockImplementation(async (data) => {
    return {
      _id: 'media_' + Date.now(),
      url: `http://localhost:3001/uploads/${data.filename || 'test-image.jpg'}`,
      mimeType: data.mimeType || 'image/jpeg',
      size: data.size || 12345,
      metadata: data.metadata || {},
      createdAt: new Date()
    };
  }),
  
  getMediaById: jest.fn().mockImplementation(async (id) => {
    return {
      _id: id,
      url: `http://localhost:3001/uploads/test-image.jpg`,
      mimeType: 'image/jpeg',
      size: 12345,
      metadata: {},
      createdAt: new Date()
    };
  }),
  
  deleteMedia: jest.fn().mockResolvedValue(true)
};

// Mock User Service
const userService = {
  findUserById: jest.fn().mockImplementation(async (userId) => {
    if (!userId) {
      throw new NotFoundError('User not found');
    }
    
    return {
      _id: userId,
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    };
  }),
  
  updateProfile: jest.fn().mockImplementation(async (userId, profileData) => {
    return {
      _id: userId,
      email: 'test@example.com',
      name: profileData.firstName + ' ' + profileData.lastName,
      profile: {
        ...profileData
      }
    };
  })
};

// Mock Order Service
const orderService = {
  findOrderById: jest.fn().mockImplementation(async (orderId) => {
    if (!orderId) {
      throw new NotFoundError('Order not found');
    }
    
    return {
      _id: orderId,
      orderNumber: 'ORD-12345',
      user: 'test-user-id',
      items: [
        {
          product: 'test-product-id',
          name: 'Test Product',
          price: 99.99,
          quantity: 2,
          subtotal: 199.98
        }
      ],
      status: 'completed',
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Testland'
      },
      total: 199.98
    };
  }),
  
  generateInvoice: jest.fn().mockImplementation(async (orderId) => {
    if (!orderId) {
      throw new NotFoundError('Order not found');
    }
    
    return {
      invoiceUrl: `http://localhost:3001/uploads/invoices/invoice-${orderId}.pdf`
    };
  })
};

// Mock Review Service
const reviewService = {
  findReviewById: jest.fn().mockImplementation(async (reviewId) => {
    if (!reviewId) {
      throw new NotFoundError('Review not found');
    }
    
    return {
      _id: reviewId,
      product: 'test-product-id',
      user: 'test-user-id',
      rating: 5,
      title: 'Great Product',
      content: 'This is an amazing product',
      status: 'approved'
    };
  }),
  
  approveReview: jest.fn().mockImplementation(async (reviewId) => {
    if (!reviewId) {
      throw new NotFoundError('Review not found');
    }
    
    return {
      _id: reviewId,
      status: 'approved'
    };
  }),
  
  rejectReview: jest.fn().mockImplementation(async (reviewId) => {
    if (!reviewId) {
      throw new NotFoundError('Review not found');
    }
    
    return {
      _id: reviewId,
      status: 'rejected'
    };
  })
};

// Mock Search Service
const searchService = {
  search: jest.fn().mockImplementation(async (query, options) => {
    return {
      products: [
        {
          _id: 'product-1',
          name: 'Product One',
          description: 'This is product one',
          price: 99.99
        },
        {
          _id: 'product-2',
          name: 'Product Two',
          description: 'This is product two',
          price: 129.99
        }
      ],
      categories: [
        {
          _id: 'category-1',
          name: 'Category One'
        }
      ],
      totalResults: 3
    };
  })
};

module.exports = {
  pdfService,
  mediaService: mockMediaService,
  userService,
  orderService,
  reviewService,
  searchService
}; 