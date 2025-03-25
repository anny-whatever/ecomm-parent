// tests/mocks/user.mock.js

/**
 * Mock user data for testing
 */
const mockUser = {
  _id: 'test-user-id',
  email: 'test@example.com',
  password: 'hashed_password',
  name: 'Test User',
  role: 'user',
  isEmailVerified: true,
  profile: {
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '1234567890',
    bio: 'Test user bio'
  },
  addresses: [
    {
      _id: 'address-1',
      fullName: 'Test User',
      addressLine1: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
      phoneNumber: '1234567890',
      isDefault: true
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock admin user data for testing
 */
const mockAdmin = {
  _id: 'admin-user-id',
  email: 'admin@example.com',
  password: 'hashed_password',
  name: 'Admin User',
  role: 'admin',
  isEmailVerified: true,
  profile: {
    firstName: 'Admin',
    lastName: 'User',
    phoneNumber: '0987654321'
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

module.exports = {
  mockUser,
  mockAdmin
}; 