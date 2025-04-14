# Search API Documentation

This document provides detailed information about the Search API endpoints that power the search functionality in the e-commerce platform.

## Base URL

All URLs referenced in this documentation have the following base:

```
/api/v1
```

## Search Endpoints

### Product Search

```
GET /api/v1/search/products
```

Searches products with advanced filtering, sorting, and pagination.

**Authentication Required:** No

**Query Parameters:**

- `keyword`: Search term to match against product name, description, and other fields
- `category`: Category ID or slug to filter by
- `priceMin`: Minimum price filter
- `priceMax`: Maximum price filter
- `attributes`: Product attributes filter (can be JSON or comma-separated key:value pairs)
- `tags`: Filter by tags (comma-separated values)
- `inStock`: Show only in-stock products (true/false)
- `ratings`: Filter by minimum rating (1-5)
- `page`: Page number for pagination (default: 1)
- `limit`: Number of products per page (default: 10)
- `sortBy`: Field to sort by (prefix with `-` for descending order, e.g., `-price` for highest price first)

**Response:**

```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "slug": "smartphone-x",
        "sku": "SP-X-001",
        "description": {
          "short": "Latest smartphone with advanced features"
        },
        "price": {
          "regular": 49999,
          "sale": 44999
        },
        "categories": [
          {
            "_id": "60c1d2e3f4a5b6c7d8e9f0a1",
            "name": "Electronics",
            "slug": "electronics"
          }
        ],
        "images": [
          {
            "url": "https://example.com/uploads/products/smartphone-x-12345.webp",
            "alt": "Smartphone X Front View",
            "isDefault": true
          }
        ],
        "status": "active",
        "inventory": {
          "quantity": 50
        },
        "reviews": {
          "average": 4.7,
          "count": 32
        }
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 10,
      "pages": 15
    },
    "filters": {
      "priceRange": {
        "min": 999,
        "max": 149999
      },
      "categories": [
        {
          "id": "60c1d2e3f4a5b6c7d8e9f0a1",
          "name": "Electronics",
          "count": 85
        },
        {
          "id": "60c1d2e3f4a5b6c7d8e9f0a2",
          "name": "Smartphones",
          "count": 42
        }
      ],
      "attributes": {
        "Color": ["Black", "Blue", "Red"],
        "Storage": ["64GB", "128GB", "256GB"]
      }
    }
  }
}
```

### Global Search

```
GET /api/v1/search
```

Performs a global search across multiple entities (products, categories, content, etc.).

**Authentication Required:** No (but some results may be limited for unauthenticated users)

**Query Parameters:**

- `keyword`: Search term to match across all searchable fields
- `entities`: Comma-separated list of entities to search (default: "products")
  - Available entities: products, categories, reviews
  - Admin users have access to: users, orders
- `limit`: Maximum number of results per entity (default: 5)

**Response:**

```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "slug": "smartphone-x",
        "images": [
          {
            "url": "https://example.com/uploads/products/smartphone-x-12345.webp",
            "isDefault": true
          }
        ],
        "price": {
          "regular": 49999,
          "sale": 44999
        }
      }
    ],
    "categories": [
      {
        "_id": "60c1d2e3f4a5b6c7d8e9f0a2",
        "name": "Smartphones",
        "slug": "smartphones",
        "image": "https://example.com/uploads/categories/smartphones.webp"
      }
    ]
  }
}
```

### Autocomplete Search

```
GET /api/v1/search/autocomplete
```

Provides real-time search suggestions as the user types.

**Authentication Required:** No

**Query Parameters:**

- `query`: Partial search term typed by user
- `limit`: Maximum number of suggestions to return (default: 10)

**Response:**

```json
{
  "success": true,
  "message": "Autocomplete results retrieved successfully",
  "data": {
    "suggestions": [
      {
        "type": "product",
        "id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "text": "Smartphone X",
        "image": "https://example.com/uploads/products/smartphone-x-thumb.webp",
        "url": "/products/smartphone-x"
      },
      {
        "type": "category",
        "id": "60c1d2e3f4a5b6c7d8e9f0a2",
        "text": "Smartphones",
        "image": "https://example.com/uploads/categories/smartphones-thumb.webp",
        "url": "/categories/smartphones"
      },
      {
        "type": "search",
        "text": "smartphone accessories",
        "url": "/search?keyword=smartphone+accessories"
      }
    ]
  }
}
```

## Search Best Practices

### Optimizing Search Queries

For the best performance and results:

1. Use specific keywords that describe what you're looking for
2. Start with broader searches, then refine with filters
3. Use quotation marks for exact phrase matching
4. Leverage category filters to narrow results

### Search Limitations

- Maximum results per page: 50
- Search term minimum length: 2 characters
- Rate limiting: 60 requests per minute for authenticated users, 30 for guests

### Response Headers

The search API includes helpful response headers:

- `X-Search-Total-Results`: Total number of results across all pages
- `X-Search-Total-Pages`: Total number of pages
- `X-Search-Page`: Current page number
- `X-Search-Limit`: Current page size limit
