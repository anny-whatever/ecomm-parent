# User Management API Documentation

## User Profile Endpoints

### Get User Profile

```
GET /api/v1/users/profile
```

Get the authenticated user's profile information.

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "60a3d1b9c2e4f83b3c5d2b7a",
      "email": "user@example.com",
      "role": "customer",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+919876543210",
        "avatar": "https://example.com/uploads/users/avatar-12345.webp"
      },
      "addresses": [
        {
          "_id": "60a4e2cafb123c4f5e6d7b8c",
          "type": "shipping",
          "isDefault": true,
          "name": "John Doe",
          "street": "123 Main St",
          "city": "Mumbai",
          "state": "Maharashtra",
          "postalCode": "400001",
          "country": "India",
          "phone": "+919876543210"
        }
      ],
      "preferences": {
        "marketing": true,
        "notifications": true
      },
      "loyalty": {
        "points": 120,
        "tier": "silver"
      },
      "emailVerified": true,
      "createdAt": "2023-05-18T10:30:45.123Z",
      "updatedAt": "2023-05-18T12:45:22.456Z"
    }
  }
}
```

### Update User Profile

```
PUT /api/v1/users/profile
```

Update the authenticated user's profile information.

**Authentication Required:** Yes

**Request Body:**

```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+919876543210"
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
      "profile": {
        "firstName": "John",
        "lastName": "Smith",
        "phone": "+919876543210"
      },
      "updatedAt": "2023-05-18T13:15:30.789Z"
    }
  }
}
```

### Upload Profile Avatar

```
POST /api/v1/users/avatar
```

Upload a profile picture.

**Authentication Required:** Yes

**Request:** Multipart form data with file field 'avatar'

**Response:**

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": "https://example.com/uploads/users/avatar-12345.webp"
  }
}
```

## Address Management

### Get User Addresses

```
GET /api/v1/users/addresses
```

Get all addresses for the authenticated user.

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": {
    "addresses": [
      {
        "_id": "60a4e2cafb123c4f5e6d7b8c",
        "type": "shipping",
        "isDefault": true,
        "name": "John Doe",
        "street": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postalCode": "400001",
        "country": "India",
        "phone": "+919876543210"
      },
      {
        "_id": "60a4e2cafb123c4f5e6d7b8d",
        "type": "billing",
        "isDefault": true,
        "name": "John Doe",
        "street": "456 Business Ave",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postalCode": "400002",
        "country": "India",
        "phone": "+919876543210"
      }
    ]
  }
}
```

### Add Address

```
POST /api/v1/users/addresses
```

Add a new address for the authenticated user.

**Authentication Required:** Yes

**Request Body:**

```json
{
  "type": "shipping",
  "isDefault": false,
  "name": "John Doe",
  "street": "789 New St",
  "city": "Bangalore",
  "state": "Karnataka",
  "postalCode": "560001",
  "country": "India",
  "phone": "+919876543210"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "address": {
      "_id": "60a4e2cafb123c4f5e6d7b8e",
      "type": "shipping",
      "isDefault": false,
      "name": "John Doe",
      "street": "789 New St",
      "city": "Bangalore",
      "state": "Karnataka",
      "postalCode": "560001",
      "country": "India",
      "phone": "+919876543210"
    }
  }
}
```

### Update Address

```
PUT /api/v1/users/addresses/:addressId
```

Update an existing address.

**Authentication Required:** Yes

**Request Body:**

```json
{
  "city": "Pune",
  "state": "Maharashtra",
  "postalCode": "411001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "address": {
      "_id": "60a4e2cafb123c4f5e6d7b8e",
      "type": "shipping",
      "isDefault": false,
      "name": "John Doe",
      "street": "789 New St",
      "city": "Pune",
      "state": "Maharashtra",
      "postalCode": "411001",
      "country": "India",
      "phone": "+919876543210"
    }
  }
}
```

### Delete Address

```
DELETE /api/v1/users/addresses/:addressId
```

Delete an address.

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

## Wishlist Management

### Get Wishlist

```
GET /api/v1/users/wishlist
```

Get the user's wishlist with product information.

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
          "quantity": 50,
          "reserved": 5
        }
      }
    ]
  }
}
```

### Add to Wishlist

```
POST /api/v1/users/wishlist
```

Add a product to the wishlist.

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
  "message": "Product added to wishlist",
  "data": {
    "wishlist": ["60b1f2e3d4c5b6a7c8d9e0f1"]
  }
}
```

### Remove from Wishlist

```
DELETE /api/v1/users/wishlist/:productId
```

Remove a product from the wishlist.

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "message": "Product removed from wishlist"
}
```

## Recently Viewed Products

### Get Recently Viewed Products

```
GET /api/v1/users/recently-viewed
```

Get the user's recently viewed products.

**Authentication Required:** Yes

**Query Parameters:**

- `limit`: Number of products to return (default: 10)

**Response:**

```json
{
  "success": true,
  "message": "Recently viewed products retrieved successfully",
  "data": {
    "products": [
      {
        "product": {
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
          ]
        },
        "viewedAt": "2023-05-18T14:20:15.123Z"
      }
    ]
  }
}
```

## User Preferences

### Update Preferences

```
PUT /api/v1/users/preferences
```

Update user preferences for marketing, notifications, etc.

**Authentication Required:** Yes

**Request Body:**

```json
{
  "marketing": false,
  "notifications": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "preferences": {
      "marketing": false,
      "notifications": true
    }
  }
}
```
