# Reviews and Ratings API Documentation

This document provides comprehensive information about the Reviews and Ratings API. These endpoints allow customers to review products, rate them, and see aggregated ratings and reviews for each product.

## Base URL

All URLs referenced in this documentation have the following base:

```
/api/v1
```

## Review Endpoints

### Create a Review

```
POST /api/v1/reviews
```

Creates a new product review and rating. Users must be authenticated to submit reviews.

**Authentication Required:** Yes

**Request Body:**

```json
{
  "product": "60b1f2e3d4c5b6a7c8d9e0f1",
  "title": "Great product!",
  "content": "This smartphone exceeded my expectations in every way. The camera quality is exceptional and battery life is impressive.",
  "rating": 5,
  "images": [
    {
      "url": "/uploads/reviews/image-12345.webp",
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
      "_id": "60f1e2d3c4b5a6b7c8d9e0f1",
      "product": {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "slug": "smartphone-x",
        "images": [
          {
            "url": "/uploads/products/smartphone-x-12345.webp",
            "alt": "Smartphone X Front View",
            "isDefault": true
          }
        ]
      },
      "user": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7a",
        "profile": {
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "/uploads/avatars/johndoe-12345.webp"
        }
      },
      "title": "Great product!",
      "content": "This smartphone exceeded my expectations in every way. The camera quality is exceptional and battery life is impressive.",
      "rating": 5,
      "images": [
        {
          "url": "/uploads/reviews/image-12345.webp",
          "alt": "Product in use"
        }
      ],
      "isVerifiedPurchase": true,
      "helpfulVotes": 0,
      "status": "pending",
      "createdAt": "2023-05-19T14:30:45.123Z",
      "updatedAt": "2023-05-19T14:30:45.123Z"
    }
  }
}
```

### Get Reviews for a Product

```
GET /api/v1/reviews/product/:productId
```

Retrieves all approved reviews for a specific product.

**Authentication Required:** No

**Query Parameters:**

- `page`: Page number for pagination (default: 1)
- `limit`: Number of reviews per page (default: 10)
- `sort`: Field to sort by (options: "createdAt", "helpfulVotes", "rating"), default is "-createdAt" (newest first)
- `status`: Filter by review status (for admins only, options: "pending", "approved", "rejected", "all")

**Response:**

```json
{
  "success": true,
  "message": "Product reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "_id": "60f1e2d3c4b5a6b7c8d9e0f1",
        "product": {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
          "name": "Smartphone X",
          "slug": "smartphone-x"
        },
        "user": {
          "profile": {
            "firstName": "John",
            "lastName": "D.",
            "avatar": "/uploads/avatars/johndoe-12345.webp"
          }
        },
        "title": "Great product!",
        "content": "This smartphone exceeded my expectations in every way. The camera quality is exceptional and battery life is impressive.",
        "rating": 5,
        "images": [
          {
            "url": "/uploads/reviews/image-12345.webp",
            "alt": "Product in use"
          }
        ],
        "isVerifiedPurchase": true,
        "helpfulVotes": 12,
        "createdAt": "2023-05-19T14:30:45.123Z",
        "adminReply": {
          "content": "Thank you for your positive feedback!",
          "createdAt": "2023-05-20T09:15:22.456Z"
        }
      }
    ],
    "pagination": {
      "total": 32,
      "page": 1,
      "limit": 10,
      "pages": 4
    }
  }
}
```

### Get Review Statistics for a Product

```
GET /api/v1/reviews/product/:productId/stats
```

Retrieves rating statistics for a specific product.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Review statistics retrieved successfully",
  "data": {
    "stats": {
      "ratingBreakdown": {
        "1": 2,
        "2": 3,
        "3": 5,
        "4": 10,
        "5": 12
      },
      "totalReviews": 32
    }
  }
}
```

### Get a Specific Review

```
GET /api/v1/reviews/:id
```

Retrieves a specific review by ID.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Review retrieved successfully",
  "data": {
    "review": {
      "_id": "60f1e2d3c4b5a6b7c8d9e0f1",
      "product": {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "slug": "smartphone-x",
        "images": [
          {
            "url": "/uploads/products/smartphone-x-12345.webp",
            "alt": "Smartphone X Front View"
          }
        ]
      },
      "user": {
        "profile": {
          "firstName": "John",
          "lastName": "D.",
          "avatar": "/uploads/avatars/johndoe-12345.webp"
        }
      },
      "title": "Great product!",
      "content": "This smartphone exceeded my expectations in every way. The camera quality is exceptional and battery life is impressive.",
      "rating": 5,
      "images": [
        {
          "url": "/uploads/reviews/image-12345.webp",
          "alt": "Product in use"
        }
      ],
      "isVerifiedPurchase": true,
      "helpfulVotes": 12,
      "status": "approved",
      "createdAt": "2023-05-19T14:30:45.123Z",
      "updatedAt": "2023-05-19T15:45:22.456Z",
      "adminReply": {
        "content": "Thank you for your positive feedback!",
        "createdAt": "2023-05-20T09:15:22.456Z"
      }
    }
  }
}
```

### Get My Reviews

```
GET /api/v1/reviews/my-reviews
```

Retrieves all reviews submitted by the authenticated user.

**Authentication Required:** Yes

**Query Parameters:**

- `page`: Page number for pagination (default: 1)
- `limit`: Number of reviews per page (default: 10)
- `sort`: Field to sort by (default: "-createdAt")

**Response:**

```json
{
  "success": true,
  "message": "My reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "_id": "60f1e2d3c4b5a6b7c8d9e0f1",
        "product": {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
          "name": "Smartphone X",
          "slug": "smartphone-x",
          "images": [
            {
              "url": "/uploads/products/smartphone-x-12345.webp",
              "alt": "Smartphone X Front View"
            }
          ]
        },
        "title": "Great product!",
        "content": "This smartphone exceeded my expectations in every way. The camera quality is exceptional and battery life is impressive.",
        "rating": 5,
        "status": "approved",
        "createdAt": "2023-05-19T14:30:45.123Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### Update a Review

```
PUT /api/v1/reviews/:id
```

Updates an existing review. Users can only update their own reviews.

**Authentication Required:** Yes

**Request Body:**

```json
{
  "title": "Updated review title",
  "content": "I've been using this product for a month now, and it's still amazing!",
  "rating": 4,
  "images": [
    {
      "url": "/uploads/reviews/image-12345.webp",
      "alt": "Product in use - updated"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    "review": {
      "_id": "60f1e2d3c4b5a6b7c8d9e0f1",
      "title": "Updated review title",
      "content": "I've been using this product for a month now, and it's still amazing!",
      "rating": 4,
      "images": [
        {
          "url": "/uploads/reviews/image-12345.webp",
          "alt": "Product in use - updated"
        }
      ],
      "status": "pending",
      "updatedAt": "2023-06-19T10:15:30.789Z"
    }
  }
}
```

### Delete a Review

```
DELETE /api/v1/reviews/:id
```

Deletes a review. Users can only delete their own reviews.

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

### Vote a Review as Helpful

```
POST /api/v1/reviews/:id/helpful
```

Marks a review as helpful, increasing its helpful vote count.

**Authentication Required:** No (uses IP tracking to prevent multiple votes)

**Response:**

```json
{
  "success": true,
  "message": "Thank you for your feedback",
  "data": {
    "helpfulVotes": 13
  }
}
```

## Admin Review Endpoints

### Update Review Status (Admin)

```
PATCH /api/v1/reviews/:id/status
```

Updates the status of a review (approve, reject, etc.).

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "status": "approved"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Review status updated successfully",
  "data": {
    "review": {
      "_id": "60f1e2d3c4b5a6b7c8d9e0f1",
      "status": "approved",
      "updatedAt": "2023-05-20T09:10:15.123Z"
    }
  }
}
```

### Add Admin Reply to a Review

```
POST /api/v1/reviews/:id/reply
```

Adds an official admin/merchant reply to a customer review.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "content": "Thank you for your feedback! We're glad you're enjoying the smartphone."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Reply added successfully",
  "data": {
    "review": {
      "_id": "60f1e2d3c4b5a6b7c8d9e0f1",
      "adminReply": {
        "content": "Thank you for your feedback! We're glad you're enjoying the smartphone.",
        "createdAt": "2023-05-20T09:15:22.456Z",
        "admin": {
          "_id": "60e4d3c2b1a0f9e8d7c6b5a4",
          "profile": {
            "firstName": "Admin",
            "lastName": "User"
          }
        }
      },
      "updatedAt": "2023-05-20T09:15:22.456Z"
    }
  }
}
```

### Upload Review Images

```
POST /api/v1/reviews/:id/images
```

Upload images for a review.

**Authentication Required:** Yes

**Request:** Multipart form data with field 'review-images' (multiple files allowed)

**Response:**

```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "images": [
    {
      "url": "/uploads/reviews/60f1e2d3c4b5a6b7c8d9e0f1/image-12345.webp",
      "alt": "Product in use"
    }
  ]
}
```
