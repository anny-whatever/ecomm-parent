# Content Management API Documentation

## Page Endpoints

### Get Page

```
GET /api/v1/content/pages/:slug
```

Get a specific page by its slug.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Page retrieved successfully",
  "data": {
    "page": {
      "_id": "60v1w2x3y4z5a6b7c8d9e0f1",
      "title": "About Us",
      "slug": "about-us",
      "content": "<h1>About Our Company</h1><p>Founded in 2020, we are dedicated to providing high-quality products...</p>",
      "metaTitle": "About Us | Example Store",
      "metaDescription": "Learn about our company history, mission, and values.",
      "status": "published",
      "createdAt": "2023-01-15T10:30:00.000Z",
      "updatedAt": "2023-04-20T15:45:22.456Z",
      "publishedAt": "2023-01-15T12:00:00.000Z"
    }
  }
}
```

### Get All Pages

```
GET /api/v1/content/pages
```

Get a list of all published pages.

**Authentication Required:** No

**Query Parameters:**

- `status`: Filter by status (default: "published")
- `page`: Page number for pagination (default: 1)
- `limit`: Number of pages per page (default: 10)

**Response:**

```json
{
  "success": true,
  "message": "Pages retrieved successfully",
  "data": {
    "pages": [
      {
        "_id": "60v1w2x3y4z5a6b7c8d9e0f1",
        "title": "About Us",
        "slug": "about-us",
        "status": "published",
        "publishedAt": "2023-01-15T12:00:00.000Z",
        "updatedAt": "2023-04-20T15:45:22.456Z"
      },
      {
        "_id": "60v2w3x4y5z6a7b8c9d0e1f2",
        "title": "Privacy Policy",
        "slug": "privacy-policy",
        "status": "published",
        "publishedAt": "2023-01-20T09:15:30.123Z",
        "updatedAt": "2023-03-10T11:20:45.789Z"
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

### Create Page (Admin)

```
POST /api/v1/admin/content/pages
```

Create a new page.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "title": "Terms and Conditions",
  "content": "<h1>Terms and Conditions</h1><p>Please read these terms and conditions carefully before using our website...</p>",
  "metaTitle": "Terms and Conditions | Example Store",
  "metaDescription": "Read our terms and conditions for using our website and services.",
  "status": "published",
  "publishedAt": "2023-05-20T18:00:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Page created successfully",
  "data": {
    "page": {
      "_id": "60v3w4x5y6z7a8b9c0d1e2f3",
      "title": "Terms and Conditions",
      "slug": "terms-and-conditions",
      "content": "<h1>Terms and Conditions</h1><p>Please read these terms and conditions carefully before using our website...</p>",
      "metaTitle": "Terms and Conditions | Example Store",
      "metaDescription": "Read our terms and conditions for using our website and services.",
      "status": "published",
      "createdAt": "2023-05-20T17:30:00.000Z",
      "updatedAt": "2023-05-20T17:30:00.000Z",
      "publishedAt": "2023-05-20T18:00:00.000Z"
    }
  }
}
```

### Update Page (Admin)

```
PUT /api/v1/admin/content/pages/:id
```

Update an existing page.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "content": "<h1>Terms and Conditions</h1><p>Updated: Please read these terms and conditions carefully before using our website...</p>",
  "metaDescription": "Updated terms and conditions for using our website and services."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Page updated successfully",
  "data": {
    "page": {
      "_id": "60v3w4x5y6z7a8b9c0d1e2f3",
      "title": "Terms and Conditions",
      "content": "<h1>Terms and Conditions</h1><p>Updated: Please read these terms and conditions carefully before using our website...</p>",
      "metaDescription": "Updated terms and conditions for using our website and services.",
      "updatedAt": "2023-05-20T19:15:30.456Z"
    }
  }
}
```

### Delete Page (Admin)

```
DELETE /api/v1/admin/content/pages/:id
```

Delete a page.

**Authentication Required:** Yes (Admin role)

**Response:**

```json
{
  "success": true,
  "message": "Page deleted successfully"
}
```

## Blog Endpoints

### Get Blog Posts

```
GET /api/v1/content/blog
```

Get a list of published blog posts.

**Authentication Required:** No

**Query Parameters:**

- `tag`: Filter by tag
- `category`: Filter by category
- `author`: Filter by author ID
- `page`: Page number for pagination (default: 1)
- `limit`: Number of posts per page (default: 10)
- `sortBy`: Field to sort by (default: "-publishedAt")

**Response:**

```json
{
  "success": true,
  "message": "Blog posts retrieved successfully",
  "data": {
    "posts": [
      {
        "_id": "60w1x2y3z4a5b6c7d8e9f0g1",
        "title": "Summer Fashion Trends 2023",
        "slug": "summer-fashion-trends-2023",
        "excerpt": "Discover the hottest fashion trends for summer 2023...",
        "coverImage": "https://example.com/uploads/blog/summer-fashion-2023.webp",
        "author": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7b",
          "profile": {
            "firstName": "Jane",
            "lastName": "Smith"
          }
        },
        "category": {
          "_id": "60w9x8y7z6a5b4c3d2e1f0g9",
          "name": "Fashion",
          "slug": "fashion"
        },
        "tags": ["fashion", "summer", "trends"],
        "publishedAt": "2023-05-15T09:30:00.000Z",
        "readTime": 5 // minutes
      },
      {
        "_id": "60w2x3y4z5a6b7c8d9e0f1g2",
        "title": "How to Choose the Perfect Smartphone",
        "slug": "how-to-choose-perfect-smartphone",
        "excerpt": "A comprehensive guide to selecting your next smartphone...",
        "coverImage": "https://example.com/uploads/blog/smartphone-guide.webp",
        "author": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7c",
          "profile": {
            "firstName": "John",
            "lastName": "Doe"
          }
        },
        "category": {
          "_id": "60w9x8y7z6a5b4c3d2e1f0g8",
          "name": "Technology",
          "slug": "technology"
        },
        "tags": ["smartphones", "tech", "buying-guide"],
        "publishedAt": "2023-05-10T14:15:00.000Z",
        "readTime": 8
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

### Get Blog Post Detail

```
GET /api/v1/content/blog/:slug
```

Get a specific blog post by its slug.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Blog post retrieved successfully",
  "data": {
    "post": {
      "_id": "60w1x2y3z4a5b6c7d8e9f0g1",
      "title": "Summer Fashion Trends 2023",
      "slug": "summer-fashion-trends-2023",
      "content": "<h1>Summer Fashion Trends 2023</h1><p>As temperatures rise, it's time to update your wardrobe with the latest summer fashion trends...</p>",
      "excerpt": "Discover the hottest fashion trends for summer 2023...",
      "coverImage": "https://example.com/uploads/blog/summer-fashion-2023.webp",
      "author": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7b",
        "profile": {
          "firstName": "Jane",
          "lastName": "Smith",
          "bio": "Fashion writer with 10+ years of experience",
          "avatar": "https://example.com/uploads/users/jane-smith.webp"
        }
      },
      "category": {
        "_id": "60w9x8y7z6a5b4c3d2e1f0g9",
        "name": "Fashion",
        "slug": "fashion"
      },
      "tags": ["fashion", "summer", "trends"],
      "metaTitle": "Summer Fashion Trends 2023 | Example Store Blog",
      "metaDescription": "Discover the hottest fashion trends for summer 2023 to stay stylish all season long.",
      "status": "published",
      "publishedAt": "2023-05-15T09:30:00.000Z",
      "updatedAt": "2023-05-15T09:30:00.000Z",
      "readTime": 5,
      "relatedPosts": [
        {
          "_id": "60w3x4y5z6a7b8c9d0e1f2g3",
          "title": "Spring Fashion Trends 2023",
          "slug": "spring-fashion-trends-2023",
          "excerpt": "The latest fashion trends for spring 2023...",
          "coverImage": "https://example.com/uploads/blog/spring-fashion-2023.webp"
        }
      ]
    }
  }
}
```

### Get Blog Categories

```
GET /api/v1/content/blog/categories
```

Get a list of all blog categories.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Blog categories retrieved successfully",
  "data": {
    "categories": [
      {
        "_id": "60w9x8y7z6a5b4c3d2e1f0g9",
        "name": "Fashion",
        "slug": "fashion",
        "description": "Fashion trends, tips, and advice",
        "postCount": 15
      },
      {
        "_id": "60w9x8y7z6a5b4c3d2e1f0g8",
        "name": "Technology",
        "slug": "technology",
        "description": "Tech reviews, guides, and news",
        "postCount": 22
      },
      {
        "_id": "60w9x8y7z6a5b4c3d2e1f0g7",
        "name": "Lifestyle",
        "slug": "lifestyle",
        "description": "Tips for a better everyday life",
        "postCount": 18
      }
    ]
  }
}
```

### Get Blog Tags

```
GET /api/v1/content/blog/tags
```

Get a list of all blog tags.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Blog tags retrieved successfully",
  "data": {
    "tags": [
      {
        "name": "fashion",
        "count": 15
      },
      {
        "name": "summer",
        "count": 8
      },
      {
        "name": "tech",
        "count": 22
      },
      {
        "name": "smartphones",
        "count": 12
      },
      {
        "name": "buying-guide",
        "count": 7
      }
    ]
  }
}
```

### Create Blog Post (Admin)

```
POST /api/v1/admin/content/blog
```

Create a new blog post.

**Authentication Required:** Yes (Admin/Manager/Editor role)

**Request Body:**

```json
{
  "title": "Top 10 Gadgets for 2023",
  "content": "<h1>Top 10 Gadgets for 2023</h1><p>In this article, we explore the most innovative gadgets of 2023...</p>",
  "excerpt": "Discover the most innovative gadgets released in 2023",
  "categoryId": "60w9x8y7z6a5b4c3d2e1f0g8",
  "tags": ["tech", "gadgets", "innovation"],
  "metaTitle": "Top 10 Gadgets for 2023 | Example Store Blog",
  "metaDescription": "Explore our curated list of the most innovative gadgets released in 2023.",
  "status": "published",
  "publishedAt": "2023-05-21T10:00:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Blog post created successfully",
  "data": {
    "post": {
      "_id": "60w4x5y6z7a8b9c0d1e2f3g4",
      "title": "Top 10 Gadgets for 2023",
      "slug": "top-10-gadgets-for-2023",
      "content": "<h1>Top 10 Gadgets for 2023</h1><p>In this article, we explore the most innovative gadgets of 2023...</p>",
      "excerpt": "Discover the most innovative gadgets released in 2023",
      "author": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7b",
        "profile": {
          "firstName": "Jane",
          "lastName": "Smith"
        }
      },
      "category": {
        "_id": "60w9x8y7z6a5b4c3d2e1f0g8",
        "name": "Technology"
      },
      "tags": ["tech", "gadgets", "innovation"],
      "metaTitle": "Top 10 Gadgets for 2023 | Example Store Blog",
      "metaDescription": "Explore our curated list of the most innovative gadgets released in 2023.",
      "status": "published",
      "createdAt": "2023-05-20T19:45:30.123Z",
      "updatedAt": "2023-05-20T19:45:30.123Z",
      "publishedAt": "2023-05-21T10:00:00.000Z"
    }
  }
}
```

### Update Blog Post (Admin)

```
PUT /api/v1/admin/content/blog/:id
```

Update an existing blog post.

**Authentication Required:** Yes (Admin/Manager/Editor role)

**Request Body:**

```json
{
  "title": "Top 12 Gadgets for 2023",
  "content": "<h1>Top 12 Gadgets for 2023</h1><p>Updated: In this article, we explore the most innovative gadgets of 2023...</p>",
  "tags": ["tech", "gadgets", "innovation", "2023"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Blog post updated successfully",
  "data": {
    "post": {
      "_id": "60w4x5y6z7a8b9c0d1e2f3g4",
      "title": "Top 12 Gadgets for 2023",
      "slug": "top-12-gadgets-for-2023",
      "content": "<h1>Top 12 Gadgets for 2023</h1><p>Updated: In this article, we explore the most innovative gadgets of 2023...</p>",
      "tags": ["tech", "gadgets", "innovation", "2023"],
      "updatedAt": "2023-05-20T20:30:15.456Z"
    }
  }
}
```

### Delete Blog Post (Admin)

```
DELETE /api/v1/admin/content/blog/:id
```

Delete a blog post.

**Authentication Required:** Yes (Admin/Editor role)

**Response:**

```json
{
  "success": true,
  "message": "Blog post deleted successfully"
}
```

## Media Endpoints

### Upload Media

```
POST /api/v1/admin/content/media
```

Upload media files.

**Authentication Required:** Yes (Admin/Manager/Editor role)

**Request:** Multipart form data with file field 'media' (multiple files allowed)

**Response:**

```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "data": {
    "files": [
      {
        "_id": "60x1y2z3a4b5c6d7e8f9g0h1",
        "filename": "product-banner.webp",
        "originalName": "banner.jpg",
        "mimeType": "image/webp",
        "size": 245678,
        "url": "https://example.com/uploads/media/product-banner.webp",
        "dimensions": {
          "width": 1200,
          "height": 800
        },
        "alt": "Product Banner",
        "uploadedBy": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7b",
          "email": "admin@example.com"
        },
        "createdAt": "2023-05-20T20:45:30.123Z"
      }
    ]
  }
}
```

### Get Media Files

```
GET /api/v1/admin/content/media
```

Get a list of media files with filtering options.

**Authentication Required:** Yes (Admin/Manager/Editor role)

**Query Parameters:**

- `type`: Filter by file type (e.g., "image", "document", "video")
- `search`: Search by filename or original name
- `uploadedBy`: Filter by uploader ID
- `startDate`: Filter by files uploaded after this date
- `endDate`: Filter by files uploaded before this date
- `page`: Page number for pagination (default: 1)
- `limit`: Number of files per page (default: 20)
- `sortBy`: Field to sort by (default: "-createdAt")

**Response:**

```json
{
  "success": true,
  "message": "Media files retrieved successfully",
  "data": {
    "files": [
      {
        "_id": "60x1y2z3a4b5c6d7e8f9g0h1",
        "filename": "product-banner.webp",
        "originalName": "banner.jpg",
        "mimeType": "image/webp",
        "size": 245678,
        "url": "https://example.com/uploads/media/product-banner.webp",
        "dimensions": {
          "width": 1200,
          "height": 800
        },
        "alt": "Product Banner",
        "uploadedBy": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7b",
          "email": "admin@example.com"
        },
        "createdAt": "2023-05-20T20:45:30.123Z"
      },
      {
        "_id": "60x2y3z4a5b6c7d8e9f0g1h2",
        "filename": "catalog-2023.pdf",
        "originalName": "catalog-2023.pdf",
        "mimeType": "application/pdf",
        "size": 3456789,
        "url": "https://example.com/uploads/media/catalog-2023.pdf",
        "alt": "Product Catalog 2023",
        "uploadedBy": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7c",
          "email": "manager@example.com"
        },
        "createdAt": "2023-05-19T15:20:10.456Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
}
```

### Delete Media

```
DELETE /api/v1/admin/content/media/:id
```

Delete a media file.

**Authentication Required:** Yes (Admin/Manager role)

**Response:**

```json
{
  "success": true,
  "message": "Media file deleted successfully"
}
```

## Banner Endpoints

### Get Active Banners

```
GET /api/v1/content/banners
```

Get a list of active banners for the specified location.

**Authentication Required:** No

**Query Parameters:**

- `location`: Banner location (e.g., "home", "category", "product")
- `category`: Category ID (when location is "category")
- `product`: Product ID (when location is "product")

**Response:**

```json
{
  "success": true,
  "message": "Banners retrieved successfully",
  "data": {
    "banners": [
      {
        "_id": "60y1z2a3b4c5d6e7f8g9h0i1",
        "title": "Summer Sale",
        "subtitle": "Up to 40% off on selected items",
        "image": {
          "desktop": "https://example.com/uploads/banners/summer-sale-desktop.webp",
          "mobile": "https://example.com/uploads/banners/summer-sale-mobile.webp"
        },
        "link": "/summer-sale",
        "buttonText": "Shop Now",
        "position": 1,
        "backgroundColor": "#f8f9fa",
        "textColor": "#343a40",
        "startDate": "2023-05-01T00:00:00.000Z",
        "endDate": "2023-06-30T23:59:59.999Z"
      },
      {
        "_id": "60y2z3a4b5c6d7e8f9g0h1i2",
        "title": "New Arrivals",
        "subtitle": "Check out our latest products",
        "image": {
          "desktop": "https://example.com/uploads/banners/new-arrivals-desktop.webp",
          "mobile": "https://example.com/uploads/banners/new-arrivals-mobile.webp"
        },
        "link": "/new-arrivals",
        "buttonText": "Explore",
        "position": 2,
        "backgroundColor": "#e9ecef",
        "textColor": "#212529",
        "startDate": "2023-05-15T00:00:00.000Z",
        "endDate": "2023-07-15T23:59:59.999Z"
      }
    ]
  }
}
```

### Create Banner (Admin)

```
POST /api/v1/admin/content/banners
```

Create a new banner.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "title": "Flash Sale",
  "subtitle": "24 Hours Only - 25% Off Everything",
  "image": {
    "desktop": "https://example.com/uploads/banners/flash-sale-desktop.webp",
    "mobile": "https://example.com/uploads/banners/flash-sale-mobile.webp"
  },
  "link": "/flash-sale",
  "buttonText": "Shop Now",
  "location": "home",
  "position": 1,
  "backgroundColor": "#dc3545",
  "textColor": "#ffffff",
  "startDate": "2023-05-25T00:00:00.000Z",
  "endDate": "2023-05-25T23:59:59.999Z",
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Banner created successfully",
  "data": {
    "banner": {
      "_id": "60y3z4a5b6c7d8e9f0g1h2i3",
      "title": "Flash Sale",
      "subtitle": "24 Hours Only - 25% Off Everything",
      "image": {
        "desktop": "https://example.com/uploads/banners/flash-sale-desktop.webp",
        "mobile": "https://example.com/uploads/banners/flash-sale-mobile.webp"
      },
      "link": "/flash-sale",
      "buttonText": "Shop Now",
      "location": "home",
      "position": 1,
      "backgroundColor": "#dc3545",
      "textColor": "#ffffff",
      "startDate": "2023-05-25T00:00:00.000Z",
      "endDate": "2023-05-25T23:59:59.999Z",
      "isActive": true,
      "createdAt": "2023-05-20T21:30:00.123Z",
      "updatedAt": "2023-05-20T21:30:00.123Z"
    }
  }
}
```

### Update Banner (Admin)

```
PUT /api/v1/admin/content/banners/:id
```

Update an existing banner.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "subtitle": "48 Hours Only - 25% Off Everything",
  "endDate": "2023-05-26T23:59:59.999Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Banner updated successfully",
  "data": {
    "banner": {
      "_id": "60y3z4a5b6c7d8e9f0g1h2i3",
      "title": "Flash Sale",
      "subtitle": "48 Hours Only - 25% Off Everything",
      "endDate": "2023-05-26T23:59:59.999Z",
      "updatedAt": "2023-05-20T22:15:30.456Z"
    }
  }
}
```

### Delete Banner (Admin)

```
DELETE /api/v1/admin/content/banners/:id
```

Delete a banner.

**Authentication Required:** Yes (Admin/Manager role)

**Response:**

```json
{
  "success": true,
  "message": "Banner deleted successfully"
}
```
