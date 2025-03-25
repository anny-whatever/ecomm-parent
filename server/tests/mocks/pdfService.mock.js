const path = require('path');
const { NotFoundError } = require('../../src/utils/errors');

// Mock implementation of the PDF service
const generateInvoice = async (order) => {
  if (!order) {
    throw new NotFoundError('Order not found');
  }
  
  // Return a mock PDF URL
  const orderNumber = order.orderNumber || 'TEST-ORDER';
  const timestamp = Date.now();
  return `/uploads/invoices/${orderNumber}-${timestamp}.pdf`;
};

module.exports = {
  generateInvoice
}; 