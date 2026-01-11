/**
 * Unit tests for WishlistService
 */

import { WishlistService } from '@/services/wishlist.service';
import { Storage } from '@/storage/storage.interface';
import { WishlistItem, WishlistWithDetails } from '@/models/wishlist';
import { createWishlist, createWishlistItem, createTobacco } from '../../fixtures/mockData';
import searchService from '@/services/search.service';

// Mock storage module
jest.mock('@/storage', () => {
  // Define mock storage class inline
  class MockStorage<T> implements Storage<T> {
    private data: Map<string, T> = new Map();
    private shouldFail: boolean = false;
    private failMethod: string | null = null;

    setFail(method: string | null) {
      this.shouldFail = method !== null;
      this.failMethod = method;
    }

    async get(key: string): Promise<T | null> {
      if (this.shouldFail && (this.failMethod === 'get' || this.failMethod === 'all')) {
        throw new Error('Storage error: get failed');
      }
      return this.data.get(key) || null;
    }

    async set(key: string, value: T): Promise<void> {
      if (this.shouldFail && (this.failMethod === 'set' || this.failMethod === 'all')) {
        throw new Error('Storage error: set failed');
      }
      this.data.set(key, value);
    }

    async delete(key: string): Promise<void> {
      if (this.shouldFail && (this.failMethod === 'delete' || this.failMethod === 'all')) {
        throw new Error('Storage error: delete failed');
      }
      this.data.delete(key);
    }

    async exists(key: string): Promise<boolean> {
      if (this.shouldFail && (this.failMethod === 'exists' || this.failMethod === 'all')) {
        throw new Error('Storage error: exists failed');
      }
      return this.data.has(key);
    }

    async clear(): Promise<void> {
      if (this.shouldFail && (this.failMethod === 'clear' || this.failMethod === 'all')) {
        throw new Error('Storage error: clear failed');
      }
      this.data.clear();
    }

    // Helper methods for testing
    size(): number {
      return this.data.size;
    }

    has(key: string): boolean {
      return this.data.has(key);
    }
  }

  return {
    wishlistStorage: new MockStorage<any>(),
    userStorage: new MockStorage<any>(),
  };
});

describe('WishlistService', () => {
  let service: WishlistService;
  let mockStorage: any;

  beforeEach(() => {
    // Get the mocked storage instance
    const { wishlistStorage } = require('@/storage');
    mockStorage = wishlistStorage;

    // Clear mock storage
    mockStorage.clear();
    mockStorage.setFail(null);

    // Create service instance
    service = new WishlistService();
  });

  afterEach(() => {
    // Clear mock storage
    mockStorage.clear();
    mockStorage.setFail(null);
  });

  describe('Constructor', () => {
    it('should create service instance', () => {
      expect(service).toBeInstanceOf(WishlistService);
    });

    it('should have all required methods', () => {
      expect(typeof service.getWishlist).toBe('function');
      expect(typeof service.getWishlistWithDetails).toBe('function');
      expect(typeof service.createWishlist).toBe('function');
      expect(typeof service.saveWishlist).toBe('function');
      expect(typeof service.addItem).toBe('function');
      expect(typeof service.removeItem).toBe('function');
      expect(typeof service.clearWishlist).toBe('function');
      expect(typeof service.formatWishlist).toBe('function');
    });
  });

  describe('getWishlist', () => {
    it('should return null for non-existent user', async () => {
      const result = await service.getWishlist(999999);
      expect(result).toBeNull();
    });

    it('should return existing wishlist', async () => {
      const wishlist = createWishlist({ userId: 123456789 });
      const key = `wishlist_${wishlist.userId}`;
      await mockStorage.set(key, wishlist);

      const result = await service.getWishlist(wishlist.userId);
      expect(result).toEqual(wishlist);
    });

    it('should return wishlist with correct structure', async () => {
      const wishlist = createWishlist({ userId: 123456789 });
      const key = `wishlist_${wishlist.userId}`;
      await mockStorage.set(key, wishlist);

      const result = await service.getWishlist(wishlist.userId);
      expect(result).toHaveProperty('userId', wishlist.userId);
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should handle storage errors gracefully', async () => {
      mockStorage.setFail('get');

      await expect(service.getWishlist(123456789)).rejects.toThrow('Storage error: get failed');
    });
  });

  describe('getWishlistWithDetails', () => {
    it('should return null for non-existent wishlist', async () => {
      const result = await service.getWishlistWithDetails(999999);
      expect(result).toBeNull();
    });

    it('should return wishlist with tobacco details', async () => {
      const wishlist = createWishlist({ userId: 123456789 });
      const key = `wishlist_${wishlist.userId}`;
      await mockStorage.set(key, wishlist);

      // Mock searchService.getTobaccoDetails
      const mockTobacco = createTobacco({ id: wishlist.items[0].tobaccoId });
      jest.spyOn(searchService, 'getTobaccoDetails').mockResolvedValue(mockTobacco);

      const result = await service.getWishlistWithDetails(wishlist.userId);
      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(wishlist.items.length);
      expect(result!.items[0]).toHaveProperty('tobacco');
      expect(result!.items[0].tobacco).toEqual(mockTobacco);
    });

    it('should handle missing tobacco details', async () => {
      const wishlist = createWishlist({ userId: 123456789 });
      const key = `wishlist_${wishlist.userId}`;
      await mockStorage.set(key, wishlist);

      // Mock searchService.getTobaccoDetails to return null
      jest.spyOn(searchService, 'getTobaccoDetails').mockResolvedValue(null);

      const result = await service.getWishlistWithDetails(wishlist.userId);
      expect(result).not.toBeNull();
      expect(result!.items[0].tobacco).toBeUndefined();
    });
  });

  describe('createWishlist', () => {
    it('should create new wishlist with empty items', async () => {
      const userId = 123456789;
      const wishlist = await service.createWishlist(userId);

      expect(wishlist.userId).toBe(userId);
      expect(wishlist.items).toEqual([]);
      expect(wishlist.createdAt).toBeDefined();
      expect(wishlist.updatedAt).toBeDefined();
    });

    it('should save wishlist to storage', async () => {
      const userId = 123456789;
      const wishlist = await service.createWishlist(userId);

      const key = `wishlist_${userId}`;
      const saved = await mockStorage.get(key);
      expect(saved).toEqual(wishlist);
    });

    it('should create wishlist with ISO date strings', async () => {
      const userId = 123456789;
      const wishlist = await service.createWishlist(userId);

      expect(() => new Date(wishlist.createdAt)).not.toThrow();
      expect(() => new Date(wishlist.updatedAt)).not.toThrow();
    });

    it('should handle storage errors', async () => {
      mockStorage.setFail('set');

      await expect(service.createWishlist(123456789)).rejects.toThrow('Storage error: set failed');
    });
  });

  describe('saveWishlist', () => {
    it('should save wishlist to storage', async () => {
      const wishlist = createWishlist({ userId: 123456789 });
      await service.saveWishlist(wishlist);

      const key = `wishlist_${wishlist.userId}`;
      const saved = await mockStorage.get(key);
      expect(saved).toEqual(wishlist);
    });

    it('should overwrite existing wishlist', async () => {
      const userId = 123456789;
      const wishlist1 = createWishlist({ userId });
      const wishlist2 = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '999' })],
      });

      await service.saveWishlist(wishlist1);
      await service.saveWishlist(wishlist2);

      const key = `wishlist_${userId}`;
      const saved = await mockStorage.get(key);
      expect(saved).toEqual(wishlist2);
      expect(saved?.items[0].tobaccoId).toBe('999');
    });

    it('should handle storage errors', async () => {
      const wishlist = createWishlist({ userId: 123456789 });
      mockStorage.setFail('set');

      await expect(service.saveWishlist(wishlist)).rejects.toThrow('Storage error: set failed');
    });
  });

  describe('addItem', () => {
    it('should add item to existing wishlist', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const result = await service.addItem(userId, '123', 'Test note');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].tobaccoId).toBe('123');
      expect(result.items[0].notes).toBe('Test note');
      expect(result.items[0].addedAt).toBeDefined();
    });

    it('should create wishlist if it does not exist', async () => {
      const userId = 123456789;

      const result = await service.addItem(userId, '123');

      expect(result.userId).toBe(userId);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].tobaccoId).toBe('123');
    });

    it('should throw error if item already exists', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '123' })],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await expect(service.addItem(userId, '123')).rejects.toThrow('Tobacco already in wishlist');
    });

    it('should update updatedAt timestamp', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const originalUpdatedAt = wishlist.updatedAt;
      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.addItem(userId, '123');

      expect(result.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should save updated wishlist to storage', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await service.addItem(userId, '123');

      const saved = await mockStorage.get(key);
      expect(saved?.items).toHaveLength(1);
      expect(saved?.items[0].tobaccoId).toBe('123');
    });

    it('should add multiple items sequentially', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await service.addItem(userId, '123');
      await service.addItem(userId, '456');
      await service.addItem(userId, '789');

      const saved = await mockStorage.get(key);
      expect(saved?.items).toHaveLength(3);
      expect(saved?.items[0].tobaccoId).toBe('123');
      expect(saved?.items[1].tobaccoId).toBe('456');
      expect(saved?.items[2].tobaccoId).toBe('789');
    });

    it('should handle storage errors on get', async () => {
      mockStorage.setFail('get');

      await expect(service.addItem(123456789, '123')).rejects.toThrow('Storage error: get failed');
    });

    it('should handle storage errors on set', async () => {
      mockStorage.setFail('set');

      await expect(service.addItem(123456789, '123')).rejects.toThrow('Storage error: set failed');
    });
  });

  describe('removeItem', () => {
    it('should remove item from wishlist', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [
          createWishlistItem({ tobaccoId: '123' }),
          createWishlistItem({ tobaccoId: '456' }),
          createWishlistItem({ tobaccoId: '789' }),
        ],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const result = await service.removeItem(userId, '456');

      expect(result.items).toHaveLength(2);
      expect(result.items[0].tobaccoId).toBe('123');
      expect(result.items[1].tobaccoId).toBe('789');
    });

    it('should throw error if wishlist does not exist', async () => {
      await expect(service.removeItem(999999, '123')).rejects.toThrow('Wishlist not found');
    });

    it('should throw error if item does not exist', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '123' })],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await expect(service.removeItem(userId, '999')).rejects.toThrow('Tobacco not found in wishlist');
    });

    it('should update updatedAt timestamp', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '123' })],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const originalUpdatedAt = wishlist.updatedAt;
      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.removeItem(userId, '123');

      expect(result.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should save updated wishlist to storage', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '123' })],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await service.removeItem(userId, '123');

      const saved = await mockStorage.get(key);
      expect(saved?.items).toHaveLength(0);
    });

    it('should handle removing first item', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [
          createWishlistItem({ tobaccoId: '123' }),
          createWishlistItem({ tobaccoId: '456' }),
        ],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const result = await service.removeItem(userId, '123');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].tobaccoId).toBe('456');
    });

    it('should handle removing last item', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [
          createWishlistItem({ tobaccoId: '123' }),
          createWishlistItem({ tobaccoId: '456' }),
        ],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const result = await service.removeItem(userId, '456');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].tobaccoId).toBe('123');
    });

    it('should handle storage errors on get', async () => {
      mockStorage.setFail('get');

      await expect(service.removeItem(123456789, '123')).rejects.toThrow('Storage error: get failed');
    });

    it('should handle storage errors on set', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '123' })],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);
      mockStorage.setFail('set');

      await expect(service.removeItem(userId, '123')).rejects.toThrow('Storage error: set failed');
    });
  });

  describe('clearWishlist', () => {
    it('should clear all items from wishlist', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [
          createWishlistItem({ tobaccoId: '123' }),
          createWishlistItem({ tobaccoId: '456' }),
          createWishlistItem({ tobaccoId: '789' }),
        ],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await service.clearWishlist(userId);

      const saved = await mockStorage.get(key);
      expect(saved?.items).toEqual([]);
    });

    it('should throw error if wishlist does not exist', async () => {
      await expect(service.clearWishlist(999999)).rejects.toThrow('Wishlist not found');
    });

    it('should update updatedAt timestamp', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '123' })],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const originalUpdatedAt = wishlist.updatedAt;
      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.clearWishlist(userId);

      const saved = await mockStorage.get(key);
      expect(saved?.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should preserve userId and timestamps', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '123' })],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await service.clearWishlist(userId);

      const saved = await mockStorage.get(key);
      expect(saved?.userId).toBe(userId);
      expect(saved?.createdAt).toBe(wishlist.createdAt);
      expect(saved?.items).toEqual([]);
    });

    it('should handle storage errors on get', async () => {
      mockStorage.setFail('get');

      await expect(service.clearWishlist(123456789)).rejects.toThrow('Storage error: get failed');
    });

    it('should handle storage errors on set', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '123' })],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);
      mockStorage.setFail('set');

      await expect(service.clearWishlist(userId)).rejects.toThrow('Storage error: set failed');
    });
  });

  describe('formatWishlist', () => {
    it('should return empty message for empty wishlist', () => {
      const wishlist: WishlistWithDetails = {
        userId: 123456789,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = service.formatWishlist(wishlist);

      expect(result).toContain('Your wishlist is empty');
      expect(result).toContain('/search');
      expect(result).toContain('/add');
    });

    it('should format wishlist with items', () => {
      const wishlist: WishlistWithDetails = {
        userId: 123456789,
        items: [
          {
            tobaccoId: '1',
            addedAt: '2024-01-05T10:00:00.000Z',
            notes: 'Test note',
            tobacco: {
              id: '1',
              name: 'Mint',
              brand: 'Al Fakher',
              flavor: 'Mint',
              description: 'Classic mint flavor',
              strength: 'medium',
              image: 'https://example.com/mint.jpg',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-06T10:00:00.000Z',
      };

      const result = service.formatWishlist(wishlist);

      expect(result).toContain('Your Wishlist (1 items)');
      expect(result).toContain('Al Fakher - Mint');
      expect(result).toContain('ID: 1');
      expect(result).toContain('Flavor: Mint');
      expect(result).toContain('Notes: Test note');
      expect(result).toContain('/remove');
    });

    it('should handle items without tobacco details', () => {
      const wishlist: WishlistWithDetails = {
        userId: 123456789,
        items: [
          {
            tobaccoId: '1',
            addedAt: '2024-01-05T10:00:00.000Z',
            notes: 'Test note',
            tobacco: undefined,
          },
        ],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-06T10:00:00.000Z',
      };

      const result = service.formatWishlist(wishlist);

      expect(result).toContain('Unknown - Unknown');
      expect(result).toContain('ID: 1');
      expect(result).toContain('Notes: Test note');
    });

    it('should handle items without notes', () => {
      const wishlist: WishlistWithDetails = {
        userId: 123456789,
        items: [
          {
            tobaccoId: '1',
            addedAt: '2024-01-05T10:00:00.000Z',
            tobacco: {
              id: '1',
              name: 'Mint',
              brand: 'Al Fakher',
              flavor: 'Mint',
              description: 'Classic mint flavor',
              strength: 'medium',
              image: 'https://example.com/mint.jpg',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-06T10:00:00.000Z',
      };

      const result = service.formatWishlist(wishlist);

      expect(result).not.toContain('Notes:');
    });

    it('should format multiple items with correct numbering', () => {
      const wishlist: WishlistWithDetails = {
        userId: 123456789,
        items: [
          {
            tobaccoId: '1',
            addedAt: '2024-01-05T10:00:00.000Z',
            tobacco: {
              id: '1',
              name: 'Mint',
              brand: 'Al Fakher',
              flavor: 'Mint',
              description: 'Classic mint flavor',
              strength: 'medium',
              image: 'https://example.com/mint.jpg',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            tobaccoId: '2',
            addedAt: '2024-01-06T10:00:00.000Z',
            tobacco: {
              id: '2',
              name: 'Double Apple',
              brand: 'Al Fakher',
              flavor: 'Apple',
              description: 'Sweet and sour apple blend',
              strength: 'medium',
              image: 'https://example.com/apple.jpg',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-06T10:00:00.000Z',
      };

      const result = service.formatWishlist(wishlist);

      expect(result).toContain('Your Wishlist (2 items)');
      expect(result).toContain('1. Al Fakher - Mint');
      expect(result).toContain('2. Al Fakher - Double Apple');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty wishlist on remove', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await expect(service.removeItem(userId, '123')).rejects.toThrow('Tobacco not found in wishlist');
    });

    it('should handle large wishlist', async () => {
      const userId = 123456789;
      const items: WishlistItem[] = [];
      for (let i = 0; i < 100; i++) {
        items.push(createWishlistItem({ tobaccoId: `${i}` }));
      }
      const wishlist = createWishlist({ userId, items });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const result = await service.getWishlist(userId);
      expect(result?.items).toHaveLength(100);
    });

    it('should handle special characters in tobaccoId', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const specialIds = ['test-123', 'test_456', 'test.789', 'test 101'];
      for (const id of specialIds) {
        await service.addItem(userId, id);
      }

      const result = await service.getWishlist(userId);
      expect(result?.items).toHaveLength(4);
    });

    it('should handle very long notes', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const longNote = 'a'.repeat(1000);
      await service.addItem(userId, '123', longNote);

      const result = await service.getWishlist(userId);
      expect(result?.items[0].notes).toBe(longNote);
    });

    it('should handle empty notes', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await service.addItem(userId, '123', '');

      const result = await service.getWishlist(userId);
      expect(result?.items[0].notes).toBe('');
    });

    it('should handle undefined notes', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await service.addItem(userId, '123', undefined);

      const result = await service.getWishlist(userId);
      expect(result?.items[0].notes).toBeUndefined();
    });

    it('should handle concurrent add operations', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(service.addItem(userId, `${i}`));
      }

      const results = await Promise.all(promises);
      expect(results[results.length - 1].items).toHaveLength(10);
    });

    it('should handle invalid userId (zero)', async () => {
      const result = await service.addItem(0, '123');
      expect(result.userId).toBe(0);
    });

    it('should handle invalid userId (negative)', async () => {
      const result = await service.addItem(-123, '123');
      expect(result.userId).toBe(-123);
    });

    it('should handle empty tobaccoId', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await service.addItem(userId, '');

      const result = await service.getWishlist(userId);
      expect(result?.items[0].tobaccoId).toBe('');
    });

    it('should handle whitespace tobaccoId', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({ userId, items: [] });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);

      await service.addItem(userId, '  test  ');

      const result = await service.getWishlist(userId);
      expect(result?.items[0].tobaccoId).toBe('  test  ');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors on getWishlist', async () => {
      mockStorage.setFail('get');

      await expect(service.getWishlist(123456789)).rejects.toThrow('Storage error: get failed');
    });

    it('should handle storage errors on createWishlist', async () => {
      mockStorage.setFail('set');

      await expect(service.createWishlist(123456789)).rejects.toThrow('Storage error: set failed');
    });

    it('should handle storage errors on saveWishlist', async () => {
      mockStorage.setFail('set');

      const wishlist = createWishlist({ userId: 123456789 });
      await expect(service.saveWishlist(wishlist)).rejects.toThrow('Storage error: set failed');
    });

    it('should handle storage errors on addItem', async () => {
      mockStorage.setFail('set');

      await expect(service.addItem(123456789, '123')).rejects.toThrow('Storage error: set failed');
    });

    it('should handle storage errors on removeItem', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '123' })],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);
      mockStorage.setFail('set');

      await expect(service.removeItem(userId, '123')).rejects.toThrow('Storage error: set failed');
    });

    it('should handle storage errors on clearWishlist', async () => {
      const userId = 123456789;
      const wishlist = createWishlist({
        userId,
        items: [createWishlistItem({ tobaccoId: '123' })],
      });
      const key = `wishlist_${userId}`;
      await mockStorage.set(key, wishlist);
      mockStorage.setFail('set');

      await expect(service.clearWishlist(userId)).rejects.toThrow('Storage error: set failed');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full wishlist lifecycle', async () => {
      const userId = 123456789;

      // Create wishlist by adding first item
      let wishlist = await service.addItem(userId, '123', 'First item');
      expect(wishlist.items).toHaveLength(1);

      // Add more items
      wishlist = await service.addItem(userId, '456', 'Second item');
      expect(wishlist.items).toHaveLength(2);

      wishlist = await service.addItem(userId, '789', 'Third item');
      expect(wishlist.items).toHaveLength(3);

      // Remove one item
      wishlist = await service.removeItem(userId, '456');
      expect(wishlist.items).toHaveLength(2);
      expect(wishlist.items.find((i) => i.tobaccoId === '456')).toBeUndefined();

      // Clear wishlist
      await service.clearWishlist(userId);
      const result = await service.getWishlist(userId);
      expect(result?.items).toHaveLength(0);
    });

    it('should handle multiple users independently', async () => {
      const user1 = 123456789;
      const user2 = 987654321;

      // Add items to user1
      await service.addItem(user1, '123');
      await service.addItem(user1, '456');

      // Add items to user2
      await service.addItem(user2, '789');
      await service.addItem(user2, '101');

      const wishlist1 = await service.getWishlist(user1);
      const wishlist2 = await service.getWishlist(user2);

      expect(wishlist1?.items).toHaveLength(2);
      expect(wishlist2?.items).toHaveLength(2);
      expect(wishlist1?.items[0].tobaccoId).toBe('123');
      expect(wishlist2?.items[0].tobaccoId).toBe('789');
    });

    it('should maintain data integrity across operations', async () => {
      const userId = 123456789;

      // Create wishlist
      let wishlist = await service.addItem(userId, '123', 'Note 1');
      const originalCreatedAt = wishlist.createdAt;

      // Add more items
      wishlist = await service.addItem(userId, '456', 'Note 2');
      expect(wishlist.createdAt).toBe(originalCreatedAt);

      wishlist = await service.addItem(userId, '789', 'Note 3');
      expect(wishlist.createdAt).toBe(originalCreatedAt);

      // Remove item
      wishlist = await service.removeItem(userId, '456');
      expect(wishlist.createdAt).toBe(originalCreatedAt);

      // Clear wishlist
      await service.clearWishlist(userId);
      const result = await service.getWishlist(userId);
      expect(result?.createdAt).toBe(originalCreatedAt);
    });
  });
});
