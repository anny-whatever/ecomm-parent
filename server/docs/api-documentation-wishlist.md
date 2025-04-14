# Wishlist API Documentation

This document provides detailed information about the Wishlist API endpoints. The wishlist functionality allows users to save products they're interested in for later viewing or purchase.

## Base URL

All URLs referenced in this documentation have the following base:

```
/api/v1
```

## Wishlist Endpoints

### Get User Wishlist

```
GET /api/v1/users/wishlist
```

Retrieves the current user's wishlist with populated product information.

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "message": "Wishlist retrieved successfully",
  "data": {
    "wishlist": [
      {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "slug": "smartphone-x",
        "price": {
          "regular": 49999,
          "sale": 44999
        },
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
        }
      },
      {
        "_id": "60d3f4e5d6c7b8a9e0f1a2b3",
        "name": "Wireless Earbuds",
        "slug": "wireless-earbuds",
        "price": {
          "regular": 9999,
          "sale": 7999
        },
        "images": [
          {
            "url": "https://example.com/uploads/products/wireless-earbuds-12345.webp",
            "alt": "Wireless Earbuds in Case",
            "isDefault": true
          }
        ],
        "status": "active",
        "inventory": {
          "quantity": 200
        }
      }
    ]
  }
}
```

### Add Product to Wishlist

```
POST /api/v1/users/wishlist
```

Adds a product to the user's wishlist.

**Authentication Required:** Yes

**Request Body:**

```json
{
  "productId": "60b1f2e3d4c5b6a7c8d9e0f1"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Product added to wishlist successfully"
}
```

### Remove Product from Wishlist

```
DELETE /api/v1/users/wishlist/:productId
```

Removes a product from the user's wishlist.

**Authentication Required:** Yes

**URL Parameters:**

- `productId`: ID of the product to remove from wishlist

**Response:**

```json
{
  "success": true,
  "message": "Product removed from wishlist successfully"
}
```

## Wishlist Best Practices

### Performance Considerations

- Wishlists are limited to 100 items per user
- Products in the wishlist are automatically removed if they become unavailable or are discontinued
- For best performance, use pagination when displaying wishlist items on the frontend

### Wishlist Features

- Items in the wishlist persist indefinitely until removed by the user
- Products in the wishlist can be quickly added to the cart
- Users receive notifications if products in their wishlist go on sale
- Wishlist data can be used for personalized product recommendations

### Common Use Cases

1. Users can save products for later consideration
2. Quick access to frequently viewed or considered products
3. Price tracking for potential future purchases
4. Gift ideas or wish lists that can be shared
5. Quick reordering of previously wishlisted and purchased items
