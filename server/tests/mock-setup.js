const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.test' });

// Import our mocked services
const mockServices = require('./mocks/services.mock');

// Mock the services in our API routes
jest.mock('../src/services/pdf.service', () => mockServices.pdfService);
jest.mock('../src/services/media.service', () => {
  return require('./api/media.service.mock');
});
jest.mock('../src/services/user.service', () => mockServices.userService);
jest.mock('../src/services/order.service', () => mockServices.orderService);
jest.mock('../src/services/review.service', () => mockServices.reviewService);
jest.mock('../src/services/search.service', () => mockServices.searchService);

// Mock mongoose models
jest.mock('../src/models/user.model', () => {
  return {
    findById: jest.fn().mockImplementation((id) => ({
      exec: jest.fn().mockResolvedValue({
        _id: id,
        email: 'test@example.com',
        role: 'user',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        save: jest.fn().mockResolvedValue({
          _id: id,
          email: 'test@example.com',
          role: 'user',
          profile: {
            firstName: 'Test',
            lastName: 'User',
            avatar: 'http://localhost:3001/uploads/avatar.jpg'
          }
        })
      })
    })),
    findOne: jest.fn().mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue(null)
    }))
  };
});

jest.mock('../src/models/product.model', () => {
  return {
    findById: jest.fn().mockImplementation((id) => ({
      exec: jest.fn().mockResolvedValue({
        _id: id,
        name: 'Test Product',
        description: 'Test product description',
        price: 99.99,
        stock: 10,
        category: 'category_1',
        images: ['http://example.com/image.jpg'],
        ratingStats: {
          totalReviews: 1,
          averageRating: 5
        }
      })
    }))
  };
});

jest.mock('../src/models/order.model', () => {
  return {
    findById: jest.fn().mockImplementation((id) => ({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: id,
        orderNumber: 'ORD123',
        user: {
          _id: 'user_123',
          email: 'user@example.com',
          profile: {
            firstName: 'Test',
            lastName: 'User'
          }
        },
        items: [{
          product: {
            _id: 'product_123',
            name: 'Test Product'
          },
          price: 99.99,
          quantity: 2,
          total: 199.98
        }],
        totalAmount: 199.98,
        status: 'completed',
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        save: jest.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      })
    }))
  };
});

jest.mock('../src/models/review.model', () => {
  return {
    findById: jest.fn().mockImplementation((id) => ({
      exec: jest.fn().mockResolvedValue({
        _id: id,
        user: 'user_123',
        product: 'product_123',
        title: 'Great Product',
        content: 'This is an amazing product',
        rating: 5,
        status: 'pending',
        save: jest.fn().mockImplementation(function() {
          return Promise.resolve({
            ...this,
            status: 'approved'
          });
        })
      })
    }))
  };
});

jest.mock('../src/models/category.model', () => {
  return {
    find: jest.fn().mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue([
        {
          _id: 'category_1',
          name: 'Electronics',
          description: 'Electronic devices',
          slug: 'electronics'
        },
        {
          _id: 'category_2',
          name: 'Clothing',
          description: 'Clothing items',
          slug: 'clothing'
        }
      ])
    }))
  };
});

// Mock util.promisify and fs modules before they're used
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: (fn) => {
    if (fn === undefined) {
      return jest.fn().mockResolvedValue(undefined);
    }
    return jest.fn().mockImplementation(async (...args) => {
      if (typeof fn === 'function') {
        return fn(...args);
      }
      return undefined;
    });
  }
}));

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    unlink: jest.fn((path, callback) => {
      if (callback) callback(null);
      return true;
    }),
    stat: jest.fn((path, callback) => {
      if (callback) callback(null, { size: 12345 });
      return { size: 12345 };
    }),
    existsSync: jest.fn().mockReturnValue(true),
    readFileSync: jest.fn().mockReturnValue(Buffer.from('mock file content')),
    createWriteStream: jest.fn().mockReturnValue({
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      end: jest.fn()
    }),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue(Buffer.from('mock file content')),
      unlink: jest.fn().mockResolvedValue(undefined),
      stat: jest.fn().mockResolvedValue({ size: 12345 })
    }
  };
});

// Mock multer
jest.mock('multer', () => {
  return () => ({
    single: () => (req, res, next) => {
      req.file = {
        fieldname: 'avatar',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('mock file content'),
        size: 12345
      };
      next();
    },
    array: () => (req, res, next) => {
      req.files = [{
        fieldname: 'images',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('mock file content'),
        size: 12345
      }];
      next();
    }
  });
});

// Mock Sharp
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({})
  }));
});

// Mock the logger
jest.mock('../src/config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
  debug: jest.fn(),
  silly: jest.fn()
}));

// Add this with the other mocks at the top of the file
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => {
    return {
      orders: {
        create: jest.fn().mockResolvedValue({
          id: 'order_mockrazorpay123',
          amount: 10000,
          currency: 'INR',
          receipt: 'receipt_mock123',
          status: 'created'
        })
      },
      payments: {
        fetch: jest.fn().mockResolvedValue({
          id: 'pay_mockrazorpay123',
          amount: 10000,
          currency: 'INR',
          status: 'authorized',
          order_id: 'order_mockrazorpay123',
          method: 'card'
        }),
        capture: jest.fn().mockResolvedValue({
          id: 'pay_mockrazorpay123',
          amount: 10000,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_mockrazorpay123',
          method: 'card'
        })
      },
      subscriptions: {
        create: jest.fn().mockResolvedValue({
          id: 'sub_mockrazorpay123',
          plan_id: 'plan_mockrazorpay123',
          status: 'created'
        })
      },
      plans: {
        create: jest.fn().mockResolvedValue({
          id: 'plan_mockrazorpay123',
          interval: 'monthly',
          period: 30,
          item: {
            name: 'Test Subscription',
            amount: 10000,
            currency: 'INR'
          }
        })
      },
      refunds: {
        create: jest.fn().mockResolvedValue({
          id: 'rfnd_mockrazorpay123',
          payment_id: 'pay_mockrazorpay123',
          amount: 10000,
          status: 'processed'
        })
      }
    };
  });
});

// After the order model mock, add this mock for Payment model
jest.mock('../src/models/payment.model', () => {
  return {
    findById: jest.fn().mockImplementation((id) => ({
      exec: jest.fn().mockResolvedValue({
        _id: id,
        orderId: 'test-order-id',
        userId: 'test-user-id',
        amount: 99.99,
        currency: 'USD',
        method: 'credit_card',
        status: 'completed',
        razorpayOrderId: 'order_mockrazorpay123',
        razorpayPaymentId: 'pay_mockrazorpay123'
      })
    })),
    createPaymentRecord: jest.fn().mockImplementation((data) => {
      return Promise.resolve({
        _id: 'test-payment-id',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }),
    updatePaymentRecord: jest.fn().mockImplementation((orderId, data) => {
      return Promise.resolve({
        _id: 'test-payment-id',
        orderId: 'test-order-id',
        razorpayOrderId: orderId,
        ...data,
        updatedAt: new Date()
      });
    }),
    findOne: jest.fn().mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue({
        _id: 'test-payment-id',
        orderId: 'test-order-id',
        userId: 'test-user-id',
        amount: 99.99,
        status: 'completed'
      })
    }))
  };
});

// Helper function to generate test tokens
const generateTestToken = (user) => {
  return jwt.sign(
    { 
      id: user._id || 'test-user-id', 
      role: user.role || 'user' 
    },
    process.env.JWT_SECRET || 'test_jwt_secret',
    { expiresIn: '1h' }
  );
};

module.exports = {
  generateTestToken,
  mockServices
}; 