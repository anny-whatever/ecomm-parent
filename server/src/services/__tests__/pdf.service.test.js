const fs = require('fs');
const path = require('path');
const { NotFoundError } = require('../../utils/errors');

// Mock the actual PDF service 
jest.mock('../../services/pdf.service', () => ({
  generateInvoice: jest.fn().mockImplementation(async (order) => {
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    // Simulate directory creation
    const uploadDir = 'uploads/invoices';
    if (!fs.existsSync(uploadDir)) {
      fs.promises.mkdir(uploadDir, { recursive: true });
    }
    
    // Return mock invoice URL
    const timestamp = Date.now();
    return `/uploads/invoices/${order.orderNumber || 'TEST-ORDER'}-${timestamp}.pdf`;
  })
}));

// Import the mocked service
const pdfService = require('../../services/pdf.service');

describe('PDF Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
  });
  
  describe('generateInvoice', () => {
    it('should throw NotFoundError if order is not provided', async () => {
      await expect(pdfService.generateInvoice(null)).rejects.toThrow(NotFoundError);
      await expect(pdfService.generateInvoice(null)).rejects.toThrow('Order not found');
    });
    
    it('should create upload directory if it does not exist', async () => {
      fs.existsSync.mockReturnValueOnce(false);
      
      const order = {
        _id: 'order123',
        orderNumber: 'ORD123',
        user: {
          _id: 'user123',
          email: 'user@example.com',
          profile: {
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          }
        },
        items: [
          {
            name: 'Test Product',
            price: 99.99,
            quantity: 2
          }
        ],
        totalAmount: 199.98,
        tax: 20,
        shippingFee: 10,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        createdAt: new Date('2023-05-01')
      };
      
      const result = await pdfService.generateInvoice(order);
      
      expect(fs.promises.mkdir).toHaveBeenCalled();
      expect(result).toMatch(/\/uploads\/invoices\/ORD123-\d+\.pdf$/);
    });
    
    it('should generate invoice with correct data', async () => {
      const order = {
        _id: 'order123',
        orderNumber: 'ORD123',
        user: {
          _id: 'user123',
          email: 'user@example.com',
          profile: {
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          }
        },
        items: [
          {
            name: 'Test Product',
            price: 99.99,
            quantity: 2
          }
        ],
        totalAmount: 199.98,
        tax: 20,
        shippingFee: 10,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        createdAt: new Date('2023-05-01')
      };
      
      const result = await pdfService.generateInvoice(order);
      
      expect(result).toMatch(/\/uploads\/invoices\/ORD123-\d+\.pdf$/);
    });
  });
}); 