const request = require('supertest');
const app = require('../../src/app');
const Cart = require('../../src/models/cart.model');
const Product = require('../../src/models/product.model');
const { generateTestToken } = require('../setup');

describe('Cart API', () => {
  let userToken;
  let testProduct;
  let testCart;
  let cartId;

  beforeAll(() => {
    // Set up test user
    const user = {
      _id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    };
    
    // Generate token
    userToken = generateTestToken(user);
    
    // Set up test product
    testProduct = {
      _id: 'test-product-id',
      name: 'Test Product',
      price: 99.99,
      inventory: 100,
      sku: 'TEST-SKU-123',
      active: true
    };
    
    // Set up test cart
    testCart = {
      _id: 'test-cart-id',
      items: [
        {
          product: testProduct._id,
          productData: {
            name: testProduct.name,
            price: testProduct.price
          },
          quantity: 2,
          price: testProduct.price,
          subtotal: testProduct.price * 2
        }
      ],
      totalItems: 2,
      subtotal: testProduct.price * 2,
      total: testProduct.price * 2,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    cartId = testCart._id;
    
    // Mock models
    Product.setMockData(testProduct);
    Cart.setMockData(testCart);
    
    // Setup mock method for Cart.findOne to return null when looking for existing cart
    const originalFindOne = Cart.findOne;
    Cart.findOne = jest.fn()
      .mockImplementation((query) => {
        if (query && query._id === cartId) {
          return {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(testCart)
          };
        }
        return {
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(null)
        };
      });
  });

  describe('GET /api/v1/cart', () => {
    it('should get cart using cartId cookie', async () => {
      const res = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', [`cartId=${cartId}`]);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.cart');
      expect(res.body.data.cart).toHaveProperty('items');
      expect(res.body.data.cart.items).toHaveLength(1);
    });
    
    it('should create a new cart when no cartId cookie exists', async () => {
      const res = await request(app)
        .get('/api/v1/cart');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.cart');
      expect(res.body.data.cart).toHaveProperty('items', []);
      expect(res.headers['set-cookie']).toBeDefined(); // Should set cart cookie
    });
  });
  
  describe('POST /api/v1/cart/items', () => {
    it('should add item to cart', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', [`cartId=${cartId}`])
        .send({
          productId: testProduct._id,
          quantity: 1
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.cart');
      expect(res.body.data.cart).toHaveProperty('items');
    });
    
    it('should return error for invalid product', async () => {
      // Mock product not found
      Product.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });
      
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', [`cartId=${cartId}`])
        .send({
          productId: 'invalid-product-id',
          quantity: 1
        });
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });
  
  describe('PUT /api/v1/cart/items/:itemId', () => {
    it('should update cart item quantity', async () => {
      const res = await request(app)
        .put(`/api/v1/cart/items/${testCart.items[0].product}`)
        .set('Cookie', [`cartId=${cartId}`])
        .send({
          quantity: 3
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.cart');
    });
  });
  
  describe('DELETE /api/v1/cart/items/:itemId', () => {
    it('should remove item from cart', async () => {
      const res = await request(app)
        .delete(`/api/v1/cart/items/${testCart.items[0].product}`)
        .set('Cookie', [`cartId=${cartId}`]);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.cart');
    });
  });
  
  describe('DELETE /api/v1/cart', () => {
    it('should clear the cart', async () => {
      const res = await request(app)
        .delete('/api/v1/cart')
        .set('Cookie', [`cartId=${cartId}`]);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.cart');
      expect(res.body.data.cart).toHaveProperty('items', []);
    });
  });
  
  describe('POST /api/v1/cart/coupon', () => {
    it('should apply coupon to cart', async () => {
      // Mock Coupon model
      const Coupon = require('../../src/models/coupon.model');
      Coupon.setMockData({
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        isActive: true,
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      });
      
      const res = await request(app)
        .post('/api/v1/cart/coupon')
        .set('Cookie', [`cartId=${cartId}`])
        .send({
          code: 'TEST10'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.cart');
      expect(res.body.data.cart).toHaveProperty('coupon');
    });
  });
  
  describe('POST /api/v1/cart/merge', () => {
    it('should merge guest cart with user cart when authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`cartId=${cartId}`])
        .send({
          guestCartId: cartId
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.cart');
    });
  });
}); 