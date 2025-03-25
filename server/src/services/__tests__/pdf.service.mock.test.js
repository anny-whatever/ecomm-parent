const path = require('path');

// Simple mock of the PDFService
const mockPdfService = {
  generateInvoice: async (order) => {
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Return mock invoice URL
    const timestamp = Date.now();
    const filename = `invoice-${order.orderNumber || 'TEST'}-${timestamp}.pdf`;
    return `/uploads/invoices/${filename}`;
  }
};

describe('PDF Service Mock', () => {
  describe('generateInvoice', () => {
    it('should throw NotFoundError if order is not provided', async () => {
      await expect(mockPdfService.generateInvoice(null)).rejects.toThrow('Order not found');
    });
    
    it('should generate invoice with correct format', async () => {
      const order = {
        orderNumber: 'ORD123'
      };
      
      const result = await mockPdfService.generateInvoice(order);
      
      expect(result).toMatch(/\/uploads\/invoices\/invoice-ORD123-\d+\.pdf$/);
    });
  });
}); 