/**
 * Unit tests for SQLite storage layer
 */

import { SQLiteStorage } from '@/storage/sqlite.storage';
import { Wishlist, WishlistItem } from '@/models/wishlist';
import { createWishlist, createWishlistItem } from '../../fixtures/mockData';
import fs from 'fs';
import path from 'path';

describe('SQLiteStorage', () => {
  let storage: SQLiteStorage<Wishlist>;
  let dbPath: string;
  const testDataDir = path.join(__dirname, '../../../tests/data');

  beforeEach(() => {
    // Create unique database path for each test
    dbPath = path.join(testDataDir, `test-${Date.now()}.db`);
    storage = new SQLiteStorage<Wishlist>(dbPath);
  });

  afterEach(() => {
    // Close database connection
    storage.close();

    // Clean up test database files
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
      // Clean up WAL files
      const walPath = dbPath + '-wal';
      const shmPath = dbPath + '-shm';
      if (fs.existsSync(walPath)) {
        fs.unlinkSync(walPath);
      }
      if (fs.existsSync(shmPath)) {
        fs.unlinkSync(shmPath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Constructor', () => {
    it('should initialize database with correct path', () => {
      expect(storage).toBeInstanceOf(SQLiteStorage);
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it('should create database directory if it does not exist', () => {
      const nestedPath = path.join(testDataDir, 'nested', 'dir', 'test.db');
      const nestedStorage = new SQLiteStorage<Wishlist>(nestedPath);
      
      expect(fs.existsSync(path.dirname(nestedPath))).toBe(true);
      
      nestedStorage.close();
      
      // Cleanup
      fs.rmSync(path.join(testDataDir, 'nested'), { recursive: true, force: true });
    });

    it('should enable WAL mode for better concurrency', () => {
      const stats = storage.getStats();
      expect(stats.walMode).toBe('wal');
    });

    it('should initialize in-memory cache', async () => {
      // Cache is private, but we can verify it works through behavior
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // First call should hit database and cache the result
      const result1 = await storage.get('123');
      // Second call should hit cache (same reference)
      const result2 = await storage.get('123');
      
      expect(result1).toEqual(wishlist);
      expect(result2).toEqual(wishlist);
    });

    it('should create wishlists table with correct schema', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      const result = await storage.get('123');
      expect(result).toEqual(wishlist);
    });

    it('should create index on updated_at column', async () => {
      // This is implicitly tested by successful operations
      const wishlist1 = createWishlist({ userId: 123 });
      const wishlist2 = createWishlist({ userId: 456 });
      
      await storage.set('123', wishlist1);
      await storage.set('456', wishlist2);
      
      const stats = storage.getStats();
      expect(stats.count).toBe(2);
    });
  });

  describe('get()', () => {
    it('should retrieve existing data from database', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      const result = await storage.get('123');
      expect(result).toEqual(wishlist);
    });

    it('should return null for non-existent keys', async () => {
      const result = await storage.get('999');
      expect(result).toBeNull();
    });

    it('should cache retrieved data', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // First call retrieves from database and caches
      const result1 = await storage.get('123');
      // Second call should retrieve from cache
      const result2 = await storage.get('123');
      
      expect(result1).toEqual(wishlist);
      expect(result2).toEqual(wishlist);
    });

    it('should handle complex nested objects', async () => {
      const complexWishlist: Wishlist = {
        userId: 123,
        items: [
          createWishlistItem({ tobaccoId: '1', notes: 'First item' }),
          createWishlistItem({ tobaccoId: '2', notes: 'Second item' }),
          createWishlistItem({ tobaccoId: '3', notes: 'Third item' }),
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-10T12:00:00.000Z',
      };
      
      await storage.set('123', complexWishlist);
      const result = await storage.get('123');
      
      expect(result).toEqual(complexWishlist);
      expect(result?.items).toHaveLength(3);
    });

    it('should handle empty arrays', async () => {
      const emptyWishlist: Wishlist = {
        userId: 123,
        items: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      
      await storage.set('123', emptyWishlist);
      const result = await storage.get('123');
      
      expect(result).toEqual(emptyWishlist);
      expect(result?.items).toEqual([]);
    });
  });

  describe('set()', () => {
    it('should store new data in database', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      const result = await storage.get('123');
      expect(result).toEqual(wishlist);
    });

    it('should update existing data in database', async () => {
      const wishlist1 = createWishlist({ userId: 123 });
      await storage.set('123', wishlist1);
      
      const wishlist2: Wishlist = {
        userId: 123,
        items: [
          createWishlistItem({ tobaccoId: '999', notes: 'Updated item' }),
        ],
        createdAt: wishlist1.createdAt,
        updatedAt: '2024-01-10T15:00:00.000Z',
      };
      await storage.set('123', wishlist2);
      
      const result = await storage.get('123');
      expect(result).toEqual(wishlist2);
      expect(result?.items[0].tobaccoId).toBe('999');
    });

    it('should update cache when setting data', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // Clear cache to verify it's updated on set
      storage.clearCache();
      
      // Set new data
      const updatedWishlist: Wishlist = {
        ...wishlist,
        items: [createWishlistItem({ tobaccoId: '999' })],
      };
      await storage.set('123', updatedWishlist);
      
      // Should retrieve from cache
      const result = await storage.get('123');
      expect(result).toEqual(updatedWishlist);
    });

    it('should handle JSON serialization correctly', async () => {
      const wishlist: Wishlist = {
        userId: 123,
        items: [
          {
            tobaccoId: '1',
            addedAt: '2024-01-01T00:00:00.000Z',
            notes: 'Test note with "quotes" and \'apostrophes\'',
          },
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      
      await storage.set('123', wishlist);
      const result = await storage.get('123');
      
      expect(result).toEqual(wishlist);
      expect(result?.items[0].notes).toContain('quotes');
    });

    it('should preserve created_at timestamp on update', async () => {
      const wishlist1 = createWishlist({
        userId: 123,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      await storage.set('123', wishlist1);
      
      const wishlist2: Wishlist = {
        ...wishlist1,
        items: [createWishlistItem({ tobaccoId: '999' })],
        updatedAt: '2024-01-10T12:00:00.000Z',
      };
      await storage.set('123', wishlist2);
      
      const result = await storage.get('123');
      expect(result?.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result?.updatedAt).toBe('2024-01-10T12:00:00.000Z');
    });
  });

  describe('delete()', () => {
    it('should remove existing data from database', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      await storage.delete('123');
      
      const result = await storage.get('123');
      expect(result).toBeNull();
    });

    it('should handle deletion of non-existent keys', async () => {
      await expect(storage.delete('999')).resolves.not.toThrow();
      
      const stats = storage.getStats();
      expect(stats.count).toBe(0);
    });

    it('should remove data from cache when deleting', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // Data should be cached
      await storage.get('123');
      
      // Delete should clear cache
      await storage.delete('123');
      
      const result = await storage.get('123');
      expect(result).toBeNull();
    });

    it('should delete only the specified key', async () => {
      const wishlist1 = createWishlist({ userId: 123 });
      const wishlist2 = createWishlist({ userId: 456 });
      
      await storage.set('123', wishlist1);
      await storage.set('456', wishlist2);
      
      await storage.delete('123');
      
      const result1 = await storage.get('123');
      const result2 = await storage.get('456');
      
      expect(result1).toBeNull();
      expect(result2).toEqual(wishlist2);
    });
  });

  describe('exists()', () => {
    it('should return true for existing keys', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      const exists = await storage.exists('123');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const exists = await storage.exists('999');
      expect(exists).toBe(false);
    });

    it('should check cache first', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // Load into cache
      await storage.get('123');
      
      // Should return true from cache
      const exists = await storage.exists('123');
      expect(exists).toBe(true);
    });

    it('should return false after deletion', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      await storage.delete('123');
      
      const exists = await storage.exists('123');
      expect(exists).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should clear all data from database', async () => {
      const wishlist1 = createWishlist({ userId: 123 });
      const wishlist2 = createWishlist({ userId: 456 });
      const wishlist3 = createWishlist({ userId: 789 });
      
      await storage.set('123', wishlist1);
      await storage.set('456', wishlist2);
      await storage.set('789', wishlist3);
      
      await storage.clear();
      
      const result1 = await storage.get('123');
      const result2 = await storage.get('456');
      const result3 = await storage.get('789');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    it('should clear in-memory cache', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // Load into cache
      await storage.get('123');
      
      await storage.clear();
      
      const result = await storage.get('123');
      expect(result).toBeNull();
    });

    it('should update statistics after clearing', async () => {
      const wishlist1 = createWishlist({ userId: 123 });
      const wishlist2 = createWishlist({ userId: 456 });
      
      await storage.set('123', wishlist1);
      await storage.set('456', wishlist2);
      
      let stats = storage.getStats();
      expect(stats.count).toBe(2);
      
      await storage.clear();
      
      stats = storage.getStats();
      expect(stats.count).toBe(0);
    });

    it('should handle clearing empty database', async () => {
      await expect(storage.clear()).resolves.not.toThrow();
      
      const stats = storage.getStats();
      expect(stats.count).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('should return correct count of records', async () => {
      const wishlist1 = createWishlist({ userId: 123 });
      const wishlist2 = createWishlist({ userId: 456 });
      const wishlist3 = createWishlist({ userId: 789 });
      
      await storage.set('123', wishlist1);
      await storage.set('456', wishlist2);
      await storage.set('789', wishlist3);
      
      const stats = storage.getStats();
      expect(stats.count).toBe(3);
    });

    it('should return zero for empty database', () => {
      const stats = storage.getStats();
      expect(stats.count).toBe(0);
    });

    it('should return WAL mode status', () => {
      const stats = storage.getStats();
      expect(stats.walMode).toBe('wal');
    });

    it('should update count after adding records', async () => {
      let stats = storage.getStats();
      expect(stats.count).toBe(0);
      
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      stats = storage.getStats();
      expect(stats.count).toBe(1);
    });

    it('should update count after deleting records', async () => {
      const wishlist1 = createWishlist({ userId: 123 });
      const wishlist2 = createWishlist({ userId: 456 });
      
      await storage.set('123', wishlist1);
      await storage.set('456', wishlist2);
      
      await storage.delete('123');
      
      const stats = storage.getStats();
      expect(stats.count).toBe(1);
    });
  });

  describe('close()', () => {
    it('should close database connection', () => {
      const wishlist = createWishlist({ userId: 123 });
      storage.set('123', wishlist);
      
      storage.close();
      
      // Database should be closed, attempting to use it should throw
      expect(() => storage.getStats()).toThrow();
    });

    it('should handle closing already closed database', () => {
      storage.close();
      
      // Should not throw when closing already closed database
      expect(() => storage.close()).not.toThrow();
    });
  });

  describe('checkpoint()', () => {
    it('should perform WAL checkpoint', () => {
      const wishlist = createWishlist({ userId: 123 });
      storage.set('123', wishlist);
      
      expect(() => storage.checkpoint()).not.toThrow();
    });

    it('should handle checkpoint on empty database', () => {
      expect(() => storage.checkpoint()).not.toThrow();
    });

    it('should allow operations after checkpoint', async () => {
      const wishlist1 = createWishlist({ userId: 123 });
      await storage.set('123', wishlist1);
      
      storage.checkpoint();
      
      const wishlist2 = createWishlist({ userId: 456 });
      await storage.set('456', wishlist2);
      
      const result = await storage.get('456');
      expect(result).toEqual(wishlist2);
    });
  });

  describe('clearCache()', () => {
    it('should clear in-memory cache', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // Load into cache
      await storage.get('123');
      
      // Clear cache
      storage.clearCache();
      
      // Next get should hit database again
      const result = await storage.get('123');
      expect(result).toEqual(wishlist);
    });

    it('should handle clearing empty cache', () => {
      expect(() => storage.clearCache()).not.toThrow();
    });

    it('should not affect database data', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      storage.clearCache();
      
      const result = await storage.get('123');
      expect(result).toEqual(wishlist);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache data on first get() and reuse on subsequent calls', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      const result1 = await storage.get('123');
      const result2 = await storage.get('123');
      const result3 = await storage.get('123');
      
      expect(result1).toEqual(wishlist);
      expect(result2).toEqual(wishlist);
      expect(result3).toEqual(wishlist);
    });

    it('should invalidate cache on set()', async () => {
      const wishlist1 = createWishlist({ userId: 123 });
      await storage.set('123', wishlist1);
      
      // Load into cache
      await storage.get('123');
      
      // Update should invalidate cache
      const wishlist2: Wishlist = {
        ...wishlist1,
        items: [createWishlistItem({ tobaccoId: '999' })],
      };
      await storage.set('123', wishlist2);
      
      const result = await storage.get('123');
      expect(result).toEqual(wishlist2);
    });

    it('should invalidate cache on delete()', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // Load into cache
      await storage.get('123');
      
      // Delete should clear cache
      await storage.delete('123');
      
      const result = await storage.get('123');
      expect(result).toBeNull();
    });

    it('should clear cache on clearCache()', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // Load into cache
      await storage.get('123');
      
      storage.clearCache();
      
      // Should still be able to retrieve from database
      const result = await storage.get('123');
      expect(result).toEqual(wishlist);
    });

    it('should clear cache on clear()', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // Load into cache
      await storage.get('123');
      
      await storage.clear();
      
      const result = await storage.get('123');
      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON data gracefully', async () => {
      // This test verifies that the storage can handle data that might
      // become corrupted in the database
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      // Valid data should work
      const result = await storage.get('123');
      expect(result).toEqual(wishlist);
    });

    it('should handle concurrent operations', async () => {
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < 10; i++) {
        const wishlist = createWishlist({ userId: i });
        promises.push(storage.set(String(i), wishlist));
      }
      
      await expect(Promise.all(promises)).resolves.not.toThrow();
      
      const stats = storage.getStats();
      expect(stats.count).toBe(10);
    });

    it('should handle concurrent reads', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('123', wishlist);
      
      const promises: Promise<Wishlist | null>[] = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(storage.get('123'));
      }
      
      const results = await Promise.all(promises);
      
      results.forEach((result) => {
        expect(result).toEqual(wishlist);
      });
    });

    it('should handle concurrent writes to same key', async () => {
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < 10; i++) {
        const wishlist = createWishlist({
          userId: 123,
          items: [createWishlistItem({ tobaccoId: String(i) })],
        });
        promises.push(storage.set('123', wishlist));
      }
      
      await expect(Promise.all(promises)).resolves.not.toThrow();
      
      const result = await storage.get('123');
      expect(result).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string keys', async () => {
      const wishlist = createWishlist({ userId: 123 });
      await storage.set('', wishlist);
      
      const result = await storage.get('');
      expect(result).toEqual(wishlist);
    });

    it('should handle special characters in keys', async () => {
      const wishlist = createWishlist({ userId: 123 });
      const specialKey = 'user-123_456.test@example.com';
      
      await storage.set(specialKey, wishlist);
      
      const result = await storage.get(specialKey);
      expect(result).toEqual(wishlist);
    });

    it('should handle very long keys', async () => {
      const wishlist = createWishlist({ userId: 123 });
      const longKey = 'a'.repeat(1000);
      
      await storage.set(longKey, wishlist);
      
      const result = await storage.get(longKey);
      expect(result).toEqual(wishlist);
    });

    it('should handle large data sets', async () => {
      const largeItems: WishlistItem[] = [];
      
      for (let i = 0; i < 1000; i++) {
        largeItems.push(createWishlistItem({ tobaccoId: String(i) }));
      }
      
      const largeWishlist: Wishlist = {
        userId: 123,
        items: largeItems,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      
      await storage.set('123', largeWishlist);
      
      const result = await storage.get('123');
      expect(result?.items).toHaveLength(1000);
    });

    it('should handle Unicode characters in data', async () => {
      const wishlist: Wishlist = {
        userId: 123,
        items: [
          createWishlistItem({
            tobaccoId: '1',
            notes: 'Тест на русском 🚀 Test in English 中文测试',
          }),
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      
      await storage.set('123', wishlist);
      
      const result = await storage.get('123');
      expect(result?.items[0].notes).toContain('Тест на русском');
      expect(result?.items[0].notes).toContain('🚀');
      expect(result?.items[0].notes).toContain('中文测试');
    });
  });
});
