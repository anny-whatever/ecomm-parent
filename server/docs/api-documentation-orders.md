# Order Management API Documentation

## Order Endpoints

### Get User Orders

```
GET /api/v1/orders
```

Get a list of orders for the authenticated user.

**Authentication Required:** Yes

**Query Parameters:**

- `page`: Page number for pagination (default: 1)
- `limit`: Number of orders per page (default: 10)
- `status`: Filter by order status (optional)
- `startDate`: Filter by orders created after this date (ISO format)
- `endDate`: Filter by orders created before this date (ISO format)
- `sortBy`: Field to sort by (default: `-createdAt`)

**Response:**

```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
        "orderNumber": "ORD12345",
        "user": "60a3d1b9c2e4f83b3c5d2b7a",
        "status": "processing",
        "pricing": {
          "subtotal": 44999,
          "shipping": 99,
          "tax": 8099.82,
          "discount": 0,
          "total": 53197.82
        },
        "payment": {
          "method": "razorpay",
          "status": "paid",
          "transactionId": "pay_123456789",
          "paidAt": "2023-05-18T19:45:30.123Z"
        },
        "shipping": {
          "method": "Standard Shipping",
          "cost": 99,
          "trackingNumber": null,
          "carrier": null,
          "estimatedDelivery": "2023-05-23T00:00:00.000Z"
        },
        "items": [
          {
            "product": {
              "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
              "name": "Smartphone X",
              "slug": "smartphone-x",
              "images": [
                {
                  "url": "https://example.com/uploads/products/smartphone-x-12345.webp",
                  "isDefault": true
                }
              ]
            },
            "variant": {
              "sku": "SP-X-001-BLK-128",
              "name": "Black 128GB",
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
        "createdAt": "2023-05-18T19:45:30.123Z",
        "updatedAt": "2023-05-18T19:45:30.123Z"
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

### Get Order Details

```
GET /api/v1/orders/:orderNumber
```

Get detailed information about a specific order.

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "order": {
      "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
      "user": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7a",
        "email": "john@example.com",
        "profile": {
          "firstName": "John",
          "lastName": "Doe",
          "phone": "+919876543210"
        }
      },
      "items": [
        {
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
            ]
          },
          "variant": {
            "sku": "SP-X-001-BLK-128",
            "name": "Black 128GB",
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
          "name": "Smartphone X (Black 128GB)",
          "sku": "SP-X-001-BLK-128",
          "price": 44999,
          "quantity": 1,
          "gstPercentage": 18,
          "gstAmount": 8099.82,
          "subtotal": 44999,
          "total": 53098.82
        }
      ],
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
        "method": "Standard Shipping",
        "cost": 99,
        "trackingNumber": null,
        "carrier": null,
        "estimatedDelivery": "2023-05-23T00:00:00.000Z"
      },
      "pricing": {
        "subtotal": 44999,
        "shipping": 99,
        "tax": 8099.82,
        "discount": 0,
        "total": 53197.82
      },
      "payment": {
        "method": "razorpay",
        "status": "paid",
        "transactionId": "pay_123456789",
        "paidAt": "2023-05-18T19:45:30.123Z"
      },
      "status": "processing",
      "statusHistory": [
        {
          "status": "pending",
          "timestamp": "2023-05-18T19:44:15.789Z",
          "note": "Order created"
        },
        {
          "status": "processing",
          "timestamp": "2023-05-18T19:45:30.123Z",
          "note": "Payment received, order is being processed"
        }
      ],
      "notes": [
        {
          "text": "Please deliver after 6 PM",
          "isPublic": true,
          "createdAt": "2023-05-18T19:44:15.789Z"
        }
      ],
      "invoiceUrl": "https://example.com/invoices/INV12345.pdf",
      "createdAt": "2023-05-18T19:44:15.789Z",
      "updatedAt": "2023-05-18T19:45:30.123Z"
    }
  }
}
```

### Cancel Order

```
POST /api/v1/orders/:orderNumber/cancel
```

Cancel an order that is in pending or processing status.

**Authentication Required:** Yes

**Request Body:**

```json
{
  "reason": "Changed my mind about the purchase",
  "notes": "Please process refund quickly"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "order": {
      "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
      "status": "cancelled",
      "statusHistory": [
        {
          "status": "pending",
          "timestamp": "2023-05-18T19:44:15.789Z",
          "note": "Order created"
        },
        {
          "status": "processing",
          "timestamp": "2023-05-18T19:45:30.123Z",
          "note": "Payment received, order is being processed"
        },
        {
          "status": "cancelled",
          "timestamp": "2023-05-18T20:15:45.456Z",
          "note": "Cancelled by customer: Changed my mind about the purchase"
        }
      ],
      "notes": [
        {
          "text": "Please deliver after 6 PM",
          "isPublic": true,
          "createdAt": "2023-05-18T19:44:15.789Z"
        },
        {
          "text": "Order cancelled: Changed my mind about the purchase. Notes: Please process refund quickly",
          "isPublic": true,
          "createdAt": "2023-05-18T20:15:45.456Z"
        }
      ],
      "updatedAt": "2023-05-18T20:15:45.456Z"
    }
  }
}
```

### Get Order Invoice

```
GET /api/v1/orders/:orderNumber/invoice
```

Get the invoice for an order.

**Authentication Required:** Yes

**Response:** PDF file download or:

```json
{
  "success": true,
  "message": "Invoice retrieved successfully",
  "data": {
    "invoiceUrl": "https://example.com/invoices/INV12345.pdf"
  }
}
```

### Track Order

```
GET /api/v1/orders/:orderNumber/tracking
```

Get tracking information for an order.

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "message": "Tracking information retrieved successfully",
  "data": {
    "tracking": {
      "orderNumber": "ORD12345",
      "carrier": "Delhivery",
      "trackingNumber": "DL123456789",
      "status": "in_transit",
      "estimatedDelivery": "2023-05-23T00:00:00.000Z",
      "trackingUrl": "https://www.delhivery.com/track/DL123456789",
      "events": [
        {
          "status": "pickup_complete",
          "location": "Mumbai Warehouse",
          "timestamp": "2023-05-19T10:30:00.000Z",
          "description": "Package picked up from seller"
        },
        {
          "status": "in_transit",
          "location": "Mumbai Hub",
          "timestamp": "2023-05-19T14:45:00.000Z",
          "description": "Package in transit to next facility"
        }
      ]
    }
  }
}
```

## Admin Order Management

### Get Orders (Admin)

```
GET /api/v1/admin/orders
```

Get a list of all orders with advanced filtering options.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `page`: Page number for pagination (default: 1)
- `limit`: Number of orders per page (default: 20)
- `status`: Filter by order status (optional)
- `userId`: Filter by user ID (optional)
- `search`: Search by order number or customer name/email (optional)
- `startDate`: Filter by orders created after this date (ISO format)
- `endDate`: Filter by orders created before this date (ISO format)
- `minAmount`: Filter by minimum order amount (optional)
- `maxAmount`: Filter by maximum order amount (optional)
- `paymentStatus`: Filter by payment status (optional)
- `paymentMethod`: Filter by payment method (optional)
- `sortBy`: Field to sort by (default: `-createdAt`)

**Response:**

```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
        "orderNumber": "ORD12345",
        "user": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7a",
          "email": "john@example.com",
          "profile": {
            "firstName": "John",
            "lastName": "Doe"
          }
        },
        "status": "processing",
        "pricing": {
          "subtotal": 44999,
          "shipping": 99,
          "tax": 8099.82,
          "discount": 0,
          "total": 53197.82
        },
        "payment": {
          "method": "razorpay",
          "status": "paid"
        },
        "createdAt": "2023-05-18T19:44:15.789Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

### Update Order Status (Admin)

```
PUT /api/v1/admin/orders/:orderNumber/status
```

Update the status of an order.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "status": "shipped",
  "note": "Order has been shipped",
  "notifyCustomer": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order": {
      "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
      "status": "shipped",
      "statusHistory": [
        {
          "status": "pending",
          "timestamp": "2023-05-18T19:44:15.789Z",
          "note": "Order created"
        },
        {
          "status": "processing",
          "timestamp": "2023-05-18T19:45:30.123Z",
          "note": "Payment received, order is being processed"
        },
        {
          "status": "shipped",
          "timestamp": "2023-05-19T15:30:45.789Z",
          "note": "Order has been shipped",
          "user": {
            "_id": "60a3d1b9c2e4f83b3c5d2b7b",
            "profile": {
              "firstName": "Admin",
              "lastName": "User"
            }
          }
        }
      ],
      "updatedAt": "2023-05-19T15:30:45.789Z"
    }
  }
}
```

### Update Shipping Information (Admin)

```
PUT /api/v1/admin/orders/:orderNumber/shipping
```

Update shipping information for an order.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "trackingNumber": "DL123456789",
  "carrier": "Delhivery",
  "estimatedDelivery": "2023-05-23T00:00:00.000Z",
  "notifyCustomer": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Shipping information updated successfully",
  "data": {
    "order": {
      "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
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
        "method": "Standard Shipping",
        "cost": 99,
        "trackingNumber": "DL123456789",
        "carrier": "Delhivery",
        "estimatedDelivery": "2023-05-23T00:00:00.000Z"
      },
      "updatedAt": "2023-05-19T15:45:30.123Z"
    }
  }
}
```

### Add Order Note (Admin)

```
POST /api/v1/admin/orders/:orderNumber/notes
```

Add a note to an order.

**Authentication Required:** Yes (Admin/Manager/Staff role)

**Request Body:**

```json
{
  "text": "Customer called about delivery time",
  "isPublic": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    "note": {
      "_id": "60f6b7c8d9e0f1a2b3c4d5e6",
      "text": "Customer called about delivery time",
      "isPublic": false,
      "createdAt": "2023-05-19T16:15:22.456Z",
      "createdBy": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7b",
        "profile": {
          "firstName": "Admin",
          "lastName": "User"
        }
      }
    }
  }
}
```

### Process Refund (Admin)

```
POST /api/v1/admin/orders/:orderNumber/refund
```

Process a refund for an order.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "amount": 53197.82,
  "reason": "Customer returned the product",
  "notes": "Product was damaged",
  "notifyCustomer": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refund": {
      "_id": "60g7c8d9e0f1a2b3c4d5e6f7",
      "order": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
      "amount": 53197.82,
      "reason": "Customer returned the product",
      "notes": "Product was damaged",
      "status": "completed",
      "transactionId": "rfnd_123456789",
      "processedAt": "2023-05-19T16:45:30.123Z",
      "processedBy": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7b",
        "profile": {
          "firstName": "Admin",
          "lastName": "User"
        }
      }
    },
    "order": {
      "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
      "status": "refunded",
      "payment": {
        "method": "razorpay",
        "status": "refunded"
      }
    }
  }
}
```

### Generate Invoice (Admin)

```
POST /api/v1/admin/orders/:orderNumber/invoice
```

Generate or regenerate an invoice for an order.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "regenerate": true,
  "sendToCustomer": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Invoice generated successfully",
  "data": {
    "invoice": {
      "url": "https://example.com/invoices/INV12345.pdf",
      "number": "INV12345",
      "generatedAt": "2023-05-19T17:00:15.789Z"
    }
  }
}
```

### Get Order Statistics (Admin)

```
GET /api/v1/admin/orders/stats
```

Get order statistics for dashboard display.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `period`: Time period for stats (e.g., "today", "week", "month", "year")
- `startDate`: Custom period start date (ISO format)
- `endDate`: Custom period end date (ISO format)

**Response:**

```json
{
  "success": true,
  "message": "Order statistics retrieved successfully",
  "data": {
    "stats": {
      "totalOrders": 156,
      "totalSales": 5674589.75,
      "averageOrderValue": 36375.57,
      "pendingOrders": 12,
      "processingOrders": 35,
      "shippedOrders": 45,
      "deliveredOrders": 58,
      "cancelledOrders": 6,
      "todayOrders": 8,
      "todaySales": 312567.89,
      "salesByStatus": {
        "pending": 456789.5,
        "processing": 1234567.8,
        "shipped": 1589345.25,
        "delivered": 2356789.45,
        "cancelled": 37097.75
      },
      "salesByDate": [
        {
          "date": "2023-05-13",
          "orders": 25,
          "sales": 857945.75
        },
        {
          "date": "2023-05-14",
          "orders": 18,
          "sales": 623478.5
        },
        {
          "date": "2023-05-15",
          "orders": 22,
          "sales": 789356.25
        },
        {
          "date": "2023-05-16",
          "orders": 30,
          "sales": 1054789.5
        },
        {
          "date": "2023-05-17",
          "orders": 28,
          "sales": 967845.25
        },
        {
          "date": "2023-05-18",
          "orders": 25,
          "sales": 868606.5
        },
        {
          "date": "2023-05-19",
          "orders": 8,
          "sales": 312567.89
        }
      ]
    }
  }
}
```
