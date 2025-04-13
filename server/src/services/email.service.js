// src/services/email.service.js
const nodemailer = require("nodemailer");
const logger = require("../config/logger");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const emailHelpers = require("../utils/emailHelpers");

/**
 * Email service for sending emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
    this.registerHandlebarsHelpers();
    this.templates = {};
    this.loadTemplates();
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
   * Register handlebars helpers
   */
  registerHandlebarsHelpers() {
    handlebars.registerHelper(
      "calculateDiscountedTotal",
      emailHelpers.calculateDiscountedTotal
    );
    handlebars.registerHelper(
      "calculateSavings",
      emailHelpers.calculateSavings
    );
    handlebars.registerHelper("formatDate", emailHelpers.formatDate);
    handlebars.registerHelper("formatCurrency", emailHelpers.formatCurrency);
    handlebars.registerHelper("truncateText", emailHelpers.truncateText);
  }

  /**
   * Load email templates
   */
  loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, "../templates/emails");

      // Check if directory exists
      if (fs.existsSync(templatesDir)) {
        const files = fs.readdirSync(templatesDir);

        files.forEach((file) => {
          if (file.endsWith(".html")) {
            const templateName = file.replace(".html", "");
            const templatePath = path.join(templatesDir, file);
            try {
              const templateSource = fs.readFileSync(templatePath, "utf8");
              this.templates[templateName] = handlebars.compile(templateSource);
              logger.info(`Loaded email template: ${templateName}`);
            } catch (templateError) {
              logger.error(
                `Failed to load template ${templateName}: ${templateError.message}`
              );
            }
          }
        });

        logger.info(
          `Successfully loaded ${
            Object.keys(this.templates).length
          } email templates`
        );
      } else {
        logger.warn(`Email templates directory not found: ${templatesDir}`);
      }
    } catch (error) {
      logger.error("Error loading email templates:", error);
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

      // If template is provided, use it to generate HTML
      if (options.template && options.data) {
        options.html = this.renderTemplate(options.template, options.data);
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
   * Render email template
   * @param {String} templateName - Name of the template to render
   * @param {Object} data - Data to populate the template with
   * @returns {String} Rendered HTML content
   */
  renderTemplate(templateName, data) {
    try {
      // First, check if we have a precompiled template
      if (this.templates[templateName]) {
        logger.debug(`Using precompiled template: ${templateName}`);
        return this.templates[templateName](data);
      }

      // If not, try to load it from file
      const templatePath = path.join(
        __dirname,
        `../templates/emails/${templateName}.html`
      );

      if (fs.existsSync(templatePath)) {
        logger.debug(`Loading template from file: ${templateName}`);
        const templateSource = fs.readFileSync(templatePath, "utf8");
        const template = handlebars.compile(templateSource);
        // Cache it for future use
        this.templates[templateName] = template;
        return template(data);
      }

      // If we still don't have a template, fall back to legacy templates
      logger.debug(`Using legacy template fallback for: ${templateName}`);
      return this.getLegacyTemplate(templateName, data);
    } catch (error) {
      logger.error(`Error rendering template ${templateName}:`, error);

      // Provide a basic fallback template in case of failure
      const fallbackTemplate = handlebars.compile(`
        <html>
          <body>
            <h1>{{subject}}</h1>
            <p>Hello {{firstName}},</p>
            <p>You have items in your cart.</p>
            {{#if recoveryUrl}}
            <p><a href="{{recoveryUrl}}">Click here to recover your cart</a></p>
            {{/if}}
            <p>Thank you for shopping with us.</p>
          </body>
        </html>
      `);

      // Try to use the fallback template with a safe subset of the data
      try {
        const safeData = {
          subject: data.subject || "Your Cart",
          firstName: data.firstName || "Valued Customer",
          recoveryUrl: data.recoveryUrl,
        };
        return fallbackTemplate(safeData);
      } catch (fallbackError) {
        logger.error("Fallback template rendering failed:", fallbackError);
        // Return a basic string as absolute last resort
        return `<html><body><p>Please check your cart.</p></body></html>`;
      }
    }
  }

  /**
   * Get legacy template (backward compatibility)
   * @param {String} template - Template name
   * @param {Object} data - Template data
   * @returns {String} HTML content
   */
  getLegacyTemplate(template, data) {
    switch (template) {
      case "welcome":
        return this.getWelcomeTemplate(data);
      case "order-confirmation":
        return this.getOrderConfirmationTemplate(data);
      case "reset-password":
        return this.getResetPasswordTemplate(data);
      case "cart-recovery":
        return this.getCartRecoveryTemplate(data);
      default:
        throw new Error(`Template "${template}" not found`);
    }
  }

  /**
   * Send abandoned cart recovery email
   * @param {String} email - Recipient email
   * @param {Object} cart - Cart data
   * @param {Number} stage - Recovery stage (1, 2, or 3)
   * @param {String} token - Recovery token
   * @returns {Promise} Email sending result
   */
  async sendAbandonedCartEmail(email, cart, userData, stage, token) {
    const templateName = `abandoned-cart-reminder-${stage}`;
    const recoveryUrl = `${process.env.FRONTEND_URL}/cart/recover/${cart._id}/${token}`;
    const logoUrl = `${process.env.FRONTEND_URL}/assets/images/logo.png`;
    const unsubscribeUrl = `${process.env.FRONTEND_URL}/preferences/email?unsubscribe=cart`;

    // Prepare common data
    const data = {
      firstName: userData ? userData.firstName : "Valued Customer",
      cartItems: cart.items,
      cartTotal: cart.total,
      cartId: cart._id,
      recoveryUrl,
      logoUrl,
      unsubscribeUrl,
    };

    // Add stage-specific data
    switch (stage) {
      case 2:
        data.discountPercent = 5;
        break;
      case 3:
        data.discountPercent = 10;
        break;
    }

    // Add discount code if provided
    if (cart.recoveryDiscount) {
      data.discountCode = cart.recoveryDiscount.code;
    }

    let subject = "";
    switch (stage) {
      case 1:
        subject = "Items in your cart are waiting for you";
        break;
      case 2:
        subject = "Your cart items are still available - Limited time offer!";
        break;
      case 3:
        subject = "Last chance: Complete your purchase with a special offer";
        break;
    }

    return await this.sendEmail({
      to: email,
      subject,
      template: templateName,
      data,
    });
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

  /**
   * Get cart recovery email template
   * @param {Object} data - Template data
   * @returns {String} HTML content
   */
  getCartRecoveryTemplate(data) {
    // Generate items HTML
    const itemsHtml = data.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <img src="${item.image || "#"}" alt="${
          item.name
        }" style="width: 50px; height: 50px; object-fit: cover;">
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${
          item.name
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${
          item.quantity
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${
          item.price ? item.price.toFixed(2) : "0.00"
        }</td>
      </tr>
    `
      )
      .join("");

    const discountMessage = data.discountCode
      ? `<p style="font-size: 18px; margin: 20px 0;">Use coupon code <strong style="background-color: #f2f2f2; padding: 3px 7px; border-radius: 4px;">${
          data.discountCode
        }</strong> for ${data.discountPercentage || 10}% off your order!</p>`
      : "";

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4a4a4a; margin-bottom: 5px;">You left something behind!</h1>
          <p style="font-size: 18px; color: #777;">Your shopping cart is waiting for you</p>
        </div>
        
        <div style="background-color: #f9f9f9; border-radius: 5px; padding: 20px; margin-bottom: 25px;">
          <h3 style="margin-top: 0; color: #4a4a4a;">Items in your cart:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="text-align: left; padding: 10px;"></th>
                <th style="text-align: left; padding: 10px;">Product</th>
                <th style="text-align: left; padding: 10px;">Quantity</th>
                <th style="text-align: left; padding: 10px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        
        ${discountMessage}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.recoveryUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
            Complete Your Purchase
          </a>
        </div>
        
        <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
          If you didn't create this cart or have any questions, please contact our support team.
        </p>
      </div>
    `;
  }
}

// Create and export email service instance
const emailService = new EmailService();
module.exports = emailService;
