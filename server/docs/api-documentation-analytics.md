# Analytics & Reporting API Documentation

## Dashboard Analytics Endpoints

### Get Dashboard Overview

```
GET /api/v1/admin/analytics/dashboard
```

Get comprehensive analytics data for the admin dashboard.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `period`: Time period for statistics (e.g., "today", "week", "month", "year", "custom")
- `startDate`: Start date for custom period (ISO format, required if period is "custom")
- `endDate`: End date for custom period (ISO format, required if period is "custom")

**Response:**

```json
{
  "success": true,
  "message": "Dashboard analytics retrieved successfully",
  "data": {
    "overview": {
      "revenue": {
        "total": 456789.5,
        "change": 12.5,
        "changeType": "increase",
        "previousTotal": 405990.67
      },
      "orders": {
        "total": 587,
        "change": 8.3,
        "changeType": "increase",
        "previousTotal": 542
      },
      "customers": {
        "total": 342,
        "new": 78,
        "change": 5.2,
        "changeType": "increase",
        "previousTotal": 325
      },
      "averageOrderValue": {
        "amount": 778.18,
        "change": 3.9,
        "changeType": "increase",
        "previousAmount": 748.88
      },
      "conversionRate": {
        "rate": 3.2,
        "change": 0.4,
        "changeType": "increase",
        "previousRate": 2.8
      }
    },
    "salesChart": {
      "labels": [
        "May 14",
        "May 15",
        "May 16",
        "May 17",
        "May 18",
        "May 19",
        "May 20"
      ],
      "datasets": [
        {
          "label": "Revenue",
          "data": [
            45678.9, 52345.67, 48912.34, 51234.56, 58765.43, 55432.1, 47890.12
          ]
        },
        {
          "label": "Orders",
          "data": [58, 65, 72, 68, 82, 75, 60]
        }
      ]
    },
    "topProducts": [
      {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "orders": 45,
        "revenue": 56999.55,
        "image": "https://example.com/uploads/products/smartphone-x-12345.webp"
      },
      {
        "_id": "60c2f3e4d5c6b7a8d9e0f1a2",
        "name": "Smartphone Y",
        "orders": 32,
        "revenue": 42999.68,
        "image": "https://example.com/uploads/products/smartphone-y-12345.webp"
      }
    ],
    "topCategories": [
      {
        "_id": "60c1d2e3f4a5b6c7d8e9f0a1",
        "name": "Electronics",
        "orders": 183,
        "revenue": 215789.45
      },
      {
        "_id": "60c1d2e3f4a5b6c7d8e9f0a4",
        "name": "Clothing",
        "orders": 145,
        "revenue": 98765.32
      }
    ],
    "recentOrders": [
      {
        "_id": "60f5a6b7c8d9e0f1a2b3c4d5",
        "orderNumber": "ORD12345",
        "customer": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "total": 53197.82,
        "status": "processing",
        "createdAt": "2023-05-20T19:45:30.123Z"
      }
    ],
    "lowStockProducts": [
      {
        "_id": "60d3f4e5d6c7b8a9e0f1a2b3",
        "name": "Laptop Pro",
        "sku": "LP-001",
        "available": 3,
        "threshold": 5
      }
    ]
  }
}
```

### Get Sales Analytics

```
GET /api/v1/admin/analytics/sales
```

Get detailed sales analytics with various breakdowns.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `period`: Time period for statistics (e.g., "week", "month", "quarter", "year", "custom")
- `startDate`: Start date for custom period (ISO format)
- `endDate`: End date for custom period (ISO format)
- `groupBy`: How to group the data (e.g., "day", "week", "month")
- `comparison`: Include comparison data (boolean, default: false)

**Response:**

```json
{
  "success": true,
  "message": "Sales analytics retrieved successfully",
  "data": {
    "summary": {
      "totalSales": 456789.5,
      "totalOrders": 587,
      "averageOrderValue": 778.18,
      "comparisonPeriod": {
        "totalSales": 405990.67,
        "totalOrders": 542,
        "averageOrderValue": 748.88
      },
      "changes": {
        "sales": {
          "amount": 50798.83,
          "percentage": 12.5
        },
        "orders": {
          "count": 45,
          "percentage": 8.3
        },
        "averageOrderValue": {
          "amount": 29.3,
          "percentage": 3.9
        }
      }
    },
    "salesByStatus": {
      "completed": 387500.25,
      "processing": 58765.43,
      "pending": 10523.82
    },
    "salesByPaymentMethod": {
      "razorpay": 402354.68,
      "cod": 54434.82
    },
    "salesByDevice": {
      "mobile": 274073.7,
      "desktop": 182715.8
    },
    "salesTrend": {
      "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
      "datasets": [
        {
          "label": "Current Period",
          "data": [98765.43, 112354.67, 128976.54, 116692.86]
        },
        {
          "label": "Previous Period",
          "data": [87654.32, 98765.43, 120543.21, 98987.71]
        }
      ]
    },
    "hourlySales": {
      "labels": ["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm"],
      "data": [
        12345.67, 8765.43, 15678.9, 45678.9, 78965.43, 98765.43, 88654.32,
        65432.1
      ]
    }
  }
}
```

### Get Customer Analytics

```
GET /api/v1/admin/analytics/customers
```

Get detailed customer analytics and insights.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `period`: Time period for statistics (e.g., "month", "quarter", "year", "custom")
- `startDate`: Start date for custom period (ISO format)
- `endDate`: End date for custom period (ISO format)

**Response:**

```json
{
  "success": true,
  "message": "Customer analytics retrieved successfully",
  "data": {
    "summary": {
      "totalCustomers": 3245,
      "newCustomers": 342,
      "returningCustomers": 1876,
      "churnRate": 2.8,
      "comparisonPeriod": {
        "totalCustomers": 3125,
        "newCustomers": 315,
        "returningCustomers": 1765
      },
      "changes": {
        "totalCustomers": {
          "count": 120,
          "percentage": 3.8
        },
        "newCustomers": {
          "count": 27,
          "percentage": 8.6
        }
      }
    },
    "customerSegmentation": {
      "new": 342,
      "active": 1654,
      "at_risk": 432,
      "dormant": 654,
      "loyal": 963
    },
    "customerLifetimeValue": {
      "average": 5678.9,
      "bySegment": {
        "new": 1234.56,
        "active": 4567.89,
        "loyal": 8765.43
      }
    },
    "topCustomers": [
      {
        "_id": "60a3d1b9c2e4f83b3c5d2b7a",
        "name": "John Doe",
        "email": "john@example.com",
        "totalOrders": 12,
        "totalSpent": 87654.32,
        "averageOrderValue": 7304.53,
        "firstPurchase": "2022-10-15T10:30:45.123Z",
        "lastPurchase": "2023-05-12T14:45:30.456Z"
      }
    ],
    "acquisitionChannels": {
      "direct": 125,
      "search": 87,
      "social": 56,
      "email": 43,
      "referral": 31
    },
    "customerRetention": {
      "labels": ["1 Month", "3 Months", "6 Months", "12 Months"],
      "data": [78.5, 65.3, 52.1, 43.7]
    }
  }
}
```

### Get Product Analytics

```
GET /api/v1/admin/analytics/products
```

Get detailed product performance analytics.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `period`: Time period for statistics (e.g., "month", "quarter", "year", "custom")
- `startDate`: Start date for custom period (ISO format)
- `endDate`: End date for custom period (ISO format)
- `categoryId`: Filter by category ID (optional)
- `sortBy`: Field to sort products by (default: "revenue")

**Response:**

```json
{
  "success": true,
  "message": "Product analytics retrieved successfully",
  "data": {
    "summary": {
      "totalProducts": 578,
      "activeProducts": 532,
      "outOfStockProducts": 23,
      "lowStockProducts": 46
    },
    "productPerformance": {
      "bestSellers": [
        {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
          "name": "Smartphone X",
          "sku": "SP-X-001",
          "orders": 45,
          "unitsSold": 58,
          "revenue": 56999.55,
          "averageRating": 4.8
        }
      ],
      "worstPerformers": [
        {
          "_id": "60d3f4e5d6c7b8a9e0f1a2b3",
          "name": "Laptop Pro",
          "sku": "LP-001",
          "orders": 5,
          "unitsSold": 6,
          "revenue": 8999.94,
          "averageRating": 3.2
        }
      ],
      "highestMargin": [
        {
          "_id": "60e4f5a6b7c8d9e0f1a2b3c4",
          "name": "Premium Headphones",
          "sku": "PH-001",
          "margin": 68.5,
          "revenue": 35678.9,
          "profit": 24420.04
        }
      ]
    },
    "categoryPerformance": [
      {
        "_id": "60c1d2e3f4a5b6c7d8e9f0a1",
        "name": "Electronics",
        "productCount": 156,
        "unitsSold": 478,
        "revenue": 215789.45
      }
    ],
    "inventoryHealth": {
      "healthy": 460,
      "warning": 46,
      "critical": 23,
      "overstock": 49
    },
    "priceRangeDistribution": {
      "labels": ["0-1000", "1001-5000", "5001-10000", "10001-50000", "50001+"],
      "data": [126, 234, 108, 87, 23]
    },
    "productViewsPurchaseRate": [
      {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "views": 1245,
        "purchases": 58,
        "conversionRate": 4.66
      }
    ]
  }
}
```

### Get Inventory Analytics

```
GET /api/v1/admin/analytics/inventory
```

Get detailed inventory analytics and forecasting.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `period`: Time period for statistics (e.g., "month", "quarter", "year")
- `categoryId`: Filter by category ID (optional)

**Response:**

```json
{
  "success": true,
  "message": "Inventory analytics retrieved successfully",
  "data": {
    "summary": {
      "totalProducts": 578,
      "totalValue": 7845329.5,
      "averageTurnoverRate": 4.2,
      "stockEfficiency": 78.5
    },
    "stockLevels": {
      "inStock": 532,
      "lowStock": 46,
      "outOfStock": 23,
      "overstock": 49
    },
    "mostStocked": [
      {
        "_id": "60f6g7h8i9j0k1l2m3n4o5p6",
        "name": "Basic T-Shirt",
        "sku": "BTS-001",
        "quantity": 1250,
        "value": 125000.0,
        "daysOfSupply": 78
      }
    ],
    "lowStockItems": [
      {
        "_id": "60d3f4e5d6c7b8a9e0f1a2b3",
        "name": "Laptop Pro",
        "sku": "LP-001",
        "quantity": 3,
        "threshold": 5,
        "reorderAmount": 15,
        "expectedRunout": "2023-06-02T00:00:00.000Z"
      }
    ],
    "categoryBreakdown": [
      {
        "_id": "60c1d2e3f4a5b6c7d8e9f0a1",
        "name": "Electronics",
        "itemCount": 156,
        "totalValue": 4523678.5,
        "averageTurnover": 3.8
      }
    ],
    "inventoryTurnover": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
      "data": [3.8, 4.1, 4.3, 4.0, 4.2]
    },
    "inventoryForecast": {
      "labels": ["Jun", "Jul", "Aug", "Sep", "Oct"],
      "datasets": [
        {
          "label": "Predicted Demand",
          "data": [567, 612, 578, 543, 602]
        },
        {
          "label": "Current Stock",
          "data": [532, 486, 423, 384, 342]
        }
      ]
    }
  }
}
```

## Report Endpoints

### Generate Sales Report

```
POST /api/v1/admin/reports/sales
```

Generate a detailed sales report for the specified time period.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "period": "custom",
  "startDate": "2023-04-01T00:00:00.000Z",
  "endDate": "2023-04-30T23:59:59.999Z",
  "groupBy": "day",
  "includeDetails": true,
  "format": "csv"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Sales report generated successfully",
  "data": {
    "report": {
      "_id": "60z1a2b3c4d5e6f7g8h9i0j1",
      "type": "sales",
      "period": {
        "start": "2023-04-01T00:00:00.000Z",
        "end": "2023-04-30T23:59:59.999Z"
      },
      "format": "csv",
      "url": "https://example.com/reports/sales-report-apr-2023.csv",
      "status": "completed",
      "requestedBy": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7b",
        "email": "admin@example.com"
      },
      "requestedAt": "2023-05-21T09:30:00.123Z",
      "completedAt": "2023-05-21T09:30:15.456Z"
    }
  }
}
```

### Generate Inventory Report

```
POST /api/v1/admin/reports/inventory
```

Generate a detailed inventory report.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "includeZeroStock": true,
  "includeVariants": true,
  "categorize": true,
  "format": "excel"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Inventory report generated successfully",
  "data": {
    "report": {
      "_id": "60z2a3b4c5d6e7f8g9h0i1j2",
      "type": "inventory",
      "format": "excel",
      "url": "https://example.com/reports/inventory-report-2023-05-21.xlsx",
      "status": "completed",
      "requestedBy": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7b",
        "email": "admin@example.com"
      },
      "requestedAt": "2023-05-21T10:15:00.123Z",
      "completedAt": "2023-05-21T10:15:45.456Z"
    }
  }
}
```

### Generate Customer Report

```
POST /api/v1/admin/reports/customers
```

Generate a detailed customer report.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "period": "year",
  "segmentation": true,
  "includeInactive": false,
  "orderHistory": true,
  "format": "excel"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Customer report generated successfully",
  "data": {
    "report": {
      "_id": "60z3a4b5c6d7e8f9g0h1i2j3",
      "type": "customers",
      "period": {
        "start": "2022-05-21T00:00:00.000Z",
        "end": "2023-05-21T23:59:59.999Z"
      },
      "format": "excel",
      "url": "https://example.com/reports/customer-report-2023-05-21.xlsx",
      "status": "completed",
      "requestedBy": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7b",
        "email": "admin@example.com"
      },
      "requestedAt": "2023-05-21T11:00:00.123Z",
      "completedAt": "2023-05-21T11:01:30.456Z"
    }
  }
}
```

### Get Report History

```
GET /api/v1/admin/reports
```

Get a list of previously generated reports.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `type`: Filter by report type (e.g., "sales", "inventory", "customers")
- `status`: Filter by report status (e.g., "completed", "processing", "failed")
- `startDate`: Filter by reports generated after this date
- `endDate`: Filter by reports generated before this date
- `page`: Page number for pagination (default: 1)
- `limit`: Number of reports per page (default: 20)
- `sortBy`: Field to sort by (default: "-requestedAt")

**Response:**

```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": {
    "reports": [
      {
        "_id": "60z3a4b5c6d7e8f9g0h1i2j3",
        "type": "customers",
        "format": "excel",
        "url": "https://example.com/reports/customer-report-2023-05-21.xlsx",
        "status": "completed",
        "requestedBy": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7b",
          "name": "Admin User"
        },
        "requestedAt": "2023-05-21T11:00:00.123Z",
        "completedAt": "2023-05-21T11:01:30.456Z"
      },
      {
        "_id": "60z2a3b4c5d6e7f8g9h0i1j2",
        "type": "inventory",
        "format": "excel",
        "url": "https://example.com/reports/inventory-report-2023-05-21.xlsx",
        "status": "completed",
        "requestedBy": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7b",
          "name": "Admin User"
        },
        "requestedAt": "2023-05-21T10:15:00.123Z",
        "completedAt": "2023-05-21T10:15:45.456Z"
      },
      {
        "_id": "60z1a2b3c4d5e6f7g8h9i0j1",
        "type": "sales",
        "period": {
          "start": "2023-04-01T00:00:00.000Z",
          "end": "2023-04-30T23:59:59.999Z"
        },
        "format": "csv",
        "url": "https://example.com/reports/sales-report-apr-2023.csv",
        "status": "completed",
        "requestedBy": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7b",
          "name": "Admin User"
        },
        "requestedAt": "2023-05-21T09:30:00.123Z",
        "completedAt": "2023-05-21T09:30:15.456Z"
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

### Get Report Status

```
GET /api/v1/admin/reports/:id
```

Get the status and details of a specific report.

**Authentication Required:** Yes (Admin/Manager role)

**Response:**

```json
{
  "success": true,
  "message": "Report status retrieved successfully",
  "data": {
    "report": {
      "_id": "60z1a2b3c4d5e6f7g8h9i0j1",
      "type": "sales",
      "period": {
        "start": "2023-04-01T00:00:00.000Z",
        "end": "2023-04-30T23:59:59.999Z"
      },
      "parameters": {
        "groupBy": "day",
        "includeDetails": true
      },
      "format": "csv",
      "url": "https://example.com/reports/sales-report-apr-2023.csv",
      "status": "completed",
      "fileSize": 458769,
      "rowCount": 1254,
      "requestedBy": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7b",
        "email": "admin@example.com",
        "name": "Admin User"
      },
      "requestedAt": "2023-05-21T09:30:00.123Z",
      "completedAt": "2023-05-21T09:30:15.456Z"
    }
  }
}
```

## Event Tracking Endpoints

### Get User Activity Analytics

```
GET /api/v1/admin/analytics/user-activity
```

Get analytics about user behavior and activity on the platform.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `period`: Time period for statistics (e.g., "week", "month", "year", "custom")
- `startDate`: Start date for custom period (ISO format)
- `endDate`: End date for custom period (ISO format)

**Response:**

```json
{
  "success": true,
  "message": "User activity analytics retrieved successfully",
  "data": {
    "summary": {
      "totalVisits": 12567,
      "uniqueVisitors": 8452,
      "newVisitors": 2345,
      "returningVisitors": 6107,
      "averageSessionDuration": 325, // seconds
      "bounceRate": 32.5 // percentage
    },
    "pageViews": {
      "total": 45678,
      "perVisit": 3.63,
      "mostViewed": [
        {
          "page": "/",
          "views": 8765,
          "percentage": 19.19
        },
        {
          "page": "/products",
          "views": 6543,
          "percentage": 14.32
        },
        {
          "page": "/products/smartphone-x",
          "views": 3456,
          "percentage": 7.57
        }
      ]
    },
    "productViews": [
      {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "views": 3456,
        "addedToCart": 876,
        "purchased": 58,
        "conversionRate": 1.68
      }
    ],
    "userJourney": {
      "entryPages": [
        {
          "page": "/",
          "count": 5678,
          "percentage": 45.18
        },
        {
          "page": "/products",
          "count": 2345,
          "percentage": 18.66
        }
      ],
      "exitPages": [
        {
          "page": "/cart",
          "count": 2134,
          "percentage": 16.98
        },
        {
          "page": "/checkout",
          "count": 1876,
          "percentage": 14.93
        }
      ],
      "funnelConversion": {
        "stages": ["Product View", "Add to Cart", "Checkout", "Purchase"],
        "data": [12567, 3456, 876, 587],
        "rates": [null, 27.5, 25.3, 67.0]
      }
    },
    "deviceStats": {
      "mobile": 6784,
      "desktop": 4567,
      "tablet": 1216
    },
    "trafficSources": {
      "direct": 4567,
      "organic": 3456,
      "referral": 2345,
      "social": 1456,
      "email": 743
    }
  }
}
```

### Track Event (Client-Side Endpoint)

```
POST /api/v1/analytics/track
```

Track user events and activities on the platform.

**Authentication Required:** No

**Request Body:**

```json
{
  "event": "product_view",
  "properties": {
    "productId": "60b1f2e3d4c5b6a7c8d9e0f1",
    "source": "search",
    "referrer": "/search?q=smartphone"
  },
  "userId": "60a3d1b9c2e4f83b3c5d2b7a", // optional, if authenticated
  "anonymousId": "anon_12345", // required if userId not present
  "timestamp": "2023-05-21T12:34:56.789Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Event tracked successfully"
}
```
