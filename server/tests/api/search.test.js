const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const Product = require('../../src/models/product.model');
const Category = require('../../src/models/category.model');
const { generateTestToken } = require('../setup');

describe('Search API', () => {
  let user;
  let admin;
  let userToken;
  let adminToken;
  let categories = [];
  let products = [];
  
  beforeEach(async () => {
    // Create users
    user = new User({
      email: 'user@example.com',
      password: 'Password123',
      role: 'user',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    });
    await user.save();
    
    admin = new User({
      email: 'admin@example.com',
      password: 'AdminPass123',
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      }
    });
    await admin.save();
    
    // Generate tokens
    userToken = generateTestToken(user);
    adminToken = generateTestToken(admin);
    
    // Create categories
    const categoryNames = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen'];
    categories = [];
    
    for (const name of categoryNames) {
      const category = new Category({
        name,
        description: `${name} category`,
        slug: name.toLowerCase().replace(/\s+/g, '-')
      });
      await category.save();
      categories.push(category);
    }
    
    // Create products
    const productsData = [
      {
        name: 'Smartphone X',
        description: 'Latest smartphone with amazing features',
        price: 999.99,
        stock: 50,
        category: categories[0]._id, // Electronics
        tags: ['phone', 'mobile', 'tech'],
        attributes: {
          color: 'black',
          memory: '128GB'
        }
      },
      {
        name: 'T-shirt Classic',
        description: 'Comfortable cotton t-shirt',
        price: 19.99,
        stock: 100,
        category: categories[1]._id, // Clothing
        tags: ['shirt', 'apparel', 'casual'],
        attributes: {
          color: 'blue',
          size: 'M'
        }
      },
      {
        name: 'Modern JavaScript Book',
        description: 'Learn modern JavaScript programming',
        price: 39.99,
        stock: 30,
        category: categories[2]._id, // Books
        tags: ['javascript', 'programming', 'education'],
        attributes: {
          format: 'hardcover',
          pages: '350'
        }
      },
      {
        name: 'Coffee Maker Pro',
        description: 'Professional coffee maker for home use',
        price: 129.99,
        stock: 20,
        category: categories[3]._id, // Home & Kitchen
        tags: ['coffee', 'kitchen', 'appliance'],
        attributes: {
          color: 'silver',
          capacity: '12 cups'
        }
      },
      {
        name: 'Wireless Earbuds',
        description: 'High-quality wireless earbuds with noise cancellation',
        price: 149.99,
        stock: 40,
        category: categories[0]._id, // Electronics
        tags: ['audio', 'wireless', 'tech'],
        attributes: {
          color: 'white',
          batteryLife: '8 hours'
        }
      }
    ];
    
    products = [];
    for (const data of productsData) {
      const product = new Product(data);
      await product.save();
      products.push(product);
    }
  });
  
  describe('GET /api/v1/search/products', () => {
    it('should search products by keyword', async () => {
      const response = await request(app)
        .get('/api/v1/search/products?keyword=coffee');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products.length).toBe(1);
      expect(response.body.data.products[0].name).toBe('Coffee Maker Pro');
    });
    
    it('should filter products by category', async () => {
      const response = await request(app)
        .get(`/api/v1/search/products?category=${categories[0]._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBe(2);
      expect(response.body.data.products[0].category.toString()).toBe(categories[0]._id.toString());
    });
    
    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/v1/search/products?minPrice=100&maxPrice=200');
      
      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBe(2);
      expect(response.body.data.products.every(p => p.price >= 100 && p.price <= 200)).toBe(true);
    });
    
    it('should support sorting products', async () => {
      const response = await request(app)
        .get('/api/v1/search/products?sort=price&order=asc');
      
      expect(response.status).toBe(200);
      
      // Check if products are sorted by price in ascending order
      const prices = response.body.data.products.map(p => p.price);
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
      }
    });
    
    it('should include facets in the response', async () => {
      const response = await request(app)
        .get('/api/v1/search/products');
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('facets');
      expect(response.body.data.facets).toHaveProperty('categories');
      expect(response.body.data.facets).toHaveProperty('priceRanges');
      expect(response.body.data.facets).toHaveProperty('attributes');
    });
  });
  
  describe('GET /api/v1/search', () => {
    it('should perform a global search', async () => {
      const response = await request(app)
        .get('/api/v1/search?keyword=book');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products.some(p => p.name.includes('Book'))).toBe(true);
    });
    
    it('should limit access to certain entities for unauthenticated users', async () => {
      const response = await request(app)
        .get('/api/v1/search?keyword=user&entities=users');
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
    
    it('should allow admin to search across all entities', async () => {
      const response = await request(app)
        .get('/api/v1/search?keyword=user&entities=users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
    });
  });
  
  describe('GET /api/v1/search/autocomplete', () => {
    it('should return autocomplete suggestions for product names', async () => {
      const response = await request(app)
        .get('/api/v1/search/autocomplete?query=cof');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('suggestions');
      expect(response.body.data.suggestions[0]).toContain('Coffee');
    });
    
    it('should return empty array for insufficient query length', async () => {
      const response = await request(app)
        .get('/api/v1/search/autocomplete?query=a');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toEqual([]);
    });
  });
}); 