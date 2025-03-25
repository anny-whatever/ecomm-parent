# E-Commerce API Documentation

## Overview

This is the official documentation for the E-Commerce API. This API provides a comprehensive suite of endpoints to handle all aspects of an e-commerce platform, including user management, product catalog, shopping cart, checkout, orders, payments, reviews, and more.

## Base URL

```
https://api.yourecommerce.com/api/v1
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. 

To authenticate, include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN
```

To obtain a token, use the login endpoint.

## Error Handling

The API returns consistent error responses with the following structure:

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

Common error codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

The API enforces rate limits to prevent abuse. Current limits:
- 100 requests per minute for authenticated users
- 30 requests per minute for unauthenticated users

## Endpoints

### Authentication

#### Login

```
POST /auth/login
```

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "email": "user@example.com",
      "role": "customer"
    }
  }
}
```

#### Register

```
POST /auth/register
```

Registers a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "email": "user@example.com"
    }
  }
}
```

### User

#### Get Profile

```
GET /users/profile
```

Retrieves the authenticated user's profile.

**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "email": "user@example.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890",
        "avatar": "/uploads/users/avatars/avatar-123.jpg"
      },
      "addresses": [],
      "preferences": {
        "marketing": true,
        "notifications": true
      }
    }
  }
}
```

#### Update Profile

```
PUT /users/profile
```

Updates the authenticated user's profile.

**Request Body:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+1234567890"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "profile": {
        "firstName": "John",
        "lastName": "Smith",
        "phone": "+1234567890"
      }
    }
  }
}
```

#### Upload Avatar

```
POST /users/profile/avatar
```

Uploads a profile avatar image.

**Request:**
Multipart form data with field `user-avatar` containing the image file.

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "user": {
      "_id": "60d0fe4f5311236168a109ca",
      "profile": {
        "firstName": "John",
        "lastName": "Smith",
        "avatar": "/uploads/users/avatars/user-avatar-123456789.jpg"
      }
    },
    "avatarUrl": "/uploads/users/avatars/user-avatar-123456789.jpg"
  }
}
```

### Products

#### Get Products

```
GET /products
```

Retrieves a list of products with pagination.

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `sort` (default: "-createdAt") - Sort field and direction
- `featured` (optional) - Filter for featured products (true/false)
- `category` (optional) - Filter by category ID

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "60d0fe4f5311236168a109ca",
        "name": "Product 1",
        "slug": "product-1",
        "price": {
          "regular": 99.99,
          "sale": 79.99,
          "effective": 79.99,
          "discountPercentage": 20
        },
        "images": [
          {
            "url": "/uploads/products/product-1.jpg",
            "alt": "Product 1",
            "isDefault": true
          }
        ],
        "reviews": {
          "average": 4.5,
          "count": 10
        }
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  }
}
```

#### Get Product Details

```
GET /products/:slug
```

Retrieves detailed information about a product.

**Response:**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": {
      "id": "60d0fe4f5311236168a109ca",
      "name": "Product 1",
      "slug": "product-1",
      "description": {
        "short": "Short description",
        "long": "Detailed product description"
      },
      "price": {
        "regular": 99.99,
        "sale": 79.99,
        "effective": 79.99,
        "discountPercentage": 20
      },
      "categories": [
        {
          "id": "60d0fe4f5311236168a109cb",
          "name": "Category 1",
          "slug": "category-1"
        }
      ],
      "images": [
        {
          "url": "/uploads/products/product-1.jpg",
          "alt": "Product 1",
          "isDefault": true
        }
      ],
      "attributes": [
        {
          "name": "Color",
          "value": "Red"
        },
        {
          "name": "Size",
          "value": "Medium"
        }
      ],
      "variants": [
        {
          "id": "60d0fe4f5311236168a109cc",
          "name": "Red / Medium",
          "price": {
            "regular": 99.99,
            "sale": 79.99
          },
          "attributes": [
            {
              "name": "Color",
              "value": "Red"
            },
            {
              "name": "Size",
              "value": "Medium"
            }
          ],
          "inventory": {
            "quantity": 100,
            "reserved": 10
          }
        }
      ],
      "inventory": {
        "quantity": 100,
        "reserved": 10
      },
      "reviews": {
        "average": 4.5,
        "count": 10
      }
    }
  }
}
```

### Cart

#### Get Cart

```
GET /cart
```

Retrieves the user's current shopping cart.

**Response:**
```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "cart": {
      "id": "60d0fe4f5311236168a109ca",
      "items": [
        {
          "product": {
            "id": "60d0fe4f5311236168a109cb",
            "name": "Product 1",
            "slug": "product-1",
            "images": [
              {
                "url": "/uploads/products/product-1.jpg",
                "isDefault": true
              }
            ]
          },
          "variant": {
            "id": "60d0fe4f5311236168a109cc",
            "name": "Red / Medium"
          },
          "quantity": 2,
          "price": 79.99,
          "total": 159.98
        }
      ],
      "subtotal": 159.98,
      "shipping": 10.00,
      "tax": 16.00,
      "discount": 0,
      "total": 185.98
    }
  }
}
```

#### Add to Cart

```
POST /cart/items
```

Adds a product to the cart.

**Request Body:**
```json
{
  "productId": "60d0fe4f5311236168a109cb",
  "variantId": "60d0fe4f5311236168a109cc",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "data": {
    "cart": {
      "id": "60d0fe4f5311236168a109ca",
      "items": [
        {
          "product": {
            "id": "60d0fe4f5311236168a109cb",
            "name": "Product 1"
          },
          "variant": {
            "id": "60d0fe4f5311236168a109cc",
            "name": "Red / Medium"
          },
          "quantity": 2,
          "price": 79.99,
          "total": 159.98
        }
      ],
      "subtotal": 159.98,
      "total": 185.98
    }
  }
}
```

### Reviews

#### Get Product Reviews

```
GET /reviews/product/:productId
```

Retrieves reviews for a specific product.

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 10) - Items per page
- `sort` (default: "-createdAt") - Sort field and direction
- `status` (default: "approved") - Filter by review status

**Response:**
```json
{
  "success": true,
  "message": "Product reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "id": "60d0fe4f5311236168a109ca",
        "title": "Great product!",
        "content": "I love this product. It exceeded my expectations.",
        "rating": 5,
        "user": {
          "id": "60d0fe4f5311236168a109cb",
          "profile": {
            "firstName": "John",
            "lastName": "D.",
            "avatar": "/uploads/users/avatars/user-123.jpg"
          }
        },
        "isVerifiedPurchase": true,
        "helpfulVotes": 10,
        "createdAt": "2023-03-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

#### Create Review

```
POST /reviews
```

Creates a new product review.

**Request Body:**
```json
{
  "product": "60d0fe4f5311236168a109ca",
  "title": "Great product!",
  "content": "I love this product. It exceeded my expectations.",
  "rating": 5,
  "images": [
    {
      "url": "/uploads/reviews/review-image-123.jpg",
      "alt": "Product in use"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "review": {
      "id": "60d0fe4f5311236168a109cb",
      "title": "Great product!",
      "content": "I love this product. It exceeded my expectations.",
      "rating": 5,
      "isVerifiedPurchase": true,
      "status": "pending"
    }
  }
}
```

#### Vote Review as Helpful

```
POST /reviews/:id/helpful
```

Marks a review as helpful, incrementing its helpful votes count.

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "data": {
    "helpfulVotes": 11
  }
}
```

### Search

#### Search Products

```
GET /search/products
```

Performs an advanced search for products.

**Query Parameters:**
- `keyword` - Search keyword
- `category` - Category ID(s)
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `rating` - Minimum rating (1-5)
- `availability` - Stock status (in_stock, out_of_stock, low_stock)
- `attributes` - Product attributes (JSON format or key:value pairs)
- `tags` - Product tags
- `sortBy` - Sort method (relevance, price_asc, price_desc, newest, rating, popularity)
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page

**Response:**
```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": {
    "products": [
      {
        "id": "60d0fe4f5311236168a109ca",
        "name": "Product 1",
        "slug": "product-1",
        "price": {
          "effective": 79.99
        },
        "images": [
          {
            "url": "/uploads/products/product-1.jpg",
            "isDefault": true
          }
        ],
        "reviews": {
          "average": 4.5,
          "count": 10
        }
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5
    },
    "facets": {
      "categories": [
        {
          "id": "60d0fe4f5311236168a109cb",
          "name": "Category 1",
          "count": 50
        }
      ],
      "priceRange": {
        "min": 10.99,
        "max": 999.99
      },
      "ratings": {
        "5": 30,
        "4": 40,
        "3": 20,
        "2": 5,
        "1": 5
      }
    }
  }
}
```

#### Global Search

```
GET /search
```

Performs a global search across multiple entities.

**Query Parameters:**
- `keyword` (required) - Search keyword
- `entities` (default: "products") - Entities to search (products, categories, users, orders, reviews)
- `limit` (default: 5) - Max results per entity

**Response:**
```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": {
    "products": [
      {
        "id": "60d0fe4f5311236168a109ca",
        "name": "Product 1",
        "slug": "product-1"
      }
    ],
    "categories": [
      {
        "id": "60d0fe4f5311236168a109cb",
        "name": "Category 1",
        "slug": "category-1"
      }
    ],
    "reviews": [
      {
        "id": "60d0fe4f5311236168a109cc",
        "title": "Great product!",
        "rating": 5
      }
    ]
  }
}
```

### Orders

#### Create Order

```
POST /orders
```

Creates a new order from the user's cart.

**Request Body:**
```json
{
  "billing": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "shipping": {
    "sameAsBilling": true
  },
  "payment": {
    "method": "razorpay",
    "razorpayOrderId": "order_123456789"
  },
  "notes": "Please deliver before noon."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "60d0fe4f5311236168a109ca",
      "orderNumber": "ORD-12345",
      "status": "pending",
      "items": [
        {
          "product": {
            "id": "60d0fe4f5311236168a109cb",
            "name": "Product 1"
          },
          "quantity": 2,
          "price": 79.99,
          "total": 159.98
        }
      ],
      "pricing": {
        "subtotal": 159.98,
        "shipping": 10.00,
        "tax": 16.00,
        "discount": 0,
        "total": 185.98
      },
      "payment": {
        "method": "razorpay",
        "status": "pending"
      },
      "createdAt": "2023-03-15T10:30:00Z"
    }
  }
}
```

#### Get Order Invoice

```
GET /orders/:id/invoice
```

Generates and retrieves a PDF invoice for the order.

**Response:**
```json
{
  "success": true,
  "message": "Invoice generated successfully",
  "data": {
    "invoiceUrl": "/uploads/invoices/invoice-ORD-12345-123456789.pdf"
  }
}
```

## Deployment Guidelines

### System Requirements

- Node.js 14+
- MongoDB 4.4+
- Redis (optional, for caching)
- Minimum 2GB RAM
- 20GB storage

### Environment Variables

Create a `.env` file with the following variables:

```
# Server
PORT=3000
NODE_ENV=production
API_URL=https://api.yourecommerce.com/api/v1

# Database
MONGODB_URI=mongodb://username:password@host:port/database

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=1d

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@yourecommerce.com

# Storage
UPLOAD_DIR=uploads
```

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/ecommerce-api.git
cd ecommerce-api
```

2. Install dependencies
```
npm install --production
```

3. Build the project (if using TypeScript)
```
npm run build
```

4. Start the server
```
npm start
```

### Docker Deployment

1. Build the Docker image
```
docker build -t yourecommerce-api .
```

2. Run the container
```
docker run -d -p 3000:3000 --name ecommerce-api \
  --env-file .env \
  yourecommerce-api
```

## Security Guidelines

1. **HTTPS**: Always deploy the API with HTTPS in production
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Input Validation**: Validate all input to prevent injection attacks
4. **Authentication**: Secure all private endpoints with authentication
5. **Authorization**: Implement proper authorization checks
6. **Sensitive Data**: Never expose sensitive data in responses
7. **CORS**: Configure CORS properly to restrict access
8. **Headers**: Use security headers (Helmet.js)
9. **Dependency Security**: Regularly update dependencies

## Performance Optimization

1. **Indexing**: Ensure proper database indexing for frequently queried fields
2. **Pagination**: Implement pagination for all list endpoints
3. **Caching**: Use Redis or in-memory caching for frequently accessed data
4. **Compression**: Enable response compression
5. **Connection Pooling**: Use connection pooling for database connections
6. **Horizontal Scaling**: Design the API to be stateless for horizontal scaling 