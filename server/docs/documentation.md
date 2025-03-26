# E-Commerce Backend API Documentation

## Overview

This document provides comprehensive documentation for the E-commerce Backend System, designed as a scalable, modular, and feature-rich API for powering e-commerce applications. The backend is built using Node.js, Express, and MongoDB, and follows a service-oriented architecture pattern.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport.js (including OAuth 2.0 for social login)
- **Payment Processing**: Razorpay
- **Real-time Updates**: Server-Sent Events

## Base URL and Versioning

All API endpoints are prefixed with:
```
/api/v1
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Most endpoints require a valid token which should be included in the Authorization header.

```
Authorization: Bearer [your_token]
```

### Authentication Endpoints

#### 1. Register a New User
- **URL**: `POST /api/v1/auth/register`
- **Access**: Public
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "name": "Full Name",
    "email": "user@example.com",
    "password": "securepassword",
    "phone": "1234567890"
  }
  ```
- **Response**: Returns user details and a JWT token

#### 2. Login
- **URL**: `POST /api/v1/auth/login`
- **Access**: Public
- **Description**: Authenticate a user and receive a token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response**: Returns user details and a JWT token

#### 3. Social Authentication (Google)
- **URL**: `GET /api/v1/auth/google`
- **Access**: Public
- **Description**: Initiate Google OAuth authentication flow
- **Process**:
  - Redirects user to Google authentication page
  - After successful authentication, redirects to `/api/v1/auth/google/callback`
  - Frontend receives JWT token at the completion of the flow

#### 4. Social Authentication (Facebook)
- **URL**: `GET /api/v1/auth/facebook`
- **Access**: Public
- **Description**: Initiate Facebook OAuth authentication flow
- **Process**:
  - Redirects user to Facebook authentication page
  - After successful authentication, redirects to `/api/v1/auth/facebook/callback`
  - Frontend receives JWT token at the completion of the flow

#### 5. Link Social Account
- **URL**: `POST /api/v1/auth/link/:provider`
- **Access**: Private
- **Description**: Link a social account to existing user account
- **Path Parameters**:
  - `provider`: Social provider (google, facebook, twitter, apple)
- **Request Body**:
  ```json
  {
    "profile": {
      "id": "social_account_id",
      "displayName": "User Name",
      "emails": [
        { "value": "user@example.com" }
      ],
      "photos": [
        { "value": "https://path.to/photo.jpg" }
      ],
      "name": {
        "givenName": "User",
        "familyName": "Name"
      }
    },
    "token": "oauth_access_token"
  }
  ```
- **Response**: Returns updated user details

#### 6. Unlink Social Account
- **URL**: `DELETE /api/v1/auth/unlink/:provider`
- **Access**: Private
- **Description**: Unlink a social account from user account
- **Path Parameters**:
  - `provider`: Social provider (google, facebook, twitter, apple)
- **Response**: Returns updated user details

#### 7. Verify Email
- **URL**: `GET /api/v1/auth/verify-email/:token`
- **Access**: Public
- **Description**: Verify user's email address using the token sent via email

#### 8. Forgot Password
- **URL**: `POST /api/v1/auth/forgot-password`
- **Access**: Public
- **Description**: Request a password reset
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**: Message confirming reset email sent

#### 9. Reset Password
- **URL**: `POST /api/v1/auth/reset-password`
- **Access**: Public
- **Description**: Reset password using token
- **Request Body**:
  ```json
  {
    "token": "reset_token",
    "password": "newpassword"
  }
  ```

#### 10. Change Password
- **URL**: `POST /api/v1/auth/change-password`
- **Access**: Private
- **Description**: Change password when logged in
- **Request Body**:
  ```json
  {
    "currentPassword": "oldpassword",
    "newPassword": "newpassword"
  }
  ```

#### 11. Logout
- **URL**: `POST /api/v1/auth/logout`
- **Access**: Private
- **Description**: Logout user (invalidates token)

#### 12. Get Current User
- **URL**: `GET /api/v1/auth/me`
- **Access**: Private
- **Description**: Get details of currently authenticated user

## Users

User management endpoints for profile operations.

#### 1. Get User Profile
- **URL**: `GET /api/v1/users/profile`
- **Access**: Private
- **Description**: Get the current user's profile details

#### 2. Update User Profile
- **URL**: `PUT /api/v1/users/profile`
- **Access**: Private
- **Description**: Update current user's profile information
- **Request Body**: User profile fields to update

#### 3. Get User Addresses
- **URL**: `GET /api/v1/users/addresses`
- **Access**: Private
- **Description**: Get all addresses of the current user

#### 4. Add Address
- **URL**: `POST /api/v1/users/addresses`
- **Access**: Private
- **Description**: Add a new address to the user's profile
- **Request Body**: Address details

## Products

Endpoints for managing products in the e-commerce system.

#### 1. Get All Products
- **URL**: `GET /api/v1/products`
- **Access**: Public
- **Description**: Get a paginated list of products with optional filtering
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `sort`: Sort field (e.g., price, createdAt)
  - `order`: Sort order (asc/desc)
  - `search`: Search term
  - `category`: Filter by category ID
  - `minPrice`: Minimum price
  - `maxPrice`: Maximum price
  - `inStock`: Filter by availability (true/false)

#### 2. Get Product Detail
- **URL**: `GET /api/v1/products/:idOrSlug`
- **Access**: Public
- **Description**: Get detailed information about a specific product
- **Path Parameters**:
  - `idOrSlug`: Product ID or slug

#### 3. Get Related Products
- **URL**: `GET /api/v1/products/:id/related`
- **Access**: Public
- **Description**: Get products related to a specific product
- **Path Parameters**:
  - `id`: Product ID

#### 4. Create Product (Admin)
- **URL**: `POST /api/v1/products`
- **Access**: Private (Admin)
- **Description**: Create a new product
- **Request Body**: Product details

#### 5. Update Product (Admin)
- **URL**: `PUT /api/v1/products/:id`
- **Access**: Private (Admin)
- **Description**: Update an existing product
- **Path Parameters**:
  - `id`: Product ID
- **Request Body**: Updated product details

#### 6. Delete Product (Admin)
- **URL**: `DELETE /api/v1/products/:id`
- **Access**: Private (Admin)
- **Description**: Delete a product
- **Path Parameters**:
  - `id`: Product ID

#### 7. Upload Product Images (Admin)
- **URL**: `POST /api/v1/products/:productId/images`
- **Access**: Private (Admin)
- **Description**: Upload images for a product
- **Path Parameters**:
  - `productId`: Product ID
- **Form Data**: `product-images` (multiple files)

#### 8. Delete Product Image (Admin)
- **URL**: `DELETE /api/v1/products/:productId/images/:imageIndex`
- **Access**: Private (Admin)
- **Description**: Delete a specific image from a product
- **Path Parameters**:
  - `productId`: Product ID
  - `imageIndex`: Index of the image to delete

## Categories

Endpoints for managing product categories.

#### 1. Get All Categories
- **URL**: `GET /api/v1/categories`
- **Access**: Public
- **Description**: Get a list of all product categories

#### 2. Get Category Detail
- **URL**: `GET /api/v1/categories/:idOrSlug`
- **Access**: Public
- **Description**: Get details of a specific category
- **Path Parameters**:
  - `idOrSlug`: Category ID or slug

#### 3. Create Category (Admin)
- **URL**: `POST /api/v1/categories`
- **Access**: Private (Admin)
- **Description**: Create a new product category
- **Request Body**: Category details

#### 4. Update Category (Admin)
- **URL**: `PUT /api/v1/categories/:id`
- **Access**: Private (Admin)
- **Description**: Update an existing category
- **Path Parameters**:
  - `id`: Category ID
- **Request Body**: Updated category details

#### 5. Delete Category (Admin)
- **URL**: `DELETE /api/v1/categories/:id`
- **Access**: Private (Admin)
- **Description**: Delete a category
- **Path Parameters**:
  - `id`: Category ID

## Orders

Endpoints for managing customer orders.

#### 1. Create Order
- **URL**: `POST /api/v1/orders`
- **Access**: Private
- **Description**: Create a new order
- **Request Body**:
  ```json
  {
    "items": [
      {
        "product": "product_id",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "shippingAddress": "address_id",
    "paymentMethod": "razorpay",
    "shippingMethod": "shipping_method_id"
  }
  ```

#### 2. Get User Orders
- **URL**: `GET /api/v1/orders`
- **Access**: Private
- **Description**: Get all orders placed by the current user
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `status`: Filter by order status

#### 3. Get Order by ID
- **URL**: `GET /api/v1/orders/:id`
- **Access**: Private
- **Description**: Get details of a specific order
- **Path Parameters**:
  - `id`: Order ID

#### 4. Cancel Order
- **URL**: `PUT /api/v1/orders/:id/cancel`
- **Access**: Private
- **Description**: Cancel an order
- **Path Parameters**:
  - `id`: Order ID
- **Request Body**:
  ```json
  {
    "reason": "Cancellation reason"
  }
  ```

#### 5. Get Order Invoice
- **URL**: `GET /api/v1/orders/:id/invoice`
- **Access**: Private
- **Description**: Generate and download a PDF invoice for an order
- **Path Parameters**:
  - `id`: Order ID

#### 6. Get Orders by Status (Admin)
- **URL**: `GET /api/v1/orders/status/:status`
- **Access**: Private (Admin)
- **Description**: Get all orders with a specific status
- **Path Parameters**:
  - `status`: Order status (pending, processing, shipped, delivered, cancelled)

#### 7. Update Order Status (Admin)
- **URL**: `PUT /api/v1/orders/:id/status`
- **Access**: Private (Admin)
- **Description**: Update the status of an order
- **Path Parameters**:
  - `id`: Order ID
- **Request Body**:
  ```json
  {
    "status": "shipped",
    "comment": "Order shipped via FedEx"
  }
  ```

#### 8. Add Order Note (Admin)
- **URL**: `POST /api/v1/orders/:id/notes`
- **Access**: Private (Admin)
- **Description**: Add an internal note to an order
- **Path Parameters**:
  - `id`: Order ID
- **Request Body**:
  ```json
  {
    "note": "Customer requested gift wrapping"
  }
  ```

#### 9. Update Shipping Information (Admin)
- **URL**: `PUT /api/v1/orders/:id/shipping`
- **Access**: Private (Admin)
- **Description**: Update shipping details for an order
- **Path Parameters**:
  - `id`: Order ID
- **Request Body**: Updated shipping details

#### 10. Process Refund (Admin)
- **URL**: `POST /api/v1/orders/:id/refund`
- **Access**: Private (Admin)
- **Description**: Process a refund for an order
- **Path Parameters**:
  - `id`: Order ID
- **Request Body**:
  ```json
  {
    "amount": 29.99,
    "reason": "Defective product"
  }
  ```

#### 11. Get Order Stats (Admin)
- **URL**: `GET /api/v1/orders/stats`
- **Access**: Private (Admin)
- **Description**: Get order statistics for the dashboard
- **Query Parameters**:
  - `period`: Time period (today, week, month, year)

## Cart

Endpoints for managing the shopping cart.

#### 1. Get Cart
- **URL**: `GET /api/v1/cart`
- **Access**: Private
- **Description**: Get the current user's shopping cart

#### 2. Add Item to Cart
- **URL**: `POST /api/v1/cart/items`
- **Access**: Private
- **Description**: Add an item to the shopping cart
- **Request Body**:
  ```json
  {
    "productId": "product_id",
    "quantity": 1,
    "variant": "variant_id" // Optional
  }
  ```

#### 3. Update Cart Item
- **URL**: `PUT /api/v1/cart/items/:itemId`
- **Access**: Private
- **Description**: Update quantity of an item in the cart
- **Path Parameters**:
  - `itemId`: Cart item ID
- **Request Body**:
  ```json
  {
    "quantity": 2
  }
  ```

#### 4. Remove Item from Cart
- **URL**: `DELETE /api/v1/cart/items/:itemId`
- **Access**: Private
- **Description**: Remove an item from the cart
- **Path Parameters**:
  - `itemId`: Cart item ID

#### 5. Clear Cart
- **URL**: `DELETE /api/v1/cart`
- **Access**: Private
- **Description**: Remove all items from the cart

#### 6. Apply Coupon
- **URL**: `POST /api/v1/cart/coupon`
- **Access**: Private
- **Description**: Apply a coupon code to the cart
- **Request Body**:
  ```json
  {
    "code": "SUMMER20"
  }
  ```

#### 7. Remove Coupon
- **URL**: `DELETE /api/v1/cart/coupon`
- **Access**: Private
- **Description**: Remove applied coupon from the cart

## Inventory

Endpoints for managing product inventory.

#### 1. Get Product Inventory (Admin)
- **URL**: `GET /api/v1/inventory/products/:productId`
- **Access**: Private (Admin)
- **Description**: Get inventory details for a specific product
- **Path Parameters**:
  - `productId`: Product ID

#### 2. Update Inventory (Admin)
- **URL**: `PUT /api/v1/inventory/products/:productId`
- **Access**: Private (Admin)
- **Description**: Update inventory for a product
- **Path Parameters**:
  - `productId`: Product ID
- **Request Body**:
  ```json
  {
    "quantity": 50,
    "reason": "Restocking",
    "location": "Warehouse A"
  }
  ```

#### 3. Get Inventory History (Admin)
- **URL**: `GET /api/v1/inventory/products/:productId/history`
- **Access**: Private (Admin)
- **Description**: Get inventory change history for a product
- **Path Parameters**:
  - `productId`: Product ID
- **Query Parameters**:
  - `from`: Start date
  - `to`: End date

#### 4. Get Low Stock Products (Admin)
- **URL**: `GET /api/v1/inventory/low-stock`
- **Access**: Private (Admin)
- **Description**: Get a list of products with low inventory
- **Query Parameters**:
  - `threshold`: Stock threshold (default: 10)

## Payments

Endpoints for payment processing.

#### 1. Create Payment Intent
- **URL**: `POST /api/v1/payments/create-intent`
- **Access**: Private
- **Description**: Create a payment intent for order checkout
- **Request Body**:
  ```json
  {
    "orderId": "order_id",
    "amount": 59.98,
    "currency": "INR"
  }
  ```

#### 2. Verify Payment
- **URL**: `POST /api/v1/payments/verify`
- **Access**: Private
- **Description**: Verify a completed payment
- **Request Body**:
  ```json
  {
    "orderId": "order_id",
    "paymentId": "payment_id",
    "signature": "razorpay_signature"
  }
  ```

#### 3. Get Payment Details
- **URL**: `GET /api/v1/payments/:paymentId`
- **Access**: Private
- **Description**: Get details of a specific payment
- **Path Parameters**:
  - `paymentId`: Payment ID

#### 4. Get User Payments
- **URL**: `GET /api/v1/payments`
- **Access**: Private
- **Description**: Get all payments made by the current user

## Promotions

Endpoints for managing promotions and discounts.

#### 1. Get Active Promotions
- **URL**: `GET /api/v1/promotions`
- **Access**: Public
- **Description**: Get all active promotions

#### 2. Get Promotion Details
- **URL**: `GET /api/v1/promotions/:id`
- **Access**: Public
- **Description**: Get details of a specific promotion
- **Path Parameters**:
  - `id`: Promotion ID

#### 3. Create Promotion (Admin)
- **URL**: `POST /api/v1/promotions`
- **Access**: Private (Admin)
- **Description**: Create a new promotion
- **Request Body**: Promotion details

#### 4. Update Promotion (Admin)
- **URL**: `PUT /api/v1/promotions/:id`
- **Access**: Private (Admin)
- **Description**: Update an existing promotion
- **Path Parameters**:
  - `id`: Promotion ID
- **Request Body**: Updated promotion details

#### 5. Delete Promotion (Admin)
- **URL**: `DELETE /api/v1/promotions/:id`
- **Access**: Private (Admin)
- **Description**: Delete a promotion
- **Path Parameters**:
  - `id`: Promotion ID

#### 6. Validate Coupon
- **URL**: `POST /api/v1/promotions/validate-coupon`
- **Access**: Private
- **Description**: Validate a coupon code
- **Request Body**:
  ```json
  {
    "code": "SUMMER20",
    "cartTotal": 100.00
  }
  ```

## Shipping

Endpoints for managing shipping methods and rates.

#### 1. Get Shipping Methods
- **URL**: `GET /api/v1/shipping/methods`
- **Access**: Public
- **Description**: Get available shipping methods

#### 2. Get Shipping Rates
- **URL**: `POST /api/v1/shipping/rates`
- **Access**: Public
- **Description**: Calculate shipping rates for a location
- **Request Body**:
  ```json
  {
    "weight": 2.5,
    "destination": {
      "country": "US",
      "state": "CA",
      "zipCode": "90210"
    },
    "items": [
      { "productId": "product_id", "quantity": 2 }
    ]
  }
  ```

#### 3. Create Shipping Method (Admin)
- **URL**: `POST /api/v1/shipping/methods`
- **Access**: Private (Admin)
- **Description**: Create a new shipping method
- **Request Body**: Shipping method details

#### 4. Update Shipping Method (Admin)
- **URL**: `PUT /api/v1/shipping/methods/:id`
- **Access**: Private (Admin)
- **Description**: Update an existing shipping method
- **Path Parameters**:
  - `id`: Shipping method ID
- **Request Body**: Updated shipping method details

#### 5. Delete Shipping Method (Admin)
- **URL**: `DELETE /api/v1/shipping/methods/:id`
- **Access**: Private (Admin)
- **Description**: Delete a shipping method
- **Path Parameters**:
  - `id`: Shipping method ID

## Reviews

Endpoints for product reviews.

#### 1. Get Product Reviews
- **URL**: `GET /api/v1/reviews/product/:productId`
- **Access**: Public
- **Description**: Get all reviews for a specific product
- **Path Parameters**:
  - `productId`: Product ID
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `sort`: Sort field (e.g., rating, createdAt)
  - `order`: Sort order (asc/desc)

#### 2. Create Review
- **URL**: `POST /api/v1/reviews`
- **Access**: Private
- **Description**: Create a new product review
- **Request Body**:
  ```json
  {
    "productId": "product_id",
    "rating": 5,
    "title": "Great product!",
    "content": "This product exceeded my expectations.",
    "images": ["image1.jpg", "image2.jpg"] // Optional
  }
  ```

#### 3. Update Review
- **URL**: `PUT /api/v1/reviews/:id`
- **Access**: Private
- **Description**: Update an existing review
- **Path Parameters**:
  - `id`: Review ID
- **Request Body**: Updated review details

#### 4. Delete Review
- **URL**: `DELETE /api/v1/reviews/:id`
- **Access**: Private
- **Description**: Delete a review
- **Path Parameters**:
  - `id`: Review ID

#### 5. Reply to Review (Admin)
- **URL**: `POST /api/v1/reviews/:id/reply`
- **Access**: Private (Admin)
- **Description**: Add a reply to a customer review
- **Path Parameters**:
  - `id`: Review ID
- **Request Body**:
  ```json
  {
    "content": "Thank you for your feedback!"
  }
  ```

## Search

Endpoints for search functionality.

#### 1. Search Products
- **URL**: `GET /api/v1/search/products`
- **Access**: Public
- **Description**: Search for products
- **Query Parameters**:
  - `q`: Search query
  - `page`: Page number
  - `limit`: Items per page
  - `filters`: Additional filters in JSON format

#### 2. Autocomplete
- **URL**: `GET /api/v1/search/autocomplete`
- **Access**: Public
- **Description**: Get autocomplete suggestions for search
- **Query Parameters**:
  - `q`: Partial search query
  - `limit`: Maximum number of suggestions (default: 5)

## Analytics (Admin)

Endpoints for analytics and reporting.

#### 1. Sales Overview
- **URL**: `GET /api/v1/analytics/sales`
- **Access**: Private (Admin)
- **Description**: Get sales analytics
- **Query Parameters**:
  - `period`: Time period (today, week, month, year)
  - `compareWith`: Previous period to compare with

#### 2. Product Performance
- **URL**: `GET /api/v1/analytics/products`
- **Access**: Private (Admin)
- **Description**: Get product performance analytics
- **Query Parameters**:
  - `period`: Time period
  - `limit`: Number of products to return

#### 3. Customer Analytics
- **URL**: `GET /api/v1/analytics/customers`
- **Access**: Private (Admin)
- **Description**: Get customer analytics
- **Query Parameters**:
  - `period`: Time period

#### 4. Inventory Analytics
- **URL**: `GET /api/v1/analytics/inventory`
- **Access**: Private (Admin)
- **Description**: Get inventory analytics
- **Query Parameters**:
  - `period`: Time period

## Events (Real-time)

Endpoints for real-time event streaming.

#### 1. Connect to Event Stream
- **URL**: `GET /api/v1/events/stream`
- **Access**: Private
- **Description**: Connect to server-sent events stream
- **Note**: Returns Server-Sent Events (SSE) stream

#### 2. Admin Event Stream
- **URL**: `GET /api/v1/events/admin-stream`
- **Access**: Private (Admin)
- **Description**: Connect to admin-specific event stream
- **Note**: Returns Server-Sent Events (SSE) stream with admin notifications

## Media Management

Endpoints for managing media files.

#### 1. Upload Media
- **URL**: `POST /api/v1/media/upload`
- **Access**: Private
- **Description**: Upload media files (images, PDFs, etc.)
- **Form Data**: Files to upload

#### 2. Get Media Details
- **URL**: `GET /api/v1/media/:id`
- **Access**: Private
- **Description**: Get details of a specific media file
- **Path Parameters**:
  - `id`: Media ID

#### 3. Delete Media
- **URL**: `DELETE /api/v1/media/:id`
- **Access**: Private
- **Description**: Delete a media file
- **Path Parameters**:
  - `id`: Media ID

## Content Management

Endpoints for managing content (CMS).

#### 1. Get Pages
- **URL**: `GET /api/v1/content/pages`
- **Access**: Public
- **Description**: Get a list of content pages

#### 2. Get Page by Slug
- **URL**: `GET /api/v1/content/pages/:slug`
- **Access**: Public
- **Description**: Get content of a specific page
- **Path Parameters**:
  - `slug`: Page slug

#### 3. Create Page (Admin)
- **URL**: `POST /api/v1/content/pages`
- **Access**: Private (Admin)
- **Description**: Create a new content page
- **Request Body**: Page content and metadata

#### 4. Update Page (Admin)
- **URL**: `PUT /api/v1/content/pages/:id`
- **Access**: Private (Admin)
- **Description**: Update an existing content page
- **Path Parameters**:
  - `id`: Page ID
- **Request Body**: Updated page content

#### 5. Delete Page (Admin)
- **URL**: `DELETE /api/v1/content/pages/:id`
- **Access**: Private (Admin)
- **Description**: Delete a content page
- **Path Parameters**:
  - `id`: Page ID

## Health Check

#### 1. API Health Check
- **URL**: `GET /api/v1/health`
- **Access**: Public
- **Description**: Check if API is running
- **Response**:
  ```json
  {
    "success": true,
    "message": "API is running",
    "timestamp": "2023-05-01T12:00:00.000Z",
    "environment": "production"
  }
  ```

## Error Handling

The API uses standard HTTP status codes and consistent error responses:

```json
{
  "success": false,
  "message": "Error message explaining what went wrong",
  "errors": [] // Optional detailed error messages 
}
```

Common status codes:
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Unprocessable Entity - Validation error
- `500`: Internal Server Error - Server-side error

## Rate Limiting

To prevent abuse, the API enforces rate limits:
- Default: 100 requests per 15-minute window per IP address
- Custom limits may apply to specific endpoints

## Security Features

- JWT Authentication with short expiration times
- RBAC (Role-Based Access Control)
- Request validation using Joi
- Protection against common web vulnerabilities with Helmet
- Secure password handling with bcrypt
- CORS protection

## Data Models

### User Model
- Personal information (name, email, etc.)
- Authentication data (password hash, roles)
- Preferences and settings
- Shipping addresses
- Wishlist

### Product Model
- Basic details (name, description, price)
- Categories and tags
- Images and media
- Variants and options
- Inventory information
- SEO metadata

### Order Model
- Order items and quantities
- Customer information
- Shipping details
- Payment information
- Status and tracking
- Notes and history

### Review Model
- Product reference
- User reference
- Rating and content
- Images
- Admin replies
- Helpful votes

### Promotion Model
- Type (coupon, discount, etc.)
- Discount amount or percentage
- Validity period
- Usage restrictions
- Minimum order value
- Applicable products/categories

## Integration Guide

### Frontend Integration Steps

1. **Authentication Flow**:
   - Implement registration and login forms
   - Store JWT token securely (HTTP-only cookies recommended)
   - Add token to Authorization header for authenticated requests
   - Handle token expiration and refresh
   - Implement social login buttons for Google, Facebook, etc.
   - Set up OAuth redirects and token handling for social authentication

2. **Social Authentication Integration**:
   - Add social login buttons to your login and registration pages
   - Redirect users to the appropriate endpoint (e.g., `/api/v1/auth/google` for Google login)
   - Create a redirect handler page (e.g., `/social-auth-success`) to receive the JWT token after successful authentication
   - Extract the token from the URL query parameters and store it for future API requests
   - Allow users to link/unlink social accounts from their profile settings

3. **Product Display**:
   - Fetch products with pagination and filtering
   - Implement product detail pages
   - Show related products
   - Display reviews and ratings

4. **Shopping Cart**:
   - Create cart management interface
   - Implement add/update/remove item functions
   - Apply and validate coupon codes
   - Calculate totals and shipping

5. **Checkout Process**:
   - Collect shipping address
   - Select shipping method
   - Initialize payment with Razorpay
   - Handle payment confirmation
   - Display order confirmation

6. **User Account**:
   - Show order history
   - Allow profile management
   - Implement address book
   - Enable password changes

7. **Real-time Updates**:
   - Connect to SSE event stream
   - Update UI in response to events (order status changes, etc.)

### Example: Basic Product Listing Integration

```javascript
// React example for fetching and displaying products
import { useState, useEffect } from 'react';
import axios from 'axios';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/v1/products', {
          params: { page, limit: 10 }
        });
        setProducts(response.data.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [page]);
  
  return (
    <div className="product-list">
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <>
          <div className="grid">
            {products.map(product => (
              <div key={product._id} className="product-card">
                <img src={product.images[0]?.url} alt={product.name} />
                <h3>{product.name}</h3>
                <p>${product.price.toFixed(2)}</p>
                <button>Add to Cart</button>
              </div>
            ))}
          </div>
          <div className="pagination">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductList;
```

### Example: Social Authentication Integration

```javascript
// React component for social login buttons
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Social Login Buttons Component
const SocialLoginButtons = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/v1/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/v1/auth/facebook`;
  };

  return (
    <div className="social-login-container">
      <button 
        onClick={handleGoogleLogin}
        className="google-login-btn"
      >
        Login with Google
      </button>
      
      <button 
        onClick={handleFacebookLogin}
        className="facebook-login-btn"
      >
        Login with Facebook
      </button>
    </div>
  );
};

// Social Auth Success Handler Component
const SocialAuthSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get token from URL query parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      // Store token in localStorage or secure cookie
      localStorage.setItem('authToken', token);
      
      // Set Authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Redirect to dashboard or home page
      navigate('/dashboard');
    } else {
      // Handle error case
      navigate('/login?error=Authentication failed');
    }
  }, [location, navigate]);
  
  return <div>Completing authentication...</div>;
};

export { SocialLoginButtons, SocialAuthSuccess };
```

## Conclusion

This documentation provides a comprehensive guide to all the endpoints available in the E-commerce Backend API. Frontend developers can use this as a reference to integrate with the backend for building complete e-commerce solutions. 