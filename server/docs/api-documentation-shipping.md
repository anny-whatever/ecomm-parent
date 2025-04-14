# Shipping & Logistics API

## Base URL

```
https://api.example.com/api/v1
```

## Authentication

All shipping endpoints require a valid JWT token obtained through the authentication process. Include the token in the request header:

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

### Get Available Shipping Methods

Retrieves available shipping methods based on destination and cart contents.

**Endpoint:** `GET /shipping/methods`

**Authentication:** Required (Customer)

**Query Parameters:**

- `country` (required): Destination country code
- `postal_code` (required): Destination postal/zip code
- `cart_id` (required): Current cart ID

**Response:**

```json
{
  "status": "success",
  "data": {
    "shipping_methods": [
      {
        "id": "ship_standard",
        "name": "Standard Shipping",
        "description": "Delivery within 5-7 business days",
        "price": 5.99,
        "estimated_delivery": {
          "min_days": 5,
          "max_days": 7
        },
        "available": true
      },
      {
        "id": "ship_express",
        "name": "Express Shipping",
        "description": "Delivery within 2-3 business days",
        "price": 12.99,
        "estimated_delivery": {
          "min_days": 2,
          "max_days": 3
        },
        "available": true
      },
      {
        "id": "ship_overnight",
        "name": "Overnight Shipping",
        "description": "Next business day delivery",
        "price": 24.99,
        "estimated_delivery": {
          "min_days": 1,
          "max_days": 1
        },
        "available": false,
        "unavailable_reason": "Some items in cart not eligible for overnight shipping"
      }
    ]
  }
}
```

### Calculate Shipping Cost

Calculates shipping cost for specific shipping method, destination, and items.

**Endpoint:** `POST /shipping/calculate`

**Authentication:** Required (Customer)

**Request Body:**

```json
{
  "shipping_method_id": "ship_express",
  "items": [
    {
      "product_id": "prod_123",
      "quantity": 2
    },
    {
      "product_id": "prod_456",
      "quantity": 1
    }
  ],
  "destination": {
    "country": "US",
    "state": "CA",
    "city": "San Francisco",
    "postal_code": "94105",
    "address_line1": "123 Main St",
    "address_line2": "Apt 4B"
  }
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "shipping_cost": 12.99,
    "estimated_delivery": {
      "min_date": "2023-01-22T00:00:00Z",
      "max_date": "2023-01-23T00:00:00Z"
    },
    "tax": 1.07,
    "total": 14.06
  }
}
```

### Track Shipment

Retrieves tracking information for a specific shipment.

**Endpoint:** `GET /shipping/track/:tracking_number`

**Authentication:** Required (Customer)

**Response:**

```json
{
  "status": "success",
  "data": {
    "tracking_number": "1Z999AA10123456784",
    "carrier": "UPS",
    "carrier_url": "https://www.ups.com/track?tracknum=1Z999AA10123456784",
    "status": "in_transit",
    "estimated_delivery": "2023-01-22T00:00:00Z",
    "shipping_address": {
      "name": "John Doe",
      "country": "US",
      "state": "CA",
      "city": "San Francisco",
      "postal_code": "94105",
      "address_line1": "123 Main St",
      "address_line2": "Apt 4B"
    },
    "events": [
      {
        "timestamp": "2023-01-19T14:30:00Z",
        "location": "San Francisco, CA",
        "description": "Out for delivery"
      },
      {
        "timestamp": "2023-01-19T08:15:00Z",
        "location": "San Francisco, CA",
        "description": "Arrived at local facility"
      },
      {
        "timestamp": "2023-01-18T22:40:00Z",
        "location": "Oakland, CA",
        "description": "Departed regional facility"
      },
      {
        "timestamp": "2023-01-17T10:25:00Z",
        "location": "Chicago, IL",
        "description": "In transit"
      },
      {
        "timestamp": "2023-01-16T16:45:00Z",
        "location": "New York, NY",
        "description": "Shipment picked up"
      }
    ]
  }
}
```

### Get User Shipping Addresses

Retrieves all shipping addresses for the authenticated user.

**Endpoint:** `GET /user/shipping-addresses`

**Authentication:** Required (Customer)

**Response:**

```json
{
  "status": "success",
  "data": {
    "addresses": [
      {
        "id": "addr_123",
        "name": "John Doe",
        "phone": "+14155552671",
        "country": "US",
        "state": "CA",
        "city": "San Francisco",
        "postal_code": "94105",
        "address_line1": "123 Main St",
        "address_line2": "Apt 4B",
        "is_default": true,
        "created_at": "2022-12-10T15:30:00Z",
        "updated_at": "2022-12-10T15:30:00Z"
      },
      {
        "id": "addr_456",
        "name": "John Doe",
        "phone": "+14155552672",
        "country": "US",
        "state": "NY",
        "city": "New York",
        "postal_code": "10001",
        "address_line1": "456 Broadway",
        "address_line2": "",
        "is_default": false,
        "created_at": "2023-01-05T09:45:00Z",
        "updated_at": "2023-01-05T09:45:00Z"
      }
    ]
  }
}
```

### Add Shipping Address

Adds a new shipping address for the authenticated user.

**Endpoint:** `POST /user/shipping-addresses`

**Authentication:** Required (Customer)

**Request Body:**

```json
{
  "name": "John Doe",
  "phone": "+14155552673",
  "country": "US",
  "state": "WA",
  "city": "Seattle",
  "postal_code": "98101",
  "address_line1": "789 Pike St",
  "address_line2": "Suite 500",
  "is_default": false
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "address_id": "addr_789",
    "message": "Shipping address added successfully"
  }
}
```

### Update Shipping Address

Updates an existing shipping address.

**Endpoint:** `PUT /user/shipping-addresses/:address_id`

**Authentication:** Required (Customer)

**Request Body:**

```json
{
  "name": "John Doe",
  "phone": "+14155552673",
  "address_line2": "Suite 501",
  "is_default": true
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "address_id": "addr_789",
    "message": "Shipping address updated successfully"
  }
}
```

### Delete Shipping Address

Deletes a shipping address.

**Endpoint:** `DELETE /user/shipping-addresses/:address_id`

**Authentication:** Required (Customer)

**Response:**

```json
{
  "status": "success",
  "data": {
    "message": "Shipping address deleted successfully"
  }
}
```

### Get Order Shipments

Retrieves shipment information for a specific order.

**Endpoint:** `GET /orders/:order_id/shipments`

**Authentication:** Required (Customer)

**Response:**

```json
{
  "status": "success",
  "data": {
    "order_id": "order_123",
    "shipments": [
      {
        "id": "ship_123",
        "tracking_number": "1Z999AA10123456784",
        "carrier": "UPS",
        "carrier_url": "https://www.ups.com/track?tracknum=1Z999AA10123456784",
        "status": "delivered",
        "shipping_method": "Express Shipping",
        "shipped_date": "2023-01-16T16:45:00Z",
        "estimated_delivery": "2023-01-19T00:00:00Z",
        "delivered_date": "2023-01-19T15:20:00Z",
        "items": [
          {
            "product_id": "prod_123",
            "product_name": "Premium Headphones",
            "quantity": 1
          }
        ]
      },
      {
        "id": "ship_456",
        "tracking_number": "1Z999AA10123456785",
        "carrier": "UPS",
        "carrier_url": "https://www.ups.com/track?tracknum=1Z999AA10123456785",
        "status": "in_transit",
        "shipping_method": "Express Shipping",
        "shipped_date": "2023-01-17T10:30:00Z",
        "estimated_delivery": "2023-01-20T00:00:00Z",
        "items": [
          {
            "product_id": "prod_456",
            "product_name": "Wireless Charger",
            "quantity": 2
          }
        ]
      }
    ]
  }
}
```

## Admin Endpoints

### Create Shipment (Admin)

Creates a new shipment for an order.

**Endpoint:** `POST /admin/orders/:order_id/shipments`

**Authentication:** Required (Admin)

**Request Body:**

```json
{
  "shipping_method_id": "ship_express",
  "carrier": "UPS",
  "tracking_number": "1Z999AA10123456786",
  "items": [
    {
      "order_item_id": "item_123",
      "quantity": 1
    },
    {
      "order_item_id": "item_456",
      "quantity": 2
    }
  ]
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "shipment_id": "ship_789",
    "order_id": "order_123",
    "tracking_number": "1Z999AA10123456786",
    "message": "Shipment created successfully"
  }
}
```

### Update Shipment (Admin)

Updates an existing shipment.

**Endpoint:** `PUT /admin/shipments/:shipment_id`

**Authentication:** Required (Admin)

**Request Body:**

```json
{
  "carrier": "FedEx",
  "tracking_number": "794583791234",
  "status": "shipped"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "shipment_id": "ship_789",
    "message": "Shipment updated successfully"
  }
}
```

### Get All Shipping Methods (Admin)

Retrieves all configured shipping methods.

**Endpoint:** `GET /admin/shipping/methods`

**Authentication:** Required (Admin)

**Response:**

```json
{
  "status": "success",
  "data": {
    "shipping_methods": [
      {
        "id": "ship_standard",
        "name": "Standard Shipping",
        "description": "Delivery within 5-7 business days",
        "base_price": 5.99,
        "conditions": [
          {
            "type": "weight_threshold",
            "threshold": 5,
            "additional_cost": 2.5
          },
          {
            "type": "distance_threshold",
            "threshold": 1000,
            "additional_cost": 3.0
          }
        ],
        "excluded_regions": ["AK", "HI"],
        "active": true
      },
      {
        "id": "ship_express",
        "name": "Express Shipping",
        "description": "Delivery within 2-3 business days",
        "base_price": 12.99,
        "conditions": [
          {
            "type": "weight_threshold",
            "threshold": 3,
            "additional_cost": 5.0
          }
        ],
        "excluded_regions": ["AK", "HI", "PR"],
        "active": true
      }
    ]
  }
}
```

### Create Shipping Method (Admin)

Creates a new shipping method.

**Endpoint:** `POST /admin/shipping/methods`

**Authentication:** Required (Admin)

**Request Body:**

```json
{
  "name": "International Economy",
  "description": "International shipping with delivery in 7-14 business days",
  "base_price": 15.99,
  "conditions": [
    {
      "type": "weight_threshold",
      "threshold": 2,
      "additional_cost": 8.0
    },
    {
      "type": "country_group",
      "group": "europe",
      "additional_cost": 5.0
    },
    {
      "type": "country_group",
      "group": "asia",
      "additional_cost": 10.0
    }
  ],
  "excluded_countries": ["RU", "IR", "CU"],
  "active": true
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "shipping_method_id": "ship_intl_economy",
    "message": "Shipping method created successfully"
  }
}
```

### Update Shipping Method (Admin)

Updates an existing shipping method.

**Endpoint:** `PUT /admin/shipping/methods/:method_id`

**Authentication:** Required (Admin)

**Request Body:**

```json
{
  "name": "International Economy Plus",
  "description": "Enhanced international shipping with delivery in 5-10 business days",
  "base_price": 18.99,
  "active": true
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "shipping_method_id": "ship_intl_economy",
    "message": "Shipping method updated successfully"
  }
}
```

### Delete Shipping Method (Admin)

Deletes a shipping method.

**Endpoint:** `DELETE /admin/shipping/methods/:method_id`

**Authentication:** Required (Admin)

**Response:**

```json
{
  "status": "success",
  "data": {
    "message": "Shipping method deleted successfully"
  }
}
```

### Generate Shipping Labels (Admin)

Generates shipping labels for specified shipments.

**Endpoint:** `POST /admin/shipping/labels`

**Authentication:** Required (Admin)

**Request Body:**

```json
{
  "shipment_ids": ["ship_123", "ship_456"]
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "labels": [
      {
        "shipment_id": "ship_123",
        "label_url": "https://example.com/labels/ship_123.pdf",
        "tracking_number": "1Z999AA10123456784"
      },
      {
        "shipment_id": "ship_456",
        "label_url": "https://example.com/labels/ship_456.pdf",
        "tracking_number": "1Z999AA10123456785"
      }
    ]
  }
}
```

### Get Shipping Rates (Admin)

Retrieves current shipping rates from integrated carriers.

**Endpoint:** `GET /admin/shipping/rates`

**Authentication:** Required (Admin)

**Query Parameters:**

- `carrier` (optional): Filter by carrier (ups, fedex, dhl, usps)
- `origin_country` (optional): Origin country code
- `destination_country` (optional): Destination country code

**Response:**

```json
{
  "status": "success",
  "data": {
    "rates": [
      {
        "carrier": "UPS",
        "service": "Ground",
        "rate": 5.99,
        "currency": "USD",
        "transit_days": {
          "min": 3,
          "max": 5
        }
      },
      {
        "carrier": "UPS",
        "service": "3-Day Select",
        "rate": 12.99,
        "currency": "USD",
        "transit_days": {
          "min": 3,
          "max": 3
        }
      },
      {
        "carrier": "FedEx",
        "service": "Ground",
        "rate": 6.5,
        "currency": "USD",
        "transit_days": {
          "min": 2,
          "max": 5
        }
      }
    ],
    "last_updated": "2023-01-15T00:00:00Z"
  }
}
```
