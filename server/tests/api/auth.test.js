const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const { generateTestToken } = require('../setup');
const mockUser = require('../mocks/user.mock');

describe('Auth API', () => {
  let testUser;
  let authToken;

  beforeAll(() => {
    // Set up test user
    testUser = {
      _id: 'test-user-id',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'user'
    };
    
    // Mock User model for test
    User.setMockData(testUser);
    
    // Generate auth token
    authToken = generateTestToken(testUser);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          passwordConfirm: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.user');
      expect(res.body.data.user).toHaveProperty('token');
    });

    it('should return validation error for invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New User',
          email: 'invalidemail',
          password: 'pass'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login a user and return token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.token');
    });

    it('should return error for invalid credentials', async () => {
      // Mock failed login
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.user');
      expect(res.body.data.user).toHaveProperty('email', testUser.email);
    });

    it('should return error if not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });
}); 