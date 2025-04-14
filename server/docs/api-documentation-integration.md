# Integration APIs Documentation

This document provides information about the available integration APIs that allow third-party systems to connect with the e-commerce platform. These APIs enable data exchange, webhook notifications, and seamless integration with external services.

## Base URL

All URLs referenced in this documentation have the following base:

```
/api/v1
```

## Authentication for Integrations

Third-party integrations must authenticate using API keys or OAuth tokens.

### API Key Authentication

For simple integrations, include the API key in the request header:

```
X-API-Key: your_api_key_here
```

### OAuth Authentication

For more secure integrations, use OAuth 2.0:

1. Obtain an access token from the OAuth endpoint
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer your_access_token
   ```

## Shipping Integration APIs

### Connect Shipping Carrier

```
POST /api/v1/admin/shipping/carriers
```

Establishes a connection with a shipping carrier API.

**Authentication Required:** Yes (Admin role)

**Request Body:**

```json
{
  "name": "DHL Express",
  "code": "dhl",
  "type": "dhl",
  "description": "DHL Express shipping integration",
  "logo": "https://example.com/uploads/carriers/dhl.png",
  "credentials": {
    "apiKey": "your_dhl_api_key",
    "apiSecret": "your_dhl_api_secret",
    "accountNumber": "your_dhl_account_number",
    "sandbox": true
  },
  "settings": {
    "defaultPackaging": "PACKAGE",
    "defaultServiceType": "EXPRESS",
    "requiresManifest": true,
    "allowsInternational": true,
    "supportsCashOnDelivery": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Shipping carrier connected successfully",
  "data": {
    "carrier": {
      "_id": "60e1d2f3a4b5c6d7e8f9a0b1",
      "name": "DHL Express",
      "code": "dhl",
      "type": "dhl",
      "description": "DHL Express shipping integration",
      "logo": "https://example.com/uploads/carriers/dhl.png",
      "isActive": true,
      "settings": {
        "defaultPackaging": "PACKAGE",
        "defaultServiceType": "EXPRESS",
        "requiresManifest": true,
        "allowsInternational": true,
        "supportsCashOnDelivery": false
      },
      "createdAt": "2023-08-15T10:30:45.123Z",
      "updatedAt": "2023-08-15T10:30:45.123Z"
    }
  }
}
```

### List Connected Shipping Carriers

```
GET /api/v1/admin/shipping/carriers
```

Retrieves a list of all connected shipping carriers.

**Authentication Required:** Yes (Admin role)

**Response:**

```json
{
  "success": true,
  "message": "Shipping carriers retrieved successfully",
  "data": {
    "carriers": [
      {
        "_id": "60e1d2f3a4b5c6d7e8f9a0b1",
        "name": "DHL Express",
        "code": "dhl",
        "type": "dhl",
        "description": "DHL Express shipping integration",
        "logo": "https://example.com/uploads/carriers/dhl.png",
        "isActive": true
      },
      {
        "_id": "60e2d3f4a5b6c7d8e9f0a1b2",
        "name": "Shiprocket",
        "code": "shiprocket",
        "type": "shiprocket",
        "description": "Shiprocket integration for domestic shipping",
        "logo": "https://example.com/uploads/carriers/shiprocket.png",
        "isActive": true
      }
    ]
  }
}
```

## Payment Gateway Integration APIs

### Connect Payment Gateway

```
POST /api/v1/admin/payments/gateways
```

Establishes a connection with a payment gateway.

**Authentication Required:** Yes (Admin role)

**Request Body:**

```json
{
  "name": "Razorpay",
  "code": "razorpay",
  "description": "Razorpay payment integration",
  "logo": "https://example.com/uploads/payment/razorpay.png",
  "credentials": {
    "apiKey": "your_razorpay_key_id",
    "apiSecret": "your_razorpay_key_secret",
    "sandbox": true
  },
  "settings": {
    "supportedCurrencies": ["INR", "USD"],
    "supportsSavedCards": true,
    "supportsSubscriptions": true,
    "supportsRefunds": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment gateway connected successfully",
  "data": {
    "gateway": {
      "_id": "60f1e2d3c4b5a6b7c8d9e0f1",
      "name": "Razorpay",
      "code": "razorpay",
      "description": "Razorpay payment integration",
      "logo": "https://example.com/uploads/payment/razorpay.png",
      "isActive": true,
      "settings": {
        "supportedCurrencies": ["INR", "USD"],
        "supportsSavedCards": true,
        "supportsSubscriptions": true,
        "supportsRefunds": true
      },
      "createdAt": "2023-08-15T12:30:45.123Z",
      "updatedAt": "2023-08-15T12:30:45.123Z"
    }
  }
}
```

## Social Media Integration APIs

### Connect Social Media Account

```
POST /api/v1/admin/integrations/social
```

Connects a social media account for login, sharing, or content publishing.

**Authentication Required:** Yes (Admin role)

**Request Body:**

```json
{
  "platform": "facebook",
  "name": "Company Facebook Page",
  "credentials": {
    "appId": "your_facebook_app_id",
    "appSecret": "your_facebook_app_secret",
    "pageId": "your_facebook_page_id",
    "accessToken": "your_facebook_access_token"
  },
  "settings": {
    "enableLogin": true,
    "enableSharing": true,
    "enableContentPublishing": true,
    "enableProductCatalog": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Social media account connected successfully",
  "data": {
    "connection": {
      "_id": "60g1f2e3d4c5b6a7c8d9e0f1",
      "platform": "facebook",
      "name": "Company Facebook Page",
      "isActive": true,
      "settings": {
        "enableLogin": true,
        "enableSharing": true,
        "enableContentPublishing": true,
        "enableProductCatalog": true
      },
      "createdAt": "2023-08-15T14:30:45.123Z",
      "updatedAt": "2023-08-15T14:30:45.123Z"
    }
  }
}
```

## Webhook Integration APIs

### Create Webhook

```
POST /api/v1/admin/webhooks
```

Creates a webhook endpoint to receive notifications for specific events.

**Authentication Required:** Yes (Admin role)

**Request Body:**

```json
{
  "name": "Order Updates",
  "url": "https://example.com/api/ecommerce-webhooks/orders",
  "events": [
    "order.created",
    "order.updated",
    "order.shipped",
    "order.delivered"
  ],
  "isActive": true,
  "secret": "your_webhook_secret_key",
  "format": "json",
  "headers": {
    "X-Custom-Header": "custom-value"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook created successfully",
  "data": {
    "webhook": {
      "_id": "60h1g2f3e4d5c6b7a8b9c0d1",
      "name": "Order Updates",
      "url": "https://example.com/api/ecommerce-webhooks/orders",
      "events": [
        "order.created",
        "order.updated",
        "order.shipped",
        "order.delivered"
      ],
      "isActive": true,
      "format": "json",
      "createdAt": "2023-08-15T16:30:45.123Z",
      "updatedAt": "2023-08-15T16:30:45.123Z"
    }
  }
}
```

### List Webhooks

```
GET /api/v1/admin/webhooks
```

Retrieves a list of all configured webhooks.

**Authentication Required:** Yes (Admin role)

**Response:**

```json
{
  "success": true,
  "message": "Webhooks retrieved successfully",
  "data": {
    "webhooks": [
      {
        "_id": "60h1g2f3e4d5c6b7a8b9c0d1",
        "name": "Order Updates",
        "url": "https://example.com/api/ecommerce-webhooks/orders",
        "events": [
          "order.created",
          "order.updated",
          "order.shipped",
          "order.delivered"
        ],
        "isActive": true,
        "format": "json",
        "createdAt": "2023-08-15T16:30:45.123Z",
        "updatedAt": "2023-08-15T16:30:45.123Z"
      },
      {
        "_id": "60h2g3f4e5d6c7b8a9b0c1d2",
        "name": "Inventory Updates",
        "url": "https://example.com/api/ecommerce-webhooks/inventory",
        "events": ["product.created", "product.updated", "inventory.updated"],
        "isActive": true,
        "format": "json",
        "createdAt": "2023-08-15T17:15:30.456Z",
        "updatedAt": "2023-08-15T17:15:30.456Z"
      }
    ]
  }
}
```

## Data Import/Export APIs

### Export Products

```
GET /api/v1/admin/export/products
```

Exports product data in CSV, JSON, or XML format.

**Authentication Required:** Yes (Admin role)

**Query Parameters:**

- `format`: Export format (csv, json, xml)
- `fields`: Comma-separated list of fields to include
- `filter`: JSON object with filtering criteria
- `includeVariants`: Include product variants (true/false)

**Response:**

For JSON format:

```json
{
  "success": true,
  "message": "Products exported successfully",
  "data": {
    "products": [
      {
        "id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "sku": "SP-X-001",
        "price": 49999,
        "salePrice": 44999,
        "categories": ["Electronics", "Smartphones"],
        "inventory": 50
      },
      {
        "id": "60d3f4e5d6c7b8a9e0f1a2b3",
        "name": "Wireless Earbuds",
        "sku": "WE-001",
        "price": 9999,
        "salePrice": 7999,
        "categories": ["Electronics", "Audio"],
        "inventory": 200
      }
    ]
  }
}
```

### Import Products

```
POST /api/v1/admin/import/products
```

Imports product data from a file.

**Authentication Required:** Yes (Admin role)

**Request Body:**
Multipart form data with:

- `file`: CSV, JSON, or XML file containing product data
- `options`: JSON string with import options
  ```json
  {
    "updateExisting": true,
    "createMissing": true,
    "identifierField": "sku",
    "skipValidation": false
  }
  ```

**Response:**

```json
{
  "success": true,
  "message": "Products imported successfully",
  "data": {
    "summary": {
      "total": 100,
      "created": 50,
      "updated": 45,
      "skipped": 5,
      "errors": 0
    },
    "importId": "import_12345",
    "completedAt": "2023-08-15T18:45:30.123Z"
  }
}
```

## ERP Integration APIs

### Sync Orders with ERP

```
POST /api/v1/admin/integrations/erp/sync-orders
```

Synchronizes order data with an external ERP system.

**Authentication Required:** Yes (Admin role)

**Request Body:**

```json
{
  "erpSystem": "sap",
  "direction": "push",
  "orders": ["order_123", "order_456"],
  "options": {
    "includeCustomerInfo": true,
    "includeShippingDetails": true,
    "includePaymentInfo": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Orders synchronized with ERP successfully",
  "data": {
    "summary": {
      "total": 2,
      "synced": 2,
      "failed": 0
    },
    "details": [
      {
        "orderId": "order_123",
        "erpReference": "SAP-ORD-123456",
        "status": "synced"
      },
      {
        "orderId": "order_456",
        "erpReference": "SAP-ORD-123457",
        "status": "synced"
      }
    ]
  }
}
```

## Webhook Event Reference

The following events can be subscribed to via webhooks:

### Order Events

- `order.created`: Triggered when a new order is placed
- `order.updated`: Triggered when an order is updated
- `order.paid`: Triggered when payment is received for an order
- `order.shipped`: Triggered when an order is shipped
- `order.delivered`: Triggered when an order is delivered
- `order.cancelled`: Triggered when an order is cancelled
- `order.refunded`: Triggered when an order is refunded

### Product Events

- `product.created`: Triggered when a new product is created
- `product.updated`: Triggered when a product is updated
- `product.deleted`: Triggered when a product is deleted
- `inventory.updated`: Triggered when product inventory changes

### Customer Events

- `customer.created`: Triggered when a new customer registers
- `customer.updated`: Triggered when customer information is updated
- `customer.deleted`: Triggered when a customer is deleted

### Review Events

- `review.created`: Triggered when a new review is submitted
- `review.approved`: Triggered when a review is approved
- `review.rejected`: Triggered when a review is rejected
