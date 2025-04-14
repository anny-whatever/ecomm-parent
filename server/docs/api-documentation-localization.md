# Localization and Internationalization API Documentation

This document provides information about the Localization and Internationalization API endpoints. These APIs enable multi-currency pricing, language translation, and other localization features for global e-commerce operations.

## Base URL

All URLs referenced in this documentation have the following base:

```
/api/v1
```

## Currency Endpoints

### Get All Currencies

```
GET /api/v1/currencies
```

Retrieves a list of all available currencies.

**Authentication Required:** No

**Query Parameters:**

- `code`: Filter by currency code (optional)

**Response:**

```json
{
  "success": true,
  "message": "Currencies retrieved successfully",
  "data": {
    "currencies": [
      {
        "code": "INR",
        "name": "Indian Rupee",
        "symbol": "₹",
        "exchangeRate": 1.0,
        "decimalPlaces": 2,
        "symbolPosition": "prefix",
        "thousandSeparator": ",",
        "decimalSeparator": ".",
        "isBaseCurrency": true,
        "isActive": true,
        "lastRateUpdate": "2023-08-15T10:30:45.123Z"
      },
      {
        "code": "USD",
        "name": "US Dollar",
        "symbol": "$",
        "exchangeRate": 0.012,
        "decimalPlaces": 2,
        "symbolPosition": "prefix",
        "thousandSeparator": ",",
        "decimalSeparator": ".",
        "isBaseCurrency": false,
        "isActive": true,
        "lastRateUpdate": "2023-08-15T10:30:45.123Z"
      }
    ]
  }
}
```

### Get Currency By Code

```
GET /api/v1/currencies/:code
```

Retrieves information about a specific currency.

**Authentication Required:** No

**URL Parameters:**

- `code`: Currency code (e.g., "USD", "EUR", "INR")

**Response:**

```json
{
  "success": true,
  "message": "Currency retrieved successfully",
  "data": {
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$",
      "exchangeRate": 0.012,
      "decimalPlaces": 2,
      "symbolPosition": "prefix",
      "thousandSeparator": ",",
      "decimalSeparator": ".",
      "isBaseCurrency": false,
      "isActive": true,
      "lastRateUpdate": "2023-08-15T10:30:45.123Z"
    }
  }
}
```

### Create Currency (Admin)

```
POST /api/v1/admin/currencies
```

Creates a new currency.

**Authentication Required:** Yes (Admin role)

**Request Body:**

```json
{
  "code": "EUR",
  "name": "Euro",
  "symbol": "€",
  "exchangeRate": 0.011,
  "decimalPlaces": 2,
  "symbolPosition": "prefix",
  "thousandSeparator": ".",
  "decimalSeparator": ",",
  "isBaseCurrency": false,
  "isActive": true,
  "autoUpdateRate": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Currency created successfully",
  "data": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€",
      "exchangeRate": 0.011,
      "decimalPlaces": 2,
      "symbolPosition": "prefix",
      "thousandSeparator": ".",
      "decimalSeparator": ",",
      "isBaseCurrency": false,
      "isActive": true,
      "autoUpdateRate": true,
      "lastRateUpdate": "2023-08-15T12:30:45.123Z",
      "createdAt": "2023-08-15T12:30:45.123Z",
      "updatedAt": "2023-08-15T12:30:45.123Z"
    }
  }
}
```

### Update Currency (Admin)

```
PUT /api/v1/admin/currencies/:code
```

Updates an existing currency.

**Authentication Required:** Yes (Admin role)

**URL Parameters:**

- `code`: Currency code to update

**Request Body:**

```json
{
  "name": "Euro",
  "symbol": "€",
  "exchangeRate": 0.0115,
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Currency updated successfully",
  "data": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€",
      "exchangeRate": 0.0115,
      "decimalPlaces": 2,
      "symbolPosition": "prefix",
      "thousandSeparator": ".",
      "decimalSeparator": ",",
      "isBaseCurrency": false,
      "isActive": true,
      "autoUpdateRate": true,
      "lastRateUpdate": "2023-08-15T14:30:45.123Z",
      "updatedAt": "2023-08-15T14:30:45.123Z"
    }
  }
}
```

### Delete Currency (Admin)

```
DELETE /api/v1/admin/currencies/:code
```

Deletes a currency.

**Authentication Required:** Yes (Admin role)

**URL Parameters:**

- `code`: Currency code to delete

**Response:**

```json
{
  "success": true,
  "message": "Currency deleted successfully"
}
```

## Product Multi-Currency Pricing Endpoints

### Update Product Currency Pricing (Admin)

```
PUT /api/v1/admin/products/:productId/pricing/:currencyCode
```

Updates a product's pricing in a specific currency.

**Authentication Required:** Yes (Admin role)

**URL Parameters:**

- `productId`: Product ID
- `currencyCode`: Currency code for pricing

**Request Body:**

```json
{
  "regular": 45.99,
  "sale": 39.99,
  "onSale": true,
  "isManual": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Product pricing updated successfully",
  "data": {
    "product": {
      "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
      "name": "Smartphone X",
      "price": {
        "regular": 49999,
        "sale": 44999,
        "onSale": true,
        "currency": "INR",
        "multiCurrency": [
          {
            "code": "USD",
            "regular": 599.99,
            "sale": 539.99,
            "onSale": true,
            "isManual": true,
            "updatedAt": "2023-08-15T14:30:45.123Z"
          },
          {
            "code": "EUR",
            "regular": 45.99,
            "sale": 39.99,
            "onSale": true,
            "isManual": true,
            "updatedAt": "2023-08-15T16:30:45.123Z"
          }
        ]
      }
    }
  }
}
```

### Change Product Base Currency (Admin)

```
PUT /api/v1/admin/products/:productId/base-currency
```

Changes the base currency of a product.

**Authentication Required:** Yes (Admin role)

**URL Parameters:**

- `productId`: Product ID

**Request Body:**

```json
{
  "currencyCode": "USD"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Product base currency updated successfully",
  "data": {
    "product": {
      "_id": "60b1f2e3d4c5b6a7c8d9e0f1",
      "name": "Smartphone X",
      "price": {
        "regular": 599.99,
        "sale": 539.99,
        "onSale": true,
        "currency": "USD",
        "multiCurrency": [
          {
            "code": "INR",
            "regular": 49999,
            "sale": 44999,
            "onSale": true,
            "isManual": true,
            "updatedAt": "2023-08-15T18:30:45.123Z"
          },
          {
            "code": "EUR",
            "regular": 45.99,
            "sale": 39.99,
            "onSale": true,
            "isManual": true,
            "updatedAt": "2023-08-15T16:30:45.123Z"
          }
        ]
      }
    }
  }
}
```

## Currency Conversion Endpoints

### Convert Amount

```
GET /api/v1/currencies/convert
```

Converts an amount from one currency to another.

**Authentication Required:** No

**Query Parameters:**

- `amount`: The amount to convert
- `from`: Source currency code
- `to`: Target currency code

**Response:**

```json
{
  "success": true,
  "message": "Amount converted successfully",
  "data": {
    "from": {
      "code": "INR",
      "amount": 49999
    },
    "to": {
      "code": "USD",
      "amount": 599.99
    },
    "rate": 0.012,
    "timestamp": "2023-08-15T19:30:45.123Z"
  }
}
```

## Future Localization Features

The following features are planned for future implementation:

### Language Translation

- Translation of product information, categories, and content
- User interface localization
- Regional content adaptation

### Localized Shipping and Tax Rules

- Country-specific shipping methods and rates
- Tax calculation based on customer location
- Customs documentation for international orders

### Region-Specific Product Catalogs

- Product availability by region
- Region-specific pricing and promotions
- Local regulatory compliance

## Best Practices for Multi-Currency Implementation

1. Always specify the currency code when displaying prices
2. Update exchange rates regularly (daily recommended)
3. Allow users to select their preferred currency
4. Store the base price in your primary operating currency
5. Consider using manual pricing for key markets rather than automatic conversion
6. Display the currency conversion timestamp for transparency
