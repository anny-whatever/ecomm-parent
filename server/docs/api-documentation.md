# E-commerce Backend API Documentation

## Introduction

This documentation provides details about the E-commerce Backend API endpoints, request/response formats, and authentication requirements. The API follows RESTful design principles and uses JSON for data exchange.

## Base URL

```
/api/v1
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Most endpoints require a valid token to access.

### How to Authenticate

1. Obtain a JWT token by logging in or registering
2. Include the token in all API requests:
   - Header: `Authorization: Bearer <your_token>`

### Authentication Endpoints

#### Register a New User

```
POST /api/v1/auth/register
```

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+919876543210"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "_id": "60a3d1b9c2e4f83b3c5d2b7a",
      "email": "user@example.com",
      "role": "customer",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+919876543210"
      },
      "emailVerified": false,
      "createdAt": "2023-05-18T10:30:45.123Z",
      "updatedAt": "2023-05-18T10:30:45.123Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login

```
POST /api/v1/auth/login
```

Authenticate a user and get a JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "60a3d1b9c2e4f83b3c5d2b7a",
      "email": "user@example.com",
      "role": "customer",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+919876543210"
      },
      "emailVerified": true,
      "createdAt": "2023-05-18T10:30:45.123Z",
      "updatedAt": "2023-05-18T10:30:45.123Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Verify Email

```
GET /api/v1/auth/verify-email/:token
```

Verify user email address using token sent to email.

**Response:**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Forgot Password

```
POST /api/v1/auth/forgot-password
```

Request a password reset link.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If your email is registered, you will receive a password reset link"
}
```

#### Reset Password

```
POST /api/v1/auth/reset-password
```

Reset password using a token.

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "password": "newSecurePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

#### Refresh Token

```
POST /api/v1/auth/refresh-token
```

Get a new token using existing valid token. Requires authentication.

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Logout

```
POST /api/v1/auth/logout
```

Invalidate the current token. Requires authentication.

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```
