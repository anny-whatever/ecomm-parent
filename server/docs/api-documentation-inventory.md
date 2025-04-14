# Inventory Management API Documentation

## Inventory Endpoints

### Get Inventory Status

```
GET /api/v1/inventory/products/:productId
```

Get the current inventory status for a specific product.

**Authentication Required:** Yes (Admin/Manager/Staff role)

**Response:**

```json
{
  "success": true,
  "message": "Inventory status retrieved successfully",
  "data": {
    "inventory": {
      "product": {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "sku": "SP-X-001"
      },
      "status": {
        "quantity": 50,
        "reserved": 5,
        "available": 45,
        "lowStockThreshold": 10,
        "lowStock": false
      },
      "variants": [
        {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f2",
          "name": "Black 128GB",
          "sku": "SP-X-001-BLK-128",
          "status": {
            "quantity": 25,
            "reserved": 3,
            "available": 22,
            "lowStockThreshold": 5,
            "lowStock": false
          }
        },
        {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f3",
          "name": "Blue 128GB",
          "sku": "SP-X-001-BLU-128",
          "status": {
            "quantity": 15,
            "reserved": 2,
            "available": 13,
            "lowStockThreshold": 5,
            "lowStock": false
          }
        },
        {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f4",
          "name": "Black 256GB",
          "sku": "SP-X-001-BLK-256",
          "status": {
            "quantity": 10,
            "reserved": 0,
            "available": 10,
            "lowStockThreshold": 5,
            "lowStock": false
          }
        }
      ]
    }
  }
}
```

### Adjust Inventory

```
POST /api/v1/inventory/products/:productId/adjust
```

Adjust the inventory quantity for a product.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "adjustment": 10,
  "reason": "Inventory count correction",
  "notes": "Physical count revealed 10 additional units",
  "effectOnReserved": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Inventory adjusted successfully",
  "data": {
    "inventory": {
      "product": {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "sku": "SP-X-001"
      },
      "previous": {
        "quantity": 50,
        "reserved": 5,
        "available": 45
      },
      "current": {
        "quantity": 60,
        "reserved": 5,
        "available": 55
      },
      "adjustment": 10,
      "adjustmentReason": "Inventory count correction",
      "notes": "Physical count revealed 10 additional units",
      "adjustedBy": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7b",
        "profile": {
          "firstName": "Admin",
          "lastName": "User"
        }
      },
      "adjustedAt": "2023-05-20T10:30:45.123Z"
    }
  }
}
```

### Adjust Variant Inventory

```
POST /api/v1/inventory/products/:productId/variants/:variantId/adjust
```

Adjust the inventory quantity for a specific product variant.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "adjustment": -5,
  "reason": "Damaged items",
  "notes": "5 units found damaged during inspection",
  "effectOnReserved": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Variant inventory adjusted successfully",
  "data": {
    "inventory": {
      "product": {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "sku": "SP-X-001"
      },
      "variant": {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f2",
        "name": "Black 128GB",
        "sku": "SP-X-001-BLK-128"
      },
      "previous": {
        "quantity": 25,
        "reserved": 3,
        "available": 22
      },
      "current": {
        "quantity": 20,
        "reserved": 3,
        "available": 17
      },
      "adjustment": -5,
      "adjustmentReason": "Damaged items",
      "notes": "5 units found damaged during inspection",
      "adjustedBy": {
        "_id": "60a3d1b9c2e4f83b3c5d2b7b",
        "profile": {
          "firstName": "Admin",
          "lastName": "User"
        }
      },
      "adjustedAt": "2023-05-20T10:45:30.456Z"
    }
  }
}
```

### Get Inventory History

```
GET /api/v1/inventory/products/:productId/history
```

Get the inventory adjustment history for a product.

**Authentication Required:** Yes (Admin/Manager/Staff role)

**Query Parameters:**

- `page`: Page number for pagination (default: 1)
- `limit`: Number of records per page (default: 20)
- `startDate`: Filter by adjustments after this date (ISO format)
- `endDate`: Filter by adjustments before this date (ISO format)
- `reason`: Filter by adjustment reason (optional)
- `includeVariants`: Include variant adjustments (boolean, default: true)

**Response:**

```json
{
  "success": true,
  "message": "Inventory history retrieved successfully",
  "data": {
    "history": [
      {
        "_id": "60i9a0b1c2d3e4f5a6b7c8d9",
        "product": {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
          "name": "Smartphone X",
          "sku": "SP-X-001"
        },
        "variant": null,
        "adjustment": 10,
        "previous": {
          "quantity": 50,
          "reserved": 5
        },
        "current": {
          "quantity": 60,
          "reserved": 5
        },
        "reason": "Inventory count correction",
        "notes": "Physical count revealed 10 additional units",
        "adjustedBy": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7b",
          "profile": {
            "firstName": "Admin",
            "lastName": "User"
          }
        },
        "adjustedAt": "2023-05-20T10:30:45.123Z"
      },
      {
        "_id": "60i9a0b1c2d3e4f5a6b7c8da",
        "product": {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
          "name": "Smartphone X",
          "sku": "SP-X-001"
        },
        "variant": {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f2",
          "name": "Black 128GB",
          "sku": "SP-X-001-BLK-128"
        },
        "adjustment": -5,
        "previous": {
          "quantity": 25,
          "reserved": 3
        },
        "current": {
          "quantity": 20,
          "reserved": 3
        },
        "reason": "Damaged items",
        "notes": "5 units found damaged during inspection",
        "adjustedBy": {
          "_id": "60a3d1b9c2e4f83b3c5d2b7b",
          "profile": {
            "firstName": "Admin",
            "lastName": "User"
          }
        },
        "adjustedAt": "2023-05-20T10:45:30.456Z"
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

### Get Low Stock Products

```
GET /api/v1/inventory/low-stock
```

Get a list of products with low stock based on their defined thresholds.

**Authentication Required:** Yes (Admin/Manager/Staff role)

**Query Parameters:**

- `page`: Page number for pagination (default: 1)
- `limit`: Number of products per page (default: 20)
- `includeOutOfStock`: Include products completely out of stock (boolean, default: true)
- `includeVariants`: Include variant details (boolean, default: true)
- `sortBy`: Field to sort by (default: "availablePercentage")

**Response:**

```json
{
  "success": true,
  "message": "Low stock products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "60c2f3e4d5c6b7a8d9e0f1a2",
        "name": "Smartphone Y",
        "sku": "SP-Y-001",
        "inventory": {
          "quantity": 8,
          "reserved": 3,
          "available": 5,
          "lowStockThreshold": 10,
          "availablePercentage": 50
        },
        "variants": [
          {
            "_id": "60c2f3e4d5c6b7a8d9e0f1a3",
            "name": "Silver 64GB",
            "sku": "SP-Y-001-SIL-64",
            "inventory": {
              "quantity": 3,
              "reserved": 1,
              "available": 2,
              "lowStockThreshold": 5,
              "availablePercentage": 40
            }
          },
          {
            "_id": "60c2f3e4d5c6b7a8d9e0f1a4",
            "name": "Gold 64GB",
            "sku": "SP-Y-001-GLD-64",
            "inventory": {
              "quantity": 5,
              "reserved": 2,
              "available": 3,
              "lowStockThreshold": 5,
              "availablePercentage": 60
            }
          }
        ]
      },
      {
        "_id": "60d3f4e5d6c7b8a9e0f1a2b3",
        "name": "Laptop Pro",
        "sku": "LP-001",
        "inventory": {
          "quantity": 0,
          "reserved": 0,
          "available": 0,
          "lowStockThreshold": 3,
          "availablePercentage": 0
        },
        "variants": []
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### Update Low Stock Threshold

```
PUT /api/v1/inventory/products/:productId/threshold
```

Update the low stock threshold for a product.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "lowStockThreshold": 15
}
```

**Response:**

```json
{
  "success": true,
  "message": "Low stock threshold updated successfully",
  "data": {
    "inventory": {
      "product": {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "sku": "SP-X-001"
      },
      "previous": {
        "lowStockThreshold": 10
      },
      "current": {
        "lowStockThreshold": 15,
        "quantity": 60,
        "reserved": 5,
        "available": 55,
        "lowStock": false
      }
    }
  }
}
```

### Update Variant Low Stock Threshold

```
PUT /api/v1/inventory/products/:productId/variants/:variantId/threshold
```

Update the low stock threshold for a specific product variant.

**Authentication Required:** Yes (Admin/Manager role)

**Request Body:**

```json
{
  "lowStockThreshold": 8
}
```

**Response:**

```json
{
  "success": true,
  "message": "Variant low stock threshold updated successfully",
  "data": {
    "inventory": {
      "product": {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
        "name": "Smartphone X",
        "sku": "SP-X-001"
      },
      "variant": {
        "_id": "60b1f2e3d4c5b6a7c8d9e0f2",
        "name": "Black 128GB",
        "sku": "SP-X-001-BLK-128"
      },
      "previous": {
        "lowStockThreshold": 5
      },
      "current": {
        "lowStockThreshold": 8,
        "quantity": 20,
        "reserved": 3,
        "available": 17,
        "lowStock": false
      }
    }
  }
}
```

### Reserve Inventory

```
POST /api/v1/inventory/products/:productId/reserve
```

Reserve inventory for a product (used during checkout).

**Authentication Required:** Yes (Internal API, system use)

**Request Body:**

```json
{
  "quantity": 2,
  "variantId": "60b1f2e3d4c5b6a7c8d9e0f2",
  "reference": {
    "type": "cart",
    "id": "60d3e4f5a6b7c8d9e0f1a2b3"
  },
  "expiresIn": 3600
}
```

**Response:**

```json
{
  "success": true,
  "message": "Inventory reserved successfully",
  "data": {
    "reservation": {
      "_id": "60j0a1b2c3d4e5f6a7b8c9d0",
      "product": "60b1f2e3d4c5b6a7c8d9e0f1",
      "variant": "60b1f2e3d4c5b6a7c8d9e0f2",
      "quantity": 2,
      "reference": {
        "type": "cart",
        "id": "60d3e4f5a6b7c8d9e0f1a2b3"
      },
      "status": "active",
      "expiresAt": "2023-05-20T11:45:30.456Z",
      "createdAt": "2023-05-20T10:45:30.456Z"
    },
    "inventory": {
      "previous": {
        "quantity": 20,
        "reserved": 3,
        "available": 17
      },
      "current": {
        "quantity": 20,
        "reserved": 5,
        "available": 15
      }
    }
  }
}
```

### Release Reservation

```
POST /api/v1/inventory/reservations/:reservationId/release
```

Release a previously made inventory reservation.

**Authentication Required:** Yes (Internal API, system use)

**Request Body:**

```json
{
  "reason": "Cart abandoned"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Reservation released successfully",
  "data": {
    "reservation": {
      "_id": "60j0a1b2c3d4e5f6a7b8c9d0",
      "product": "60b1f2e3d4c5b6a7c8d9e0f1",
      "variant": "60b1f2e3d4c5b6a7c8d9e0f2",
      "quantity": 2,
      "reference": {
        "type": "cart",
        "id": "60d3e4f5a6b7c8d9e0f1a2b3"
      },
      "status": "released",
      "releasedAt": "2023-05-20T11:15:45.789Z",
      "releaseReason": "Cart abandoned"
    },
    "inventory": {
      "previous": {
        "quantity": 20,
        "reserved": 5,
        "available": 15
      },
      "current": {
        "quantity": 20,
        "reserved": 3,
        "available": 17
      }
    }
  }
}
```

### Commit Reservation

```
POST /api/v1/inventory/reservations/:reservationId/commit
```

Commit a reservation (converting reserved inventory to a confirmed reduction).

**Authentication Required:** Yes (Internal API, system use)

**Request Body:**

```json
{
  "reference": {
    "type": "order",
    "id": "60f5a6b7c8d9e0f1a2b3c4d5"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Reservation committed successfully",
  "data": {
    "reservation": {
      "_id": "60j0a1b2c3d4e5f6a7b8c9d0",
      "product": "60b1f2e3d4c5b6a7c8d9e0f1",
      "variant": "60b1f2e3d4c5b6a7c8d9e0f2",
      "quantity": 2,
      "reference": {
        "type": "order",
        "id": "60f5a6b7c8d9e0f1a2b3c4d5"
      },
      "status": "committed",
      "committedAt": "2023-05-20T11:30:15.123Z"
    },
    "inventory": {
      "previous": {
        "quantity": 20,
        "reserved": 5,
        "available": 15
      },
      "current": {
        "quantity": 18,
        "reserved": 3,
        "available": 15
      }
    }
  }
}
```

### Bulk Adjust Inventory

```
POST /api/v1/inventory/bulk-adjust
```

Adjust inventory for multiple products at once.

**Authentication Required:** Yes (Admin role)

**Request Body:**

```json
{
  "adjustments": [
    {
      "productId": "60b1f2e3d4c5b6a7c8d9e0f1",
      "variantId": null,
      "adjustment": 25,
      "reason": "Bulk restock"
    },
    {
      "productId": "60c2f3e4d5c6b7a8d9e0f1a2",
      "variantId": "60c2f3e4d5c6b7a8d9e0f1a3",
      "adjustment": 10,
      "reason": "Bulk restock"
    }
  ],
  "notes": "Monthly inventory restock",
  "effectOnReserved": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bulk inventory adjustment completed successfully",
  "data": {
    "adjustments": [
      {
        "product": {
          "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
          "name": "Smartphone X",
          "sku": "SP-X-001"
        },
        "variant": null,
        "adjustment": 25,
        "previous": {
          "quantity": 60,
          "reserved": 5
        },
        "current": {
          "quantity": 85,
          "reserved": 5
        }
      },
      {
        "product": {
          "_id": "60c2f3e4d5c6b7a8d9e0f1a2",
          "name": "Smartphone Y",
          "sku": "SP-Y-001"
        },
        "variant": {
          "_id": "60c2f3e4d5c6b7a8d9e0f1a3",
          "name": "Silver 64GB",
          "sku": "SP-Y-001-SIL-64"
        },
        "adjustment": 10,
        "previous": {
          "quantity": 3,
          "reserved": 1
        },
        "current": {
          "quantity": 13,
          "reserved": 1
        }
      }
    ]
  }
}
```

### Get Inventory Summary

```
GET /api/v1/inventory/summary
```

Get a summary of inventory status across all products.

**Authentication Required:** Yes (Admin/Manager role)

**Response:**

```json
{
  "success": true,
  "message": "Inventory summary retrieved successfully",
  "data": {
    "summary": {
      "totalProducts": 58,
      "lowStockProducts": 8,
      "outOfStockProducts": 3,
      "totalInventoryValue": 7845329.5,
      "reservedInventoryValue": 254678.75,
      "topCategories": [
        {
          "category": {
            "_id": "60c1d2e3f4a5b6c7d8e9f0a1",
            "name": "Electronics"
          },
          "productCount": 25,
          "inventoryValue": 4523678.5
        },
        {
          "category": {
            "_id": "60c1d2e3f4a5b6c7d8e9f0a4",
            "name": "Clothing"
          },
          "productCount": 18,
          "inventoryValue": 1856432.75
        }
      ],
      "recentActivity": [
        {
          "product": {
            "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
            "name": "Smartphone X"
          },
          "action": "adjustment",
          "quantity": 25,
          "timestamp": "2023-05-20T12:15:30.456Z"
        },
        {
          "product": {
            "_id": "60c2f3e4d5c6b7a8d9e0f1a2",
            "name": "Smartphone Y"
          },
          "variant": {
            "_id": "60c2f3e4d5c6b7a8d9e0f1a3",
            "name": "Silver 64GB"
          },
          "action": "adjustment",
          "quantity": 10,
          "timestamp": "2023-05-20T12:15:30.456Z"
        }
      ]
    }
  }
}
```

### Export Inventory Report

```
GET /api/v1/inventory/export
```

Export inventory data as CSV or Excel file.

**Authentication Required:** Yes (Admin/Manager role)

**Query Parameters:**

- `format`: File format, either "csv" or "excel" (default: "csv")
- `includeVariants`: Include variant details (boolean, default: true)
- `includeZeroStock`: Include out of stock items (boolean, default: true)

**Response:** File download or:

```json
{
  "success": true,
  "message": "Inventory export started successfully",
  "data": {
    "export": {
      "_id": "60k1a2b3c4d5e6f7a8b9c0d1",
      "type": "inventory",
      "format": "csv",
      "status": "processing",
      "requestedAt": "2023-05-20T12:30:45.789Z",
      "estimatedCompletion": "2023-05-20T12:32:45.789Z"
    }
  }
}
```

### Check Export Status

```
GET /api/v1/inventory/export/:exportId
```

Check the status of an export job.

**Authentication Required:** Yes (Admin/Manager role)

**Response:**

```json
{
  "success": true,
  "message": "Export status retrieved successfully",
  "data": {
    "export": {
      "_id": "60k1a2b3c4d5e6f7a8b9c0d1",
      "type": "inventory",
      "format": "csv",
      "status": "completed",
      "fileUrl": "https://example.com/exports/inventory-20230520-123045.csv",
      "fileSize": 245678,
      "recordCount": 58,
      "requestedAt": "2023-05-20T12:30:45.789Z",
      "completedAt": "2023-05-20T12:32:15.456Z"
    }
  }
}
```
