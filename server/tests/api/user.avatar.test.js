const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const Media = require('../../src/models/media.model');

// Mock modules directly
jest.mock('../../src/services/media.service', () => ({
  createMedia: jest.fn().mockImplementation(() => {
    return {
      _id: 'media123',
      url: 'http://localhost:3001/uploads/avatar.jpg',
      type: 'image',
      path: 'avatar.jpg'
    };
  }),
  deleteMedia: jest.fn().mockResolvedValue(true)
}));

jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn().mockImplementation(fn => {
    return jest.fn().mockResolvedValue(undefined);
  })
}));

// Mock mongoose functions
jest.mock('mongoose', () => {
  const mockModel = {
    _id: new mongoose.Types.ObjectId(),
    save: jest.fn().mockResolvedValue(this),
    populate: jest.fn().mockReturnThis(),
    remove: jest.fn().mockResolvedValue({}),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
  };
  
  const originalMongoose = jest.requireActual('mongoose');
  return {
    ...originalMongoose,
    model: jest.fn().mockReturnValue(mockModel)
  };
});

// Test setup
let testUser;
let token;

beforeEach(async () => {
  jest.clearAllMocks();
  
  // Create test user
  testUser = {
    _id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    password: 'password123',
    profile: {
      firstName: 'Test',
      lastName: 'User'
    },
    generateAuthToken: jest.fn().mockReturnValue('test-token')
  };

  // Set up user mock
  User.findById = jest.fn().mockResolvedValue(testUser);
  User.findByIdAndUpdate = jest.fn().mockResolvedValue({
    ...testUser,
    profile: {
      ...testUser.profile,
      avatar: 'media123'
    }
  });
  
  // Set up media mock
  Media.findById = jest.fn().mockResolvedValue({
    _id: 'media123',
    url: 'http://localhost:3001/uploads/avatar.jpg',
    type: 'image'
  });
  
  // Generate auth token
  token = `Bearer ${testUser.generateAuthToken()}`;
});

describe('User Avatar API', () => {
  test('should upload user avatar', async () => {
    const response = await request(app)
      .post('/api/users/avatar')
      .set('Authorization', token)
      .attach('avatar', Buffer.from('mock image data'), 'avatar.jpg');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('avatarUrl');
    expect(response.body.avatarUrl).toContain('avatar.jpg');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      testUser._id.toString(),
      { 'profile.avatar': 'media123' },
      { new: true }
    );
  });

  test('should fail if no file is uploaded', async () => {
    const response = await request(app)
      .post('/api/users/avatar')
      .set('Authorization', token);
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('No file uploaded');
  });

  test('should delete user avatar', async () => {
    const response = await request(app)
      .delete('/api/users/avatar')
      .set('Authorization', token);
    
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('Avatar removed successfully');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      testUser._id.toString(),
      { $unset: { 'profile.avatar': '' } },
      { new: true }
    );
  });
}); 