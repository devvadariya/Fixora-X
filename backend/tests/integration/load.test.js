const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

describe('Load Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    global.isLoadTest = true;
    // Ensure DB connection and clean it
    if (mongoose.connection.readyState !== 1) {
      const TEST_DB_URI = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;
      await mongoose.connect(TEST_DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
    await mongoose.connection.db.dropDatabase();

    // Register a test user
    const userData = {
      name: 'Load Test User',
      email: 'loadtest@example.com',
      phone: '+11234567899',
      password: 'Password123!',
      role: 'customer'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    if (!registerResponse.body || !registerResponse.body.success) {
      console.error("REGISTRATION FAILED in load.test.js beforeAll:", registerResponse.status, registerResponse.body);
    }

    authToken = registerResponse.body.data.tokens.accessToken;
    userId = registerResponse.body.data.user.id;

    // Add a vehicle
    await request(app)
      .post('/api/customer/vehicles')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Load Test Vehicle',
        type: 'car',
        make: 'Toyota',
        model: 'Load Test Vehicle',
        year: 2020,
        plate: 'LOAD123'
      });
  });

  describe('Concurrent User Registration', () => {
    test('should handle multiple concurrent registrations', async () => {
      const registrationPromises = Array(10).fill().map((_, index) => 
        request(app)
          .post('/api/auth/register')
          .send({
            name: `Concurrent User ${index}`,
            email: `concurrent${index}@example.com`,
            phone: `+1123456780${index}`,
            password: 'Password123!',
            role: 'customer'
          })
      );

      const responses = await Promise.all(registrationPromises);
      
      // All registrations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Concurrent Service Requests', () => {
    test('should handle multiple concurrent service requests', async () => {
      const requestPromises = Array(5).fill().map((_, index) => 
        request(app)
          .post('/api/customer/service-requests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            issueType: 'engine_trouble',
            description: `Load test service request ${index}`,
            vehicleInfo: {
              type: 'car',
              model: 'Load Test Vehicle',
              plate: 'LOAD123'
            },
            location: {
              lat: 40.7128 + (index * 0.001),
              lng: -74.0060 + (index * 0.001),
              address: `Load Test Location ${index}`
            },
            priority: 'medium',
            userExpectedPrice: 100
          })
      );

      const responses = await Promise.all(requestPromises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.request).toBeDefined();
        expect(response.body.data.quotation).toBeDefined();
      });
    });
  });

  describe('Database Stress Test', () => {
    test('should handle rapid read operations', async () => {
      const readPromises = Array(20).fill().map(() => 
        request(app)
          .get('/api/customer/profile')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(readPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('should handle rapid vehicle operations', async () => {
      // Create multiple vehicles
      const createPromises = Array(5).fill().map((_, index) => 
        request(app)
          .post('/api/customer/vehicles')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Stress Vehicle ${index}`,
            type: 'car',
            make: 'Toyota',
            model: `Stress Test Vehicle ${index}`,
            year: 2020,
            plate: `STRESS${index}`
          })
      );

      const createResponses = await Promise.all(createPromises);
      
      createResponses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Read vehicles multiple times
      const readPromises = Array(10).fill().map(() => 
        request(app)
          .get('/api/customer/vehicles')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const readResponses = await Promise.all(readPromises);
      
      readResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe('Memory and Performance Tests', () => {
    test('should handle large payload requests', async () => {
      const largeDescription = 'A'.repeat(500); // Maximum allowed description
      
      const response = await request(app)
        .post('/api/customer/service-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          issueType: 'other',
          description: largeDescription,
          vehicleInfo: {
            type: 'car',
            model: 'Performance Test Vehicle',
            plate: 'PERF123'
          },
          location: {
            lat: 40.7128,
            lng: -74.0060,
            address: 'Performance Test Location'
          },
          priority: 'low',
          userExpectedPrice: 100
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.request.description).toBe(largeDescription);
    });

    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/customer/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('Error Handling Under Load', () => {
    test('should handle invalid requests gracefully under load', async () => {
      const invalidPromises = Array(10).fill().map(() => 
        request(app)
          .post('/api/customer/service-requests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            issueType: 'invalid_type',
            description: '',
            vehicleInfo: {},
            location: {}
          })
      );

      const responses = await Promise.all(invalidPromises);
      
      // All should return validation errors but not crash
      responses.forEach(response => {
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });
    });

    test('should handle unauthorized requests under load', async () => {
      const unauthorizedPromises = Array(15).fill().map(() => 
        request(app)
          .get('/api/customer/profile')
          .set('Authorization', 'Bearer invalid-token')
      );

      const responses = await Promise.all(unauthorizedPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });
  });

  afterAll(async () => {
    global.isLoadTest = false;
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    }
  });
});
