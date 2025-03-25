const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const Product = require('../../src/models/product.model');
const Cart = require('../../src/models/cart.model');
const Order = require('../../src/models/order.model');
const Payment = require('../../src/models/payment.model');
const { generateTestToken } = require('../setup');

describe('Checkout Flow Integration Test', () => {
  let userToken;
  let cartId;
  let userId;
  let productId;
  let address;
  let agent;

  beforeAll(() => {
    // Set up test user
    const user = {
      _id: 'test-user-id',
      email: 'customer@example.com',
      name: 'Test Customer',
      role: 'user',
      addresses: [
        {
          _id: 'address-id-1',
          fullName: 'Test Customer',
          addressLine1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country',
          phoneNumber: '1234567890',
          isDefault: true
        }
      ]
    };
    
    userId = user._id;
    address = user.addresses[0];
    
    // Mock User.findById to return user with address
    User.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(user)
    });
    
    // Set up test product
    const testProduct = {
      _id: 'test-product-id',
      name: 'Test Product',
      price: 99.99,
      inventory: 100,
      sku: 'TEST-SKU-123',
      active: true
    };
    
    productId = testProduct._id;
    
    // Mock the Product model
    Product.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(testProduct)
    });
    
    // Mock Order model
    Order.create = jest.fn().mockResolvedValue({
      _id: 'test-order-id',
      user: userId,
      items: [
        {
          product: productId,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 1,
          subtotal: testProduct.price
        }
      ],
      shippingAddress: address,
      paymentMethod: 'credit_card',
      shippingMethod: {
        name: 'Standard Shipping',
        price: 10.00
      },
      subtotal: testProduct.price,
      shipping: 10.00,
      tax: 8.00,
      total: testProduct.price + 10.00 + 8.00,
      status: 'pending',
      trackingNumber: null
    });
    
    // Mock Payment model
    Payment.create = jest.fn().mockResolvedValue({
      _id: 'test-payment-id',
      order: 'test-order-id',
      amount: testProduct.price + 10.00 + 8.00,
      method: 'credit_card',
      status: 'success',
      transactionId: 'mock-transaction-id'
    });
    
    // Generate token
    userToken = generateTestToken(user);
    
    // Create a supertest agent that maintains cookies across requests
    agent = request.agent(app);
  });

  describe('Complete Checkout Flow', () => {
    it('should complete the entire checkout process', async () => {
      // Step 1: Get or create a new cart
      const cartResponse = await agent
        .get('/api/v1/cart');
      
      expect(cartResponse.statusCode).toBe(200);
      expect(cartResponse.body).toHaveProperty('success', true);
      
      // Extract the cart ID from the cookie for further requests
      const cookies = cartResponse.headers['set-cookie'];
      const cartIdCookie = cookies.find(cookie => cookie.startsWith('cartId='));
      cartId = cartIdCookie.split('=')[1].split(';')[0];
      
      // Step 2: Add product to cart
      const addItemResponse = await agent
        .post('/api/v1/cart/items')
        .send({
          productId: productId,
          quantity: 1
        });
      
      expect(addItemResponse.statusCode).toBe(200);
      expect(addItemResponse.body).toHaveProperty('success', true);
      expect(addItemResponse.body.data.cart.items).toHaveLength(1);
      
      // Step 3: Add shipping method to cart
      const shippingResponse = await agent
        .post('/api/v1/cart/shipping')
        .send({
          shippingMethodId: 'standard-shipping'
        });
      
      expect(shippingResponse.statusCode).toBe(200);
      expect(shippingResponse.body).toHaveProperty('success', true);
      
      // Step 4: Login user
      await agent
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'password123'
        });
      
      // Step 5: Start checkout process
      const checkoutInitResponse = await agent
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          addressId: address._id,
          paymentMethod: 'credit_card'
        });
      
      expect(checkoutInitResponse.statusCode).toBe(200);
      expect(checkoutInitResponse.body).toHaveProperty('success', true);
      expect(checkoutInitResponse.body).toHaveProperty('data.checkoutId');
      
      const checkoutId = checkoutInitResponse.body.data.checkoutId;
      
      // Step 6: Submit payment details
      const paymentResponse = await agent
        .post('/api/v1/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          checkoutId: checkoutId,
          paymentMethod: 'credit_card',
          cardDetails: {
            cardNumber: '4242424242424242',
            expiryMonth: '12',
            expiryYear: '2025',
            cvc: '123'
          }
        });
      
      expect(paymentResponse.statusCode).toBe(200);
      expect(paymentResponse.body).toHaveProperty('success', true);
      expect(paymentResponse.body).toHaveProperty('data.order');
      expect(paymentResponse.body).toHaveProperty('data.payment');
      
      const orderId = paymentResponse.body.data.order._id;
      
      // Step 7: Check order status
      const orderResponse = await agent
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(orderResponse.statusCode).toBe(200);
      expect(orderResponse.body).toHaveProperty('success', true);
      expect(orderResponse.body).toHaveProperty('data.order');
      expect(orderResponse.body.data.order).toHaveProperty('status');
      expect(['pending', 'processing', 'completed']).toContain(orderResponse.body.data.order.status);
    });
  });
}); 