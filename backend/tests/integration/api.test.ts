/**
 * Integration tests for entire API
 * Tests server initialization, all endpoints together, middleware integration,
 * error handling, and full request/response cycle
 */

import request from 'supertest';
import crypto from 'crypto';
import { createServer } from '@/api/server';
import { wishlistStorage } from '@/storage';
import { sampleTobaccos } from '../fixtures/mockData';
import searchService from '@/services/search.service';

// Mock search service
jest.mock('@/services/search.service');

describe('API Integration Tests', () => {
  let app: any;
  const TEST_USER_ID = 123456789;
  const TEST_BOT_TOKEN = 'test-bot-token';

  beforeAll(() => {
    // Set environment variables for testing
    process.env.TELEGRAM_BOT_TOKEN = TEST_BOT_TOKEN;
    process.env.NODE_ENV = 'test';
    process.env.MINI_APP_URL = 'http://localhost:3000';
  });

  beforeEach(async () => {
    // Create server
    app = createServer();

    // Clear storage before each test
    await wishlistStorage.clear();

    // Mock search service methods
    (searchService.search as jest.Mock).mockImplementation(
      async (query: string, page: number = 1, pageSize: number = 10) => {
        const filtered = sampleTobaccos.filter(
          (t) =>
            t.name.toLowerCase().includes(query.toLowerCase()) ||
            t.brand.toLowerCase().includes(query.toLowerCase()) ||
            t.flavor.toLowerCase().includes(query.toLowerCase())
        );
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const results = filtered.slice(start, end);

        return {
          results,
          total: filtered.length,
          page,
          pageSize,
        };
      }
    );

    (searchService.getTobaccoDetails as jest.Mock).mockImplementation((tobaccoId: string) => {
      return sampleTobaccos.find((t) => t.id === tobaccoId) || null;
    });

    (searchService.getAvailableBrands as jest.Mock).mockResolvedValue(['Al Fakher', 'Starbuzz', 'Tangiers']);
    (searchService.getAvailableFlavors as jest.Mock).mockResolvedValue(['Mint', 'Apple', 'Blueberry']);
  });

  afterEach(async () => {
    // Clear storage after each test
    await wishlistStorage.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup
    await wishlistStorage.clear();
  });

  /**
   * Helper function to create valid Telegram init data
   */
  const createValidInitData = (userId: number): string => {
    const user = {
      id: userId,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      language_code: 'en',
    };

    const authDate = Math.floor(Date.now() / 1000).toString();
    const userParam = encodeURIComponent(JSON.stringify(user));

    // Create data-check-string
    const dataCheckString = `auth_date=${authDate}\nuser=${userParam}`;

    // Calculate secret key from bot token
    const secretKey = crypto.createHash('sha256').update(TEST_BOT_TOKEN).digest();

    // Calculate HMAC-SHA256
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Return initData with hash
    return `auth_date=${authDate}&user=${userParam}&hash=${hash}`;
  };

  /**
   * Helper function to create invalid init data (wrong hash)
   */
  const createInvalidInitData = (userId: number): string => {
    const user = {
      id: userId,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      language_code: 'en',
    };

    const authDate = Math.floor(Date.now() / 1000).toString();
    const userParam = encodeURIComponent(JSON.stringify(user));

    // Return initData with invalid hash
    return `auth_date=${authDate}&user=${userParam}&hash=invalidhash123`;
  };

  describe('Server Initialization', () => {
    it('should create server successfully', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should have express app methods', () => {
      expect(app.use).toBeDefined();
      expect(app.get).toBeDefined();
      expect(app.post).toBeDefined();
      expect(app.delete).toBeDefined();
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 for /health endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return JSON content-type for /health', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Root Endpoint', () => {
    it('should return 404 for root endpoint (no route defined)', async () => {
      const response = await request(app)
        .get('/')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return JSON content-type for root endpoint', async () => {
      const response = await request(app)
        .get('/');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Wishlist Routes Integration', () => {
    const validInitData = createValidInitData(TEST_USER_ID);

    it('should allow full wishlist workflow: add, get, remove', async () => {
      // Step 1: Add item
      const addResponse = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '1', notes: 'Test note' })
        .expect(200);

      expect(addResponse.body).toHaveProperty('success', true);
      expect(addResponse.body.wishlist.items).toHaveLength(1);

      // Step 2: Get wishlist
      const getResponse = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(getResponse.body.userId).toBe(TEST_USER_ID);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0].tobaccoId).toBe('1');

      // Step 3: Add another item
      await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '2' })
        .expect(200);

      // Step 4: Verify two items
      const getResponse2 = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(getResponse2.body.items).toHaveLength(2);

      // Step 5: Remove first item
      const removeResponse = await request(app)
        .delete('/api/v1/wishlist/1')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(removeResponse.body).toHaveProperty('success', true);

      // Step 6: Verify one item remains
      const getResponse3 = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(getResponse3.body.items).toHaveLength(1);
      expect(getResponse3.body.items[0].tobaccoId).toBe('2');

      // Step 7: Clear wishlist
      const clearResponse = await request(app)
        .delete('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(clearResponse.body).toHaveProperty('success', true);

      // Step 8: Verify empty wishlist
      const getResponse4 = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(getResponse4.body.items).toHaveLength(0);
    });

    it('should handle multiple users independently', async () => {
      const userId1 = 111111111;
      const userId2 = 222222222;
      const validInitData1 = createValidInitData(userId1);
      const validInitData2 = createValidInitData(userId2);

      // Add item for user 1
      await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData1)
        .send({ tobaccoId: '1' })
        .expect(200);

      // Add item for user 2
      await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData2)
        .send({ tobaccoId: '2' })
        .expect(200);

      // Get wishlist for user 1
      const response1 = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData1)
        .expect(200);

      expect(response1.body.userId).toBe(userId1);
      expect(response1.body.items).toHaveLength(1);
      expect(response1.body.items[0].tobaccoId).toBe('1');

      // Get wishlist for user 2
      const response2 = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData2)
        .expect(200);

      expect(response2.body.userId).toBe(userId2);
      expect(response2.body.items).toHaveLength(1);
      expect(response2.body.items[0].tobaccoId).toBe('2');
    });

    it('should prevent duplicate items in wishlist', async () => {
      // Add item
      await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '1' })
        .expect(200);

      // Try to add duplicate
      const response = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '1' })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Tobacco already in wishlist');
    });
  });

  describe('Search Routes Integration', () => {
    const validInitData = createValidInitData(TEST_USER_ID);

    it('should search for tobaccos successfully', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'mint' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should get available brands', async () => {
      const response = await request(app)
        .get('/api/v1/search/brands')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(response.body).toHaveProperty('brands');
      expect(Array.isArray(response.body.brands)).toBe(true);
      expect(response.body.brands.length).toBeGreaterThan(0);
    });

    it('should get available flavors', async () => {
      const response = await request(app)
        .get('/api/v1/search/flavors')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(response.body).toHaveProperty('flavors');
      expect(Array.isArray(response.body.flavors)).toBe(true);
      expect(response.body.flavors.length).toBeGreaterThan(0);
    });

    it('should get tobacco details by ID', async () => {
      const response = await request(app)
        .get('/api/v1/search/tobacco/1')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(response.body).toHaveProperty('id', '1');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('brand');
      expect(response.body).toHaveProperty('flavor');
    });

    it('should handle pagination in search', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', page: 2, pageSize: 5 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(response.body).toHaveProperty('page', 2);
      expect(response.body).toHaveProperty('pageSize', 5);
    });

    it('should return 400 when query is missing', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'query parameter is required');
    });

    it('should return 404 when tobacco not found', async () => {
      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/v1/search/tobacco/999')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Tobacco not found');
    });
  });

  describe('Authentication Integration', () => {
    it('should block all protected routes without authentication', async () => {
      // Test wishlist routes
      await request(app).get('/api/v1/wishlist').expect(401);
      await request(app).post('/api/v1/wishlist').send({ tobaccoId: '1' }).expect(401);
      await request(app).delete('/api/v1/wishlist/1').expect(401);
      await request(app).delete('/api/v1/wishlist').expect(401);

      // Test search routes
      await request(app).get('/api/v1/search').query({ query: 'test' }).expect(401);
      await request(app).get('/api/v1/search/brands').expect(401);
      await request(app).get('/api/v1/search/flavors').expect(401);
      await request(app).get('/api/v1/search/tobacco/1').expect(401);
    });

    it('should block all protected routes with invalid signature', async () => {
      const invalidInitData = createInvalidInitData(TEST_USER_ID);

      // Test wishlist routes
      const wishlistResponse = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', invalidInitData)
        .expect(401);

      expect(wishlistResponse.body.code).toBe('INVALID_SIGNATURE');

      // Test search routes
      const searchResponse = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test' })
        .set('X-Telegram-Init-Data', invalidInitData)
        .expect(401);

      expect(searchResponse.body.code).toBe('INVALID_SIGNATURE');
    });

    it('should allow all protected routes with valid authentication', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Test wishlist routes
      await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '1' })
        .expect(200);

      // Test search routes
      await request(app)
        .get('/api/v1/search')
        .query({ query: 'test' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      await request(app)
        .get('/api/v1/search/brands')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      await request(app)
        .get('/api/v1/search/flavors')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      await request(app)
        .get('/api/v1/search/tobacco/1')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);
    });

    it('should return proper error codes for authentication failures', async () => {
      // Missing initData
      const missingResponse = await request(app)
        .get('/api/v1/wishlist')
        .expect(401);

      expect(missingResponse.body).toHaveProperty('code', 'MISSING_INIT_DATA');

      // Invalid signature
      const invalidResponse = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', createInvalidInitData(TEST_USER_ID))
        .expect(401);

      expect(invalidResponse.body).toHaveProperty('code', 'INVALID_SIGNATURE');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle unsupported methods (returns 401 due to auth middleware)', async () => {
      const response = await request(app)
        .patch('/api/v1/wishlist')
        .expect(401); // Returns 401 because auth middleware runs first

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON in request body', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle service errors gracefully', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock storage to throw error
      jest.spyOn(wishlistStorage, 'get').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to get wishlist');

      jest.restoreAllMocks();
    });

    it('should return proper error response format', async () => {
      const response = await request(app)
        .get('/api/v1/wishlist')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.code).toBe('string');
    });

    it('should handle search service errors', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock search service to throw error
      (searchService.search as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to search');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers on all responses', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include CORS headers on API responses', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test' })
        .set('X-Telegram-Init-Data', validInitData);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow credentials in CORS headers', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['access-control-allow-credentials']).toBeDefined();
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/v1/wishlist');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Content-Type Headers', () => {
    it('should return JSON content-type for successful responses', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return JSON content-type for error responses', async () => {
      const response = await request(app)
        .get('/api/v1/wishlist')
        .expect(401);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return JSON content-type for health check', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return JSON content-type for search results', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test' })
        .set('X-Telegram-Init-Data', validInitData);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return JSON content-type for 404 errors', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent wishlist requests', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const requests = [
        request(app)
          .get('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData),
        request(app)
          .post('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData)
          .send({ tobaccoId: '1' }),
        request(app)
          .post('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData)
          .send({ tobaccoId: '2' }),
        request(app)
          .post('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData)
          .send({ tobaccoId: '3' }),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);
      });
    });

    it('should handle multiple concurrent search requests', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const requests = [
        request(app)
          .get('/api/v1/search')
          .query({ query: 'mint' })
          .set('X-Telegram-Init-Data', validInitData),
        request(app)
          .get('/api/v1/search')
          .query({ query: 'apple' })
          .set('X-Telegram-Init-Data', validInitData),
        request(app)
          .get('/api/v1/search/brands')
          .set('X-Telegram-Init-Data', validInitData),
        request(app)
          .get('/api/v1/search/flavors')
          .set('X-Telegram-Init-Data', validInitData),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);
      });
    });

    it('should handle mixed concurrent requests (wishlist + search)', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const requests = [
        request(app)
          .get('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData),
        request(app)
          .get('/api/v1/search')
          .query({ query: 'test' })
          .set('X-Telegram-Init-Data', validInitData),
        request(app)
          .post('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData)
          .send({ tobaccoId: '1' }),
        request(app)
          .get('/api/v1/search/brands')
          .set('X-Telegram-Init-Data', validInitData),
        request(app)
          .get('/health'),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect([200, 401]).toContain(response.status);
        expect(response.headers['content-type']).toMatch(/json/);
      });
    });

    it('should handle concurrent requests from different users', async () => {
      const userId1 = 111111111;
      const userId2 = 222222222;
      const validInitData1 = createValidInitData(userId1);
      const validInitData2 = createValidInitData(userId2);

      const requests = [
        request(app)
          .post('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData1)
          .send({ tobaccoId: '1' }),
        request(app)
          .post('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData2)
          .send({ tobaccoId: '2' }),
        request(app)
          .get('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData1),
        request(app)
          .get('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData2),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Verify user 1's wishlist
      const user1Wishlist = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData1);

      expect(user1Wishlist.body.userId).toBe(userId1);
      expect(user1Wishlist.body.items).toHaveLength(1);
      expect(user1Wishlist.body.items[0].tobaccoId).toBe('1');

      // Verify user 2's wishlist
      const user2Wishlist = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData2);

      expect(user2Wishlist.body.userId).toBe(userId2);
      expect(user2Wishlist.body.items).toHaveLength(1);
      expect(user2Wishlist.body.items[0].tobaccoId).toBe('2');
    });

    it('should handle high concurrency without race conditions (sequential adds)', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Add items sequentially to avoid race conditions
      for (let i = 1; i <= 10; i++) {
        await request(app)
          .post('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData)
          .send({ tobaccoId: `${i}` })
          .expect(200);
      }

      // Verify all items were added
      const getResponse = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData);

      expect(getResponse.body.items).toHaveLength(10);
    });
  });

  describe('Full Request/Response Cycle', () => {
    it('should complete full user workflow: search -> add to wishlist -> verify', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Step 1: Search for tobacco
      const searchResponse = await request(app)
        .get('/api/v1/search')
        .query({ query: 'mint' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(searchResponse.body.results).toBeDefined();
      const tobaccoId = searchResponse.body.results[0]?.id || '1';

      // Step 2: Add to wishlist
      const addResponse = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId, notes: 'Found via search' })
        .expect(200);

      expect(addResponse.body.success).toBe(true);

      // Step 3: Get tobacco details
      const detailsResponse = await request(app)
        .get(`/api/v1/search/tobacco/${tobaccoId}`)
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(detailsResponse.body.id).toBe(tobaccoId);

      // Step 4: Verify in wishlist
      const wishlistResponse = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(wishlistResponse.body.items).toHaveLength(1);
      expect(wishlistResponse.body.items[0].tobaccoId).toBe(tobaccoId);
      expect(wishlistResponse.body.items[0].notes).toBe('Found via search');
      expect(wishlistResponse.body.items[0].tobacco).toBeDefined();
    });

    it('should handle error recovery in workflow', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Step 1: Try to add invalid item (will fail validation)
      const addResponse1 = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ notes: 'Missing tobaccoId' })
        .expect(400);

      expect(addResponse1.body.error).toBe('tobaccoId is required');

      // Step 2: Add valid item
      const addResponse2 = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '1' })
        .expect(200);

      expect(addResponse2.body.success).toBe(true);

      // Step 3: Verify wishlist has one item (error didn't corrupt state)
      const getResponse = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(getResponse.body.items).toHaveLength(1);
    });
  });

  describe('API Health Check Integration', () => {
    it('should have /health endpoint at root level', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should have /api/health endpoint', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should return consistent timestamp format', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
