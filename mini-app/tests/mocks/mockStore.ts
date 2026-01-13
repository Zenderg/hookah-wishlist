/**
 * Mock Zustand Store for Testing
 * 
 * This file provides a comprehensive mock for Zustand store used in mini-app.
 * Following javascript-testing-patterns skill best practices for mocking state management.
 */

import { vi, expect } from 'vitest';
import type { Tobacco, Wishlist } from '../../src/types';

/**
 * Mock Store State Interface
 */
export interface MockStoreState {
  wishlist: Wishlist | null;
  searchResults: Tobacco[];
  searchQuery: string;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Mock Store Actions Interface
 */
export interface MockStoreActions {
  fetchWishlist: ReturnType<typeof vi.fn>;
  addToWishlist: ReturnType<typeof vi.fn>;
  removeFromWishlist: ReturnType<typeof vi.fn>;
  clearWishlist: ReturnType<typeof vi.fn>;
  searchTobaccos: ReturnType<typeof vi.fn>;
  setSearchQuery: ReturnType<typeof vi.fn>;
  setCurrentPage: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
}

/**
 * Complete Mock Store Interface
 */
export interface MockStore extends MockStoreState, MockStoreActions {}

/**
 * Default mock store state
 */
export const defaultMockStoreState: MockStoreState = {
  wishlist: null,
  searchResults: [],
  searchQuery: '',
  currentPage: 1,
  isLoading: false,
  error: null,
};

/**
 * Create a mock store with custom state and actions
 */
export function createMockStore(overrides?: Partial<MockStoreState>): MockStore {
  const state: MockStoreState = {
    ...defaultMockStoreState,
    ...overrides,
  };

  return {
    ...state,

    fetchWishlist: vi.fn(async () => {
      // Default implementation - can be overridden
      state.wishlist = overrides?.wishlist || null;
      state.isLoading = false;
      state.error = null;
    }),

    addToWishlist: vi.fn(async (tobaccoId: string, notes?: string) => {
      // Default implementation - can be overridden
      state.isLoading = false;
      state.error = null;
    }),

    removeFromWishlist: vi.fn(async (tobaccoId: string) => {
      // Default implementation - can be overridden
      state.isLoading = false;
      state.error = null;
    }),

    clearWishlist: vi.fn(async () => {
      // Default implementation - can be overridden
      state.wishlist = null;
      state.isLoading = false;
      state.error = null;
    }),

    searchTobaccos: vi.fn(async (query: string, page?: number) => {
      // Default implementation - can be overridden
      state.searchResults = overrides?.searchResults || [];
      state.currentPage = page || 1;
      state.isLoading = false;
      state.error = null;
    }),

    setSearchQuery: vi.fn((query: string) => {
      state.searchQuery = query;
    }),

    setCurrentPage: vi.fn((page: number) => {
      state.currentPage = page;
    }),

    clearError: vi.fn(() => {
      state.error = null;
    }),
  };
}

/**
 * Mock store instance with default state
 */
export const mockStore = createMockStore();

/**
 * Create a mock store with wishlist populated
 */
export function createMockStoreWithWishlist(wishlist: Wishlist): MockStore {
  return createMockStore({
    wishlist,
    isLoading: false,
    error: null,
  });
}

/**
 * Create a mock store with search results populated
 */
export function createMockStoreWithSearchResults(results: Tobacco[]): MockStore {
  return createMockStore({
    searchResults: results,
    isLoading: false,
    error: null,
  });
}

/**
 * Create a mock store in loading state
 */
export function createMockStoreLoading(): MockStore {
  return createMockStore({
    isLoading: true,
    error: null,
  });
}

/**
 * Create a mock store with error state
 */
export function createMockStoreWithError(error: string): MockStore {
  return createMockStore({
    isLoading: false,
    error,
  });
}

/**
 * Create a mock store with search query
 */
export function createMockStoreWithSearchQuery(query: string): MockStore {
  return createMockStore({
    searchQuery: query,
    isLoading: false,
    error: null,
  });
}

/**
 * Create a mock store with specific page
 */
export function createMockStoreWithPage(page: number): MockStore {
  return createMockStore({
    currentPage: page,
    isLoading: false,
    error: null,
  });
}

/**
 * Reset mock store to default state
 */
export function resetMockStore(): void {
  mockStore.wishlist = null;
  mockStore.searchResults = [];
  mockStore.searchQuery = '';
  mockStore.currentPage = 1;
  mockStore.isLoading = false;
  mockStore.error = null;
}

/**
 * Clear all mock store function calls
 */
export function clearMockStore(): void {
  mockStore.fetchWishlist.mockClear();
  mockStore.addToWishlist.mockClear();
  mockStore.removeFromWishlist.mockClear();
  mockStore.clearWishlist.mockClear();
  mockStore.searchTobaccos.mockClear();
  mockStore.setSearchQuery.mockClear();
  mockStore.setCurrentPage.mockClear();
  mockStore.clearError.mockClear();
}

/**
 * Reset all mock store function calls
 */
export function resetMockStoreFunctions(): void {
  mockStore.fetchWishlist.mockReset();
  mockStore.addToWishlist.mockReset();
  mockStore.removeFromWishlist.mockReset();
  mockStore.clearWishlist.mockReset();
  mockStore.searchTobaccos.mockReset();
  mockStore.setSearchQuery.mockReset();
  mockStore.setCurrentPage.mockReset();
  mockStore.clearError.mockReset();
}

/**
 * Helper function to verify fetchWishlist was called
 */
export function expectFetchWishlistCalled(times: number = 1): void {
  expect(mockStore.fetchWishlist).toHaveBeenCalledTimes(times);
}

/**
 * Helper function to verify addToWishlist was called
 */
export function expectAddToWishlistCalled(
  tobaccoId: string,
  notes?: string,
  times: number = 1
): void {
  expect(mockStore.addToWishlist).toHaveBeenCalledTimes(times);
  if (times > 0) {
    expect(mockStore.addToWishlist).toHaveBeenCalledWith(tobaccoId, notes);
  }
}

/**
 * Helper function to verify removeFromWishlist was called
 */
export function expectRemoveFromWishlistCalled(
  tobaccoId: string,
  times: number = 1
): void {
  expect(mockStore.removeFromWishlist).toHaveBeenCalledTimes(times);
  if (times > 0) {
    expect(mockStore.removeFromWishlist).toHaveBeenCalledWith(tobaccoId);
  }
}

/**
 * Helper function to verify clearWishlist was called
 */
export function expectClearWishlistCalled(times: number = 1): void {
  expect(mockStore.clearWishlist).toHaveBeenCalledTimes(times);
}

/**
 * Helper function to verify searchTobaccos was called
 */
export function expectSearchTobaccosCalled(
  query: string,
  page?: number,
  times: number = 1
): void {
  expect(mockStore.searchTobaccos).toHaveBeenCalledTimes(times);
  if (times > 0) {
    expect(mockStore.searchTobaccos).toHaveBeenCalledWith(query, page);
  }
}

/**
 * Helper function to verify setSearchQuery was called
 */
export function expectSetSearchQueryCalled(
  query: string,
  times: number = 1
): void {
  expect(mockStore.setSearchQuery).toHaveBeenCalledTimes(times);
  if (times > 0) {
    expect(mockStore.setSearchQuery).toHaveBeenCalledWith(query);
  }
}

/**
 * Helper function to verify setCurrentPage was called
 */
export function expectSetCurrentPageCalled(
  page: number,
  times: number = 1
): void {
  expect(mockStore.setCurrentPage).toHaveBeenCalledTimes(times);
  if (times > 0) {
    expect(mockStore.setCurrentPage).toHaveBeenCalledWith(page);
  }
}

/**
 * Helper function to verify clearError was called
 */
export function expectClearErrorCalled(times: number = 1): void {
  expect(mockStore.clearError).toHaveBeenCalledTimes(times);
}

/**
 * Helper function to verify no store actions were called
 */
export function expectNoStoreActionsCalled(): void {
  expect(mockStore.fetchWishlist).not.toHaveBeenCalled();
  expect(mockStore.addToWishlist).not.toHaveBeenCalled();
  expect(mockStore.removeFromWishlist).not.toHaveBeenCalled();
  expect(mockStore.clearWishlist).not.toHaveBeenCalled();
  expect(mockStore.searchTobaccos).not.toHaveBeenCalled();
  expect(mockStore.setSearchQuery).not.toHaveBeenCalled();
  expect(mockStore.setCurrentPage).not.toHaveBeenCalled();
  expect(mockStore.clearError).not.toHaveBeenCalled();
}

/**
 * Helper function to update mock store state
 */
export function updateMockStoreState(updates: Partial<MockStoreState>): void {
  if (updates.wishlist !== undefined) {
    mockStore.wishlist = updates.wishlist;
  }
  if (updates.searchResults !== undefined) {
    mockStore.searchResults = updates.searchResults;
  }
  if (updates.searchQuery !== undefined) {
    mockStore.searchQuery = updates.searchQuery;
  }
  if (updates.currentPage !== undefined) {
    mockStore.currentPage = updates.currentPage;
  }
  if (updates.isLoading !== undefined) {
    mockStore.isLoading = updates.isLoading;
  }
  if (updates.error !== undefined) {
    mockStore.error = updates.error;
  }
}

/**
 * Helper function to get mock store state snapshot
 */
export function getMockStoreState(): MockStoreState {
  return {
    wishlist: mockStore.wishlist,
    searchResults: mockStore.searchResults,
    searchQuery: mockStore.searchQuery,
    currentPage: mockStore.currentPage,
    isLoading: mockStore.isLoading,
    error: mockStore.error,
  };
}

/**
 * Helper function to mock fetchWishlist success
 */
export function mockFetchWishlistSuccess(wishlist: Wishlist): void {
  mockStore.fetchWishlist.mockImplementation(async () => {
    mockStore.wishlist = wishlist;
    mockStore.isLoading = false;
    mockStore.error = null;
  });
}

/**
 * Helper function to mock fetchWishlist failure
 * NOTE: This throws an error to trigger catch blocks in components
 */
export function mockFetchWishlistFailure(error: string): void {
  mockStore.fetchWishlist.mockImplementation(async () => {
    mockStore.wishlist = null;
    mockStore.isLoading = false;
    mockStore.error = error;
    // Throw error to trigger catch blocks in components
    throw new Error(error);
  });
}

/**
 * Helper function to mock addToWishlist success
 */
export function mockAddToWishlistSuccess(wishlist: Wishlist): void {
  mockStore.addToWishlist.mockImplementation(async (tobaccoId: string, notes?: string) => {
    mockStore.wishlist = wishlist;
    mockStore.isLoading = false;
    mockStore.error = null;
  });
}

/**
 * Helper function to mock addToWishlist failure
 */
export function mockAddToWishlistFailure(error: string): void {
  mockStore.addToWishlist.mockImplementation(async (tobaccoId: string, notes?: string) => {
    mockStore.isLoading = false;
    mockStore.error = error;
    throw new Error(error);
  });
}

/**
 * Helper function to mock removeFromWishlist success
 */
export function mockRemoveFromWishlistSuccess(wishlist: Wishlist): void {
  mockStore.removeFromWishlist.mockImplementation(async (tobaccoId: string) => {
    mockStore.wishlist = wishlist;
    mockStore.isLoading = false;
    mockStore.error = null;
  });
}

/**
 * Helper function to mock removeFromWishlist failure
 */
export function mockRemoveFromWishlistFailure(error: string): void {
  mockStore.removeFromWishlist.mockImplementation(async (tobaccoId: string) => {
    mockStore.isLoading = false;
    mockStore.error = error;
    throw new Error(error);
  });
}

/**
 * Helper function to mock clearWishlist success
 */
export function mockClearWishlistSuccess(): void {
  mockStore.clearWishlist.mockImplementation(async () => {
    mockStore.wishlist = null;
    mockStore.isLoading = false;
    mockStore.error = null;
  });
}

/**
 * Helper function to mock clearWishlist failure
 */
export function mockClearWishlistFailure(error: string): void {
  mockStore.clearWishlist.mockImplementation(async () => {
    mockStore.isLoading = false;
    mockStore.error = error;
    throw new Error(error);
  });
}

/**
 * Helper function to mock searchTobaccos success
 */
export function mockSearchTobaccosSuccess(results: Tobacco[]): void {
  mockStore.searchTobaccos.mockImplementation(async (query: string, page?: number) => {
    mockStore.searchResults = results;
    mockStore.currentPage = page || 1;
    mockStore.isLoading = false;
    mockStore.error = null;
  });
}

/**
 * Helper function to mock searchTobaccos failure
 */
export function mockSearchTobaccosFailure(error: string): void {
  mockStore.searchTobaccos.mockImplementation(async (query: string, page?: number) => {
    mockStore.searchResults = [];
    mockStore.currentPage = page || 1;
    mockStore.isLoading = false;
    mockStore.error = error;
    throw new Error(error);
  });
}

/**
 * Helper function to verify store state matches expected values
 */
export function expectMockStoreState(expected: Partial<MockStoreState>): void {
  const actual = getMockStoreState();
  
  if (expected.wishlist !== undefined) {
    expect(actual.wishlist).toEqual(expected.wishlist);
  }
  if (expected.searchResults !== undefined) {
    expect(actual.searchResults).toEqual(expected.searchResults);
  }
  if (expected.searchQuery !== undefined) {
    expect(actual.searchQuery).toBe(expected.searchQuery);
  }
  if (expected.currentPage !== undefined) {
    expect(actual.currentPage).toBe(expected.currentPage);
  }
  if (expected.isLoading !== undefined) {
    expect(actual.isLoading).toBe(expected.isLoading);
  }
  if (expected.error !== undefined) {
    expect(actual.error).toBe(expected.error);
  }
}

/**
 * Helper function to verify store is in loading state
 */
export function expectStoreLoading(): void {
  expect(mockStore.isLoading).toBe(true);
  expect(mockStore.error).toBeNull();
}

/**
 * Helper function to verify store is not in loading state
 */
export function expectStoreNotLoading(): void {
  expect(mockStore.isLoading).toBe(false);
}

/**
 * Helper function to verify store has error
 */
export function expectStoreError(expectedError?: string): void {
  expect(mockStore.error).not.toBeNull();
  if (expectedError) {
    expect(mockStore.error).toBe(expectedError);
  }
}

/**
 * Helper function to verify store has no error
 */
export function expectStoreNoError(): void {
  expect(mockStore.error).toBeNull();
}

/**
 * Helper function to verify store has wishlist
 */
export function expectStoreHasWishlist(): void {
  expect(mockStore.wishlist).not.toBeNull();
  expect(mockStore.wishlist).toBeDefined();
}

/**
 * Helper function to verify store has no wishlist
 */
export function expectStoreNoWishlist(): void {
  expect(mockStore.wishlist).toBeNull();
}

/**
 * Helper function to verify store has search results
 */
export function expectStoreHasSearchResults(): void {
  expect(mockStore.searchResults.length).toBeGreaterThan(0);
}

/**
 * Helper function to verify store has no search results
 */
export function expectStoreNoSearchResults(): void {
  expect(mockStore.searchResults).toHaveLength(0);
}

export default mockStore;
