const mongoose = require('mongoose');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
process.env.RATE_LIMIT_MAX_REQUESTS = '30';
process.env.RATE_LIMIT_WINDOW_MS = '60000';

// Mock logger to reduce noise during tests but print errors
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn((...args) => console.error('LOGGER ERROR:', ...args)),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock upload service to avoid actual Cloudinary calls during tests
jest.mock('../src/services/uploadService', () => ({
  uploadServiceRequestImages: jest.fn().mockResolvedValue(['http://example.com/image1.jpg']),
  uploadProfilePicture: jest.fn().mockResolvedValue('http://example.com/avatar.jpg'),
  deleteImage: jest.fn().mockResolvedValue(true)
}));

// Mock notification service
jest.mock('../src/services/notificationService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendSMS: jest.fn().mockResolvedValue(true),
  addToQueue: jest.fn().mockResolvedValue(true),
  notifyRequestCreated: jest.fn().mockResolvedValue(true),
  notifyMechanicAssigned: jest.fn().mockResolvedValue(true),
  notifyRequestStatusUpdate: jest.fn().mockResolvedValue(true),
  notifyPaymentReceived: jest.fn().mockResolvedValue(true),
  notifyRequestCancelled: jest.fn().mockResolvedValue(true),
  notifyMechanicArrival: jest.fn().mockResolvedValue(true),
  sendOTPNotification: jest.fn().mockResolvedValue(true),
  sendPasswordResetNotification: jest.fn().mockResolvedValue(true)
}));

let mongodServer = null;

// Global test setup
beforeAll(async () => {
  // Set up test database connection if needed
  if (mongoose.connection.readyState === 0) {
    const testDbUri = process.env.TEST_MONGODB_URI;
    if (testDbUri) {
      try {
        await mongoose.connect(testDbUri, { serverSelectionTimeoutMS: 2000 });
      } catch (e) {
        // Fall back to memory server
      }
    }
    if (mongoose.connection.readyState === 0) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodServer = await MongoMemoryServer.create();
      await mongoose.connect(mongodServer.getUri() + 'fixora-x-test');
    }
  }
});

// Global test cleanup
afterAll(async () => {
  // Clean up database connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongodServer) {
    await mongodServer.stop();
  }
});

// Set longer timeout for integration tests
jest.setTimeout(30000);
