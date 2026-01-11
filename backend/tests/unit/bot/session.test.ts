/**
 * Unit tests for bot session management
 */

import { sessionManager, SessionData } from '../../../src/bot/session';
import { generateTestId } from '../../utils/testHelpers';

describe('SessionManager', () => {
  let testUserId: number;

  beforeEach(() => {
    // Clear all sessions before each test
    sessionManager.clear();
    // Generate a unique test user ID
    testUserId = generateTestId();
  });

  afterEach(() => {
    // Clean up after each test
    sessionManager.clear();
  });

  describe('Session Creation', () => {
    it('should create a new session with user ID', () => {
      sessionManager.set(testUserId, {});

      const session = sessionManager.get(testUserId);

      expect(session).toBeDefined();
      expect(session?.userId).toBe(testUserId);
    });

    it('should create multiple independent sessions', () => {
      const userId1 = generateTestId();
      const userId2 = generateTestId();

      sessionManager.set(userId1, {});
      sessionManager.set(userId2, {});

      const session1 = sessionManager.get(userId1);
      const session2 = sessionManager.get(userId2);

      expect(session1?.userId).toBe(userId1);
      expect(session2?.userId).toBe(userId2);
      expect(session1?.userId).not.toBe(session2?.userId);
    });
  });

  describe('Session Retrieval', () => {
    it('should retrieve an existing session', () => {
      const testData: Partial<SessionData> = {
        lastCommand: '/search',
        searchQuery: 'mint',
        currentPage: 1,
      };

      sessionManager.set(testUserId, testData);
      const session = sessionManager.get(testUserId);

      expect(session).toBeDefined();
      expect(session?.lastCommand).toBe('/search');
      expect(session?.searchQuery).toBe('mint');
      expect(session?.currentPage).toBe(1);
    });

    it('should return undefined for non-existent session', () => {
      const session = sessionManager.get(testUserId);

      expect(session).toBeUndefined();
    });

    it('should retrieve the same session instance across multiple calls', () => {
      sessionManager.set(testUserId, { lastCommand: '/search' });

      const session1 = sessionManager.get(testUserId);
      const session2 = sessionManager.get(testUserId);

      expect(session1).toEqual(session2);
    });
  });

  describe('Session Data Storage', () => {
    it('should store string data in session', () => {
      sessionManager.set(testUserId, { lastCommand: '/search' });

      const session = sessionManager.get(testUserId);

      expect(session?.lastCommand).toBe('/search');
    });

    it('should store number data in session', () => {
      sessionManager.set(testUserId, { currentPage: 5 });

      const session = sessionManager.get(testUserId);

      expect(session?.currentPage).toBe(5);
    });

    it('should store object data in session', () => {
      const searchContext = {
        query: 'mint',
        filters: { brand: 'Al Fakher', strength: 'medium' },
      };

      sessionManager.set(testUserId, { searchQuery: searchContext.query } as any);

      const session = sessionManager.get(testUserId);

      expect(session?.searchQuery).toBe(searchContext.query);
    });

    it('should store array data in session', () => {
      const recentSearches = ['mint', 'apple', 'grape'];

      sessionManager.set(testUserId, { searchQuery: recentSearches.join(',') } as any);

      const session = sessionManager.get(testUserId);

      expect(session?.searchQuery).toBe(recentSearches.join(','));
    });

    it('should store boolean data in session', () => {
      sessionManager.set(testUserId, { searchQuery: 'true' } as any);

      const session = sessionManager.get(testUserId);

      expect(session?.searchQuery).toBe('true');
    });

    it('should store null data in session', () => {
      sessionManager.set(testUserId, { lastCommand: undefined });

      const session = sessionManager.get(testUserId);

      expect(session?.lastCommand).toBeUndefined();
    });
  });

  describe('Session Data Retrieval', () => {
    it('should retrieve stored data from session', () => {
      sessionManager.set(testUserId, {
        lastCommand: '/search',
        searchQuery: 'mint',
        currentPage: 2,
      });

      const session = sessionManager.get(testUserId);

      expect(session?.lastCommand).toBe('/search');
      expect(session?.searchQuery).toBe('mint');
      expect(session?.currentPage).toBe(2);
    });

    it('should return undefined for missing session data', () => {
      sessionManager.set(testUserId, { lastCommand: '/search' });

      const session = sessionManager.get(testUserId);

      expect(session?.searchQuery).toBeUndefined();
      expect(session?.currentPage).toBeUndefined();
    });

    it('should retrieve partial session data', () => {
      sessionManager.set(testUserId, { lastCommand: '/search' });

      const session = sessionManager.get(testUserId);

      expect(session?.lastCommand).toBe('/search');
      expect(session?.searchQuery).toBeUndefined();
      expect(session?.currentPage).toBeUndefined();
    });
  });

  describe('Session Data Update', () => {
    it('should update existing session data', () => {
      sessionManager.set(testUserId, { lastCommand: '/search' });
      sessionManager.set(testUserId, { searchQuery: 'mint' });

      const session = sessionManager.get(testUserId);

      expect(session?.lastCommand).toBe('/search');
      expect(session?.searchQuery).toBe('mint');
    });

    it('should overwrite existing session data', () => {
      sessionManager.set(testUserId, { lastCommand: '/search' });
      sessionManager.set(testUserId, { lastCommand: '/wishlist' });

      const session = sessionManager.get(testUserId);

      expect(session?.lastCommand).toBe('/wishlist');
    });

    it('should update multiple session fields at once', () => {
      sessionManager.set(testUserId, { lastCommand: '/search' });
      sessionManager.set(testUserId, {
        searchQuery: 'mint',
        currentPage: 3,
      });

      const session = sessionManager.get(testUserId);

      expect(session?.lastCommand).toBe('/search');
      expect(session?.searchQuery).toBe('mint');
      expect(session?.currentPage).toBe(3);
    });

    it('should update session data while preserving other fields', () => {
      sessionManager.set(testUserId, {
        lastCommand: '/search',
        searchQuery: 'mint',
        currentPage: 1,
      });

      sessionManager.set(testUserId, { currentPage: 5 });

      const session = sessionManager.get(testUserId);

      expect(session?.lastCommand).toBe('/search');
      expect(session?.searchQuery).toBe('mint');
      expect(session?.currentPage).toBe(5);
    });
  });

  describe('Session Data Deletion', () => {
    it('should delete specific session data by setting to undefined', () => {
      sessionManager.set(testUserId, {
        lastCommand: '/search',
        searchQuery: 'mint',
        currentPage: 1,
      });

      sessionManager.set(testUserId, { searchQuery: undefined });

      const session = sessionManager.get(testUserId);

      expect(session?.lastCommand).toBe('/search');
      expect(session?.searchQuery).toBeUndefined();
      expect(session?.currentPage).toBe(1);
    });

    it('should delete entire session', () => {
      sessionManager.set(testUserId, {
        lastCommand: '/search',
        searchQuery: 'mint',
      });

      sessionManager.delete(testUserId);

      const session = sessionManager.get(testUserId);

      expect(session).toBeUndefined();
    });

    it('should handle deletion of non-existent session', () => {
      expect(() => {
        sessionManager.delete(testUserId);
      }).not.toThrow();
    });
  });

  describe('Session Existence Check', () => {
    it('should return true for existing session', () => {
      sessionManager.set(testUserId, {});

      const exists = sessionManager.get(testUserId) !== undefined;

      expect(exists).toBe(true);
    });

    it('should return false for non-existent session', () => {
      const exists = sessionManager.get(testUserId) !== undefined;

      expect(exists).toBe(false);
    });

    it('should check session existence after deletion', () => {
      sessionManager.set(testUserId, {});
      sessionManager.delete(testUserId);

      const exists = sessionManager.get(testUserId) !== undefined;

      expect(exists).toBe(false);
    });
  });

  describe('Session Deletion', () => {
    it('should delete a session by user ID', () => {
      sessionManager.set(testUserId, { lastCommand: '/search' });

      sessionManager.delete(testUserId);

      const session = sessionManager.get(testUserId);

      expect(session).toBeUndefined();
    });

    it('should delete only the specified session', () => {
      const userId1 = generateTestId();
      const userId2 = generateTestId();

      sessionManager.set(userId1, { lastCommand: '/search' });
      sessionManager.set(userId2, { lastCommand: '/wishlist' });

      sessionManager.delete(userId1);

      const session1 = sessionManager.get(userId1);
      const session2 = sessionManager.get(userId2);

      expect(session1).toBeUndefined();
      expect(session2).toBeDefined();
      expect(session2?.lastCommand).toBe('/wishlist');
    });

    it('should handle deletion of already deleted session', () => {
      sessionManager.set(testUserId, { lastCommand: '/search' });
      sessionManager.delete(testUserId);

      expect(() => {
        sessionManager.delete(testUserId);
      }).not.toThrow();
    });
  });

  describe('Session Cleanup', () => {
    it('should clear all sessions', () => {
      const userId1 = generateTestId();
      const userId2 = generateTestId();
      const userId3 = generateTestId();

      sessionManager.set(userId1, { lastCommand: '/search' });
      sessionManager.set(userId2, { lastCommand: '/wishlist' });
      sessionManager.set(userId3, { lastCommand: '/add' });

      sessionManager.clear();

      expect(sessionManager.get(userId1)).toBeUndefined();
      expect(sessionManager.get(userId2)).toBeUndefined();
      expect(sessionManager.get(userId3)).toBeUndefined();
    });

    it('should handle cleanup of empty session manager', () => {
      expect(() => {
        sessionManager.clear();
      }).not.toThrow();
    });

    it('should allow adding new sessions after cleanup', () => {
      const userId1 = generateTestId();
      const userId2 = generateTestId();

      sessionManager.set(userId1, { lastCommand: '/search' });
      sessionManager.clear();
      sessionManager.set(userId2, { lastCommand: '/wishlist' });

      const session1 = sessionManager.get(userId1);
      const session2 = sessionManager.get(userId2);

      expect(session1).toBeUndefined();
      expect(session2).toBeDefined();
      expect(session2?.lastCommand).toBe('/wishlist');
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent session retrieval gracefully', () => {
      const session = sessionManager.get(999999999);

      expect(session).toBeUndefined();
    });

    it('should handle missing session data gracefully', () => {
      sessionManager.set(testUserId, {});

      const session = sessionManager.get(testUserId);

      expect(session).toBeDefined();
      expect(session?.lastCommand).toBeUndefined();
      expect(session?.searchQuery).toBeUndefined();
      expect(session?.currentPage).toBeUndefined();
    });

    it('should handle concurrent session operations', () => {
      const userId1 = generateTestId();
      const userId2 = generateTestId();
      const userId3 = generateTestId();

      // Create multiple sessions concurrently
      sessionManager.set(userId1, { lastCommand: '/search' });
      sessionManager.set(userId2, { lastCommand: '/wishlist' });
      sessionManager.set(userId3, { lastCommand: '/add' });

      // Update sessions concurrently
      sessionManager.set(userId1, { searchQuery: 'mint' });
      sessionManager.set(userId2, { currentPage: 2 });
      sessionManager.set(userId3, { lastCommand: '/remove' });

      // Verify all sessions are correct
      const session1 = sessionManager.get(userId1);
      const session2 = sessionManager.get(userId2);
      const session3 = sessionManager.get(userId3);

      expect(session1?.lastCommand).toBe('/search');
      expect(session1?.searchQuery).toBe('mint');
      expect(session2?.lastCommand).toBe('/wishlist');
      expect(session2?.currentPage).toBe(2);
      expect(session3?.lastCommand).toBe('/remove');
    });

    it('should handle large session data', () => {
      const largeQuery = 'a'.repeat(10000);

      sessionManager.set(testUserId, { searchQuery: largeQuery });

      const session = sessionManager.get(testUserId);

      expect(session?.searchQuery).toBe(largeQuery);
      expect(session?.searchQuery?.length).toBe(10000);
    });

    it('should handle special characters in session data', () => {
      const specialQuery = 'Mint!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';

      sessionManager.set(testUserId, { searchQuery: specialQuery });

      const session = sessionManager.get(testUserId);

      expect(session?.searchQuery).toBe(specialQuery);
    });

    it('should handle Unicode characters in session data', () => {
      const unicodeQuery = 'Мята 🍃 ミント Mint';

      sessionManager.set(testUserId, { searchQuery: unicodeQuery });

      const session = sessionManager.get(testUserId);

      expect(session?.searchQuery).toBe(unicodeQuery);
    });

    it('should handle empty string in session data', () => {
      sessionManager.set(testUserId, { searchQuery: '' });

      const session = sessionManager.get(testUserId);

      expect(session?.searchQuery).toBe('');
    });

    it('should handle zero in session data', () => {
      sessionManager.set(testUserId, { currentPage: 0 });

      const session = sessionManager.get(testUserId);

      expect(session?.currentPage).toBe(0);
    });

    it('should handle negative numbers in session data', () => {
      sessionManager.set(testUserId, { currentPage: -1 } as any);

      const session = sessionManager.get(testUserId);

      expect(session?.currentPage).toBe(-1);
    });

    it('should handle very large numbers in session data', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;

      sessionManager.set(testUserId, { currentPage: largeNumber } as any);

      const session = sessionManager.get(testUserId);

      expect(session?.currentPage).toBe(largeNumber);
    });
  });

  describe('Session Data Types', () => {
    it('should handle string data type', () => {
      const stringData = '/search';

      sessionManager.set(testUserId, { lastCommand: stringData });

      const session = sessionManager.get(testUserId);

      expect(typeof session?.lastCommand).toBe('string');
      expect(session?.lastCommand).toBe(stringData);
    });

    it('should handle number data type', () => {
      const numberData = 42;

      sessionManager.set(testUserId, { currentPage: numberData });

      const session = sessionManager.get(testUserId);

      expect(typeof session?.currentPage).toBe('number');
      expect(session?.currentPage).toBe(numberData);
    });

    it('should handle object data type (via JSON string)', () => {
      const objectData = { query: 'mint', page: 1 };

      sessionManager.set(testUserId, { searchQuery: JSON.stringify(objectData) } as any);

      const session = sessionManager.get(testUserId);

      expect(typeof session?.searchQuery).toBe('string');
      expect(JSON.parse(session!.searchQuery!)).toEqual(objectData);
    });

    it('should handle array data type (via JSON string)', () => {
      const arrayData = ['mint', 'apple', 'grape'];

      sessionManager.set(testUserId, { searchQuery: JSON.stringify(arrayData) } as any);

      const session = sessionManager.get(testUserId);

      expect(typeof session?.searchQuery).toBe('string');
      expect(JSON.parse(session!.searchQuery!)).toEqual(arrayData);
    });

    it('should handle boolean data type (via string)', () => {
      sessionManager.set(testUserId, { searchQuery: 'true' } as any);

      const session = sessionManager.get(testUserId);

      expect(session?.searchQuery).toBe('true');
    });

    it('should handle null data type (via undefined)', () => {
      sessionManager.set(testUserId, { lastCommand: undefined });

      const session = sessionManager.get(testUserId);

      expect(session?.lastCommand).toBeUndefined();
    });
  });

  describe('Session Expiration', () => {
    it('should note: current implementation does not support expiration', () => {
      // This test documents that expiration is not implemented
      sessionManager.set(testUserId, { lastCommand: '/search' });

      const session = sessionManager.get(testUserId);

      expect(session).toBeDefined();
      expect(session?.lastCommand).toBe('/search');
    });
  });

  describe('Session Manager Singleton', () => {
    it('should export a singleton instance', () => {
      expect(sessionManager).toBeDefined();
      expect(typeof sessionManager.get).toBe('function');
      expect(typeof sessionManager.set).toBe('function');
      expect(typeof sessionManager.delete).toBe('function');
      expect(typeof sessionManager.clear).toBe('function');
    });

    it('should maintain state across multiple imports', () => {
      const { sessionManager: sessionManager2 } = require('../../../src/bot/session');

      sessionManager.set(testUserId, { lastCommand: '/search' });

      const session = sessionManager2.get(testUserId);

      expect(session).toBeDefined();
      expect(session?.lastCommand).toBe('/search');
    });
  });
});
