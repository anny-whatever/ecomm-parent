# Payment API Documentation

## Payment Endpoints

### Initialize Payment

```
POST /api/v1/payments/initialize
```

Initialize a payment for an order.

**Authentication Required:** Optional (Different behavior for authenticated vs. guest users)

**Request Body:**

```json
{
  "orderId": "60f5a6b7c8d9e0f1a2b3c4d5",
  "paymentMethod": "razorpay",
  "currency": "INR",
  "amount": 53197.82,
  "description": "Payment for order #ORD12345",
  "callbackUrl": "https://example.com/payment/callback"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "paymentId": "pay_init_123456789",
    "gateway": "razorpay",
    "gatewayData": {
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
        "orderId": "60f5a6b7c8d9e0f1a2b3c4d5"
      },
      "theme": {
        "color": "#F37254"
      }
    }
  }
}
```

### Verify Payment

```
POST /api/v1/payments/verify
```

Verify a payment after completion.

**Authentication Required:** No

**Request Body:**

```json
{
  "paymentId": "pay_init_123456789",
  "razorpayPaymentId": "pay_123456789",
  "razorpayOrderId": "order_123456789",
  "razorpaySignature": "signature_hash"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "payment": {
      "_id": "60g7c8d9e0f1a2b3c4d5e6f7",
      "order": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
      "amount": 53197.82,
      "currency": "INR",
      "method": "razorpay",
      "status": "completed",
      "transactionId": "pay_123456789",
      "gatewayData": {
        "orderId": "order_123456789",
        "signature": "signature_hash"
      },
      "completedAt": "2023-05-19T18:30:45.123Z"
    },
    "redirect": "/orders/ORD12345/confirmation"
  }
}
```

### Payment Webhook

```
POST /api/v1/webhooks/razorpay
```

Webhook endpoint for receiving payment notifications from Razorpay.

**Authentication Required:** No (Uses webhook signature validation)

**Request Body (example from Razorpay):**

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_123456789",
        "order_id": "order_123456789",
        "amount": 5319782,
        "currency": "INR",
        "status": "captured",
        "method": "card",
        "notes": {
          "orderId": "60f5a6b7c8d9e0f1a2b3c4d5"
        }
      }
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### Get Payment Methods

```
GET /api/v1/payments/methods
```

Get available payment methods.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Payment methods retrieved successfully",
  "data": {
    "methods": [
      {
        "id": "razorpay",
        "name": "Credit/Debit Card & UPI",
        "description": "Pay securely with Razorpay",
        "isActive": true,
        "supportedCurrencies": ["INR"],
        "icon": "https://example.com/assets/icons/razorpay.png"
      },
      {
        "id": "cod",
        "name": "Cash on Delivery",
        "description": "Pay when you receive your order",
        "isActive": true,
        "supportedCurrencies": ["INR"],
        "icon": "https://example.com/assets/icons/cod.png",
        "extraCharges": 50,
        "minOrderValue": 500,
        "maxOrderValue": 10000
      }
    ]
  }
}
```

### Get Payment Status

```
GET /api/v1/payments/:paymentId
```

Get the status of a payment.

**Authentication Required:** Yes (or valid guest token)

**Response:**

```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "payment": {
      "_id": "60g7c8d9e0f1a2b3c4d5e6f7",
      "order": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
      "amount": 53197.82,
      "currency": "INR",
      "method": "razorpay",
      "status": "completed",
      "transactionId": "pay_123456789",
      "completedAt": "2023-05-19T18:30:45.123Z"
    }
  }
}
```

## Admin Payment Management

### Process Refund (Admin)

```
POST /api/v1/admin/payments/refund
```

Process a refund for a payment.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "paymentId": "60g7c8d9e0f1a2b3c4d5e6f7",
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
      "_id": "60h8d9e0f1a2b3c4d5e6f7g8",
      "payment": "60g7c8d9e0f1a2b3c4d5e6f7",
      "order": "60f5a6b7c8d9e0f1a2b3c4d5",
      "orderNumber": "ORD12345",
      "amount": 53197.82,
      "currency": "INR",
      "reason": "Customer returned the product",
      "notes": "Product was damaged",
      "status": "completed",
      "transactionId": "rfnd_123456789",
      "processedAt": "2023-05-19T19:15:30.456Z",
      "processedBy": {
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

### List Payments (Admin)

```
GET /api/v1/admin/payments
```

Get a list of payments with filtering options.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `page`: Page number for pagination (default: 1)
- `limit`: Number of payments per page (default: 20)
- `status`: Filter by payment status (e.g., "pending", "completed", "failed", "refunded")
- `method`: Filter by payment method (e.g., "razorpay", "cod")
- `startDate`: Filter by payments created after this date (ISO format)
- `endDate`: Filter by payments created before this date (ISO format)
- `orderId`: Filter by order ID
- `orderNumber`: Filter by order number
- `search`: Search by transaction ID or customer email/name
- `sortBy`: Field to sort by (default: `-createdAt`)

**Response:**

```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": {
    "payments": [
      {
        "_id": "60g7c8d9e0f1a2b3c4d5e6f7",
        "order": {
          "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
          "orderNumber": "ORD12345"
        },
        "user": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7a",
          "email": "john@example.com",
          "profile": {
            "firstName": "John",
            "lastName": "Doe"
          }
        },
        "amount": 53197.82,
        "currency": "INR",
        "method": "razorpay",
        "status": "completed",
        "transactionId": "pay_123456789",
        "completedAt": "2023-05-19T18:30:45.123Z",
        "createdAt": "2023-05-19T18:25:30.789Z"
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

### Get Payment Details (Admin)

```
GET /api/v1/admin/payments/:paymentId
```

Get detailed information about a specific payment.

**Authentication Required:** Yes (Admin/Manager role)

**Response:**

```json
{
  "success": true,
  "message": "Payment details retrieved successfully",
  "data": {
    "payment": {
      "_id": "60g7c8d9e0f1a2b3c4d5e6f7",
      "order": {
        "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
        "orderNumber": "ORD12345",
        "status": "processing"
      },
      "user": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7a",
        "email": "john@example.com",
        "profile": {
          "firstName": "John",
          "lastName": "Doe",
          "phone": "+919876543210"
        }
      },
      "amount": 53197.82,
      "currency": "INR",
      "method": "razorpay",
      "status": "completed",
      "transactionId": "pay_123456789",
      "gatewayData": {
        "orderId": "order_123456789",
        "signature": "signature_hash",
        "cardNetwork": "Visa",
        "cardLastFour": "1234",
        "method": "card"
      },
      "history": [
        {
          "status": "initiated",
          "timestamp": "2023-05-19T18:25:30.789Z",
          "note": "Payment initiated"
        },
        {
          "status": "processing",
          "timestamp": "2023-05-19T18:28:15.456Z",
          "note": "Payment being processed by gateway"
        },
        {
          "status": "completed",
          "timestamp": "2023-05-19T18:30:45.123Z",
          "note": "Payment completed successfully"
        }
      ],
      "completedAt": "2023-05-19T18:30:45.123Z",
      "createdAt": "2023-05-19T18:25:30.789Z",
      "updatedAt": "2023-05-19T18:30:45.123Z",
      "refunds": [
        {
          "_id": "60h8d9e0f1a2b3c4d5e6f7g8",
          "amount": 53197.82,
          "currency": "INR",
          "reason": "Customer returned the product",
          "status": "completed",
          "transactionId": "rfnd_123456789",
          "processedAt": "2023-05-19T19:15:30.456Z",
          "processedBy": {
            "_id": "60a3d1b9c2e4f83b3c5d2b7b",
            "profile": {
              "firstName": "Admin",
              "lastName": "User"
            }
          }
        }
      ]
    }
  }
}
```

### Update Payment Method Settings (Admin)

```
PUT /api/v1/admin/payments/methods/:methodId
```

Update settings for a payment method.

**Authentication Required:** Yes (Admin role)

**Request Body:**

```json
{
  "isActive": true,
  "settings": {
    "extraCharges": 0,
    "minOrderValue": 0,
    "maxOrderValue": 50000
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment method settings updated successfully",
  "data": {
    "method": {
      "id": "cod",
      "name": "Cash on Delivery",
      "isActive": true,
      "settings": {
        "extraCharges": 0,
        "minOrderValue": 0,
        "maxOrderValue": 50000
      },
      "updatedAt": "2023-05-19T19:45:15.789Z"
    }
  }
}
```

### Get Payment Gateway Settings (Admin)

```
GET /api/v1/admin/payments/gateway-settings/:gateway
```

Get settings for a payment gateway.

**Authentication Required:** Yes (Admin role)

**Response:**

```json
{
  "success": true,
  "message": "Gateway settings retrieved successfully",
  "data": {
    "settings": {
      "gateway": "razorpay",
      "isActive": true,
      "displayName": "Credit/Debit Card & UPI",
      "credentials": {
        "keyId": "rzp_*********", // Masked for security
        "keySecret": "********" // Masked for security
      },
      "webhookEnabled": true,
      "webhookUrl": "https://example.com/api/v1/webhooks/razorpay",
      "testMode": false,
      "updatedAt": "2023-05-01T10:15:30.789Z"
    }
  }
}
```

### Update Payment Gateway Settings (Admin)

```
PUT /api/v1/admin/payments/gateway-settings/:gateway
```

Update settings for a payment gateway.

**Authentication Required:** Yes (Admin role)

**Request Body:**

```json
{
  "displayName": "Credit/Debit Card, UPI & NetBanking",
  "credentials": {
    "keyId": "rzp_live_new_key_id",
    "keySecret": "new_key_secret"
  },
  "testMode": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Gateway settings updated successfully",
  "data": {
    "settings": {
      "gateway": "razorpay",
      "isActive": true,
      "displayName": "Credit/Debit Card, UPI & NetBanking",
      "testMode": false,
      "updatedAt": "2023-05-19T20:00:45.123Z"
    }
  }
}
```

### Get Payment Statistics (Admin)

```
GET /api/v1/admin/payments/stats
```

Get payment statistics for dashboard display.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `period`: Time period for stats (e.g., "today", "week", "month", "year")
- `startDate`: Custom period start date (ISO format)
- `endDate`: Custom period end date (ISO format)

**Response:**

```json
{
  "success": true,
  "message": "Payment statistics retrieved successfully",
  "data": {
    "stats": {
      "totalPayments": 156,
      "totalAmount": 5674589.75,
      "successfulPayments": 145,
      "successfulAmount": 5583214.25,
      "pendingPayments": 5,
      "pendingAmount": 54328.5,
      "failedPayments": 6,
      "failedAmount": 37047.0,
      "totalRefunds": 12,
      "refundAmount": 345678.9,
      "paymentsByMethod": {
        "razorpay": {
          "count": 135,
          "amount": 5294567.75
        },
        "cod": {
          "count": 21,
          "amount": 380022.0
        }
      },
      "paymentsByDate": [
        {
          "date": "2023-05-13",
          "count": 25,
          "amount": 857945.75
        },
        {
          "date": "2023-05-14",
          "count": 18,
          "amount": 623478.5
        },
        {
          "date": "2023-05-15",
          "count": 22,
          "amount": 789356.25
        },
        {
          "date": "2023-05-16",
          "count": 30,
          "amount": 1054789.5
        },
        {
          "date": "2023-05-17",
          "count": 28,
          "amount": 967845.25
        },
        {
          "date": "2023-05-18",
          "count": 25,
          "amount": 868606.5
        },
        {
          "date": "2023-05-19",
          "count": 8,
          "amount": 312567.89
        }
      ]
    }
  }
}
```
