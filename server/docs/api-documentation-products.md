# Product Management API Documentation

## Product Endpoints

### Get Products

```
GET /api/v1/products
```

Get a list of products with filtering, sorting, and pagination.

**Authentication Required:** No

**Query Parameters:**

- `search`: Search term for product name and description
- `category`: Category slug to filter by
- `priceMin`: Minimum price filter
- `priceMax`: Maximum price filter
- `status`: Product status (default: "active")
- `tags`: Filter by tags
- `attributes`: Filter by product attributes (e.g., `color=red&size=large`)
- `inStock`: Show only in-stock products ("true"/"false")
- `featured`: Show only featured products ("true"/"false")
- `page`: Page number for pagination (default: 1)
- `limit`: Number of products per page (default: 10)
- `sortBy`: Field to sort by (prefix with `-` for descending order, e.g., `-price.regular` for highest price first)

**Response:**

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "slug": "smartphone-x",
        "sku": "SP-X-001",
        "description": {
          "short": "Latest smartphone with advanced features",
          "long": "Detailed description of the smartphone..."
        },
        "price": {
          "regular": 49999,
          "sale": 44999
        },
        "gstPercentage": 18,
        "categories": [
          {
            "_id": "60c1d2e3f4a5b6c7d8e9f0a1",
            "name": "Electronics",
            "slug": "electronics"
          }
        ],
        "tags": ["smartphone", "mobile", "android"],
        "images": [
          {
            "url": "https://example.com/uploads/products/smartphone-x-12345.webp",
            "alt": "Smartphone X Front View",
            "isDefault": true
          }
        ],
        "status": "active",
        "isFeatured": true,
        "inventory": {
          "quantity": 50,
          "reserved": 5,
          "lowStockThreshold": 10
        },
        "reviews": {
          "average": 4.7,
          "count": 32
        },
        "createdAt": "2023-05-18T09:30:45.123Z",
        "updatedAt": "2023-05-18T14:15:22.456Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 10,
      "pages": 15
    }
  }
}
```

### Get Product Detail

```
GET /api/v1/products/:idOrSlug
```

Get detailed information about a specific product. The parameter can be either a product ID or slug.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": {
      "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
      "name": "Smartphone X",
      "slug": "smartphone-x",
      "sku": "SP-X-001",
      "description": {
        "short": "Latest smartphone with advanced features",
        "long": "Detailed description of the smartphone with all specifications..."
      },
      "price": {
        "regular": 49999,
        "sale": 44999,
        "cost": 35000,
        "compareAt": 54999
      },
      "gstPercentage": 18,
      "categories": [
        {
          "_id": "60c1d2e3f4a5b6c7d8e9f0a1",
          "name": "Electronics",
          "slug": "electronics"
        },
        {
          "_id": "60c1d2e3f4a5b6c7d8e9f0a2",
          "name": "Smartphones",
          "slug": "smartphones"
        }
      ],
      "tags": ["smartphone", "mobile", "android"],
      "attributes": [
        {
          "name": "Brand",
          "value": "TechX",
          "visible": true
        },
        {
          "name": "Processor",
          "value": "Snapdragon 888",
          "visible": true
        }
      ],
      "variants": [
        {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f2",
          "name": "Black 128GB",
          "sku": "SP-X-001-BLK-128",
          "price": {
            "regular": 49999,
            "sale": 44999
          },
          "attributes": [
            {
              "name": "Color",
              "value": "Black"
            },
            {
              "name": "Storage",
              "value": "128GB"
            }
          ],
          "inventory": {
            "quantity": 25,
            "reserved": 3,
            "lowStockThreshold": 5
          },
          "images": [
            "https://example.com/uploads/products/smartphone-x-black-12345.webp"
          ],
          "isDefault": true
        },
        {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f3",
          "name": "Blue 128GB",
          "sku": "SP-X-001-BLU-128",
          "price": {
            "regular": 49999,
            "sale": 44999
          },
          "attributes": [
            {
              "name": "Color",
              "value": "Blue"
            },
            {
              "name": "Storage",
              "value": "128GB"
            }
          ],
          "inventory": {
            "quantity": 15,
            "reserved": 2,
            "lowStockThreshold": 5
          },
          "images": [
            "https://example.com/uploads/products/smartphone-x-blue-12345.webp"
          ],
          "isDefault": false
        },
        {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f4",
          "name": "Black 256GB",
          "sku": "SP-X-001-BLK-256",
          "price": {
            "regular": 59999,
            "sale": 54999
          },
          "attributes": [
            {
              "name": "Color",
              "value": "Black"
            },
            {
              "name": "Storage",
              "value": "256GB"
            }
          ],
          "inventory": {
            "quantity": 10,
            "reserved": 0,
            "lowStockThreshold": 5
          },
          "images": [
            "https://example.com/uploads/products/smartphone-x-black-12345.webp"
          ],
          "isDefault": false
        }
      ],
      "images": [
        {
          "url": "https://example.com/uploads/products/smartphone-x-12345.webp",
          "alt": "Smartphone X Front View",
          "isDefault": true
        },
        {
          "url": "https://example.com/uploads/products/smartphone-x-67890.webp",
          "alt": "Smartphone X Side View",
          "isDefault": false
        }
      ],
      "seo": {
        "title": "Buy Smartphone X - Latest Technology | Example Store",
        "description": "Purchase the latest Smartphone X with advanced features and cutting-edge technology. Free shipping and 1-year warranty.",
        "keywords": ["smartphone", "mobile", "android", "techx"]
      },
      "related": ["60b1f2e3d4c5b6a7c8d9e0f5", "60b1f2e3d4c5b6a7c8d9e0f6"],
      "status": "active",
      "isFeatured": true,
      "inventory": {
        "quantity": 50,
        "reserved": 5,
        "lowStockThreshold": 10
      },
      "reviews": {
        "average": 4.7,
        "count": 32
      },
      "createdAt": "2023-05-18T09:30:45.123Z",
      "updatedAt": "2023-05-18T14:15:22.456Z"
    }
  }
}
```

### Get Related Products

```
GET /api/v1/products/:id/related
```

Get products related to a specific product.

**Authentication Required:** No

**Query Parameters:**

- `limit`: Number of related products to return (default: 4)

**Response:**

```json
{
  "success": true,
  "message": "Related products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f5",
        "name": "Smartphone Y",
        "slug": "smartphone-y",
        "price": {
          "regular": 39999,
          "sale": 34999
        },
        "images": [
          {
            "url": "https://example.com/uploads/products/smartphone-y-12345.webp",
            "alt": "Smartphone Y Front View",
            "isDefault": true
          }
        ],
        "status": "active"
      },
      {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f6",
        "name": "Smartphone Z",
        "slug": "smartphone-z",
        "price": {
          "regular": 59999,
          "sale": null
        },
        "images": [
          {
            "url": "https://example.com/uploads/products/smartphone-z-12345.webp",
            "alt": "Smartphone Z Front View",
            "isDefault": true
          }
        ],
        "status": "active"
      }
    ]
  }
}
```

### Create Product (Admin)

```
POST /api/v1/products
```

Create a new product.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "name": "New Smartphone",
  "sku": "NSP-001",
  "description": {
    "short": "Brand new smartphone with amazing features",
    "long": "Detailed description of the new smartphone..."
  },
  "price": {
    "regular": 45999,
    "sale": 42999,
    "cost": 32000,
    "compareAt": 49999
  },
  "gstPercentage": 18,
  "categories": ["60c1d2e3f4a5b6c7d8e9f0a1", "60c1d2e3f4a5b6c7d8e9f0a2"],
  "tags": ["smartphone", "mobile", "android"],
  "attributes": [
    {
      "name": "Brand",
      "value": "NewTech",
      "visible": true
    }
  ],
  "variants": [
    {
      "name": "Black 64GB",
      "sku": "NSP-001-BLK-64",
      "price": {
        "regular": 45999,
        "sale": 42999
      },
      "attributes": [
        {
          "name": "Color",
          "value": "Black"
        },
        {
          "name": "Storage",
          "value": "64GB"
        }
      ],
      "inventory": {
        "quantity": 30,
        "lowStockThreshold": 5
      },
      "isDefault": true
    }
  ],
  "seo": {
    "title": "Buy New Smartphone - Amazing Features | Example Store",
    "description": "Purchase the New Smartphone with amazing features and cutting-edge technology.",
    "keywords": ["smartphone", "mobile", "android", "newtech"]
  },
  "status": "active",
  "isFeatured": false,
  "inventory": {
    "quantity": 30,
    "lowStockThreshold": 5
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "_id": "60d2e3f4a5b6c7d8e9f0a1b2",
      "name": "New Smartphone",
      "slug": "new-smartphone",
      "sku": "NSP-001",
      "description": {
        "short": "Brand new smartphone with amazing features",
        "long": "Detailed description of the new smartphone..."
      },
      "price": {
        "regular": 45999,
        "sale": 42999,
        "cost": 32000,
        "compareAt": 49999
      },
      "gstPercentage": 18,
      "categories": ["60c1d2e3f4a5b6c7d8e9f0a1", "60c1d2e3f4a5b6c7d8e9f0a2"],
      "tags": ["smartphone", "mobile", "android"],
      "attributes": [
        {
          "name": "Brand",
          "value": "NewTech",
          "visible": true
        }
      ],
      "variants": [
        {
          "_id": "60d2e3f4a5b6c7d8e9f0a1b3",
          "name": "Black 64GB",
          "sku": "NSP-001-BLK-64",
          "price": {
            "regular": 45999,
            "sale": 42999
          },
          "attributes": [
            {
              "name": "Color",
              "value": "Black"
            },
            {
              "name": "Storage",
              "value": "64GB"
            }
          ],
          "inventory": {
            "quantity": 30,
            "reserved": 0,
            "lowStockThreshold": 5
          },
          "isDefault": true
        }
      ],
      "seo": {
        "title": "Buy New Smartphone - Amazing Features | Example Store",
        "description": "Purchase the New Smartphone with amazing features and cutting-edge technology.",
        "keywords": ["smartphone", "mobile", "android", "newtech"]
      },
      "status": "active",
      "isFeatured": false,
      "inventory": {
        "quantity": 30,
        "reserved": 0,
        "lowStockThreshold": 5
      },
      "createdAt": "2023-05-18T15:45:22.456Z",
      "updatedAt": "2023-05-18T15:45:22.456Z"
    }
  }
}
```

### Update Product (Admin)

```
PUT /api/v1/products/:id
```

Update an existing product.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "price": {
    "regular": 43999,
    "sale": 40999
  },
  "status": "active",
  "isFeatured": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      "_id": "60d2e3f4a5b6c7d8e9f0a1b2",
      "name": "New Smartphone",
      "price": {
        "regular": 43999,
        "sale": 40999,
        "cost": 32000,
        "compareAt": 49999
      },
      "status": "active",
      "isFeatured": true,
      "updatedAt": "2023-05-18T16:30:10.123Z"
    }
  }
}
```

### Delete Product (Admin)

```
DELETE /api/v1/products/:id
```

Delete a product.

**Authentication Required:** Yes (Admin role)

**Response:**

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Upload Product Images (Admin)

```
POST /api/v1/products/:productId/images
```

Upload images for a product.

**Authentication Required:** Yes (Admin/Manager role)

**Request:** Multipart form data with file field 'product-images' (multiple files allowed)

**Response:**

```json
{
  "success": true,
  "message": "Images uploaded and processed successfully",
  "data": {
    "images": [
      {
        "original": {
          "url": "/uploads/products/60d2e3f4a5b6c7d8e9f0a1b2/image-12345.webp",
          "width": 1200,
          "height": 1200,
          "fileSize": 254879
        },
        "thumbnail": {
          "url": "/uploads/products/60d2e3f4a5b6c7d8e9f0a1b2/image-12345-thumb.webp",
          "width": 300,
          "height": 300,
          "fileSize": 45687
        },
        "alt": "New Smartphone Front View",
        "isDefault": true
      }
    ]
  }
}
```

### Delete Product Image (Admin)

```
DELETE /api/v1/products/:productId/images/:imageId
```

Delete an image from a product.

**Authentication Required:** Yes (Admin/Manager role)

**Response:**

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Category Endpoints

### Get Categories

```
GET /api/v1/categories
```

Get a list of product categories.

**Authentication Required:** No

**Query Parameters:**

- `parent`: Filter by parent category ID (optional)
- `includeSubcategories`: Include subcategories (boolean, default: false)
- `active`: Filter by active status (boolean, optional)
- `page`: Page number for pagination (default: 1)
- `limit`: Number of categories per page (default: 20)

**Response:**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [
      {
        "_id": "60c1d2e3f4a5b6c7d8e9f0a1",
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices and gadgets",
        "image": "https://example.com/uploads/categories/electronics.webp",
        "parent": null,
        "isActive": true,
        "order": 1,
        "subcategories": [
          {
            "_id": "60c1d2e3f4a5b6c7d8e9f0a2",
            "name": "Smartphones",
            "slug": "smartphones",
            "description": "Mobile phones and smartphones",
            "image": "https://example.com/uploads/categories/smartphones.webp",
            "isActive": true,
            "order": 1
          },
          {
            "_id": "60c1d2e3f4a5b6c7d8e9f0a3",
            "name": "Laptops",
            "slug": "laptops",
            "description": "Laptops and notebooks",
            "image": "https://example.com/uploads/categories/laptops.webp",
            "isActive": true,
            "order": 2
          }
        ]
      },
      {
        "_id": "60c1d2e3f4a5b6c7d8e9f0a4",
        "name": "Clothing",
        "slug": "clothing",
        "description": "Fashion and apparel",
        "image": "https://example.com/uploads/categories/clothing.webp",
        "parent": null,
        "isActive": true,
        "order": 2,
        "subcategories": []
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### Get Category Detail

```
GET /api/v1/categories/:slug
```

Get detailed information about a specific category.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "category": {
      "_id": "60c1d2e3f4a5b6c7d8e9f0a1",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic devices and gadgets",
      "image": "https://example.com/uploads/categories/electronics.webp",
      "parent": null,
      "ancestors": [],
      "isActive": true,
      "order": 1,
      "seo": {
        "title": "Electronics - Shop the Latest Gadgets | Example Store",
        "description": "Shop the latest electronic gadgets and devices with free shipping and warranty.",
        "keywords": ["electronics", "gadgets", "devices"]
      },
      "subcategories": [
        {
          "_id": "60c1d2e3f4a5b6c7d8e9f0a2",
          "name": "Smartphones",
          "slug": "smartphones",
          "description": "Mobile phones and smartphones",
          "image": "https://example.com/uploads/categories/smartphones.webp",
          "isActive": true,
          "order": 1
        },
        {
          "_id": "60c1d2e3f4a5b6c7d8e9f0a3",
          "name": "Laptops",
          "slug": "laptops",
          "description": "Laptops and notebooks",
          "image": "https://example.com/uploads/categories/laptops.webp",
          "isActive": true,
          "order": 2
        }
      ],
      "createdAt": "2023-05-18T09:00:00.000Z",
      "updatedAt": "2023-05-18T09:00:00.000Z"
    }
  }
}
```

### Create Category (Admin)

```
POST /api/v1/categories
```

Create a new category.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "name": "Audio",
  "description": "Audio devices and equipment",
  "parent": "60c1d2e3f4a5b6c7d8e9f0a1",
  "isActive": true,
  "order": 3,
  "seo": {
    "title": "Audio Equipment | Example Store",
    "description": "Shop high-quality audio equipment with free shipping.",
    "keywords": ["audio", "speakers", "headphones"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "category": {
      "_id": "60c1d2e3f4a5b6c7d8e9f0a5",
      "name": "Audio",
      "slug": "audio",
      "description": "Audio devices and equipment",
      "parent": "60c1d2e3f4a5b6c7d8e9f0a1",
      "ancestors": [
        {
          "_id": "60c1d2e3f4a5b6c7d8e9f0a1",
          "name": "Electronics",
          "slug": "electronics"
        }
      ],
      "isActive": true,
      "order": 3,
      "seo": {
        "title": "Audio Equipment | Example Store",
        "description": "Shop high-quality audio equipment with free shipping.",
        "keywords": ["audio", "speakers", "headphones"]
      },
      "createdAt": "2023-05-18T16:45:30.123Z",
      "updatedAt": "2023-05-18T16:45:30.123Z"
    }
  }
}
```

### Update Category (Admin)

```
PUT /api/v1/categories/:id
```

Update an existing category.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "name": "Audio Equipment",
  "description": "High-quality audio devices and equipment",
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "category": {
      "_id": "60c1d2e3f4a5b6c7d8e9f0a5",
      "name": "Audio Equipment",
      "slug": "audio-equipment",
      "description": "High-quality audio devices and equipment",
      "isActive": true,
      "updatedAt": "2023-05-18T17:15:45.789Z"
    }
  }
}
```

### Delete Category (Admin)

```
DELETE /api/v1/categories/:id
```

Delete a category.

**Authentication Required:** Yes (Admin role)

**Response:**

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

### Upload Category Image (Admin)

```
POST /api/v1/categories/:categoryId/image
```

Upload an image for a category.

**Authentication Required:** Yes (Admin/Manager role)

**Request:** Multipart form data with file field 'category-image'

**Response:**

```json
{
  "success": true,
  "message": "Category image uploaded successfully",
  "data": {
    "image": "https://example.com/uploads/categories/audio-equipment-12345.webp"
  }
}
```
