/**
 * Integration tests for search routes
 * Tests HTTP request/response cycle, authentication middleware integration,
 * controller integration, and error handling
 */

import express, { Express } from 'express';
import request from 'supertest';
import crypto from 'crypto';
import searchRoutes from '@/api/routes/search';
import searchService from '@/services/search.service';
import { sampleTobaccos, sampleBrands, sampleFlavors, createTobacco } from '../../fixtures/mockData';
import { TobaccoSearchResult } from '@/models/tobacco';

// Mock search service
jest.mock('@/services/search.service');

describe('Search Routes Integration Tests', () => {
  let app: Express;
  const TEST_USER_ID = 123456789;
  const TEST_BOT_TOKEN = 'test-bot-token';

  beforeAll(() => {
    // Set environment variables for testing
    process.env.TELEGRAM_BOT_TOKEN = TEST_BOT_TOKEN;
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/v1/search', searchRoutes);

    // Mock search service methods with default implementations
    (searchService.search as jest.Mock).mockImplementation(
      async (query: string, page: number = 1, pageSize: number = 10): Promise<TobaccoSearchResult> => {
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

    // Mock getTobaccoDetails to return a tobacco for any ID (for testing edge cases)
    (searchService.getTobaccoDetails as jest.Mock).mockImplementation(
      async (id: string) => {
        // First check if it exists in sample data
        const existing = sampleTobaccos.find((t) => t.id === id);
        if (existing) {
          return existing;
        }
        // For testing edge cases, return a mock tobacco for any ID
        return createTobacco({ id });
      }
    );

    (searchService.getAvailableBrands as jest.Mock).mockResolvedValue(sampleBrands);

    (searchService.getAvailableFlavors as jest.Mock).mockResolvedValue(sampleFlavors);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  /**
   * Helper function to create expired init data (old timestamp)
   */
  const createExpiredInitData = (userId: number): string => {
    const user = {
      id: userId,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      language_code: 'en',
    };

    // Use timestamp from 2 days ago (beyond 24-hour limit)
    const authDate = Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000).toString();
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

    // Return initData with expired timestamp
    return `auth_date=${authDate}&user=${userParam}&hash=${hash}`;
  };

  describe('Authentication Tests', () => {
    describe('GET /api/v1/search', () => {
      it('should return 401 when missing initData', async () => {
        const response = await request(app)
          .get('/api/v1/search')
          .query({ query: 'mint' })
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Missing Telegram init data');
        expect(response.body.code).toBe('MISSING_INIT_DATA');
      });

      it('should return 401 when invalid initData signature', async () => {
        const invalidInitData = createInvalidInitData(TEST_USER_ID);

        const response = await request(app)
          .get('/api/v1/search')
          .query({ query: 'mint' })
          .set('X-Telegram-Init-Data', invalidInitData)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid signature');
        expect(response.body.code).toBe('INVALID_SIGNATURE');
      });

      it('should return 401 when expired initData timestamp', async () => {
        const expiredInitData = createExpiredInitData(TEST_USER_ID);

        const response = await request(app)
          .get('/api/v1/search')
          .query({ query: 'mint' })
          .set('X-Telegram-Init-Data', expiredInitData)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Expired authentication data');
        expect(response.body.code).toBe('EXPIRED_AUTH_DATA');
      });

      it('should return 200 when valid initData', async () => {
        const validInitData = createValidInitData(TEST_USER_ID);

        const response = await request(app)
          .get('/api/v1/search')
          .query({ query: 'mint' })
          .set('X-Telegram-Init-Data', validInitData)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('results');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('pageSize');
      });
    });

    describe('GET /api/v1/search/brands', () => {
      it('should return 401 when missing initData', async () => {
        const response = await request(app)
          .get('/api/v1/search/brands')
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('MISSING_INIT_DATA');
      });

      it('should return 200 when valid initData', async () => {
        const validInitData = createValidInitData(TEST_USER_ID);

        const response = await request(app)
          .get('/api/v1/search/brands')
          .set('X-Telegram-Init-Data', validInitData)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('brands');
      });
    });

    describe('GET /api/v1/search/flavors', () => {
      it('should return 401 when missing initData', async () => {
        const response = await request(app)
          .get('/api/v1/search/flavors')
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('MISSING_INIT_DATA');
      });

      it('should return 200 when valid initData', async () => {
        const validInitData = createValidInitData(TEST_USER_ID);

        const response = await request(app)
          .get('/api/v1/search/flavors')
          .set('X-Telegram-Init-Data', validInitData)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('flavors');
      });
    });

    describe('GET /api/v1/search/tobacco/:id', () => {
      it('should return 401 when missing initData', async () => {
        const response = await request(app)
          .get('/api/v1/search/tobacco/1')
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('MISSING_INIT_DATA');
      });

      it('should return 200 when valid initData', async () => {
        const validInitData = createValidInitData(TEST_USER_ID);

        const response = await request(app)
          .get('/api/v1/search/tobacco/1')
          .set('X-Telegram-Init-Data', validInitData)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('brand');
        expect(response.body).toHaveProperty('flavor');
      });
    });
  });

  describe('GET /api/v1/search - Search Tobaccos', () => {
    it('should search tobaccos with valid query', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'mint' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('pageSize', 20); // Default pageSize is 20
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(searchService.search).toHaveBeenCalledWith('mint', 1, 20);
    });

    it('should return 400 when query parameter is missing', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'query parameter is required');
    });

    it('should return 400 when query parameter is empty', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: '' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'query parameter is required');
    });

    it('should return 400 when query parameter is only whitespace', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: '   ' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'query parameter is required');
    });

    it('should handle pagination with page parameter', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', page: 2 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('page', 2);
      expect(searchService.search).toHaveBeenCalledWith('test', 2, 20);
    });

    it('should handle pagination with pageSize parameter', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', pageSize: 5 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('pageSize', 5);
      expect(searchService.search).toHaveBeenCalledWith('test', 1, 5);
    });

    it('should handle pagination with both page and pageSize', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', page: 3, pageSize: 15 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('page', 3);
      expect(response.body).toHaveProperty('pageSize', 15);
      expect(searchService.search).toHaveBeenCalledWith('test', 3, 15);
    });

    it('should return empty results when no matches found', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock to return empty results
      (searchService.search as jest.Mock).mockResolvedValueOnce({
        results: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'nonexistent' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.results).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it('should return 500 on service error', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock service to throw error
      (searchService.search as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Failed to search');
    });

    it('should handle special characters in query', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test & special! chars@#' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(searchService.search).toHaveBeenCalledWith('test & special! chars@#', 1, 20);
    });

    it('should handle Unicode characters in query', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'тест запрос' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(searchService.search).toHaveBeenCalledWith('тест запрос', 1, 20);
    });

    it('should handle very long queries', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);
      const longQuery = 'a'.repeat(1000);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: longQuery })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
    });

    it('should handle invalid pagination parameters', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', page: 'invalid', pageSize: 'invalid' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      // Controller uses parseInt, which returns NaN for invalid strings
      // Service should handle this gracefully
      expect(searchService.search).toHaveBeenCalledWith('test', NaN, NaN);
    });

    it('should handle negative page number', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', page: -1 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(searchService.search).toHaveBeenCalledWith('test', -1, 20);
    });

    it('should handle zero page number', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', page: 0 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(searchService.search).toHaveBeenCalledWith('test', 0, 20);
    });

    it('should handle very large page number', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', page: 999999 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(searchService.search).toHaveBeenCalledWith('test', 999999, 20);
    });

    it('should handle very large pageSize', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', pageSize: 10000 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(searchService.search).toHaveBeenCalledWith('test', 1, 10000);
    });
  });

  describe('GET /api/v1/search/brands - Get Available Brands', () => {
    it('should return list of brands', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search/brands')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('brands');
      expect(Array.isArray(response.body.brands)).toBe(true);
      expect(response.body.brands.length).toBeGreaterThan(0);
      expect(searchService.getAvailableBrands).toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock service to throw error
      (searchService.getAvailableBrands as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      const response = await request(app)
        .get('/api/v1/search/brands')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Failed to get brands');
    });

    it('should return empty array when no brands available', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock to return empty array
      (searchService.getAvailableBrands as jest.Mock).mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/v1/search/brands')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.brands).toHaveLength(0);
    });
  });

  describe('GET /api/v1/search/flavors - Get Available Flavors', () => {
    it('should return list of flavors', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search/flavors')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('flavors');
      expect(Array.isArray(response.body.flavors)).toBe(true);
      expect(response.body.flavors.length).toBeGreaterThan(0);
      expect(searchService.getAvailableFlavors).toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock service to throw error
      (searchService.getAvailableFlavors as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      const response = await request(app)
        .get('/api/v1/search/flavors')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Failed to get flavors');
    });

    it('should return empty array when no flavors available', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock to return empty array
      (searchService.getAvailableFlavors as jest.Mock).mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/v1/search/flavors')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.flavors).toHaveLength(0);
    });
  });

  describe('GET /api/v1/search/tobacco/:id - Get Tobacco Details', () => {
    it('should return tobacco details for valid ID', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search/tobacco/1')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('id', '1');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('brand');
      expect(response.body).toHaveProperty('flavor');
      expect(searchService.getTobaccoDetails).toHaveBeenCalledWith('1');
    });

    it('should return 404 when tobacco not found', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock to return null (not found)
      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/v1/search/tobacco/999')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Tobacco not found');
    });

    it('should return 500 on service error', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock service to throw error
      (searchService.getTobaccoDetails as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      const response = await request(app)
        .get('/api/v1/search/tobacco/1')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Failed to get tobacco details');
    });

    it('should handle numeric ID as string', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search/tobacco/123')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(searchService.getTobaccoDetails).toHaveBeenCalledWith('123');
    });

    it('should handle alphanumeric ID', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search/tobacco/al-fakher-mint')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(searchService.getTobaccoDetails).toHaveBeenCalledWith('al-fakher-mint');
    });

    it('should handle special characters in ID', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search/tobacco/test-id_123')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(searchService.getTobaccoDetails).toHaveBeenCalledWith('test-id_123');
    });

    it('should handle empty ID', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search/tobacco/')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(404); // Will return 404 because route doesn't match

      expect(searchService.getTobaccoDetails).not.toHaveBeenCalled();
    });

    it('should handle very long ID', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);
      const longId = 'a'.repeat(1000);

      await request(app)
        .get(`/api/v1/search/tobacco/${longId}`)
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(searchService.getTobaccoDetails).toHaveBeenCalledWith(longId);
    });

    it('should include all tobacco properties in response', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search/tobacco/1')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      // Check for expected properties
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('brand');
      expect(response.body).toHaveProperty('flavor');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('strength');
      expect(response.body).toHaveProperty('image');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });

  describe('Request/Response Format', () => {
    it('should return proper JSON content-type header for search', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test' })
        .set('X-Telegram-Init-Data', validInitData);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return proper JSON content-type header for brands', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search/brands')
        .set('X-Telegram-Init-Data', validInitData);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return proper JSON content-type header for flavors', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search/flavors')
        .set('X-Telegram-Init-Data', validInitData);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return proper JSON content-type header for tobacco details', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search/tobacco/1')
        .set('X-Telegram-Init-Data', validInitData);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should include proper error messages', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should include error codes for authentication failures', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test' })
        .expect(401);

      expect(response.body).toHaveProperty('code');
      expect(typeof response.body.code).toBe('string');
    });

    it('should include pagination metadata in search results', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', page: 2, pageSize: 5 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(response.body).toHaveProperty('page', 2);
      expect(response.body).toHaveProperty('pageSize', 5);
      expect(response.body).toHaveProperty('total');
      expect(typeof response.body.total).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
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

    it('should handle query with only numbers', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: '123' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith('123', 1, 20);
    });

    it('should handle query with only special characters', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: '!@#$%^&*()' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith('!@#$%^&*()', 1, 20);
    });

    it('should handle mixed case queries', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: 'MiXeD CaSe QuErY' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith('MiXeD CaSe QuErY', 1, 20);
    });

    it('should handle query with leading/trailing whitespace', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: '  test  ' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith('  test  ', 1, 20);
    });

    it('should handle query with newlines and tabs', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: 'test\nquery\twith\twhitespace' })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith('test\nquery\twith\twhitespace', 1, 20);
    });

    it('should handle pagination beyond available results', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock to return empty results for page 100
      (searchService.search as jest.Mock).mockResolvedValueOnce({
        results: [],
        total: 10,
        page: 100,
        pageSize: 20,
      });

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', page: 100 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(response.body.results).toHaveLength(0);
      expect(response.body.total).toBe(10);
      expect(response.body.page).toBe(100);
    });

    it('should handle pageSize of 1', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', pageSize: 1 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith('test', 1, 1);
    });

    it('should handle large result sets', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Mock to return large result set
      const largeResults = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `Tobacco ${i}`,
        brand: 'Test Brand',
        flavor: 'Test Flavor',
      }));

      (searchService.search as jest.Mock).mockResolvedValueOnce({
        results: largeResults,
        total: 1000,
        page: 1,
        pageSize: 100,
      });

      const response = await request(app)
        .get('/api/v1/search')
        .query({ query: 'test', pageSize: 100 })
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(response.body.results).toHaveLength(100);
      expect(response.body.total).toBe(1000);
    });
  });
});
