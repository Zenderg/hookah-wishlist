/**
 * Unit tests for FileStorage class
 */

import fs from 'fs/promises';
import path from 'path';
import { FileStorage } from '../../../src/storage/file.storage';
import { createWishlist, createTobacco, createUsers } from '../../fixtures/mockData';

// Mock the logger to avoid console output during tests
jest.mock('../../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe('FileStorage', () => {
  let storage: FileStorage<any>;
  let testStoragePath: string;

  beforeEach(async () => {
    // Create a unique test directory for each test
    testStoragePath = path.join(__dirname, '..', '..', '..', 'data', `test-storage-${Date.now()}`);
    await fs.mkdir(testStoragePath, { recursive: true });
    storage = new FileStorage(testStoragePath);
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await storage.clear();
      await fs.rm(testStoragePath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Constructor', () => {
    it('should create storage directory if it does not exist', async () => {
      const newPath = path.join(__dirname, '..', '..', '..', 'data', `new-storage-${Date.now()}`);
      new FileStorage(newPath);
      
      // Wait a bit for async directory creation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const exists = await fs.access(newPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
      
      // Cleanup
      await fs.rm(newPath, { recursive: true, force: true });
    });

    it('should initialize with empty cache', () => {
      const testStorage = new FileStorage(testStoragePath);
      expect(testStorage).toBeInstanceOf(FileStorage);
    });

    it('should handle existing storage directory', async () => {
      // Create directory first
      await fs.mkdir(testStoragePath, { recursive: true });
      
      // Should not throw error
      expect(() => new FileStorage(testStoragePath)).not.toThrow();
    });
  });

  describe('get()', () => {
    it('should retrieve existing data', async () => {
      const key = 'test-key-1';
      const data = createWishlist();
      
      await storage.set(key, data);
      const result = await storage.get(key);
      
      expect(result).toEqual(data);
    });

    it('should return null for non-existent key', async () => {
      const result = await storage.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should use cache for repeated get calls', async () => {
      const key = 'cached-key';
      const data = createTobacco();
      
      await storage.set(key, data);
      
      // First call reads from file
      const result1 = await storage.get(key);
      
      // Second call should use cache
      const result2 = await storage.get(key);
      
      expect(result1).toEqual(result2);
      expect(result1).toEqual(data);
    });

    it('should handle complex nested objects', async () => {
      const key = 'complex-key';
      const complexData = {
        user: { id: 123, name: 'Test User', profile: { age: 30, location: 'Test City' } },
        items: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
        metadata: { created: '2024-01-01', tags: ['tag1', 'tag2'] },
      };
      
      await storage.set(key, complexData);
      const result = await storage.get(key);
      
      expect(result).toEqual(complexData);
    });

    it('should handle arrays', async () => {
      const key = 'array-key';
      const arrayData = createUsers(5);
      
      await storage.set(key, arrayData);
      const result = await storage.get(key);
      
      expect(result).toEqual(arrayData);
      expect(result).toHaveLength(5);
    });

    it('should handle primitive values', async () => {
      const stringKey = 'string-key';
      const numberKey = 'number-key';
      const booleanKey = 'boolean-key';
      const nullKey = 'null-key';
      
      await storage.set(stringKey, 'test string');
      await storage.set(numberKey, 12345);
      await storage.set(booleanKey, true);
      await storage.set(nullKey, null);
      
      expect(await storage.get(stringKey)).toBe('test string');
      expect(await storage.get(numberKey)).toBe(12345);
      expect(await storage.get(booleanKey)).toBe(true);
      expect(await storage.get(nullKey)).toBeNull();
    });

    it('should handle empty object', async () => {
      const key = 'empty-object-key';
      const emptyData: Record<string, never> = {};
      
      await storage.set(key, emptyData);
      const result = await storage.get(key);
      
      expect(result).toEqual(emptyData);
    });

    it('should handle empty array', async () => {
      const key = 'empty-array-key';
      const emptyData: any[] = [];
      
      await storage.set(key, emptyData);
      const result = await storage.get(key);
      
      expect(result).toEqual(emptyData);
    });
  });

  describe('set()', () => {
    it('should store new data', async () => {
      const key = 'new-key';
      const data = createWishlist();
      
      await storage.set(key, data);
      const result = await storage.get(key);
      
      expect(result).toEqual(data);
    });

    it('should update existing data', async () => {
      const key = 'update-key';
      const initialData = createWishlist({ userId: 123 });
      const updatedData = createWishlist({ userId: 456 });
      
      await storage.set(key, initialData);
      await storage.set(key, updatedData);
      
      const result = await storage.get(key);
      expect(result).toEqual(updatedData);
      expect(result).not.toEqual(initialData);
    });

    it('should update cache when setting data', async () => {
      const key = 'cache-update-key';
      const initialData = createTobacco({ id: '1' });
      const updatedData = createTobacco({ id: '2' });
      
      await storage.set(key, initialData);
      const result1 = await storage.get(key);
      
      await storage.set(key, updatedData);
      const result2 = await storage.get(key);
      
      expect(result1).toEqual(initialData);
      expect(result2).toEqual(updatedData);
    });

    it('should handle JSON serialization of special characters', async () => {
      const key = 'special-chars-key';
      const data = {
        text: 'Special chars: \n\t\r\\\'"',
        unicode: 'Unicode: 你好世界 🌍',
        emoji: 'Emoji: 😀😁😂',
      };
      
      await storage.set(key, data);
      const result = await storage.get(key);
      
      expect(result).toEqual(data);
    });

    it('should handle large datasets', async () => {
      const key = 'large-dataset-key';
      const largeData = createUsers(1000);
      
      await storage.set(key, largeData);
      const result = await storage.get(key);
      
      expect(result).toHaveLength(1000);
      expect(result).toEqual(largeData);
    });

    it('should create file with .json extension', async () => {
      const key = 'file-extension-key';
      const data = { test: 'data' };
      
      await storage.set(key, data);
      
      const filePath = path.join(testStoragePath, `${key}.json`);
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
    });

    it('should write properly formatted JSON', async () => {
      const key = 'formatted-json-key';
      const data = { name: 'Test', value: 123 };
      
      await storage.set(key, data);
      
      const filePath = path.join(testStoragePath, `${key}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      expect(() => JSON.parse(fileContent)).not.toThrow();
      expect(JSON.parse(fileContent)).toEqual(data);
    });
  });

  describe('delete()', () => {
    it('should delete existing data', async () => {
      const key = 'delete-key';
      const data = createWishlist();
      
      await storage.set(key, data);
      expect(await storage.get(key)).toEqual(data);
      
      await storage.delete(key);
      expect(await storage.get(key)).toBeNull();
    });

    it('should not throw error when deleting non-existent key', async () => {
      const key = 'non-existent-delete-key';
      
      await expect(storage.delete(key)).resolves.not.toThrow();
    });

    it('should remove from cache when deleting', async () => {
      const key = 'cache-delete-key';
      const data = createTobacco();
      
      await storage.set(key, data);
      expect(await storage.get(key)).toEqual(data);
      
      await storage.delete(key);
      expect(await storage.get(key)).toBeNull();
    });

    it('should delete file from filesystem', async () => {
      const key = 'file-delete-key';
      const data = { test: 'data' };
      
      await storage.set(key, data);
      
      const filePath = path.join(testStoragePath, `${key}.json`);
      let exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
      
      await storage.delete(key);
      
      exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('should handle deleting multiple keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const data = createWishlist();
      
      for (const key of keys) {
        await storage.set(key, data);
      }
      
      for (const key of keys) {
        expect(await storage.get(key)).toEqual(data);
      }
      
      for (const key of keys) {
        await storage.delete(key);
      }
      
      for (const key of keys) {
        expect(await storage.get(key)).toBeNull();
      }
    });
  });

  describe('exists()', () => {
    it('should return true for existing key', async () => {
      const key = 'exists-key';
      const data = createWishlist();
      
      await storage.set(key, data);
      const result = await storage.exists(key);
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const result = await storage.exists('non-existent-key');
      expect(result).toBe(false);
    });

    it('should return false after deletion', async () => {
      const key = 'exists-after-delete-key';
      const data = createTobacco();
      
      await storage.set(key, data);
      expect(await storage.exists(key)).toBe(true);
      
      await storage.delete(key);
      expect(await storage.exists(key)).toBe(false);
    });

    it('should check existence without affecting cache', async () => {
      const key = 'exists-cache-key';
      const data = { test: 'data' };
      
      await storage.set(key, data);
      
      // Check existence (should not populate cache)
      await storage.exists(key);
      
      // Data should still be retrievable
      const result = await storage.get(key);
      expect(result).toEqual(data);
    });

    it('should handle multiple existence checks', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const data = createWishlist();
      
      for (const key of keys) {
        await storage.set(key, data);
      }
      
      for (const key of keys) {
        expect(await storage.exists(key)).toBe(true);
      }
      
      expect(await storage.exists('non-existent')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should clear all data from storage', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const data = createWishlist();
      
      for (const key of keys) {
        await storage.set(key, data);
      }
      
      for (const key of keys) {
        expect(await storage.get(key)).toEqual(data);
      }
      
      await storage.clear();
      
      for (const key of keys) {
        expect(await storage.get(key)).toBeNull();
      }
    });

    it('should clear cache', async () => {
      const key = 'cache-clear-key';
      const data = createTobacco();
      
      await storage.set(key, data);
      expect(await storage.get(key)).toEqual(data);
      
      await storage.clear();
      
      expect(await storage.get(key)).toBeNull();
    });

    it('should handle clearing empty storage', async () => {
      await expect(storage.clear()).resolves.not.toThrow();
    });

    it('should delete all .json files from storage directory', async () => {
      const keys = ['file1', 'file2', 'file3'];
      const data = { test: 'data' };
      
      for (const key of keys) {
        await storage.set(key, data);
      }
      
      const filesBefore = await fs.readdir(testStoragePath);
      expect(filesBefore.length).toBeGreaterThan(0);
      
      await storage.clear();
      
      const filesAfter = await fs.readdir(testStoragePath);
      expect(filesAfter.length).toBe(0);
    });

    it('should handle clearing large number of items', async () => {
      const count = 100;
      const data = createWishlist();
      
      for (let i = 0; i < count; i++) {
        await storage.set(`key${i}`, data);
      }
      
      await storage.clear();
      
      for (let i = 0; i < count; i++) {
        expect(await storage.get(`key${i}`)).toBeNull();
      }
    });
  });

  describe('clearCache()', () => {
    it('should clear internal cache', async () => {
      const key = 'cache-method-key';
      const data = createTobacco();
      
      await storage.set(key, data);
      
      // Populate cache
      await storage.get(key);
      
      // Clear cache using method
      storage.clearCache();
      
      // Next get should read from file
      const result = await storage.get(key);
      expect(result).toEqual(data);
    });

    it('should not affect stored data', async () => {
      const key = 'cache-data-key';
      const data = createWishlist();
      
      await storage.set(key, data);
      storage.clearCache();
      
      const result = await storage.get(key);
      expect(result).toEqual(data);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string keys', async () => {
      const key = '';
      const data = { test: 'data' };
      
      await storage.set(key, data);
      const result = await storage.get(key);
      
      expect(result).toEqual(data);
    });

    it('should handle keys with special characters (slashes sanitized)', async () => {
      const specialKeys = [
        'key-with-dashes',
        'key_with_underscores',
        'key.with.dots',
        'key with spaces',
        'key@with#special$chars',
      ];
      
      const data = { test: 'data' };
      
      for (const key of specialKeys) {
        await storage.set(key, data);
        expect(await storage.get(key)).toEqual(data);
      }
    });

    it('should handle keys with unicode characters', async () => {
      const unicodeKeys = [
        'ключ-русский',
        '鍵-中文',
        '키-한국어',
        'キー-日本語',
        'مفتاح-عربي',
      ];
      
      const data = { test: 'data' };
      
      for (const key of unicodeKeys) {
        await storage.set(key, data);
        expect(await storage.get(key)).toEqual(data);
      }
    });

    it('should handle deeply nested objects', async () => {
      const key = 'deep-nested-key';
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep value',
                },
              },
            },
          },
        },
      };
      
      await storage.set(key, deepData);
      const result = await storage.get(key);
      
      expect(result).toEqual(deepData);
      expect(result.level1.level2.level3.level4.level5.value).toBe('deep value');
    });

    it('should handle circular references (should throw)', async () => {
      const key = 'circular-key';
      const data: any = { name: 'test' };
      data.self = data;
      
      await expect(storage.set(key, data)).rejects.toThrow();
    });

    it('should handle undefined values in objects', async () => {
      const key = 'undefined-key';
      const data = { defined: 'value', undefined: undefined };
      
      await storage.set(key, data);
      const result = await storage.get(key);
      
      expect(result).toEqual(data);
    });

    it('should handle Date objects', async () => {
      const key = 'date-key';
      const date = new Date();
      const data = { createdAt: date, updatedAt: new Date('2024-01-01') };
      
      await storage.set(key, data);
      const result = await storage.get(key);
      
      expect(result).toEqual(data);
      expect(result.createdAt).toEqual(date);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent set operations', async () => {
      const count = 10;
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < count; i++) {
        const key = `concurrent-set-${i}`;
        const data = createWishlist({ userId: i });
        promises.push(storage.set(key, data));
      }
      
      await Promise.all(promises);
      
      for (let i = 0; i < count; i++) {
        const result = await storage.get(`concurrent-set-${i}`);
        expect(result).not.toBeNull();
        expect(result?.userId).toBe(i);
      }
    });

    it('should handle concurrent get operations', async () => {
      const key = 'concurrent-get-key';
      const data = createTobacco();
      await storage.set(key, data);
      
      const count = 10;
      const promises: Promise<any>[] = [];
      
      for (let i = 0; i < count; i++) {
        promises.push(storage.get(key));
      }
      
      const results = await Promise.all(promises);
      
      for (const result of results) {
        expect(result).toEqual(data);
      }
    });

    it('should handle concurrent delete operations', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const data = createWishlist();
      
      for (const key of keys) {
        await storage.set(key, data);
      }
      
      const promises = keys.map((key) => storage.delete(key));
      await Promise.all(promises);
      
      for (const key of keys) {
        expect(await storage.get(key)).toBeNull();
      }
    });

    it('should handle mixed concurrent operations', async () => {
      const key = 'mixed-ops-key';
      const data1 = createWishlist({ userId: 1 });
      const data2 = createWishlist({ userId: 2 });
      
      await storage.set(key, data1);
      
      const promises = [
        storage.get(key),
        storage.set(key, data2),
        storage.exists(key),
      ];
      
      const results = await Promise.all(promises);
      
      expect(results[0]).not.toBeNull();
      expect(results[2]).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in file', async () => {
      const key = 'invalid-json-key';
      const filePath = path.join(testStoragePath, `${key}.json`);
      
      // Write invalid JSON
      await fs.writeFile(filePath, '{ invalid json }', 'utf-8');
      
      await expect(storage.get(key)).rejects.toThrow();
    });

    it('should handle corrupted JSON file', async () => {
      const key = 'corrupted-json-key';
      const filePath = path.join(testStoragePath, `${key}.json`);
      
      // Write corrupted data
      await fs.writeFile(filePath, Buffer.from([0x00, 0x01, 0x02, 0x03]));
      
      await expect(storage.get(key)).rejects.toThrow();
    });

    it('should handle file write permission errors', async () => {
      const key = 'write-permission-key';
      const data = { test: 'data' };
      
      // Make directory read-only (this may not work on all systems)
      try {
        await fs.chmod(testStoragePath, 0o444);
        
        await expect(storage.set(key, data)).rejects.toThrow();
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(testStoragePath, 0o755).catch(() => {});
      }
    });
  });

  describe('Type Safety', () => {
    it('should work with generic type parameter', async () => {
      interface TestType {
        id: number;
        name: string;
        value: number;
      }
      
      const typedStorage = new FileStorage<TestType>(testStoragePath);
      const key = 'typed-key';
      const data: TestType = { id: 1, name: 'test', value: 100 };
      
      await typedStorage.set(key, data);
      const result = await typedStorage.get(key);
      
      expect(result).toEqual(data);
      expect(result?.id).toBe(1);
      expect(result?.name).toBe('test');
      expect(result?.value).toBe(100);
    });

    it('should work with union types', async () => {
      type UnionType = string | number | boolean;
      
      const unionStorage = new FileStorage<UnionType>(testStoragePath);
      
      await unionStorage.set('string-key', 'test');
      await unionStorage.set('number-key', 123);
      await unionStorage.set('boolean-key', true);
      
      expect(await unionStorage.get('string-key')).toBe('test');
      expect(await unionStorage.get('number-key')).toBe(123);
      expect(await unionStorage.get('boolean-key')).toBe(true);
    });
  });
});
