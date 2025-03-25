const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const Product = require('../../src/models/product.model');
const Order = require('../../src/models/order.model');
const Review = require('../../src/models/review.model');
const { generateTestToken } = require('../setup');

describe('Review API', () => {
  let user;
  let admin;
  let product;
  let order;
  let userToken;
  let adminToken;
  
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
    
    // Create a product
    product = new Product({
      name: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      stock: 10,
      category: mongoose.Types.ObjectId(),
      images: ['http://example.com/image.jpg']
    });
    await product.save();
    
    // Create an order for the user (needed to verify purchase)
    order = new Order({
      user: user._id,
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      }],
      totalAmount: 99.99,
      status: 'completed'
    });
    await order.save();
  });
  
  describe('POST /api/v1/reviews', () => {
    it('should create a new review for a purchased product', async () => {
      const reviewData = {
        product: product._id.toString(),
        title: 'Great Product',
        content: 'This is an amazing product, highly recommend!',
        rating: 5
      };
      
      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('review');
      expect(response.body.data.review.title).toBe(reviewData.title);
      expect(response.body.data.review.rating).toBe(reviewData.rating);
      expect(response.body.data.review.user.toString()).toBe(user._id.toString());
      expect(response.body.data.review.product.toString()).toBe(product._id.toString());
      
      // Check if product stats were updated
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.ratingStats.totalReviews).toBe(1);
      expect(updatedProduct.ratingStats.averageRating).toBe(5);
    });
    
    it('should not allow review if product was not purchased', async () => {
      // Create another product that hasn't been purchased
      const unpurchasedProduct = new Product({
        name: 'Unpurchased Product',
        description: 'Another test product',
        price: 49.99,
        stock: 10,
        category: mongoose.Types.ObjectId(),
        images: ['http://example.com/image2.jpg']
      });
      await unpurchasedProduct.save();
      
      const reviewData = {
        product: unpurchasedProduct._id.toString(),
        title: 'Not purchased',
        content: 'I should not be able to review this',
        rating: 4
      };
      
      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/v1/reviews/product/:productId', () => {
    it('should get all reviews for a product', async () => {
      // Create a few reviews first
      const review1 = new Review({
        product: product._id,
        user: user._id,
        title: 'Review 1',
        content: 'Great product',
        rating: 5,
        status: 'approved'
      });
      await review1.save();
      
      const review2 = new Review({
        product: product._id,
        user: admin._id,
        title: 'Review 2',
        content: 'Also good',
        rating: 4,
        status: 'approved'
      });
      await review2.save();
      
      const response = await request(app)
        .get(`/api/v1/reviews/product/${product._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('reviews');
      expect(response.body.data.reviews.length).toBe(2);
      expect(response.body.data).toHaveProperty('pagination');
    });
  });
  
  describe('GET /api/v1/reviews/product/:productId/stats', () => {
    it('should get review statistics for a product', async () => {
      // Create some reviews with different ratings
      const reviews = [
        { rating: 5, status: 'approved' },
        { rating: 4, status: 'approved' },
        { rating: 3, status: 'approved' },
        { rating: 2, status: 'pending' } // This one shouldn't count in stats
      ];
      
      for (let i = 0; i < reviews.length; i++) {
        const review = new Review({
          product: product._id,
          user: user._id,
          title: `Review ${i+1}`,
          content: `Content ${i+1}`,
          rating: reviews[i].rating,
          status: reviews[i].status
        });
        await review.save();
      }
      
      const response = await request(app)
        .get(`/api/v1/reviews/product/${product._id}/stats`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('ratingDistribution');
      expect(response.body.data.stats).toHaveProperty('averageRating');
      expect(response.body.data.stats).toHaveProperty('totalReviews', 3); // Only approved reviews
      
      // Check rating distribution
      expect(response.body.data.stats.ratingDistribution['5']).toBe(1);
      expect(response.body.data.stats.ratingDistribution['4']).toBe(1);
      expect(response.body.data.stats.ratingDistribution['3']).toBe(1);
      expect(response.body.data.stats.ratingDistribution['2']).toBeUndefined();
    });
  });
  
  describe('PATCH /api/v1/reviews/:id/status', () => {
    it('should allow admin to update review status', async () => {
      // Create a review
      const review = new Review({
        product: product._id,
        user: user._id,
        title: 'Pending Review',
        content: 'Waiting for approval',
        rating: 4,
        status: 'pending'
      });
      await review.save();
      
      const response = await request(app)
        .patch(`/api/v1/reviews/${review._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.review.status).toBe('approved');
      
      // Verify in database
      const updatedReview = await Review.findById(review._id);
      expect(updatedReview.status).toBe('approved');
    });
    
    it('should not allow regular user to update review status', async () => {
      // Create a review
      const review = new Review({
        product: product._id,
        user: user._id,
        title: 'Pending Review',
        content: 'Waiting for approval',
        rating: 4,
        status: 'pending'
      });
      await review.save();
      
      const response = await request(app)
        .patch(`/api/v1/reviews/${review._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'approved' });
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
}); 