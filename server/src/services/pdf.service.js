const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const { NotFoundError } = require('../utils/errors');

/**
 * Generate a PDF invoice for an order
 * @param {Object} order - Order data with populated details
 * @param {Object} options - PDF generation options
 * @returns {Promise<String>} Path to the generated PDF
 */
const generateInvoice = async (order, options = {}) => {
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  return new Promise((resolve, reject) => {
    try {
      // Ensure directory exists
      const uploadDir = path.join('uploads', 'invoices');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate a unique filename
      const filename = `invoice-${order.orderNumber}-${Date.now()}.pdf`;
      const filePath = path.join(uploadDir, filename);
      
      // Create PDF document
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        ...options
      });
      
      // Pipe PDF to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Add company logo if available
      const logoPath = path.join(__dirname, '..', '..', 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 150 });
        doc.moveDown();
      }
      
      // Header - Company info
      doc.fontSize(20).text('INVOICE', { align: 'right' });
      doc.fontSize(10).text('Your E-Commerce Company', { align: 'right' });
      doc.text('123 Commerce Street', { align: 'right' });
      doc.text('City, State, ZIP', { align: 'right' });
      doc.text('contact@yourecommerce.com', { align: 'right' });
      doc.moveDown();
      
      // Invoice details
      doc.fontSize(14).text('Invoice Details', { underline: true });
      doc.fontSize(10).text(`Invoice Number: INV-${order.orderNumber}`);
      doc.text(`Order Number: ${order.orderNumber}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.text(`Payment Method: ${order.paymentMethod || 'Not specified'}`);
      doc.text(`Payment Status: ${order.paymentStatus || 'Not specified'}`);
      doc.moveDown();
      
      // Customer details
      doc.fontSize(14).text('Customer Details', { underline: true });
      if (order.user && order.user.profile) {
        doc.fontSize(10).text(`Name: ${order.user.profile.firstName} ${order.user.profile.lastName}`);
        doc.text(`Email: ${order.user.email}`);
        
        if (order.user.profile.phone) {
          doc.text(`Phone: ${order.user.profile.phone}`);
        }
      } else {
        doc.fontSize(10).text('Customer: Guest checkout');
      }
      
      // Billing address
      if (order.billingAddress) {
        doc.moveDown();
        doc.fontSize(14).text('Billing Address', { underline: true });
        doc.fontSize(10).text(`${order.billingAddress.firstName} ${order.billingAddress.lastName}`);
        doc.text(`${order.billingAddress.addressLine1}`);
        
        if (order.billingAddress.addressLine2) {
          doc.text(`${order.billingAddress.addressLine2}`);
        }
        
        doc.text(`${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.zipCode}`);
        doc.text(`${order.billingAddress.country}`);
        
        if (order.billingAddress.phone) {
          doc.text(`Phone: ${order.billingAddress.phone}`);
        }
      }
      
      // Shipping address if different from billing
      if (order.shippingAddress) {
        doc.moveDown();
        doc.fontSize(14).text('Shipping Address', { underline: true });
        doc.fontSize(10).text(`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`);
        doc.text(`${order.shippingAddress.addressLine1}`);
        
        if (order.shippingAddress.addressLine2) {
          doc.text(`${order.shippingAddress.addressLine2}`);
        }
        
        doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`);
        doc.text(`${order.shippingAddress.country}`);
        
        if (order.shippingAddress.phone) {
          doc.text(`Phone: ${order.shippingAddress.phone}`);
        }
      }
      
      // Order items
      doc.moveDown();
      doc.fontSize(14).text('Order Items', { underline: true });
      
      // Table headers
      const tableTop = doc.y + 10;
      doc.fontSize(10);
      
      // Draw headers
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, tableTop);
      doc.text('Quantity', 280, tableTop, { width: 90, align: 'center' });
      doc.text('Price', 370, tableTop, { width: 90, align: 'right' });
      doc.text('Total', 460, tableTop, { width: 90, align: 'right' });
      
      // Underline headers
      doc.moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();
      
      // Reset font
      doc.font('Helvetica');
      
      // Item rows
      let y = tableTop + 25;
      order.items.forEach((item, index) => {
        // Add a new page if we're too close to the bottom
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = 50;
        }
        
        // Item details
        const productName = item.product?.name || 'Product';
        const sku = item.product?.sku || 'N/A';
        const variantName = item.variant ? ` - ${item.variant.name}` : '';
        
        doc.fontSize(10).text(`${productName}${variantName}`, 50, y, { width: 230 });
        doc.fontSize(8).text(`SKU: ${sku}`, 50, doc.y, { width: 230 });
        
        // Quantity, price and total
        doc.fontSize(10);
        doc.text(item.quantity.toString(), 280, y, { width: 90, align: 'center' });
        doc.text(`₹${parseFloat(item.price).toFixed(2)}`, 370, y, { width: 90, align: 'right' });
        doc.text(`₹${parseFloat(item.total).toFixed(2)}`, 460, y, { width: 90, align: 'right' });
        
        // Update y position for next item
        y = doc.y + 15;
      });
      
      // Line separator
      doc.moveTo(50, y)
         .lineTo(550, y)
         .stroke();
      
      // Order summary
      doc.moveDown();
      
      // Subtotal, shipping, taxes, and total
      const summaryX = 380;
      let summaryY = y + 20;
      
      doc.fontSize(10).text('Subtotal:', summaryX, summaryY);
      doc.text(`₹${parseFloat(order.subtotal).toFixed(2)}`, 460, summaryY, { width: 90, align: 'right' });
      
      summaryY += 15;
      doc.text('Shipping:', summaryX, summaryY);
      doc.text(`₹${parseFloat(order.shipping?.cost || 0).toFixed(2)}`, 460, summaryY, { width: 90, align: 'right' });
      
      if (order.discount) {
        summaryY += 15;
        doc.text('Discount:', summaryX, summaryY);
        doc.text(`-₹${parseFloat(order.discount).toFixed(2)}`, 460, summaryY, { width: 90, align: 'right' });
      }
      
      summaryY += 15;
      doc.text('Tax:', summaryX, summaryY);
      doc.text(`₹${parseFloat(order.tax).toFixed(2)}`, 460, summaryY, { width: 90, align: 'right' });
      
      // Total with bold font
      summaryY += 20;
      doc.font('Helvetica-Bold');
      doc.fontSize(12).text('Total:', summaryX, summaryY);
      doc.text(`₹${parseFloat(order.total).toFixed(2)}`, 460, summaryY, { width: 90, align: 'right' });
      doc.font('Helvetica');
      
      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(10).text(
        'Thank you for your business!',
        50,
        pageHeight - 100,
        { align: 'center' }
      );
      doc.fontSize(8).text(
        'This is a computer-generated invoice and does not require a signature.',
        50,
        pageHeight - 80,
        { align: 'center' }
      );
      
      // Finalize PDF
      doc.end();
      
      // Wait for stream to finish
      stream.on('finish', () => {
        logger.info(`Invoice generated: ${filePath}`);
        resolve(`/${filePath.replace(/\\/g, '/')}`);
      });
      
      stream.on('error', (error) => {
        logger.error(`Error generating invoice: ${error.message}`);
        reject(error);
      });
    } catch (error) {
      logger.error(`Error in PDF generation: ${error.message}`);
      reject(error);
    }
  });
};

module.exports = {
  generateInvoice,
}; 