# Testing Documentation

This document outlines the testing strategy and procedures for the e-commerce platform.

## Overview

Our testing approach includes:

1. Unit Testing
2. Integration Testing
3. API Testing
4. Performance Testing
5. Security Testing

## Test Environment Setup

### Prerequisites

- Node.js v14+
- MongoDB v4.4+
- npm or yarn

### Configuration

Create a `.env.test` file with test environment configurations:

```
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ecommerce_test
JWT_SECRET=test_jwt_secret
```

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Suites

```bash
# Run only API tests
npm run test:api

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### With Coverage Report

```bash
npm run test:coverage
```

## Unit Testing

Unit tests focus on testing individual functions and components in isolation.

### Framework: Jest

We use Jest as our primary testing framework.

### Directory Structure

```
server/
├── src/
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── user.service.test.js
│   │   │   ├── product.service.test.js
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── helpers.test.js
```

### Example Unit Test

```javascript
// user.service.test.js
const userService = require('../user.service');
const User = require('../../models/user.model');

jest.mock('../../models/user.model');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = { _id: '123', email: 'test@example.com' };
      User.findById.mockResolvedValue(mockUser);
      
      const result = await userService.getUserById('123');
      
      expect(User.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockUser);
    });
    
    it('should return null if user not found', async () => {
      User.findById.mockResolvedValue(null);
      
      const result = await userService.getUserById('123');
      
      expect(result).toBeNull();
    });
  });
});
```

## Integration Testing

Integration tests verify that different parts of the application work together correctly.

### Directory Structure

```
server/
├── tests/
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── users.test.js
│   │   ├── products.test.js
```

### Example Integration Test

```javascript
// auth.test.js
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user.model');

describe('Auth API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          profile: {
            firstName: 'Test',
            lastName: 'User'
          }
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user.email).toBe('test@example.com');
    });
  });
});
```

## API Testing

API tests verify that HTTP endpoints behave as expected.

### Tool: Supertest

We use Supertest to simulate HTTP requests.

### Directory Structure

```
server/
├── tests/
│   ├── api/
│   │   ├── auth.api.test.js
│   │   ├── users.api.test.js
│   │   ├── products.api.test.js
```

### Example API Test

```javascript
// products.api.test.js
const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../helpers/auth');

describe('Products API', () => {
  let authToken;
  
  beforeAll(async () => {
    authToken = generateToken({ id: '123', role: 'admin' });
  });
  
  describe('GET /api/v1/products', () => {
    it('should retrieve a list of products', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
    
    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });
  });
});
```

## End-to-End Testing

End-to-end tests simulate real user scenarios.

### Framework: Cypress

We use Cypress for end-to-end testing.

### Directory Structure

```
cypress/
├── integration/
│   ├── auth/
│   │   ├── login.spec.js
│   │   ├── register.spec.js
│   ├── products/
│   │   ├── browse.spec.js
│   │   ├── search.spec.js
│   ├── cart/
│   │   ├── checkout.spec.js
```

### Example E2E Test

```javascript
// login.spec.js
describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login');
  });
  
  it('should login a user with valid credentials', () => {
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('.user-welcome').should('contain', 'Welcome back');
  });
  
  it('should show error with invalid credentials', () => {
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('WrongPassword');
    cy.get('button[type="submit"]').click();
    
    cy.get('.error-message').should('be.visible');
    cy.get('.error-message').should('contain', 'Invalid credentials');
  });
});
```

## Performance Testing

Performance tests evaluate the system's responsiveness and stability under various load conditions.

### Tool: k6

We use k6 for performance testing.

### Test Scripts

```
performance/
├── scripts/
│   ├── products-load.js
│   ├── checkout-flow.js
```

### Example Performance Test

```javascript
// products-load.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  vus: 10,         // 10 virtual users
  duration: '30s', // test for 30 seconds
};

export default function() {
  let response = http.get('https://api.yourecommerce.com/api/v1/products');
  
  check(response, {
    'is status 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

### Running Performance Tests

```bash
k6 run performance/scripts/products-load.js
```

## Security Testing

Security tests identify vulnerabilities in the application.

### Tools:
- OWASP ZAP (for vulnerability scanning)
- npm audit (for dependency vulnerabilities)

### Running Security Tests

```bash
# Check dependencies for vulnerabilities
npm audit

# Run ZAP scan (requires ZAP CLI)
zap-cli quick-scan --self-contained \
  --start-options "-config api.disablekey=true" \
  https://api.yourecommerce.com
```

## Mocking

For tests that require mocking external dependencies, we use Jest's mocking capabilities.

### Example with Mock

```javascript
// payment.service.test.js
const paymentService = require('../payment.service');
const razorpayClient = require('../../config/razorpay');

jest.mock('../../config/razorpay');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a Razorpay order', async () => {
      razorpayClient.orders.create.mockResolvedValue({
        id: 'order_123',
        amount: 50000,
        currency: 'INR'
      });
      
      const result = await paymentService.createPayment({
        amount: 500,
        currency: 'INR',
        receipt: 'receipt_123'
      });
      
      expect(razorpayClient.orders.create).toHaveBeenCalledWith({
        amount: 50000, // in paise
        currency: 'INR',
        receipt: 'receipt_123'
      });
      
      expect(result).toHaveProperty('id', 'order_123');
    });
  });
});
```

## Continuous Integration

We use GitHub Actions for continuous integration.

### Workflow File

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:4.4
        ports:
          - 27017:27017

    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14.x'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linter
      run: npm run lint
      
    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test
        MONGODB_URI: mongodb://localhost:27017/ecommerce_test
        JWT_SECRET: test_jwt_secret
        
    - name: Upload coverage
      uses: codecov/codecov-action@v1
```

## Test Coverage Targets

We aim for the following test coverage targets:

- Unit tests: 80%
- Integration tests: 70%
- API tests: 90%

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on the state from other tests
2. **Use Descriptive Names**: Test names should clearly describe what they're testing
3. **Follow AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Use mocks for external services, databases, etc.
5. **Test Edge Cases**: Include tests for error conditions and edge cases
6. **Keep Tests Fast**: Tests should run quickly to enable rapid feedback

## Writing Effective Tests

### Do:
- Test one thing per test
- Use setup and teardown functions to avoid repetition
- Test both happy paths and error cases
- Use descriptive assertion messages

### Don't:
- Write tests that depend on each other
- Test implementation details rather than behavior
- Use production data for testing
- Hardcode expected values that might change over time

## Troubleshooting Common Test Issues

1. **Flaky Tests**: Tests that sometimes pass and sometimes fail
   - Solution: Identify race conditions, use proper async/await handling

2. **Slow Tests**: Tests that take too long to run
   - Solution: Use mocks instead of real dependencies, optimize database interactions

3. **Database State Leakage**: Tests affecting each other via database state
   - Solution: Clean up database between tests, use test transactions

4. **Auth Token Issues**: Problems with authentication in tests
   - Solution: Create helper functions to generate test tokens

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Cypress Documentation](https://docs.cypress.io)
- [k6 Documentation](https://k6.io/docs/) 