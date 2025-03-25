// src/services/email.service.js
const nodemailer = require("nodemailer");
const logger = require("../config/logger");

/**
 * Email service for sending emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Verify connection configuration
      if (process.env.NODE_ENV !== "test") {
        this.transporter.verify((error) => {
          if (error) {
            logger.error("Email transport verification failed:", error);
          } else {
            logger.info("Email service ready to send messages");
          }
        });
      }
    } catch (error) {
      logger.error("Email transporter initialization failed:", error);
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {String} options.to - Recipient email
   * @param {String} options.subject - Email subject
   * @param {String} options.html - Email body in HTML
   * @param {String} options.text - Email body in plain text (optional)
   * @param {String} options.from - Sender email (optional, uses default if not provided)
   * @param {Array} options.attachments - Email attachments (optional)
   * @returns {Promise} Email sending result
   */
  async sendEmail(options) {
    try {
      if (!this.transporter) {
        this.initializeTransporter();
      }

      const mailOptions = {
        from: options.from || process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || undefined,
        attachments: options.attachments || [],
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV === "development") {
        logger.info(`Email sent: ${info.messageId}`);
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error("Email sending failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send template email
   * @param {String} template - Template name
   * @param {Object} data - Template data
   * @param {Object} options - Email options
   * @returns {Promise} Email sending result
   */
  async sendTemplateEmail(template, data, options) {
    try {
      // Here you would use a template engine like handlebars
      // For now, we'll just use a basic implementation

      let htmlContent = "";

      switch (template) {
        case "welcome":
          htmlContent = this.getWelcomeTemplate(data);
          break;
        case "order-confirmation":
          htmlContent = this.getOrderConfirmationTemplate(data);
          break;
        case "reset-password":
          htmlContent = this.getResetPasswordTemplate(data);
          break;
        default:
          throw new Error(`Template "${template}" not found`);
      }

      return await this.sendEmail({
        ...options,
        html: htmlContent,
      });
    } catch (error) {
      logger.error("Template email sending failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get welcome email template
   * @param {Object} data - Template data
   * @returns {String} HTML content
   */
  getWelcomeTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to our E-commerce Platform!</h2>
        <p>Hi ${data.name || "there"},</p>
        <p>Thank you for registering with us. We're excited to have you as our customer!</p>
        <p>
          <a href="${
            data.loginUrl
          }" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Log In to Your Account
          </a>
        </p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Thanks,<br>The E-commerce Team</p>
      </div>
    `;
  }

  /**
   * Get order confirmation email template
   * @param {Object} data - Template data
   * @returns {String} HTML content
   */
  getOrderConfirmationTemplate(data) {
    // Generate items HTML
    const itemsHtml = data.items
      .map(
        (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price.toFixed(2)}</td>
        <td>₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Confirmation</h2>
        <p>Hi ${data.customerName || "there"},</p>
        <p>Thank you for your order! We've received your order and it's being processed.</p>
        
        <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0;">
          <h3>Order Summary</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(
            data.orderDate
          ).toLocaleDateString()}</p>
          
          <h4>Items</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="text-align: left; padding: 8px;">Product</th>
                <th style="text-align: left; padding: 8px;">Quantity</th>
                <th style="text-align: left; padding: 8px;">Price</th>
                <th style="text-align: left; padding: 8px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right; padding: 8px;"><strong>Subtotal:</strong></td>
                <td style="padding: 8px;">₹${data.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right; padding: 8px;"><strong>Shipping:</strong></td>
                <td style="padding: 8px;">₹${data.shipping.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right; padding: 8px;"><strong>Tax:</strong></td>
                <td style="padding: 8px;">₹${data.tax.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right; padding: 8px;"><strong>Total:</strong></td>
                <td style="padding: 8px;"><strong>₹${data.total.toFixed(
                  2
                )}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <div style="width: 48%;">
            <h4>Shipping Address</h4>
            <p>
              ${data.shippingAddress.name}<br>
              ${data.shippingAddress.street}<br>
              ${data.shippingAddress.city}, ${data.shippingAddress.state} ${
      data.shippingAddress.postalCode
    }<br>
              ${data.shippingAddress.country}
            </p>
          </div>
          
          <div style="width: 48%;">
            <h4>Shipping Method</h4>
            <p>${data.shippingMethod}</p>
            
            <h4>Payment Method</h4>
            <p>${data.paymentMethod}</p>
          </div>
        </div>
        
        <p>
          <a href="${
            data.orderUrl
          }" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Order Details
          </a>
        </p>
        
        <p>If you have any questions or concerns about your order, please contact our customer service.</p>
        
        <p>Thanks for shopping with us!<br>The E-commerce Team</p>
      </div>
    `;
  }

  /**
   * Get reset password email template
   * @param {Object} data - Template data
   * @returns {String} HTML content
   */
  getResetPasswordTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Hi ${data.name || "there"},</p>
        <p>You requested a password reset for your account.</p>
        <p>Please click the button below to set a new password:</p>
        <p>
          <a href="${
            data.resetUrl
          }" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p>Thanks,<br>The E-commerce Team</p>
      </div>
    `;
  }
}

module.exports = new EmailService();
