/**
 * Integration tests for wishlist routes
 * Tests the HTTP request/response cycle, authentication middleware integration,
 * controller integration, and error handling
 */

import express, { Express } from 'express';
import request from 'supertest';
import crypto from 'crypto';
import wishlistRoutes from '@/api/routes/wishlist';
import { wishlistStorage } from '@/storage';
import { createWishlist, createWishlistItem, sampleTobaccos } from '../../fixtures/mockData';
import { Wishlist, WishlistItem } from '@/models/wishlist';
import { Tobacco } from '@/models/tobacco';
import searchService from '@/services/search.service';

// Mock search service
jest.mock('@/services/search.service');

describe('Wishlist Routes Integration Tests', () => {
  let app: Express;
  const TEST_USER_ID = 123456789;
  const TEST_BOT_TOKEN = 'test-bot-token';

  beforeAll(() => {
    // Set environment variables for testing
    process.env.TELEGRAM_BOT_TOKEN = TEST_BOT_TOKEN;
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/v1/wishlist', wishlistRoutes);

    // Clear storage before each test
    await wishlistStorage.clear();

    // Mock search service methods
    (searchService.getTobaccoDetails as jest.Mock).mockImplementation((tobaccoId: string) => {
      return sampleTobaccos.find((t: Tobacco) => t.id === tobaccoId) || null;
    });
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
    describe('GET /api/v1/wishlist', () => {
      it('should return 401 when missing initData', async () => {
        const response = await request(app)
          .get('/api/v1/wishlist')
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Missing Telegram init data');
        expect(response.body.code).toBe('MISSING_INIT_DATA');
      });

      it('should return 401 when invalid initData signature', async () => {
        const invalidInitData = createInvalidInitData(TEST_USER_ID);

        const response = await request(app)
          .get('/api/v1/wishlist')
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
          .get('/api/v1/wishlist')
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
          .get('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('userId');
        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('POST /api/v1/wishlist', () => {
      it('should return 401 when missing initData', async () => {
        const response = await request(app)
          .post('/api/v1/wishlist')
          .send({ tobaccoId: '1' })
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('MISSING_INIT_DATA');
      });

      it('should return 401 when invalid initData', async () => {
        const invalidInitData = createInvalidInitData(TEST_USER_ID);

        const response = await request(app)
          .post('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', invalidInitData)
          .send({ tobaccoId: '1' })
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body.code).toBe('INVALID_SIGNATURE');
      });

      it('should return 200 when valid initData', async () => {
        const validInitData = createValidInitData(TEST_USER_ID);

        const response = await request(app)
          .post('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', validInitData)
          .send({ tobaccoId: '1' })
          .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('wishlist');
      });
    });

    describe('DELETE /api/v1/wishlist/:tobaccoId', () => {
      it('should return 401 when missing initData', async () => {
        const response = await request(app)
          .delete('/api/v1/wishlist/1')
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('MISSING_INIT_DATA');
      });

      it('should return 401 when invalid initData', async () => {
        const invalidInitData = createInvalidInitData(TEST_USER_ID);

        const response = await request(app)
          .delete('/api/v1/wishlist/1')
          .set('X-Telegram-Init-Data', invalidInitData)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body.code).toBe('INVALID_SIGNATURE');
      });
    });

    describe('DELETE /api/v1/wishlist', () => {
      it('should return 401 when missing initData', async () => {
        const response = await request(app)
          .delete('/api/v1/wishlist')
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('MISSING_INIT_DATA');
      });

      it('should return 401 when invalid initData', async () => {
        const invalidInitData = createInvalidInitData(TEST_USER_ID);

        const response = await request(app)
          .delete('/api/v1/wishlist')
          .set('X-Telegram-Init-Data', invalidInitData)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(401);
        expect(response.body.code).toBe('INVALID_SIGNATURE');
      });
    });
  });

  describe('GET /api/v1/wishlist - Retrieve Wishlist', () => {
    it('should return empty wishlist for new user', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toEqual({
        userId: TEST_USER_ID,
        items: [],
        total: 0,
      });
    });

    it('should return existing wishlist with items', async () => {
      // Setup: Create a wishlist with items
      const wishlist: Wishlist = createWishlist({
        userId: TEST_USER_ID,
        items: [
          createWishlistItem({ tobaccoId: '1', notes: 'Favorite' }),
          createWishlistItem({ tobaccoId: '2', notes: 'Try soon' }),
        ],
      });

      await wishlistStorage.set(`wishlist_${TEST_USER_ID}`, wishlist);

      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('userId', TEST_USER_ID);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total', 2);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0]).toHaveProperty('tobaccoId', '1');
      expect(response.body.items[0]).toHaveProperty('tobacco');
    });

    it('should return 500 on service error', async () => {
      // Mock storage to throw error
      jest.spyOn(wishlistStorage, 'get').mockRejectedValueOnce(new Error('Database error'));

      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Failed to get wishlist');

      jest.restoreAllMocks();
    });
  });

  describe('POST /api/v1/wishlist - Add Item to Wishlist', () => {
    it('should add item to wishlist successfully', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '1', notes: 'Test note' })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('wishlist');
      expect(response.body.wishlist).toHaveProperty('userId', TEST_USER_ID);
      expect(response.body.wishlist).toHaveProperty('items');
      expect(response.body.wishlist.items).toHaveLength(1);
      expect(response.body.wishlist.items[0]).toHaveProperty('tobaccoId', '1');
      expect(response.body.wishlist.items[0]).toHaveProperty('notes', 'Test note');
    });

    it('should add multiple items to wishlist', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Add first item
      await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '1' })
        .expect(200);

      // Add second item
      const response = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '2' })
        .expect(200);

      expect(response.body.wishlist.items).toHaveLength(2);
    });

    it('should return 400 when tobaccoId is missing', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ notes: 'Test note' })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'tobaccoId is required');
    });

    it('should return 409 when adding duplicate item', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      // Add first item
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
        .expect(409)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Tobacco already in wishlist');
    });

    it('should return 500 on service error', async () => {
      // Mock storage to throw error
      jest.spyOn(wishlistStorage, 'set').mockRejectedValueOnce(new Error('Database error'));

      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '1' })
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Failed to add to wishlist');

      jest.restoreAllMocks();
    });
  });

  describe('DELETE /api/v1/wishlist/:tobaccoId - Remove Item from Wishlist', () => {
    it('should remove item from wishlist successfully', async () => {
      // Setup: Create a wishlist with items
      const wishlist: Wishlist = createWishlist({
        userId: TEST_USER_ID,
        items: [
          createWishlistItem({ tobaccoId: '1' }),
          createWishlistItem({ tobaccoId: '2' }),
        ],
      });

      await wishlistStorage.set(`wishlist_${TEST_USER_ID}`, wishlist);

      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .delete('/api/v1/wishlist/1')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('wishlist');
      expect(response.body.wishlist.items).toHaveLength(1);
      expect(response.body.wishlist.items[0]).toHaveProperty('tobaccoId', '2');
    });

    it('should return 404 when wishlist not found', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .delete('/api/v1/wishlist/1')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Wishlist not found');
    });

    it('should return 404 when tobacco not found in wishlist', async () => {
      // Setup: Create a wishlist with items
      const wishlist: Wishlist = createWishlist({
        userId: TEST_USER_ID,
        items: [createWishlistItem({ tobaccoId: '1' })],
      });

      await wishlistStorage.set(`wishlist_${TEST_USER_ID}`, wishlist);

      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .delete('/api/v1/wishlist/999')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Tobacco not found in wishlist');
    });

    it('should return 500 on service error', async () => {
      // Mock storage to throw error
      jest.spyOn(wishlistStorage, 'get').mockRejectedValueOnce(new Error('Database error'));

      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .delete('/api/v1/wishlist/1')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Failed to remove from wishlist');

      jest.restoreAllMocks();
    });
  });

  describe('DELETE /api/v1/wishlist - Clear Wishlist', () => {
    it('should clear all items from wishlist successfully', async () => {
      // Setup: Create a wishlist with items
      const wishlist: Wishlist = createWishlist({
        userId: TEST_USER_ID,
        items: [
          createWishlistItem({ tobaccoId: '1' }),
          createWishlistItem({ tobaccoId: '2' }),
          createWishlistItem({ tobaccoId: '3' }),
        ],
      });

      await wishlistStorage.set(`wishlist_${TEST_USER_ID}`, wishlist);

      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .delete('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Wishlist cleared successfully');

      // Verify wishlist is cleared
      const clearedWishlist = await wishlistStorage.get(`wishlist_${TEST_USER_ID}`) as Wishlist;
      expect(clearedWishlist.items).toHaveLength(0);
    });

    it('should return 404 when wishlist not found', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .delete('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Wishlist not found');
    });

    it('should return 500 on service error', async () => {
      // Mock storage to throw error
      jest.spyOn(wishlistStorage, 'get').mockRejectedValueOnce(new Error('Database error'));

      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .delete('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Failed to clear wishlist');

      jest.restoreAllMocks();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty wishlist correctly', async () => {
      // Setup: Create empty wishlist
      const wishlist: Wishlist = createWishlist({
        userId: TEST_USER_ID,
        items: [],
      });

      await wishlistStorage.set(`wishlist_${TEST_USER_ID}`, wishlist);

      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(response.body.items).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it('should handle large wishlists', async () => {
      // Setup: Create wishlist with 100 items
      const items: WishlistItem[] = Array.from({ length: 100 }, (_, i) =>
        createWishlistItem({ tobaccoId: `${i + 1}` })
      );

      const wishlist: Wishlist = createWishlist({
        userId: TEST_USER_ID,
        items,
      });

      await wishlistStorage.set(`wishlist_${TEST_USER_ID}`, wishlist);

      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .expect(200);

      expect(response.body.items).toHaveLength(100);
      expect(response.body.total).toBe(100);
    });

    it('should handle adding item without notes', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '1' })
        .expect(200);

      expect(response.body.wishlist.items[0]).toHaveProperty('tobaccoId', '1');
      expect(response.body.wishlist.items[0].notes).toBeUndefined();
    });

    it('should handle special characters in notes', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);
      const specialNotes = 'Test with émojis 🚀 and spëcial çhars!';

      const response = await request(app)
        .post('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData)
        .send({ tobaccoId: '1', notes: specialNotes })
        .expect(200);

      expect(response.body.wishlist.items[0].notes).toBe(specialNotes);
    });

    it('should handle different user IDs correctly', async () => {
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
  });

  describe('Request/Response Format', () => {
    it('should return proper JSON content-type header', async () => {
      const validInitData = createValidInitData(TEST_USER_ID);

      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('X-Telegram-Init-Data', validInitData);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should include proper error messages', async () => {
      const response = await request(app)
        .get('/api/v1/wishlist')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should include error codes for authentication failures', async () => {
      const response = await request(app)
        .get('/api/v1/wishlist')
        .expect(401);

      expect(response.body).toHaveProperty('code');
      expect(typeof response.body.code).toBe('string');
    });
  });
});
