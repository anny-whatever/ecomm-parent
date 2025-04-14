# Loyalty Program API Documentation

This document provides detailed information about the Loyalty Program API endpoints. The loyalty program allows customers to earn and redeem points for purchases, view their rewards history, and participate in tiered loyalty programs.

## Base URL

All URLs referenced in this documentation have the following base:

```
https://api.yourdomain.com/api/v1
```

## Authentication

Most loyalty endpoints require authentication using a valid JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Error Handling

All endpoints follow a standard error response format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "errors": ["Detailed error information"],
  "errorCode": "ERROR_CODE"
}
```

## Rate Limiting

API requests are subject to rate limiting of 100 requests per IP address per 15-minute window for public endpoints and 1000 requests per IP per 15-minute window for authenticated requests.

---

## Loyalty Program Endpoints

### 1. Get Loyalty Program Status

Returns the customer's current loyalty program status, including points balance, tier information, and upcoming rewards.

**Endpoint:** `GET /loyalty/status`

**Authentication required:** Yes

**Request Parameters:** None

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "pointsBalance": 450,
    "lifetimePoints": 2750,
    "currentTier": {
      "id": "silver",
      "name": "Silver",
      "threshold": 1000,
      "benefits": [
        "Free shipping on orders over $50",
        "Birthday reward",
        "Early access to sales"
      ]
    },
    "nextTier": {
      "id": "gold",
      "name": "Gold",
      "threshold": 5000,
      "pointsToNextTier": 2250,
      "benefits": [
        "Free shipping on all orders",
        "Double points on Tuesdays",
        "Exclusive products",
        "Priority customer service"
      ]
    },
    "availableRewards": [
      {
        "id": "reward123",
        "name": "$10 off your next order",
        "description": "Use your points for $10 off your next purchase",
        "pointsCost": 200,
        "expiryDate": "2023-12-31T23:59:59Z"
      }
    ],
    "expiringPoints": {
      "amount": 50,
      "expiryDate": "2023-10-31T23:59:59Z"
    }
  }
}
```

### 2. View Loyalty History

Returns the customer's loyalty program activity history, including points earned and redeemed.

**Endpoint:** `GET /loyalty/history`

**Authentication required:** Yes

**Query Parameters:**

| Parameter | Type    | Default | Description                             |
| --------- | ------- | ------- | --------------------------------------- |
| page      | integer | 1       | Page number for pagination              |
| limit     | integer | 10      | Number of records per page (max 50)     |
| sort      | string  | "date"  | Field to sort by (date, points, type)   |
| order     | string  | "desc"  | Sort order ("asc" or "desc")            |
| type      | string  | null    | Filter by type ("earned" or "redeemed") |

**Response:**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "txn123",
        "date": "2023-08-15T14:30:45Z",
        "type": "earned",
        "points": 120,
        "description": "Order #ORD123456",
        "orderId": "ORD123456",
        "reference": "purchase"
      },
      {
        "id": "txn122",
        "date": "2023-08-01T09:15:22Z",
        "type": "redeemed",
        "points": -200,
        "description": "$10 off coupon applied",
        "reference": "reward",
        "rewardId": "reward123"
      },
      {
        "id": "txn121",
        "date": "2023-07-30T16:45:33Z",
        "type": "earned",
        "points": 50,
        "description": "Birthday bonus",
        "reference": "bonus"
      }
    ],
    "pagination": {
      "totalRecords": 24,
      "totalPages": 3,
      "currentPage": 1,
      "limit": 10
    }
  }
}
```

### 3. Available Rewards

Lists all rewards available for redemption in the loyalty program.

**Endpoint:** `GET /loyalty/rewards`

**Authentication required:** Yes

**Query Parameters:**

| Parameter | Type    | Default      | Description                         |
| --------- | ------- | ------------ | ----------------------------------- |
| page      | integer | 1            | Page number for pagination          |
| limit     | integer | 10           | Number of records per page (max 50) |
| sort      | string  | "pointsCost" | Field to sort by (pointsCost, name) |
| order     | string  | "asc"        | Sort order ("asc" or "desc")        |

**Response:**

```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": "reward123",
        "name": "$10 off your next order",
        "description": "Use your points for $10 off your next purchase",
        "pointsCost": 200,
        "type": "discount",
        "value": 10,
        "minOrderValue": 25,
        "redemptionLimit": 1,
        "expiryDays": 30,
        "isAvailable": true
      },
      {
        "id": "reward124",
        "name": "Free shipping",
        "description": "Free shipping on your next order",
        "pointsCost": 150,
        "type": "shipping",
        "redemptionLimit": 1,
        "expiryDays": 30,
        "isAvailable": true
      },
      {
        "id": "reward125",
        "name": "$25 off your next order",
        "description": "Use your points for $25 off your next purchase",
        "pointsCost": 500,
        "type": "discount",
        "value": 25,
        "minOrderValue": 75,
        "redemptionLimit": 1,
        "expiryDays": 30,
        "isAvailable": true
      }
    ],
    "pagination": {
      "totalRecords": 8,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 10
    }
  }
}
```

### 4. Redeem Points for Reward

Allows customers to redeem their loyalty points for a specific reward.

**Endpoint:** `POST /loyalty/redeem`

**Authentication required:** Yes

**Request Body:**

```json
{
  "rewardId": "reward123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "redemption": {
      "id": "redeem456",
      "rewardId": "reward123",
      "pointsRedeemed": 200,
      "reward": {
        "name": "$10 off your next order",
        "description": "Use your points for $10 off your next purchase",
        "type": "discount"
      },
      "code": "LOYALTYDISCOUNT-1234567890",
      "status": "active",
      "createdAt": "2023-08-17T10:25:12Z",
      "expiresAt": "2023-09-16T23:59:59Z"
    },
    "newPointsBalance": 250
  }
}
```

### 5. Get Loyalty Tiers

Retrieves information about all loyalty program tiers and their benefits.

**Endpoint:** `GET /loyalty/tiers`

**Authentication required:** No

**Response:**

```json
{
  "success": true,
  "data": {
    "tiers": [
      {
        "id": "bronze",
        "name": "Bronze",
        "threshold": 0,
        "benefits": ["Earn 1 point per $1 spent", "Birthday reward"],
        "image": "https://assets.yourdomain.com/loyalty/bronze.png"
      },
      {
        "id": "silver",
        "name": "Silver",
        "threshold": 1000,
        "benefits": [
          "Earn 1.25 points per $1 spent",
          "Free shipping on orders over $50",
          "Birthday reward",
          "Early access to sales"
        ],
        "image": "https://assets.yourdomain.com/loyalty/silver.png"
      },
      {
        "id": "gold",
        "name": "Gold",
        "threshold": 5000,
        "benefits": [
          "Earn 1.5 points per $1 spent",
          "Free shipping on all orders",
          "Double points on Tuesdays",
          "Exclusive products",
          "Priority customer service",
          "Birthday reward"
        ],
        "image": "https://assets.yourdomain.com/loyalty/gold.png"
      },
      {
        "id": "platinum",
        "name": "Platinum",
        "threshold": 10000,
        "benefits": [
          "Earn 2 points per $1 spent",
          "Free shipping on all orders",
          "Triple points on Tuesdays",
          "Exclusive products",
          "Dedicated customer service representative",
          "Birthday reward with bonus points",
          "Exclusive events"
        ],
        "image": "https://assets.yourdomain.com/loyalty/platinum.png"
      }
    ]
  }
}
```

### 6. View Reward Redemption History

Returns the customer's reward redemption history.

**Endpoint:** `GET /loyalty/redemptions`

**Authentication required:** Yes

**Query Parameters:**

| Parameter | Type    | Default | Description                              |
| --------- | ------- | ------- | ---------------------------------------- |
| page      | integer | 1       | Page number for pagination               |
| limit     | integer | 10      | Number of records per page (max 50)      |
| status    | string  | null    | Filter by status (active, used, expired) |

**Response:**

```json
{
  "success": true,
  "data": {
    "redemptions": [
      {
        "id": "redeem456",
        "rewardId": "reward123",
        "reward": {
          "name": "$10 off your next order",
          "description": "Use your points for $10 off your next purchase",
          "type": "discount"
        },
        "pointsRedeemed": 200,
        "code": "LOYALTYDISCOUNT-1234567890",
        "status": "active",
        "createdAt": "2023-08-17T10:25:12Z",
        "expiresAt": "2023-09-16T23:59:59Z",
        "usedAt": null,
        "appliedToOrder": null
      },
      {
        "id": "redeem455",
        "rewardId": "reward124",
        "reward": {
          "name": "Free shipping",
          "description": "Free shipping on your next order",
          "type": "shipping"
        },
        "pointsRedeemed": 150,
        "code": "LOYALTYSHIP-9876543210",
        "status": "used",
        "createdAt": "2023-07-05T14:12:33Z",
        "expiresAt": "2023-08-04T23:59:59Z",
        "usedAt": "2023-07-12T16:45:22Z",
        "appliedToOrder": "ORD123123"
      }
    ],
    "pagination": {
      "totalRecords": 5,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 10
    }
  }
}
```

### 7. Apply Loyalty Reward to Cart

Applies a redeemed loyalty reward to the current shopping cart.

**Endpoint:** `POST /cart/apply-loyalty-reward`

**Authentication required:** Yes

**Request Body:**

```json
{
  "redemptionId": "redeem456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "cart789",
      "items": [
        {
          "id": "item123",
          "productId": "prod123",
          "name": "Organic Cotton T-Shirt",
          "quantity": 2,
          "price": 24.99,
          "total": 49.98,
          "image": "https://assets.yourdomain.com/products/tshirt-blue.jpg"
        }
      ],
      "subtotal": 49.98,
      "discounts": [
        {
          "id": "discount123",
          "type": "loyalty_reward",
          "code": "LOYALTYDISCOUNT-1234567890",
          "description": "$10 off your next order",
          "value": -10.0
        }
      ],
      "shipping": 5.99,
      "tax": 3.6,
      "total": 49.57,
      "appliedRewards": [
        {
          "id": "redeem456",
          "name": "$10 off your next order",
          "code": "LOYALTYDISCOUNT-1234567890"
        }
      ]
    }
  }
}
```

### 8. Remove Loyalty Reward from Cart

Removes a previously applied loyalty reward from the current shopping cart.

**Endpoint:** `DELETE /cart/loyalty-reward/:redemptionId`

**Authentication required:** Yes

**URL Parameters:**

| Parameter    | Type   | Description                         |
| ------------ | ------ | ----------------------------------- |
| redemptionId | string | ID of the loyalty reward redemption |

**Response:**

```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "cart789",
      "items": [
        {
          "id": "item123",
          "productId": "prod123",
          "name": "Organic Cotton T-Shirt",
          "quantity": 2,
          "price": 24.99,
          "total": 49.98,
          "image": "https://assets.yourdomain.com/products/tshirt-blue.jpg"
        }
      ],
      "subtotal": 49.98,
      "discounts": [],
      "shipping": 5.99,
      "tax": 4.5,
      "total": 60.47,
      "appliedRewards": []
    }
  }
}
```

### 9. Admin: Create Loyalty Reward

**Endpoint:** `POST /admin/loyalty/rewards`

**Authentication required:** Yes (Admin/Manager only)

**Request Body:**

```json
{
  "name": "Summer Special - $15 off",
  "description": "Get $15 off on orders over $50",
  "pointsCost": 300,
  "type": "discount",
  "value": 15,
  "minOrderValue": 50,
  "redemptionLimit": 1,
  "expiryDays": 45,
  "isAvailable": true,
  "startDate": "2023-06-01T00:00:00Z",
  "endDate": "2023-08-31T23:59:59Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reward": {
      "id": "reward126",
      "name": "Summer Special - $15 off",
      "description": "Get $15 off on orders over $50",
      "pointsCost": 300,
      "type": "discount",
      "value": 15,
      "minOrderValue": 50,
      "redemptionLimit": 1,
      "expiryDays": 45,
      "isAvailable": true,
      "startDate": "2023-06-01T00:00:00Z",
      "endDate": "2023-08-31T23:59:59Z",
      "createdAt": "2023-05-12T10:22:45Z"
    }
  }
}
```

### 10. Admin: Update Loyalty Reward

**Endpoint:** `PUT /admin/loyalty/rewards/:rewardId`

**Authentication required:** Yes (Admin/Manager only)

**URL Parameters:**

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| rewardId  | string | ID of the loyalty reward |

**Request Body:**

```json
{
  "name": "Summer Special - $15 off",
  "description": "Get $15 off on orders over $75",
  "pointsCost": 350,
  "minOrderValue": 75,
  "isAvailable": true,
  "endDate": "2023-09-15T23:59:59Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reward": {
      "id": "reward126",
      "name": "Summer Special - $15 off",
      "description": "Get $15 off on orders over $75",
      "pointsCost": 350,
      "type": "discount",
      "value": 15,
      "minOrderValue": 75,
      "redemptionLimit": 1,
      "expiryDays": 45,
      "isAvailable": true,
      "startDate": "2023-06-01T00:00:00Z",
      "endDate": "2023-09-15T23:59:59Z",
      "updatedAt": "2023-05-15T08:42:16Z"
    }
  }
}
```

### 11. Admin: Delete Loyalty Reward

**Endpoint:** `DELETE /admin/loyalty/rewards/:rewardId`

**Authentication required:** Yes (Admin/Manager only)

**URL Parameters:**

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| rewardId  | string | ID of the loyalty reward |

**Response:**

```json
{
  "success": true,
  "message": "Loyalty reward successfully deleted"
}
```

### 12. Admin: Manually Adjust Points

Allows administrators to manually adjust a customer's loyalty points.

**Endpoint:** `POST /admin/loyalty/adjust-points`

**Authentication required:** Yes (Admin/Manager only)

**Request Body:**

```json
{
  "userId": "user123",
  "points": 100,
  "description": "Goodwill adjustment for customer service issue",
  "reference": "support_ticket_12345"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "txn124",
      "userId": "user123",
      "points": 100,
      "description": "Goodwill adjustment for customer service issue",
      "reference": "support_ticket_12345",
      "type": "manual_adjustment",
      "createdAt": "2023-08-18T15:22:45Z",
      "createdBy": "admin789"
    },
    "newPointsBalance": 550
  }
}
```

### 13. Admin: Get Customer Loyalty Details

Retrieves detailed loyalty information for a specific customer.

**Endpoint:** `GET /admin/loyalty/customers/:userId`

**Authentication required:** Yes (Admin/Manager only)

**URL Parameters:**

| Parameter | Type   | Description        |
| --------- | ------ | ------------------ |
| userId    | string | ID of the customer |

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "registeredAt": "2022-03-15T08:22:45Z"
    },
    "loyalty": {
      "pointsBalance": 550,
      "lifetimePoints": 2850,
      "currentTier": {
        "id": "silver",
        "name": "Silver",
        "threshold": 1000
      },
      "pointsToNextTier": 2150,
      "nextTierThreshold": 5000,
      "nextTier": "gold",
      "joinedLoyaltyAt": "2022-03-15T08:22:45Z"
    },
    "activity": {
      "lastTransactionDate": "2023-08-18T15:22:45Z",
      "totalTransactions": 18,
      "totalRedemptions": 3,
      "expiringPoints": {
        "amount": 50,
        "expiryDate": "2023-10-31T23:59:59Z"
      }
    },
    "statistics": {
      "totalSpent": 1450.75,
      "averageOrderValue": 120.89,
      "purchaseFrequency": "45 days"
    }
  }
}
```
