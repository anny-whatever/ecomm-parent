# Subscription Management API

## Base URL

```
https://api.example.com/api/v1
```

## Authentication

All subscription endpoints require a valid JWT token obtained through the authentication process. Include the token in the request header:

```
Authorization: Bearer {jwt_token}
```

## Error Handling

Errors return appropriate HTTP status codes with a JSON response:

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Description of the error"
}
```

## Endpoints

### Get User Subscriptions

Retrieves all active and past subscriptions for the authenticated user.

**Endpoint:** `GET /subscriptions`

**Authentication:** Required (Customer)

**Response:**

```json
{
  "status": "success",
  "data": {
    "subscriptions": [
      {
        "id": "sub_12345",
        "plan": {
          "id": "plan_123",
          "name": "Premium Monthly",
          "description": "Premium access to all products",
          "price": 29.99,
          "billing_cycle": "monthly",
          "features": ["Free shipping", "Early access"]
        },
        "status": "active",
        "start_date": "2023-01-15T00:00:00Z",
        "next_billing_date": "2023-02-15T00:00:00Z",
        "payment_method": {
          "id": "pm_123456",
          "last4": "4242",
          "brand": "visa",
          "expiry": "12/25"
        },
        "items": [
          {
            "product_id": "prod_123",
            "product_name": "Organic Coffee",
            "quantity": 2
          }
        ]
      }
    ]
  }
}
```

### Create Subscription

Creates a new subscription for the authenticated user.

**Endpoint:** `POST /subscriptions`

**Authentication:** Required (Customer)

**Request Body:**

```json
{
  "plan_id": "plan_123",
  "payment_method_id": "pm_123456",
  "items": [
    {
      "product_id": "prod_123",
      "quantity": 2
    }
  ],
  "shipping_address_id": "addr_123",
  "billing_address_id": "addr_456"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "subscription_id": "sub_12345",
    "status": "active",
    "start_date": "2023-01-15T00:00:00Z",
    "next_billing_date": "2023-02-15T00:00:00Z"
  }
}
```

### Get Subscription Details

Retrieves detailed information about a specific subscription.

**Endpoint:** `GET /subscriptions/:subscription_id`

**Authentication:** Required (Customer)

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "sub_12345",
    "plan": {
      "id": "plan_123",
      "name": "Premium Monthly",
      "description": "Premium access to all products",
      "price": 29.99,
      "billing_cycle": "monthly",
      "features": ["Free shipping", "Early access"]
    },
    "status": "active",
    "start_date": "2023-01-15T00:00:00Z",
    "next_billing_date": "2023-02-15T00:00:00Z",
    "payment_method": {
      "id": "pm_123456",
      "last4": "4242",
      "brand": "visa",
      "expiry": "12/25"
    },
    "items": [
      {
        "product_id": "prod_123",
        "product_name": "Organic Coffee",
        "quantity": 2
      }
    ],
    "shipping_address": {
      "id": "addr_123",
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94105",
      "country": "US"
    },
    "billing_address": {
      "id": "addr_456",
      "line1": "456 Market St",
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94105",
      "country": "US"
    },
    "billing_history": [
      {
        "id": "bill_123",
        "amount": 29.99,
        "status": "paid",
        "date": "2023-01-15T00:00:00Z",
        "invoice_url": "https://example.com/invoices/inv_123.pdf"
      }
    ]
  }
}
```

### Update Subscription

Updates an existing subscription's details.

**Endpoint:** `PUT /subscriptions/:subscription_id`

**Authentication:** Required (Customer)

**Request Body:**

```json
{
  "items": [
    {
      "product_id": "prod_123",
      "quantity": 3
    }
  ],
  "shipping_address_id": "addr_789"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "subscription_id": "sub_12345",
    "message": "Subscription updated successfully"
  }
}
```

### Pause Subscription

Temporarily pauses an active subscription.

**Endpoint:** `POST /subscriptions/:subscription_id/pause`

**Authentication:** Required (Customer)

**Request Body:**

```json
{
  "resume_date": "2023-03-15T00:00:00Z"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "subscription_id": "sub_12345",
    "status": "paused",
    "resume_date": "2023-03-15T00:00:00Z",
    "message": "Subscription paused successfully"
  }
}
```

### Resume Subscription

Resumes a paused subscription.

**Endpoint:** `POST /subscriptions/:subscription_id/resume`

**Authentication:** Required (Customer)

**Response:**

```json
{
  "status": "success",
  "data": {
    "subscription_id": "sub_12345",
    "status": "active",
    "next_billing_date": "2023-02-15T00:00:00Z",
    "message": "Subscription resumed successfully"
  }
}
```

### Cancel Subscription

Cancels an active subscription.

**Endpoint:** `POST /subscriptions/:subscription_id/cancel`

**Authentication:** Required (Customer)

**Request Body:**

```json
{
  "reason": "Too expensive",
  "feedback": "I found a better deal elsewhere"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "subscription_id": "sub_12345",
    "status": "cancelled",
    "end_date": "2023-02-15T00:00:00Z",
    "message": "Subscription cancelled successfully"
  }
}
```

### Get Available Subscription Plans

Retrieves all available subscription plans.

**Endpoint:** `GET /subscription-plans`

**Authentication:** Optional

**Response:**

```json
{
  "status": "success",
  "data": {
    "plans": [
      {
        "id": "plan_123",
        "name": "Premium Monthly",
        "description": "Premium access to all products",
        "price": 29.99,
        "billing_cycle": "monthly",
        "features": ["Free shipping", "Early access"],
        "is_popular": true
      },
      {
        "id": "plan_456",
        "name": "Premium Annual",
        "description": "Premium access to all products, billed annually",
        "price": 299.99,
        "billing_cycle": "annual",
        "features": ["Free shipping", "Early access", "10% discount"],
        "is_popular": false
      }
    ]
  }
}
```

### Get Subscription Plan Details

Retrieves detailed information about a specific subscription plan.

**Endpoint:** `GET /subscription-plans/:plan_id`

**Authentication:** Optional

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "plan_123",
    "name": "Premium Monthly",
    "description": "Premium access to all products",
    "price": 29.99,
    "billing_cycle": "monthly",
    "features": ["Free shipping", "Early access"],
    "is_popular": true,
    "available_products": [
      {
        "id": "prod_123",
        "name": "Organic Coffee",
        "description": "Premium organic coffee delivered monthly",
        "image_url": "https://example.com/images/coffee.jpg"
      }
    ]
  }
}
```

## Admin Endpoints

### Get All Subscriptions (Admin)

Retrieves all customer subscriptions with filtering options.

**Endpoint:** `GET /admin/subscriptions`

**Authentication:** Required (Admin)

**Query Parameters:**

- `status` (optional): Filter by subscription status (active, paused, cancelled)
- `plan_id` (optional): Filter by subscription plan
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20): Results per page

**Response:**

```json
{
  "status": "success",
  "data": {
    "subscriptions": [
      {
        "id": "sub_12345",
        "user": {
          "id": "user_123",
          "email": "customer@example.com",
          "name": "John Doe"
        },
        "plan": {
          "id": "plan_123",
          "name": "Premium Monthly"
        },
        "status": "active",
        "start_date": "2023-01-15T00:00:00Z",
        "next_billing_date": "2023-02-15T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 145,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

### Create Subscription Plan (Admin)

Creates a new subscription plan.

**Endpoint:** `POST /admin/subscription-plans`

**Authentication:** Required (Admin)

**Request Body:**

```json
{
  "name": "Premium Quarterly",
  "description": "Premium access to all products, billed quarterly",
  "price": 79.99,
  "billing_cycle": "quarterly",
  "features": ["Free shipping", "Early access", "5% discount"],
  "is_popular": false
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "plan_id": "plan_789",
    "message": "Subscription plan created successfully"
  }
}
```

### Update Subscription Plan (Admin)

Updates an existing subscription plan.

**Endpoint:** `PUT /admin/subscription-plans/:plan_id`

**Authentication:** Required (Admin)

**Request Body:**

```json
{
  "name": "Premium Quarterly Plus",
  "description": "Enhanced quarterly subscription with additional benefits",
  "price": 89.99,
  "features": [
    "Free shipping",
    "Early access",
    "10% discount",
    "Priority support"
  ],
  "is_popular": true
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "plan_id": "plan_789",
    "message": "Subscription plan updated successfully"
  }
}
```

### Delete Subscription Plan (Admin)

Deletes a subscription plan. Existing subscriptions using this plan will not be affected.

**Endpoint:** `DELETE /admin/subscription-plans/:plan_id`

**Authentication:** Required (Admin)

**Response:**

```json
{
  "status": "success",
  "data": {
    "message": "Subscription plan deleted successfully"
  }
}
```
