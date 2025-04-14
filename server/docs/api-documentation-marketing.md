# Marketing & Promotions API Documentation

## Promotion Endpoints

### Get Active Promotions

```
GET /api/v1/promotions
```

Get a list of all currently active promotions.

**Authentication Required:** No

**Query Parameters:**

- `type`: Filter by promotion type (e.g., "percentage", "fixed", "buyXgetY")
- `appliesTo`: Filter by what the promotion applies to (e.g., "product", "category", "cart")
- `code`: Filter by promotion code
- `page`: Page number for pagination (default: 1)
- `limit`: Number of promotions per page (default: 10)

**Response:**

```json
{
  "success": true,
  "message": "Promotions retrieved successfully",
  "data": {
    "promotions": [
      {
        "_id": "60p1q2r3s4t5u6v7w8x9y0z1",
        "name": "Summer Sale",
        "code": "SUMMER20",
        "type": "percentage",
        "value": 20,
        "minOrderValue": 1000,
        "maxDiscount": 2000,
        "appliesTo": "cart",
        "eligibility": "all",
        "startDate": "2023-05-01T00:00:00.000Z",
        "endDate": "2023-06-30T23:59:59.999Z",
        "isActive": true,
        "usageLimit": 1000,
        "usageCount": 324,
        "createdAt": "2023-04-25T10:30:00.000Z",
        "updatedAt": "2023-05-20T08:15:45.123Z"
      },
      {
        "_id": "60p2q3r4s5t6u7v8w9x0y1z2",
        "name": "Electronics Discount",
        "code": "ELECTRO15",
        "type": "percentage",
        "value": 15,
        "minOrderValue": 5000,
        "maxDiscount": null,
        "appliesTo": "category",
        "target": "60c1d2e3f4a5b6c7d8e9f0a1", // Category ID for Electronics
        "eligibility": "all",
        "startDate": "2023-05-15T00:00:00.000Z",
        "endDate": "2023-05-31T23:59:59.999Z",
        "isActive": true,
        "usageLimit": 500,
        "usageCount": 89,
        "createdAt": "2023-05-10T14:20:30.456Z",
        "updatedAt": "2023-05-20T09:45:12.789Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### Get Promotion Details

```
GET /api/v1/promotions/:id
```

Get detailed information about a specific promotion.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Promotion retrieved successfully",
  "data": {
    "promotion": {
      "_id": "60p1q2r3s4t5u6v7w8x9y0z1",
      "name": "Summer Sale",
      "description": "Get 20% off on all orders above ₹1,000",
      "code": "SUMMER20",
      "type": "percentage",
      "value": 20,
      "minOrderValue": 1000,
      "maxDiscount": 2000,
      "appliesTo": "cart",
      "eligibility": "all",
      "conditions": {
        "userGroups": [],
        "excludedProducts": [],
        "excludedCategories": []
      },
      "startDate": "2023-05-01T00:00:00.000Z",
      "endDate": "2023-06-30T23:59:59.999Z",
      "isActive": true,
      "usageLimit": 1000,
      "usageCount": 324,
      "usagePerUser": 1,
      "stackable": false,
      "priority": 1,
      "image": "https://example.com/uploads/promotions/summer-sale.webp",
      "createdAt": "2023-04-25T10:30:00.000Z",
      "updatedAt": "2023-05-20T08:15:45.123Z"
    }
  }
}
```

### Validate Promotion Code

```
POST /api/v1/promotions/validate
```

Validate a promotion code and get discount information.

**Authentication Required:** No

**Request Body:**

```json
{
  "code": "SUMMER20",
  "cartValue": 5000,
  "items": [
    {
      "productId": "60b1f2e3d4c5b6a7c8d9e0f1",
      "variantId": "60b1f2e3d4c5b6a7c8d9e0f2",
      "quantity": 2,
      "price": 2500
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Promotion code is valid",
  "data": {
    "promotion": {
      "_id": "60p1q2r3s4t5u6v7w8x9y0z1",
      "name": "Summer Sale",
      "code": "SUMMER20",
      "type": "percentage",
      "value": 20
    },
    "discount": {
      "amount": 1000,
      "description": "20% off on your order",
      "maxPossible": 2000
    },
    "cartAfterDiscount": 4000
  }
}
```

### Create Promotion (Admin)

```
POST /api/v1/admin/promotions
```

Create a new promotion.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "name": "Flash Sale",
  "description": "24-hour flash sale with 25% off on all products",
  "code": "FLASH25",
  "type": "percentage",
  "value": 25,
  "minOrderValue": 0,
  "maxDiscount": 5000,
  "appliesTo": "cart",
  "eligibility": "all",
  "conditions": {
    "userGroups": [],
    "excludedProducts": [],
    "excludedCategories": ["60c1d2e3f4a5b6c7d8e9f0a4"] // Exclude "Clothing" category
  },
  "startDate": "2023-05-25T00:00:00.000Z",
  "endDate": "2023-05-25T23:59:59.999Z",
  "isActive": true,
  "usageLimit": 500,
  "usagePerUser": 1,
  "stackable": false,
  "priority": 2
}
```

**Response:**

```json
{
  "success": true,
  "message": "Promotion created successfully",
  "data": {
    "promotion": {
      "_id": "60p3q4r5s6t7u8v9w0x1y2z3",
      "name": "Flash Sale",
      "description": "24-hour flash sale with 25% off on all products",
      "code": "FLASH25",
      "type": "percentage",
      "value": 25,
      "minOrderValue": 0,
      "maxDiscount": 5000,
      "appliesTo": "cart",
      "eligibility": "all",
      "conditions": {
        "userGroups": [],
        "excludedProducts": [],
        "excludedCategories": ["60c1d2e3f4a5b6c7d8e9f0a4"]
      },
      "startDate": "2023-05-25T00:00:00.000Z",
      "endDate": "2023-05-25T23:59:59.999Z",
      "isActive": true,
      "usageLimit": 500,
      "usagePerUser": 1,
      "usageCount": 0,
      "stackable": false,
      "priority": 2,
      "createdAt": "2023-05-20T11:30:45.123Z",
      "updatedAt": "2023-05-20T11:30:45.123Z"
    }
  }
}
```

### Update Promotion (Admin)

```
PUT /api/v1/admin/promotions/:id
```

Update an existing promotion.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "maxDiscount": 3000,
  "endDate": "2023-05-26T23:59:59.999Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Promotion updated successfully",
  "data": {
    "promotion": {
      "_id": "60p3q4r5s6t7u8v9w0x1y2z3",
      "name": "Flash Sale",
      "maxDiscount": 3000,
      "endDate": "2023-05-26T23:59:59.999Z",
      "updatedAt": "2023-05-20T12:15:30.456Z"
    }
  }
}
```

### Delete Promotion (Admin)

```
DELETE /api/v1/admin/promotions/:id
```

Delete a promotion.

**Authentication Required:** Yes (Admin role)

**Response:**

```json
{
  "success": true,
  "message": "Promotion deleted successfully"
}
```

### Get Promotions (Admin)

```
GET /api/v1/admin/promotions
```

Get a list of all promotions with advanced filtering.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `search`: Search by name or code
- `status`: Filter by status ("active", "inactive", "scheduled", "expired")
- `type`: Filter by promotion type
- `startDate`: Filter by promotions starting after this date
- `endDate`: Filter by promotions ending before this date
- `page`: Page number for pagination (default: 1)
- `limit`: Number of promotions per page (default: 20)
- `sortBy`: Field to sort by (default: "startDate")

**Response:**

```json
{
  "success": true,
  "message": "Promotions retrieved successfully",
  "data": {
    "promotions": [
      {
        "_id": "60p1q2r3s4t5u6v7w8x9y0z1",
        "name": "Summer Sale",
        "code": "SUMMER20",
        "type": "percentage",
        "value": 20,
        "appliesTo": "cart",
        "startDate": "2023-05-01T00:00:00.000Z",
        "endDate": "2023-06-30T23:59:59.999Z",
        "isActive": true,
        "usageCount": 324,
        "usageLimit": 1000,
        "status": "active", // Calculated field
        "createdAt": "2023-04-25T10:30:00.000Z"
      },
      {
        "_id": "60p3q4r5s6t7u8v9w0x1y2z3",
        "name": "Flash Sale",
        "code": "FLASH25",
        "type": "percentage",
        "value": 25,
        "appliesTo": "cart",
        "startDate": "2023-05-25T00:00:00.000Z",
        "endDate": "2023-05-26T23:59:59.999Z",
        "isActive": true,
        "usageCount": 0,
        "usageLimit": 500,
        "status": "scheduled", // Calculated field
        "createdAt": "2023-05-20T11:30:45.123Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### Get Promotion Usage (Admin)

```
GET /api/v1/admin/promotions/:id/usage
```

Get usage statistics for a specific promotion.

**Authentication Required:** Yes (Admin/Manager role)

**Response:**

```json
{
  "success": true,
  "message": "Promotion usage retrieved successfully",
  "data": {
    "promotion": {
      "_id": "60p1q2r3s4t5u6v7w8x9y0z1",
      "name": "Summer Sale",
      "code": "SUMMER20"
    },
    "usage": {
      "total": 324,
      "limit": 1000,
      "percentage": 32.4,
      "uniqueUsers": 317,
      "totalDiscountAmount": 156789.5,
      "averageDiscountAmount": 483.92,
      "byDate": [
        {
          "date": "2023-05-18",
          "count": 45,
          "discountAmount": 21456.75
        },
        {
          "date": "2023-05-19",
          "count": 52,
          "discountAmount": 24891.3
        },
        {
          "date": "2023-05-20",
          "count": 38,
          "discountAmount": 18234.45
        }
      ]
    }
  }
}
```

## Coupon Endpoints

### Generate Bulk Coupons (Admin)

```
POST /api/v1/admin/promotions/bulk-coupons
```

Generate multiple unique coupon codes for a promotion.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "promotionId": "60p1q2r3s4t5u6v7w8x9y0z1",
  "prefix": "SUMMER",
  "suffix": "",
  "length": 8,
  "count": 100,
  "usagePerCode": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bulk coupons generated successfully",
  "data": {
    "promotion": {
      "_id": "60p1q2r3s4t5u6v7w8x9y0z1",
      "name": "Summer Sale"
    },
    "coupons": {
      "count": 100,
      "sampleCodes": ["SUMMER4A7B9C3D", "SUMMER8E5F2G1H", "SUMMER7J4K2L9M"],
      "downloadUrl": "https://example.com/downloads/coupons/summer-sale-bulk-20230520.csv"
    }
  }
}
```

## Campaign Endpoints

### Get Active Campaigns

```
GET /api/v1/campaigns
```

Get a list of currently active marketing campaigns.

**Authentication Required:** No

**Response:**

```json
{
  "success": true,
  "message": "Active campaigns retrieved successfully",
  "data": {
    "campaigns": [
      {
        "_id": "60r1s2t3u4v5w6x7y8z9a0b1",
        "name": "Summer Collection Launch",
        "description": "Introducing our latest summer collection with exclusive offers",
        "type": "promotion",
        "startDate": "2023-05-15T00:00:00.000Z",
        "endDate": "2023-06-15T23:59:59.999Z",
        "banner": {
          "desktop": "https://example.com/uploads/campaigns/summer-launch-desktop.webp",
          "mobile": "https://example.com/uploads/campaigns/summer-launch-mobile.webp"
        },
        "landingPage": "/summer-collection",
        "promotions": ["60p1q2r3s4t5u6v7w8x9y0z1"],
        "isActive": true
      },
      {
        "_id": "60r2s3t4u5v6w7x8y9z0a1b2",
        "name": "Membership Rewards",
        "description": "Exclusive offers for loyalty program members",
        "type": "loyalty",
        "startDate": "2023-05-01T00:00:00.000Z",
        "endDate": "2023-07-31T23:59:59.999Z",
        "banner": {
          "desktop": "https://example.com/uploads/campaigns/membership-desktop.webp",
          "mobile": "https://example.com/uploads/campaigns/membership-mobile.webp"
        },
        "landingPage": "/membership-rewards",
        "eligibility": "loyal",
        "isActive": true
      }
    ]
  }
}
```

### Create Campaign (Admin)

```
POST /api/v1/admin/campaigns
```

Create a new marketing campaign.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "name": "Monsoon Sale",
  "description": "Get ready for the monsoon with special discounts",
  "type": "promotion",
  "startDate": "2023-06-01T00:00:00.000Z",
  "endDate": "2023-07-15T23:59:59.999Z",
  "banner": {
    "desktop": "https://example.com/uploads/campaigns/monsoon-desktop.webp",
    "mobile": "https://example.com/uploads/campaigns/monsoon-mobile.webp"
  },
  "landingPage": "/monsoon-sale",
  "promotions": ["60p3q4r5s6t7u8v9w0x1y2z3"],
  "isActive": true,
  "targetedSegments": ["new-customers", "inactive-30days"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Campaign created successfully",
  "data": {
    "campaign": {
      "_id": "60r3s4t5u6v7w8x9y0z1a2b3",
      "name": "Monsoon Sale",
      "description": "Get ready for the monsoon with special discounts",
      "type": "promotion",
      "startDate": "2023-06-01T00:00:00.000Z",
      "endDate": "2023-07-15T23:59:59.999Z",
      "banner": {
        "desktop": "https://example.com/uploads/campaigns/monsoon-desktop.webp",
        "mobile": "https://example.com/uploads/campaigns/monsoon-mobile.webp"
      },
      "landingPage": "/monsoon-sale",
      "promotions": ["60p3q4r5s6t7u8v9w0x1y2z3"],
      "isActive": true,
      "targetedSegments": ["new-customers", "inactive-30days"],
      "createdAt": "2023-05-20T14:30:45.123Z",
      "updatedAt": "2023-05-20T14:30:45.123Z"
    }
  }
}
```

### Update Campaign (Admin)

```
PUT /api/v1/admin/campaigns/:id
```

Update an existing marketing campaign.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "banner": {
    "desktop": "https://example.com/uploads/campaigns/monsoon-new-desktop.webp",
    "mobile": "https://example.com/uploads/campaigns/monsoon-new-mobile.webp"
  },
  "endDate": "2023-07-31T23:59:59.999Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Campaign updated successfully",
  "data": {
    "campaign": {
      "_id": "60r3s4t5u6v7w8x9y0z1a2b3",
      "name": "Monsoon Sale",
      "banner": {
        "desktop": "https://example.com/uploads/campaigns/monsoon-new-desktop.webp",
        "mobile": "https://example.com/uploads/campaigns/monsoon-new-mobile.webp"
      },
      "endDate": "2023-07-31T23:59:59.999Z",
      "updatedAt": "2023-05-20T15:15:30.456Z"
    }
  }
}
```

### Delete Campaign (Admin)

```
DELETE /api/v1/admin/campaigns/:id
```

Delete a marketing campaign.

**Authentication Required:** Yes (Admin role)

**Response:**

```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

## Abandoned Cart Recovery Endpoints

### Create Recovery Campaign (Admin)

```
POST /api/v1/admin/abandoned-carts/campaigns
```

Create a new abandoned cart recovery campaign.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "name": "24-Hour Recovery",
  "description": "Recovery campaign for carts abandoned within 24 hours",
  "triggerDelay": 24, // Hours after cart abandonment
  "emailTemplate": "abandoned-cart-24h",
  "promotion": "60p3q4r5s6t7u8v9w0x1y2z3", // Optional promotion to include
  "minimumCartValue": 1000,
  "isActive": true,
  "sendReminder": true,
  "reminderDelay": 48 // Hours after first email
}
```

**Response:**

```json
{
  "success": true,
  "message": "Abandoned cart recovery campaign created successfully",
  "data": {
    "campaign": {
      "_id": "60t1u2v3w4x5y6z7a8b9c0d1",
      "name": "24-Hour Recovery",
      "description": "Recovery campaign for carts abandoned within 24 hours",
      "triggerDelay": 24,
      "emailTemplate": "abandoned-cart-24h",
      "promotion": "60p3q4r5s6t7u8v9w0x1y2z3",
      "minimumCartValue": 1000,
      "isActive": true,
      "sendReminder": true,
      "reminderDelay": 48,
      "createdAt": "2023-05-20T16:30:00.123Z",
      "updatedAt": "2023-05-20T16:30:00.123Z"
    }
  }
}
```

### Get Abandoned Cart Statistics (Admin)

```
GET /api/v1/admin/abandoned-carts/stats
```

Get statistics about abandoned carts and recovery efforts.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `startDate`: Start date for statistics (ISO format)
- `endDate`: End date for statistics (ISO format)

**Response:**

```json
{
  "success": true,
  "message": "Abandoned cart statistics retrieved successfully",
  "data": {
    "stats": {
      "abandonedCarts": {
        "total": 547,
        "value": 3249870.5,
        "averageValue": 5941.26
      },
      "recoveredCarts": {
        "total": 89,
        "value": 528945.75,
        "recoveryRate": 16.27
      },
      "campaignPerformance": [
        {
          "campaign": {
            "_id": "60t1u2v3w4x5y6z7a8b9c0d1",
            "name": "24-Hour Recovery"
          },
          "emailsSent": 412,
          "emailsOpened": 287,
          "clicksToRecoveryPage": 132,
          "cartsRecovered": 64,
          "conversionRate": 15.53,
          "revenue": 380675.25
        },
        {
          "campaign": {
            "_id": "60t2u3v4w5x6y7z8a9b0c1d2",
            "name": "48-Hour Recovery"
          },
          "emailsSent": 135,
          "emailsOpened": 82,
          "clicksToRecoveryPage": 43,
          "cartsRecovered": 25,
          "conversionRate": 18.52,
          "revenue": 148270.5
        }
      ]
    }
  }
}
```

### Get Abandoned Carts (Admin)

```
GET /api/v1/admin/abandoned-carts
```

Get a list of abandoned carts with details.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `status`: Filter by status ("abandoned", "recovered", "expired")
- `minValue`: Minimum cart value
- `maxValue`: Maximum cart value
- `startDate`: Filter by abandoned date after (ISO format)
- `endDate`: Filter by abandoned date before (ISO format)
- `page`: Page number for pagination (default: 1)
- `limit`: Number of carts per page (default: 20)
- `sortBy`: Field to sort by (default: "-abandonedAt")

**Response:**

```json
{
  "success": true,
  "message": "Abandoned carts retrieved successfully",
  "data": {
    "carts": [
      {
        "_id": "60u1v2w3x4y5z6a7b8c9d0e1",
        "user": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7a",
          "email": "john@example.com",
          "profile": {
            "firstName": "John",
            "lastName": "Doe"
          }
        },
        "cartValue": 12499,
        "items": [
          {
            "product": {
              "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
              "name": "Smartphone X"
            },
            "variant": {
              "_id": "60b1f2e3d4c5b6a7c8d9e0f2",
              "name": "Black 128GB"
            },
            "quantity": 1,
            "price": 12499
          }
        ],
        "abandonedAt": "2023-05-19T18:45:30.123Z",
        "status": "abandoned",
        "recoveryAttempts": [
          {
            "campaign": "60t1u2v3w4x5y6z7a8b9c0d1",
            "emailSent": "2023-05-20T18:45:45.789Z",
            "emailOpened": "2023-05-20T19:12:30.456Z",
            "clickedRecoveryLink": null
          }
        ],
        "expiresAt": "2023-05-26T18:45:30.123Z"
      }
    ],
    "pagination": {
      "total": 138,
      "page": 1,
      "limit": 20,
      "pages": 7
    }
  }
}
```
