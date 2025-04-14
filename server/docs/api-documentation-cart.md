# Cart and Checkout API Documentation

## Cart Endpoints

### Get Cart

```
GET /api/v1/cart
```

Get the current user's shopping cart. Uses a cart token stored in cookies for guest users or the user ID for authenticated users.

**Authentication Required:** No (Guest carts supported)

**Response:**

```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "cart": {
      "_id": "60d3e4f5a6b7c8d9e0f1a2b3",
      "user": "60a3d1b9c2e4f83b3c5d2b7a", // Only for authenticated users
      "cartToken": "unique-cart-token", // Only for guest carts
      "items": [
        {
          "_id": "60d3e4f5a6b7c8d9e0f1a2b4",
          "product": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
            "name": "Smartphone X",
            "slug": "smartphone-x",
            "sku": "SP-X-001",
            "images": [
              {
                "url": "https://example.com/uploads/products/smartphone-x-12345.webp",
                "alt": "Smartphone X Front View",
                "isDefault": true
              }
            ],
            "status": "active"
          },
          "variant": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f2",
            "name": "Black 128GB",
            "sku": "SP-X-001-BLK-128",
            "attributes": [
              {
                "name": "Color",
                "value": "Black"
              },
              {
                "name": "Storage",
                "value": "128GB"
              }
            ]
          },
          "quantity": 1,
          "price": 44999,
          "subtotal": 44999,
          "gstPercentage": 18,
          "gstAmount": 8099.82,
          "total": 53098.82
        }
      ],
      "summary": {
        "subtotal": 44999,
        "tax": 8099.82,
        "shipping": 0,
        "discount": 0,
        "total": 53098.82
      },
      "hasPromoCode": false,
      "promoCode": null,
      "status": "active",
      "updatedAt": "2023-05-18T18:30:45.123Z",
      "createdAt": "2023-05-18T18:15:22.456Z"
    }
  }
}
```

### Add to Cart

```
POST /api/v1/cart
```

Add an item to the shopping cart.

**Authentication Required:** No (Guest carts supported)

**Request Body:**

```json
{
  "productId": "60b1f2e3d4c5b6a7c8d9e0f1",
  "variantId": "60b1f2e3d4c5b6a7c8d9e0f2", // Optional, if product has variants
  "quantity": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cart": {
      "_id": "60d3e4f5a6b7c8d9e0f1a2b3",
      "items": [
        {
          "_id": "60d3e4f5a6b7c8d9e0f1a2b4",
          "product": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
            "name": "Smartphone X",
            "slug": "smartphone-x"
          },
          "variant": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f2",
            "name": "Black 128GB"
          },
          "quantity": 1,
          "price": 44999,
          "subtotal": 44999,
          "gstPercentage": 18,
          "gstAmount": 8099.82,
          "total": 53098.82
        }
      ],
      "summary": {
        "subtotal": 44999,
        "tax": 8099.82,
        "shipping": 0,
        "discount": 0,
        "total": 53098.82
      }
    }
  }
}
```

### Update Cart Item

```
PUT /api/v1/cart/:itemId
```

Update the quantity of an item in the cart.

**Authentication Required:** No (Guest carts supported)

**Request Body:**

```json
{
  "quantity": 2
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cart item updated",
  "data": {
    "cart": {
      "_id": "60d3e4f5a6b7c8d9e0f1a2b3",
      "items": [
        {
          "_id": "60d3e4f5a6b7c8d9e0f1a2b4",
          "product": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
            "name": "Smartphone X",
            "slug": "smartphone-x"
          },
          "variant": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f2",
            "name": "Black 128GB"
          },
          "quantity": 2,
          "price": 44999,
          "subtotal": 89998,
          "gstPercentage": 18,
          "gstAmount": 16199.64,
          "total": 106197.64
        }
      ],
      "summary": {
        "subtotal": 89998,
        "tax": 16199.64,
        "shipping": 0,
        "discount": 0,
        "total": 106197.64
      }
    }
  }
}
```

### Remove Cart Item

```
DELETE /api/v1/cart/:itemId
```

Remove an item from the cart.

**Authentication Required:** No (Guest carts supported)

**Response:**

```json
{
  "success": true,
  "message": "Item removed from cart",
  "data": {
    "cart": {
      "_id": "60d3e4f5a6b7c8d9e0f1a2b3",
      "items": [],
      "summary": {
        "subtotal": 0,
        "tax": 0,
        "shipping": 0,
        "discount": 0,
        "total": 0
      }
    }
  }
}
```

### Clear Cart

```
DELETE /api/v1/cart
```

Remove all items from the cart.

**Authentication Required:** No (Guest carts supported)

**Response:**

```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "cart": {
      "_id": "60d3e4f5a6b7c8d9e0f1a2b3",
      "items": [],
      "summary": {
        "subtotal": 0,
        "tax": 0,
        "shipping": 0,
        "discount": 0,
        "total": 0
      }
    }
  }
}
```

### Apply Promotion

```
POST /api/v1/cart/apply-promotion
```

Apply a promotion code to the cart.

**Authentication Required:** No (Guest carts supported)

**Request Body:**

```json
{
  "code": "SUMMER20"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Promotion applied successfully",
  "data": {
    "cart": {
      "_id": "60d3e4f5a6b7c8d9e0f1a2b3",
      "items": [
        {
          "_id": "60d3e4f5a6b7c8d9e0f1a2b4",
          "product": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
            "name": "Smartphone X"
          },
          "quantity": 1,
          "price": 44999,
          "subtotal": 44999,
          "gstPercentage": 18,
          "gstAmount": 8099.82,
          "total": 53098.82
        }
      ],
      "summary": {
        "subtotal": 44999,
        "tax": 8099.82,
        "shipping": 0,
        "discount": 8999.8, // 20% discount
        "total": 44099.02
      },
      "hasPromoCode": true,
      "promoCode": {
        "code": "SUMMER20",
        "discountType": "percentage",
        "discountValue": 20,
        "discountAmount": 8999.8
      }
    }
  }
}
```

### Remove Promotion

```
DELETE /api/v1/cart/promotion
```

Remove the applied promotion code from the cart.

**Authentication Required:** No (Guest carts supported)

**Response:**

```json
{
  "success": true,
  "message": "Promotion removed successfully",
  "data": {
    "cart": {
      "_id": "60d3e4f5a6b7c8d9e0f1a2b3",
      "items": [
        {
          "_id": "60d3e4f5a6b7c8d9e0f1a2b4",
          "product": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
            "name": "Smartphone X"
          },
          "quantity": 1,
          "price": 44999,
          "subtotal": 44999,
          "gstPercentage": 18,
          "gstAmount": 8099.82,
          "total": 53098.82
        }
      ],
      "summary": {
        "subtotal": 44999,
        "tax": 8099.82,
        "shipping": 0,
        "discount": 0,
        "total": 53098.82
      },
      "hasPromoCode": false,
      "promoCode": null
    }
  }
}
```

## Checkout Endpoints

### Get Checkout Data

```
GET /api/v1/checkout
```

Get checkout data including cart items, shipping methods, and payment options.

**Authentication Required:** Optional (Different response for authenticated vs. guest users)

**Response:**

```json
{
  "success": true,
  "message": "Checkout data retrieved successfully",
  "data": {
    "cart": {
      "_id": "60d3e4f5a6b7c8d9e0f1a2b3",
      "items": [
        {
          "_id": "60d3e4f5a6b7c8d9e0f1a2b4",
          "product": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
            "name": "Smartphone X",
            "slug": "smartphone-x"
          },
          "variant": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f2",
            "name": "Black 128GB"
          },
          "quantity": 1,
          "price": 44999,
          "subtotal": 44999,
          "gstPercentage": 18,
          "gstAmount": 8099.82,
          "total": 53098.82
        }
      ],
      "summary": {
        "subtotal": 44999,
        "tax": 8099.82,
        "shipping": 0,
        "discount": 0,
        "total": 53098.82
      }
    },
    "shippingMethods": [
      {
        "_id": "60e4f5a6b7c8d9e0f1a2b3c4",
        "name": "Standard Shipping",
        "description": "Delivery in 3-5 business days",
        "cost": 99,
        "estimatedDays": 5,
        "isActive": true
      },
      {
        "_id": "60e4f5a6b7c8d9e0f1a2b3c5",
        "name": "Express Shipping",
        "description": "Delivery in 1-2 business days",
        "cost": 299,
        "estimatedDays": 2,
        "isActive": true
      }
    ],
    "paymentMethods": [
      {
        "id": "razorpay",
        "name": "Credit/Debit Card & UPI",
        "description": "Pay securely with Razorpay",
        "isActive": true
      },
      {
        "id": "cod",
        "name": "Cash on Delivery",
        "description": "Pay when you receive your order",
        "isActive": true,
        "extraCharges": 50,
        "minOrderValue": 500,
        "maxOrderValue": 10000
      }
    ],
    "savedAddresses": [
      // Only for authenticated users
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
    ]
  }
}
```

### Add Shipping Details

```
POST /api/v1/checkout/shipping
```

Add shipping details to the checkout.

**Authentication Required:** No (Guest checkout supported)

**Request Body:**

```json
{
  "address": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India",
    "phone": "+919876543210"
  },
  "shippingMethodId": "60e4f5a6b7c8d9e0f1a2b3c4",
  "saveAddress": true // Only for authenticated users
}
```

**Response:**

```json
{
  "success": true,
  "message": "Shipping details added successfully",
  "data": {
    "checkout": {
      "_id": "60d3e4f5a6b7c8d9e0f1a2b3",
      "shipping": {
        "address": {
          "name": "John Doe",
          "street": "123 Main St",
          "city": "Mumbai",
          "state": "Maharashtra",
          "postalCode": "400001",
          "country": "India",
          "phone": "+919876543210"
        },
        "method": {
          "_id": "60e4f5a6b7c8d9e0f1a2b3c4",
          "name": "Standard Shipping",
          "cost": 99,
          "estimatedDays": 5
        }
      },
      "summary": {
        "subtotal": 44999,
        "tax": 8099.82,
        "shipping": 99,
        "discount": 0,
        "total": 53197.82
      }
    }
  }
}
```

### Add Billing Details

```
POST /api/v1/checkout/billing
```

Add billing details to the checkout.

**Authentication Required:** No (Guest checkout supported)

**Request Body:**

```json
{
  "sameAsShipping": true,
  "address": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India",
    "phone": "+919876543210"
  },
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Billing details added successfully",
  "data": {
    "checkout": {
      "_id": "60d3e4f5a6b7c8d9e0f1a2b3",
      "shipping": {
        "address": {
          "name": "John Doe",
          "street": "123 Main St",
          "city": "Mumbai",
          "state": "Maharashtra",
          "postalCode": "400001",
          "country": "India",
          "phone": "+919876543210"
        },
        "method": {
          "_id": "60e4f5a6b7c8d9e0f1a2b3c4",
          "name": "Standard Shipping",
          "cost": 99,
          "estimatedDays": 5
        }
      },
      "billing": {
        "address": {
          "name": "John Doe",
          "street": "123 Main St",
          "city": "Mumbai",
          "state": "Maharashtra",
          "postalCode": "400001",
          "country": "India",
          "phone": "+919876543210"
        },
        "email": "john@example.com"
      },
      "summary": {
        "subtotal": 44999,
        "tax": 8099.82,
        "shipping": 99,
        "discount": 0,
        "total": 53197.82
      }
    }
  }
}
```

### Initialize Payment

```
POST /api/v1/checkout/payment
```

Initialize payment for the order.

**Authentication Required:** No (Guest checkout supported)

**Request Body:**

```json
{
  "paymentMethod": "razorpay",
  "notes": "Please deliver after 6 PM"
}
```

**Response (for Razorpay):**

```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "orderId": "order_123456789",
    "paymentDetails": {
      "key": "rzp_test_your_key",
      "amount": 5319782, // in lowest currency unit (paise)
      "currency": "INR",
      "name": "Example Store",
      "description": "Order #ORD12345",
      "orderId": "order_123456789",
      "prefill": {
        "name": "John Doe",
        "email": "john@example.com",
        "contact": "+919876543210"
      },
      "notes": {
        "address": "123 Main St, Mumbai"
      },
      "theme": {
        "color": "#F37254"
      }
    }
  }
}
```

**Response (for COD):**

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order": {
      "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
      "status": "pending",
      "payment": {
        "method": "cod",
        "status": "pending"
      },
      "total": 53247.82 // Including COD charges
    }
  }
}
```

### Verify Payment

```
POST /api/v1/checkout/verify-payment
```

Verify payment after completion.

**Authentication Required:** No (Guest checkout supported)

**Request Body:**

```json
{
  "orderId": "order_123456789",
  "paymentId": "pay_123456789",
  "signature": "signature_hash"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment verified and order placed successfully",
  "data": {
    "order": {
      "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
      "status": "processing",
      "payment": {
        "method": "razorpay",
        "status": "paid",
        "transactionId": "pay_123456789",
        "paidAt": "2023-05-18T19:45:30.123Z"
      },
      "total": 53197.82
    }
  }
}
```

## Abandoned Cart Endpoints

### Get Abandoned Cart Recovery Link

```
GET /api/v1/cart/recovery/:cartToken
```

Recover an abandoned cart using a token sent via email.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Cart recovered successfully",
  "data": {
    "redirect": "/cart"
  }
}
```
