const request = require('supertest');
const app = require('../../src/app');
const Product = require('../../src/models/product.model');
const { generateTestToken } = require('../setup');

describe('Products API', () => {
  let adminToken;
  let userToken;
  let testProduct;

  beforeAll(() => {
    // Set up test admin
    const admin = {
      _id: 'admin-user-id',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    };
    
    // Set up regular user
    const user = {
      _id: 'regular-user-id',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user'
    };
    
    // Generate tokens
    adminToken = generateTestToken(admin);
    userToken = generateTestToken(user);
    
    // Set up test product
    testProduct = {
      _id: 'test-product-id',
      name: 'Test Product',
      description: 'This is a test product',
      price: 99.99,
      images: ['image1.jpg', 'image2.jpg'],
      category: 'test-category',
      inventory: 100,
      sku: 'TEST-SKU-123',
      slug: 'test-product',
      active: true
    };
    
    // Mock Product model
    Product.setMockData(testProduct);
  });

  describe('GET /api/v1/products', () => {
    it('should get list of products', async () => {
      const res = await request(app)
        .get('/api/v1/products');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.products');
      expect(Array.isArray(res.body.data.products)).toBe(true);
    });
    
    it('should filter products by query parameters', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .query({
          minPrice: 50,
          maxPrice: 100,
          category: 'test-category',
          sort: 'price',
          limit: 10,
          page: 1
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.products');
    });
  });
  
  describe('GET /api/v1/products/:idOrSlug', () => {
    it('should get product by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${testProduct._id}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.product');
      expect(res.body.data.product).toHaveProperty('name', testProduct.name);
    });
    
    it('should get product by slug', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${testProduct.slug}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.product');
    });
    
    it('should return 404 for non-existent product', async () => {
      Product.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      
      const res = await request(app)
        .get('/api/v1/products/nonexistent-product');
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });
  
  describe('POST /api/v1/products', () => {
    it('should create a new product when admin is authenticated', async () => {
      const productData = {
        name: 'New Product',
        description: 'Brand new product',
        price: 129.99,
        category: 'test-category',
        inventory: 50,
        sku: 'NEW-SKU-123'
      };
      
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.product');
      expect(res.body.data.product).toHaveProperty('name', productData.name);
    });
    
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send({
          name: 'New Product',
          description: 'Brand new product',
          price: 129.99
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });
    
    it('should return 403 if not admin', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Product',
          description: 'Brand new product',
          price: 129.99
        });
      
      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false);
    });
  });
  
  describe('PUT /api/v1/products/:id', () => {
    it('should update a product when admin is authenticated', async () => {
      const updatedData = {
        name: 'Updated Product',
        price: 149.99
      };
      
      const res = await request(app)
        .put(`/api/v1/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.product');
      expect(res.body.data.product).toHaveProperty('name', updatedData.name);
    });
  });
  
  describe('DELETE /api/v1/products/:id', () => {
    it('should delete a product when admin is authenticated', async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
}); 