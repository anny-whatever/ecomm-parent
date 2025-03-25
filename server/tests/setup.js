const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.test' });

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
}));

// Mock mongoose for testing
jest.mock('mongoose', () => {
  const mongoose = jest.requireActual('mongoose');
  
  // Create mock model class
  class MockModel {
    constructor(data) {
      Object.assign(this, data);
      this._id = this._id || new mongoose.Types.ObjectId();
      this.save = jest.fn().mockResolvedValue(this);
    }
    
    static findById() {
      return {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(this.mockData)
      };
    }
    
    static findOne() {
      return {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(this.mockData)
      };
    }
    
    static find() {
      return {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([this.mockData])
      };
    }
    
    static deleteMany() {
      return {
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
      };
    }
    
    static aggregate() {
      return {
        exec: jest.fn().mockResolvedValue([])
      };
    }
    
    static setMockData(data) {
      this.mockData = data;
    }
  }
  
  // Mock connection object
  mongoose.connection = {
    collections: {}
  };
  
  // Mock model creation
  mongoose.model = jest.fn().mockImplementation((name) => {
    return MockModel;
  });
  
  return mongoose;
});

// Mock file system for PDF generation and image processing
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mock file content')),
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    end: jest.fn()
  }),
  statSync: jest.fn().mockReturnValue({ size: 12345 }),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(Buffer.from('mock file content'))
  }
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
  })
}));

// Mock PDFKit to avoid actual PDF generation
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    lineCap: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    table: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    end: jest.fn(),
    page: {
      width: 595.28,
      height: 841.89,
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    }
  }));
});

// Mock Sharp for image processing
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
  generateTestToken
}; 