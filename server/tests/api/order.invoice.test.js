const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Order = require('../../src/models/order.model');
const { generateTestToken, mockServices } = require('../mock-setup');

// Clear mock history before tests
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Order Invoice API', () => {
  let customerUser;
  let adminUser;
  let anotherUser;
  let orderId;
  let customerToken;
  let adminToken;
  let anotherUserToken;
  
  beforeEach(() => {
    // Create test users
    customerUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      email: 'customer@example.com',
      password: 'Password123',
      role: 'user',
      profile: {
        firstName: 'Test',
        lastName: 'Customer'
      }
    };
    
    adminUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      email: 'admin@example.com',
      password: 'AdminPass123',
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      }
    };
    
    anotherUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      email: 'another@example.com',
      password: 'Password123',
      role: 'user',
      profile: {
        firstName: 'Another',
        lastName: 'User'
      }
    };
    
    // Generate auth tokens
    customerToken = generateTestToken(customerUser);
    adminToken = generateTestToken(adminUser);
    anotherUserToken = generateTestToken(anotherUser);
    
    // Create a test order ID
    orderId = new mongoose.Types.ObjectId().toString();
    
    // Mock the order service to return our custom response
    mockServices.orderService.generateInvoice.mockImplementation(async (id, userId) => {
      if (id === 'notfound') {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
      }
      
      if (userId !== customerUser._id && userId !== adminUser._id) {
        const error = new Error('Forbidden: You are not authorized to access this resource');
        error.statusCode = 403;
        throw error;
      }
      
      return {
        invoiceUrl: `/uploads/invoices/invoice-ORD123-${Date.now()}.pdf`
      };
    });
  });
  
  describe('GET /api/v1/orders/:id/invoice', () => {
    it('should generate PDF invoice for the order owner', async () => {
      // Mock the Order.findById to return order with customer as user
      Order.findById.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: orderId,
          orderNumber: 'ORD123',
          user: {
            _id: customerUser._id,
            email: customerUser.email
          },
          items: [{
            product: { _id: 'product123', name: 'Test Product' },
            price: 99.99,
            quantity: 2
          }],
          totalAmount: 199.98,
          status: 'completed',
          save: jest.fn().mockImplementation(function() {
            return Promise.resolve({
              ...this,
              invoiceUrl: `/uploads/invoices/invoice-ORD123-${Date.now()}.pdf`
            });
          })
        })
      }));
      
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}/invoice`)
        .set('Authorization', `Bearer ${customerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('invoiceUrl');
      expect(response.body.data.invoiceUrl).toContain('.pdf');
      
      // Check that order service was called
      expect(mockServices.orderService.generateInvoice).toHaveBeenCalled();
    });
    
    it('should allow admin to generate invoice for any order', async () => {
      // Mock the Order.findById to return order with customer as user (not admin)
      Order.findById.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: orderId,
          orderNumber: 'ORD123',
          user: {
            _id: customerUser._id,
            email: customerUser.email
          },
          items: [{
            product: { _id: 'product123', name: 'Test Product' },
            price: 99.99,
            quantity: 2
          }],
          totalAmount: 199.98,
          status: 'completed',
          save: jest.fn().mockImplementation(function() {
            return Promise.resolve({
              ...this,
              invoiceUrl: `/uploads/invoices/invoice-ORD123-${Date.now()}.pdf`
            });
          })
        })
      }));
      
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}/invoice`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('invoiceUrl');
    });
    
    it('should not allow other users to generate invoice', async () => {
      // Mock the Order.findById to return order with customer as user (not anotherUser)
      Order.findById.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: orderId,
          orderNumber: 'ORD123',
          user: {
            _id: customerUser._id,
            email: customerUser.email
          },
          items: [{
            product: { _id: 'product123', name: 'Test Product' },
            price: 99.99,
            quantity: 2
          }],
          totalAmount: 199.98,
          status: 'completed'
        })
      }));
      
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}/invoice`)
        .set('Authorization', `Bearer ${anotherUserToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
    
    it('should return 404 for non-existent order', async () => {
      // Mock the Order.findById to return null for non-existent order
      Order.findById.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      }));
      
      const nonExistentId = 'notfound';
      const response = await request(app)
        .get(`/api/v1/orders/${nonExistentId}/invoice`)
        .set('Authorization', `Bearer ${customerToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
}); 