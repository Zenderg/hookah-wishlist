/**
 * Unit tests for WishlistController
 */

import { wishlistController } from '@/api/controllers/wishlist.controller';
import wishlistService from '@/services/wishlist.service';
import {
  createMockRequest,
  createMockResponse,
  createAuthenticatedRequest,
  testController,
} from '../../../tests/mocks/mockExpress';
import { createWishlist, createWishlistItem } from '../../../tests/fixtures/mockData';

// Mock the wishlist service
jest.mock('@/services/wishlist.service');

describe('WishlistController', () => {
  let mockWishlistService: jest.Mocked<typeof wishlistService>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Get the mocked service
    mockWishlistService = wishlistService as jest.Mocked<typeof wishlistService>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getWishlist', () => {
    describe('Authentication', () => {
      it('should return 401 when telegramUser is missing', async () => {
        const req = createMockRequest({
          telegramUser: undefined,
        });
        const res = createMockResponse();

        await testController(wishlistController.getWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'Unauthorized: Invalid user' });
      });

      it('should return 401 when telegramUser.userId is missing', async () => {
        const req = createMockRequest({
          telegramUser: {
            userId: undefined as any,
            user: { id: 123456789, username: 'testuser', first_name: 'Test', last_name: 'User', language_code: 'en' },
            initData: 'test',
          },
        });
        const res = createMockResponse();

        await testController(wishlistController.getWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'Unauthorized: Invalid user' });
      });
    });

    describe('Success cases', () => {
      it('should return user wishlist with items', async () => {
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [
            createWishlistItem({ tobaccoId: '1', notes: 'Favorite' }),
            createWishlistItem({ tobaccoId: '2', notes: 'Try this' }),
          ],
        });

        mockWishlistService.getWishlistWithDetails.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.getWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
          userId: 123456789,
          items: mockWishlist.items,
          total: 2,
          createdAt: mockWishlist.createdAt,
          updatedAt: mockWishlist.updatedAt,
        });
        expect(mockWishlistService.getWishlistWithDetails).toHaveBeenCalledWith(123456789);
      });

      it('should return empty wishlist when user has no wishlist', async () => {
        mockWishlistService.getWishlistWithDetails.mockResolvedValue(null);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.getWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
          userId: 123456789,
          items: [],
          total: 0,
        });
        expect(mockWishlistService.getWishlistWithDetails).toHaveBeenCalledWith(123456789);
      });

      it('should return wishlist with single item', async () => {
        const mockWishlist = createWishlist({
          userId: 987654321,
          items: [createWishlistItem({ tobaccoId: '3' })],
        });

        mockWishlistService.getWishlistWithDetails.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(987654321);
        const res = createMockResponse();

        await testController(wishlistController.getWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.total).toBe(1);
        expect(res.body.items).toHaveLength(1);
      });
    });

    describe('Error handling', () => {
      it('should return 500 when service throws error', async () => {
        mockWishlistService.getWishlistWithDetails.mockRejectedValue(new Error('Database error'));

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.getWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to get wishlist' });
      });

      it('should return 500 when service throws unexpected error', async () => {
        mockWishlistService.getWishlistWithDetails.mockRejectedValue(new Error('Unexpected error'));

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.getWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to get wishlist' });
      });
    });

    describe('Edge cases', () => {
      it('should handle large wishlist', async () => {
        const largeWishlist = createWishlist({
          userId: 123456789,
          items: Array.from({ length: 100 }, (_, i) =>
            createWishlistItem({ tobaccoId: `${i}` })
          ),
        });

        mockWishlistService.getWishlistWithDetails.mockResolvedValue(largeWishlist);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.getWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.total).toBe(100);
        expect(res.body.items).toHaveLength(100);
      });

      it('should handle wishlist with special characters in tobacco IDs', async () => {
        const wishlistWithSpecialChars = createWishlist({
          userId: 123456789,
          items: [
            createWishlistItem({ tobaccoId: 'tobacco-123' }),
            createWishlistItem({ tobaccoId: 'tobacco_456' }),
            createWishlistItem({ tobaccoId: 'tobacco.789' }),
          ],
        });

        mockWishlistService.getWishlistWithDetails.mockResolvedValue(wishlistWithSpecialChars);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.getWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.items).toHaveLength(3);
      });
    });
  });

  describe('addItem', () => {
    describe('Authentication', () => {
      it('should return 401 when telegramUser is missing', async () => {
        const req = createMockRequest({
          body: { tobaccoId: '1' },
          telegramUser: undefined,
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'Unauthorized: Invalid user' });
      });
    });

    describe('Request validation', () => {
      it('should return 400 when tobaccoId is missing', async () => {
        const req = createAuthenticatedRequest(123456789, {
          body: {},
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'tobaccoId is required' });
        expect(mockWishlistService.addItem).not.toHaveBeenCalled();
      });

      it('should return 400 when tobaccoId is empty string', async () => {
        const req = createAuthenticatedRequest(123456789, {
          body: { tobaccoId: '' },
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'tobaccoId is required' });
        expect(mockWishlistService.addItem).not.toHaveBeenCalled();
      });

      it('should accept valid tobaccoId with notes', async () => {
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [createWishlistItem({ tobaccoId: '1', notes: 'Test note' })],
        });

        mockWishlistService.addItem.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789, {
          body: { tobaccoId: '1', notes: 'Test note' },
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockWishlistService.addItem).toHaveBeenCalledWith(123456789, '1', 'Test note');
      });

      it('should accept valid tobaccoId without notes', async () => {
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [createWishlistItem({ tobaccoId: '1' })],
        });

        mockWishlistService.addItem.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789, {
          body: { tobaccoId: '1' },
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockWishlistService.addItem).toHaveBeenCalledWith(123456789, '1', undefined);
      });
    });

    describe('Success cases', () => {
      it('should add item to wishlist successfully', async () => {
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [createWishlistItem({ tobaccoId: '1' })],
        });

        mockWishlistService.addItem.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789, {
          body: { tobaccoId: '1' },
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
          success: true,
          wishlist: {
            userId: 123456789,
            items: mockWishlist.items,
            total: 1,
            updatedAt: mockWishlist.updatedAt,
          },
        });
        expect(mockWishlistService.addItem).toHaveBeenCalledWith(123456789, '1', undefined);
      });

      it('should add item with notes to wishlist', async () => {
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [createWishlistItem({ tobaccoId: '1', notes: 'Great flavor!' })],
        });

        mockWishlistService.addItem.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789, {
          body: { tobaccoId: '1', notes: 'Great flavor!' },
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.wishlist.items[0].notes).toBe('Great flavor!');
        expect(mockWishlistService.addItem).toHaveBeenCalledWith(123456789, '1', 'Great flavor!');
      });
    });

    describe('Error handling', () => {
      it('should return 409 when tobacco already in wishlist', async () => {
        const error = new Error('Tobacco already in wishlist');
        mockWishlistService.addItem.mockRejectedValue(error);

        const req = createAuthenticatedRequest(123456789, {
          body: { tobaccoId: '1' },
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(409);
        expect(res.body).toEqual({ error: 'Tobacco already in wishlist' });
      });

      it('should return 500 when service throws unexpected error', async () => {
        mockWishlistService.addItem.mockRejectedValue(new Error('Database error'));

        const req = createAuthenticatedRequest(123456789, {
          body: { tobaccoId: '1' },
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to add to wishlist' });
      });
    });

    describe('Edge cases', () => {
      it('should handle special characters in tobaccoId', async () => {
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [createWishlistItem({ tobaccoId: 'tobacco-123_abc' })],
        });

        mockWishlistService.addItem.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789, {
          body: { tobaccoId: 'tobacco-123_abc' },
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockWishlistService.addItem).toHaveBeenCalledWith(123456789, 'tobacco-123_abc', undefined);
      });

      it('should handle very long notes', async () => {
        const longNotes = 'A'.repeat(1000);
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [createWishlistItem({ tobaccoId: '1', notes: longNotes })],
        });

        mockWishlistService.addItem.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789, {
          body: { tobaccoId: '1', notes: longNotes },
        });
        const res = createMockResponse();

        await testController(wishlistController.addItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockWishlistService.addItem).toHaveBeenCalledWith(123456789, '1', longNotes);
      });
    });
  });

  describe('removeItem', () => {
    describe('Authentication', () => {
      it('should return 401 when telegramUser is missing', async () => {
        const req = createMockRequest({
          params: { tobaccoId: '1' },
          telegramUser: undefined,
        });
        const res = createMockResponse();

        await testController(wishlistController.removeItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'Unauthorized: Invalid user' });
      });
    });

    describe('Request validation', () => {
      it('should return 400 when tobaccoId is missing from params', async () => {
        const req = createAuthenticatedRequest(123456789, {
          params: {},
        });
        const res = createMockResponse();

        await testController(wishlistController.removeItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'tobaccoId is required' });
        expect(mockWishlistService.removeItem).not.toHaveBeenCalled();
      });

      it('should return 400 when tobaccoId is empty string', async () => {
        const req = createAuthenticatedRequest(123456789, {
          params: { tobaccoId: '' },
        });
        const res = createMockResponse();

        await testController(wishlistController.removeItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'tobaccoId is required' });
        expect(mockWishlistService.removeItem).not.toHaveBeenCalled();
      });
    });

    describe('Success cases', () => {
      it('should remove item from wishlist successfully', async () => {
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [],
        });

        mockWishlistService.removeItem.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789, {
          params: { tobaccoId: '1' },
        });
        const res = createMockResponse();

        await testController(wishlistController.removeItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
          success: true,
          wishlist: {
            userId: 123456789,
            items: [],
            total: 0,
            updatedAt: mockWishlist.updatedAt,
          },
        });
        expect(mockWishlistService.removeItem).toHaveBeenCalledWith(123456789, '1');
      });

      it('should remove item and return remaining items', async () => {
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [
            createWishlistItem({ tobaccoId: '2' }),
            createWishlistItem({ tobaccoId: '3' }),
          ],
        });

        mockWishlistService.removeItem.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789, {
          params: { tobaccoId: '1' },
        });
        const res = createMockResponse();

        await testController(wishlistController.removeItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.wishlist.total).toBe(2);
        expect(res.body.wishlist.items).toHaveLength(2);
      });
    });

    describe('Error handling', () => {
      it('should return 404 when wishlist not found', async () => {
        const error = new Error('Wishlist not found');
        mockWishlistService.removeItem.mockRejectedValue(error);

        const req = createAuthenticatedRequest(123456789, {
          params: { tobaccoId: '1' },
        });
        const res = createMockResponse();

        await testController(wishlistController.removeItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: 'Wishlist not found' });
      });

      it('should return 404 when tobacco not found in wishlist', async () => {
        const error = new Error('Tobacco not found in wishlist');
        mockWishlistService.removeItem.mockRejectedValue(error);

        const req = createAuthenticatedRequest(123456789, {
          params: { tobaccoId: '1' },
        });
        const res = createMockResponse();

        await testController(wishlistController.removeItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: 'Tobacco not found in wishlist' });
      });

      it('should return 500 when service throws unexpected error', async () => {
        mockWishlistService.removeItem.mockRejectedValue(new Error('Database error'));

        const req = createAuthenticatedRequest(123456789, {
          params: { tobaccoId: '1' },
        });
        const res = createMockResponse();

        await testController(wishlistController.removeItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to remove from wishlist' });
      });
    });

    describe('Edge cases', () => {
      it('should handle special characters in tobaccoId', async () => {
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [],
        });

        mockWishlistService.removeItem.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789, {
          params: { tobaccoId: 'tobacco-123_abc' },
        });
        const res = createMockResponse();

        await testController(wishlistController.removeItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockWishlistService.removeItem).toHaveBeenCalledWith(123456789, 'tobacco-123_abc');
      });

      it('should handle removing last item', async () => {
        const mockWishlist = createWishlist({
          userId: 123456789,
          items: [],
        });

        mockWishlistService.removeItem.mockResolvedValue(mockWishlist);

        const req = createAuthenticatedRequest(123456789, {
          params: { tobaccoId: '1' },
        });
        const res = createMockResponse();

        await testController(wishlistController.removeItem.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.wishlist.total).toBe(0);
        expect(res.body.wishlist.items).toHaveLength(0);
      });
    });
  });

  describe('clearWishlist', () => {
    describe('Authentication', () => {
      it('should return 401 when telegramUser is missing', async () => {
        const req = createMockRequest({
          telegramUser: undefined,
        });
        const res = createMockResponse();

        await testController(wishlistController.clearWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'Unauthorized: Invalid user' });
      });
    });

    describe('Success cases', () => {
      it('should clear wishlist successfully', async () => {
        mockWishlistService.clearWishlist.mockResolvedValue(undefined);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.clearWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
          success: true,
          message: 'Wishlist cleared successfully',
        });
        expect(mockWishlistService.clearWishlist).toHaveBeenCalledWith(123456789);
      });
    });

    describe('Error handling', () => {
      it('should return 404 when wishlist not found', async () => {
        const error = new Error('Wishlist not found');
        mockWishlistService.clearWishlist.mockRejectedValue(error);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.clearWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: 'Wishlist not found' });
      });

      it('should return 500 when service throws unexpected error', async () => {
        mockWishlistService.clearWishlist.mockRejectedValue(new Error('Database error'));

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.clearWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to clear wishlist' });
      });
    });

    describe('Edge cases', () => {
      it('should handle clearing empty wishlist', async () => {
        mockWishlistService.clearWishlist.mockResolvedValue(undefined);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.clearWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('should handle clearing large wishlist', async () => {
        mockWishlistService.clearWishlist.mockResolvedValue(undefined);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(wishlistController.clearWishlist.bind(wishlistController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockWishlistService.clearWishlist).toHaveBeenCalledWith(123456789);
      });
    });
  });
});
