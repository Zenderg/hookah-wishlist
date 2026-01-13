/**
 * Comprehensive Unit Tests for Zustand Store (useStore.ts)
 * 
 * This test suite provides comprehensive coverage of Zustand store following
 * javascript-testing-patterns skill best practices for testing state management.
 * 
 * Test Coverage:
 * - Initial state initialization
 * - Async actions (wishlist and search)
 * - Synchronous actions
 * - State persistence
 * - Integration workflows
 * - Edge cases and boundary conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useStore } from '../../../src/store/useStore';
import apiService from '../../../src/services/api';
import {
  mockWishlist,
  mockEmptyWishlist,
  mockWishlistItem1,
  mockWishlistItem2,
  mockWishlistItem3,
  mockTobacco1,
  mockTobacco2,
  mockTobacco3,
  mockSearchResults,
  mockEmptySearchResults,
  createMockWishlist,
  createMockWishlistItem,
  createMockTobaccos,
} from '../../fixtures/mockData';

// Mock apiService
vi.mock('../../../src/services/api', () => ({
  default: {
    getWishlist: vi.fn(),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    clearWishlist: vi.fn(),
    searchTobaccos: vi.fn(),
  },
}));

describe('useStore - Initial State Tests', () => {
  it('should initialize with correct default state', () => {
    const state = useStore.getState();
    
    expect(state.wishlist).toBeNull();
    expect(state.searchResults).toEqual([]);
    expect(state.searchQuery).toBe('');
    expect(state.currentPage).toBe(1);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should have all state properties initialized', () => {
    const state = useStore.getState();
    
    expect(state).toHaveProperty('wishlist');
    expect(state).toHaveProperty('searchResults');
    expect(state).toHaveProperty('searchQuery');
    expect(state).toHaveProperty('currentPage');
    expect(state).toHaveProperty('isLoading');
    expect(state).toHaveProperty('error');
  });

  it('should have all actions available', () => {
    const state = useStore.getState();
    
    expect(state).toHaveProperty('fetchWishlist');
    expect(state).toHaveProperty('addToWishlist');
    expect(state).toHaveProperty('removeFromWishlist');
    expect(state).toHaveProperty('clearWishlist');
    expect(state).toHaveProperty('searchTobaccos');
    expect(state).toHaveProperty('setSearchQuery');
    expect(state).toHaveProperty('setCurrentPage');
    expect(state).toHaveProperty('clearError');
  });

  it('should have wishlist as null initially', () => {
    const { wishlist } = useStore.getState();
    expect(wishlist).toBeNull();
  });

  it('should have searchResults as empty array initially', () => {
    const { searchResults } = useStore.getState();
    expect(searchResults).toEqual([]);
    expect(searchResults).toHaveLength(0);
  });

  it('should have isLoading as false initially', () => {
    const { isLoading } = useStore.getState();
    expect(isLoading).toBe(false);
  });

  it('should have error as null initially', () => {
    const { error } = useStore.getState();
    expect(error).toBeNull();
  });

  it('should have searchQuery as empty string initially', () => {
    const { searchQuery } = useStore.getState();
    expect(searchQuery).toBe('');
  });

  it('should have currentPage as 1 initially', () => {
    const { currentPage } = useStore.getState();
    expect(currentPage).toBe(1);
  });
});

describe('useStore - Async Action Tests: fetchWishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      wishlist: null,
      isLoading: false,
      error: null,
    });
  });

  it('should fetch wishlist successfully with data', async () => {
    vi.mocked(apiService.getWishlist).mockResolvedValue(mockWishlist);
    
    await useStore.getState().fetchWishlist();
    
    const state = useStore.getState();
    expect(state.wishlist).toEqual(mockWishlist);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(apiService.getWishlist).toHaveBeenCalledTimes(1);
  });

  it('should fetch wishlist successfully with empty wishlist', async () => {
    vi.mocked(apiService.getWishlist).mockResolvedValue(mockEmptyWishlist);
    
    await useStore.getState().fetchWishlist();
    
    const state = useStore.getState();
    expect(state.wishlist).toEqual(mockEmptyWishlist);
    expect(state.wishlist?.items).toHaveLength(0);
    expect(state.wishlist?.total).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle 401 authentication error', async () => {
    const authError = new Error('Authentication failed. Please open this app from Telegram.');
    vi.mocked(apiService.getWishlist).mockRejectedValue(authError);
    
    await useStore.getState().fetchWishlist();
    
    const state = useStore.getState();
    expect(state.wishlist).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Authentication failed. Please open this app from Telegram.');
  });

  it('should handle 404 not found error', async () => {
    const notFoundError = new Error('The requested resource was not found.');
    vi.mocked(apiService.getWishlist).mockRejectedValue(notFoundError);
    
    await useStore.getState().fetchWishlist();
    
    const state = useStore.getState();
    expect(state.wishlist).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('The requested resource was not found.');
  });

  it('should handle network error', async () => {
    const networkError = new Error('Network Error');
    vi.mocked(apiService.getWishlist).mockRejectedValue(networkError);
    
    await useStore.getState().fetchWishlist();
    
    const state = useStore.getState();
    expect(state.wishlist).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Network Error');
  });

  it('should set loading state during fetch', async () => {
    vi.mocked(apiService.getWishlist).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockWishlist), 10))
    );
    
    const fetchPromise = useStore.getState().fetchWishlist();
    
    // Check loading state immediately
    expect(useStore.getState().isLoading).toBe(true);
    expect(useStore.getState().error).toBeNull();
    
    await fetchPromise;
    
    // Check final state
    expect(useStore.getState().isLoading).toBe(false);
  });

  it('should set error state after failed fetch', async () => {
    const error = new Error('Failed to fetch wishlist');
    vi.mocked(apiService.getWishlist).mockRejectedValue(error);
    
    await useStore.getState().fetchWishlist();
    
    const state = useStore.getState();
    expect(state.error).toBe('Failed to fetch wishlist');
    expect(state.isLoading).toBe(false);
  });

  it('should handle error without message property', async () => {
    const error = new Error();
    vi.mocked(apiService.getWishlist).mockRejectedValue(error);
    
    await useStore.getState().fetchWishlist();
    
    const state = useStore.getState();
    expect(state.error).toBe('Failed to fetch wishlist');
  });

  it('should update wishlist on successful fetch', async () => {
    const newWishlist = createMockWishlist({
      items: [],
      total: 0,
    });
    vi.mocked(apiService.getWishlist).mockResolvedValue(newWishlist);
    
    await useStore.getState().fetchWishlist();
    
    expect(useStore.getState().wishlist).toEqual(newWishlist);
  });
});

describe('useStore - Async Action Tests: addToWishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      wishlist: null,
      isLoading: false,
      error: null,
    });
  });

  it('should add tobacco to wishlist successfully', async () => {
    const updatedWishlist = createMockWishlist({
      items: [mockWishlistItem1],
      total: 1,
    });
    vi.mocked(apiService.addToWishlist).mockResolvedValue(updatedWishlist);
    
    await useStore.getState().addToWishlist('tobacco-001', 'Try this soon');
    
    const state = useStore.getState();
    expect(state.wishlist).toEqual(updatedWishlist);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(apiService.addToWishlist).toHaveBeenCalledWith('tobacco-001', 'Try this soon');
  });

  it('should add tobacco without notes', async () => {
    const updatedWishlist = createMockWishlist({
      items: [mockWishlistItem1],
      total: 1,
    });
    vi.mocked(apiService.addToWishlist).mockResolvedValue(updatedWishlist);
    
    await useStore.getState().addToWishlist('tobacco-001');
    
    expect(apiService.addToWishlist).toHaveBeenCalledWith('tobacco-001', undefined);
    expect(useStore.getState().wishlist).toEqual(updatedWishlist);
  });

  it('should handle adding duplicate tobacco', async () => {
    const item1 = createMockWishlistItem({ tobaccoId: 'tobacco-001', tobacco: mockTobacco1 });
    const item2 = createMockWishlistItem({ tobaccoId: 'tobacco-001', tobacco: mockTobacco1 });
    const updatedWishlist = createMockWishlist({
      items: [item1, item2],
      total: 2,
    });
    vi.mocked(apiService.addToWishlist).mockResolvedValue(updatedWishlist);
    
    await useStore.getState().addToWishlist('tobacco-001');
    
    const state = useStore.getState();
    expect(state.wishlist?.items).toHaveLength(2);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle 401 authentication error', async () => {
    const authError = new Error('Authentication failed');
    vi.mocked(apiService.addToWishlist).mockRejectedValue(authError);
    
    await expect(
      useStore.getState().addToWishlist('tobacco-001')
    ).rejects.toThrow('Authentication failed');
    
    const state = useStore.getState();
    expect(state.error).toBe('Authentication failed');
    expect(state.isLoading).toBe(false);
  });

  it('should handle 404 not found error', async () => {
    const notFoundError = new Error('Tobacco not found');
    vi.mocked(apiService.addToWishlist).mockRejectedValue(notFoundError);
    
    await expect(
      useStore.getState().addToWishlist('invalid-id')
    ).rejects.toThrow('Tobacco not found');
    
    const state = useStore.getState();
    expect(state.error).toBe('Tobacco not found');
    expect(state.isLoading).toBe(false);
  });

  it('should handle network error', async () => {
    const networkError = new Error('Network Error');
    vi.mocked(apiService.addToWishlist).mockRejectedValue(networkError);
    
    await expect(
      useStore.getState().addToWishlist('tobacco-001')
    ).rejects.toThrow('Network Error');
    
    const state = useStore.getState();
    expect(state.error).toBe('Network Error');
    expect(state.isLoading).toBe(false);
  });

  it('should set loading state during addition', async () => {
    vi.mocked(apiService.addToWishlist).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockWishlist), 10))
    );
    
    const addPromise = useStore.getState().addToWishlist('tobacco-001');
    
    expect(useStore.getState().isLoading).toBe(true);
    expect(useStore.getState().error).toBeNull();
    
    await addPromise;
    
    expect(useStore.getState().isLoading).toBe(false);
  });

  it('should set error state after failed addition', async () => {
    const error = new Error('Failed to add to wishlist');
    vi.mocked(apiService.addToWishlist).mockRejectedValue(error);
    
    await expect(
      useStore.getState().addToWishlist('tobacco-001')
    ).rejects.toThrow();
    
    const state = useStore.getState();
    expect(state.error).toBe('Failed to add to wishlist');
    expect(state.isLoading).toBe(false);
  });

  it('should handle error without message property', async () => {
    const error = new Error();
    vi.mocked(apiService.addToWishlist).mockRejectedValue(error);
    
    await expect(
      useStore.getState().addToWishlist('tobacco-001')
    ).rejects.toThrow();
    
    const state = useStore.getState();
    expect(state.error).toBe('Failed to add to wishlist');
  });

  it('should update wishlist on successful addition', async () => {
    const updatedWishlist = createMockWishlist({
      items: [mockWishlistItem1, mockWishlistItem2],
      total: 2,
    });
    vi.mocked(apiService.addToWishlist).mockResolvedValue(updatedWishlist);
    
    await useStore.getState().addToWishlist('tobacco-002');
    
    expect(useStore.getState().wishlist).toEqual(updatedWishlist);
  });
});

describe('useStore - Async Action Tests: removeFromWishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      wishlist: mockWishlist,
      isLoading: false,
      error: null,
    });
  });

  it('should remove tobacco from wishlist successfully', async () => {
    const updatedWishlist = createMockWishlist({
      items: [mockWishlistItem2, mockWishlistItem3],
      total: 2,
    });
    vi.mocked(apiService.removeFromWishlist).mockResolvedValue(updatedWishlist);
    
    await useStore.getState().removeFromWishlist('tobacco-001');
    
    const state = useStore.getState();
    expect(state.wishlist).toEqual(updatedWishlist);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(apiService.removeFromWishlist).toHaveBeenCalledWith('tobacco-001');
  });

  it('should handle removing non-existent tobacco', async () => {
    const updatedWishlist = createMockWishlist({
      items: [mockWishlistItem1, mockWishlistItem2, mockWishlistItem3],
      total: 3,
    });
    vi.mocked(apiService.removeFromWishlist).mockResolvedValue(updatedWishlist);
    
    await useStore.getState().removeFromWishlist('non-existent-id');
    
    const state = useStore.getState();
    expect(state.wishlist).toEqual(updatedWishlist);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle 401 authentication error', async () => {
    const authError = new Error('Authentication failed');
    vi.mocked(apiService.removeFromWishlist).mockRejectedValue(authError);
    
    await expect(
      useStore.getState().removeFromWishlist('tobacco-001')
    ).rejects.toThrow('Authentication failed');
    
    const state = useStore.getState();
    expect(state.error).toBe('Authentication failed');
    expect(state.isLoading).toBe(false);
  });

  it('should handle 404 not found error', async () => {
    const notFoundError = new Error('Tobacco not found in wishlist');
    vi.mocked(apiService.removeFromWishlist).mockRejectedValue(notFoundError);
    
    await expect(
      useStore.getState().removeFromWishlist('tobacco-001')
    ).rejects.toThrow('Tobacco not found in wishlist');
    
    const state = useStore.getState();
    expect(state.error).toBe('Tobacco not found in wishlist');
    expect(state.isLoading).toBe(false);
  });

  it('should handle network error', async () => {
    const networkError = new Error('Network Error');
    vi.mocked(apiService.removeFromWishlist).mockRejectedValue(networkError);
    
    await expect(
      useStore.getState().removeFromWishlist('tobacco-001')
    ).rejects.toThrow('Network Error');
    
    const state = useStore.getState();
    expect(state.error).toBe('Network Error');
    expect(state.isLoading).toBe(false);
  });

  it('should set loading state during removal', async () => {
    vi.mocked(apiService.removeFromWishlist).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockWishlist), 10))
    );
    
    const removePromise = useStore.getState().removeFromWishlist('tobacco-001');
    
    expect(useStore.getState().isLoading).toBe(true);
    expect(useStore.getState().error).toBeNull();
    
    await removePromise;
    
    expect(useStore.getState().isLoading).toBe(false);
  });

  it('should set error state after failed removal', async () => {
    const error = new Error('Failed to remove from wishlist');
    vi.mocked(apiService.removeFromWishlist).mockRejectedValue(error);
    
    await expect(
      useStore.getState().removeFromWishlist('tobacco-001')
    ).rejects.toThrow();
    
    const state = useStore.getState();
    expect(state.error).toBe('Failed to remove from wishlist');
    expect(state.isLoading).toBe(false);
  });

  it('should handle error without message property', async () => {
    const error = new Error();
    vi.mocked(apiService.removeFromWishlist).mockRejectedValue(error);
    
    await expect(
      useStore.getState().removeFromWishlist('tobacco-001')
    ).rejects.toThrow();
    
    const state = useStore.getState();
    expect(state.error).toBe('Failed to remove from wishlist');
  });

  it('should update wishlist on successful removal', async () => {
    const updatedWishlist = createMockWishlist({
      items: [mockWishlistItem2],
      total: 1,
    });
    vi.mocked(apiService.removeFromWishlist).mockResolvedValue(updatedWishlist);
    
    await useStore.getState().removeFromWishlist('tobacco-001');
    
    expect(useStore.getState().wishlist).toEqual(updatedWishlist);
  });
});

describe('useStore - Async Action Tests: clearWishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      wishlist: mockWishlist,
      isLoading: false,
      error: null,
    });
  });

  it('should clear wishlist successfully', async () => {
    vi.mocked(apiService.clearWishlist).mockResolvedValue(undefined as any);
    
    await useStore.getState().clearWishlist();
    
    const state = useStore.getState();
    expect(state.wishlist).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(apiService.clearWishlist).toHaveBeenCalledTimes(1);
  });

  it('should handle 401 authentication error', async () => {
    const authError = new Error('Authentication failed');
    vi.mocked(apiService.clearWishlist).mockRejectedValue(authError);
    
    await useStore.getState().clearWishlist();
    
    const state = useStore.getState();
    expect(state.wishlist).toEqual(mockWishlist); // Should not change on error
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Authentication failed');
  });

  it('should handle 403 forbidden error', async () => {
    const forbiddenError = new Error('Access denied');
    vi.mocked(apiService.clearWishlist).mockRejectedValue(forbiddenError);
    
    await useStore.getState().clearWishlist();
    
    const state = useStore.getState();
    expect(state.wishlist).toEqual(mockWishlist);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Access denied');
  });

  it('should handle network error', async () => {
    const networkError = new Error('Network Error');
    vi.mocked(apiService.clearWishlist).mockRejectedValue(networkError);
    
    await useStore.getState().clearWishlist();
    
    const state = useStore.getState();
    expect(state.wishlist).toEqual(mockWishlist);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Network Error');
  });

  it('should set loading state during clear', async () => {
    vi.mocked(apiService.clearWishlist).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined as any), 10))
    );
    
    const clearPromise = useStore.getState().clearWishlist();
    
    expect(useStore.getState().isLoading).toBe(true);
    expect(useStore.getState().error).toBeNull();
    
    await clearPromise;
    
    expect(useStore.getState().isLoading).toBe(false);
  });

  it('should set error state after failed clear', async () => {
    const error = new Error('Failed to clear wishlist');
    vi.mocked(apiService.clearWishlist).mockRejectedValue(error);
    
    await useStore.getState().clearWishlist();
    
    const state = useStore.getState();
    expect(state.error).toBe('Failed to clear wishlist');
    expect(state.isLoading).toBe(false);
  });

  it('should handle error without message property', async () => {
    const error = new Error();
    vi.mocked(apiService.clearWishlist).mockRejectedValue(error);
    
    await useStore.getState().clearWishlist();
    
    const state = useStore.getState();
    expect(state.error).toBe('Failed to clear wishlist');
  });

  it('should set wishlist to null on successful clear', async () => {
    vi.mocked(apiService.clearWishlist).mockResolvedValue(undefined as any);
    
    await useStore.getState().clearWishlist();
    
    expect(useStore.getState().wishlist).toBeNull();
  });
});

describe('useStore - Async Action Tests: searchTobaccos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      searchResults: [],
      currentPage: 1,
      isLoading: false,
      error: null,
    });
  });

  it('should search tobaccos successfully with results', async () => {
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockSearchResults);
    
    await useStore.getState().searchTobaccos('mint');
    
    const state = useStore.getState();
    expect(state.searchResults).toEqual(mockSearchResults.results);
    expect(state.currentPage).toBe(1);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(apiService.searchTobaccos).toHaveBeenCalledWith('mint', 1);
  });

  it('should search tobaccos successfully with empty results', async () => {
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockEmptySearchResults);
    
    await useStore.getState().searchTobaccos('nonexistent');
    
    const state = useStore.getState();
    expect(state.searchResults).toEqual([]);
    expect(state.searchResults).toHaveLength(0);
    expect(state.currentPage).toBe(1);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should search with pagination', async () => {
    const paginatedResults = {
      results: createMockTobaccos(20),
      total: 45,
      page: 2,
      pageSize: 20,
    };
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(paginatedResults);
    
    await useStore.getState().searchTobaccos('mint', 2);
    
    const state = useStore.getState();
    expect(state.searchResults).toHaveLength(20);
    expect(state.currentPage).toBe(2);
    expect(apiService.searchTobaccos).toHaveBeenCalledWith('mint', 2);
  });

  it('should handle 401 authentication error', async () => {
    const authError = new Error('Authentication failed');
    vi.mocked(apiService.searchTobaccos).mockRejectedValue(authError);
    
    await useStore.getState().searchTobaccos('mint');
    
    const state = useStore.getState();
    expect(state.searchResults).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Authentication failed');
  });

  it('should handle 429 rate limit error', async () => {
    const rateLimitError = new Error('Too many requests');
    vi.mocked(apiService.searchTobaccos).mockRejectedValue(rateLimitError);
    
    await useStore.getState().searchTobaccos('mint');
    
    const state = useStore.getState();
    expect(state.searchResults).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Too many requests');
  });

  it('should handle network error', async () => {
    const networkError = new Error('Network Error');
    vi.mocked(apiService.searchTobaccos).mockRejectedValue(networkError);
    
    await useStore.getState().searchTobaccos('mint');
    
    const state = useStore.getState();
    expect(state.searchResults).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Network Error');
  });

  it('should set loading state during search', async () => {
    vi.mocked(apiService.searchTobaccos).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSearchResults), 10))
    );
    
    const searchPromise = useStore.getState().searchTobaccos('mint');
    
    expect(useStore.getState().isLoading).toBe(true);
    expect(useStore.getState().error).toBeNull();
    
    await searchPromise;
    
    expect(useStore.getState().isLoading).toBe(false);
  });

  it('should set error state after failed search', async () => {
    const error = new Error('Failed to search');
    vi.mocked(apiService.searchTobaccos).mockRejectedValue(error);
    
    await useStore.getState().searchTobaccos('mint');
    
    const state = useStore.getState();
    expect(state.error).toBe('Failed to search');
    expect(state.isLoading).toBe(false);
  });

  it('should handle error without message property', async () => {
    const error = new Error();
    vi.mocked(apiService.searchTobaccos).mockRejectedValue(error);
    
    await useStore.getState().searchTobaccos('mint');
    
    const state = useStore.getState();
    expect(state.error).toBe('Failed to search');
  });

  it('should update searchResults on successful search', async () => {
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockSearchResults);
    
    await useStore.getState().searchTobaccos('mint');
    
    expect(useStore.getState().searchResults).toEqual(mockSearchResults.results);
  });

  it('should update currentPage on successful search', async () => {
    const results = {
      results: [],
      total: 0,
      page: 3,
      pageSize: 20,
    };
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(results);
    
    await useStore.getState().searchTobaccos('mint', 3);
    
    expect(useStore.getState().currentPage).toBe(3);
  });
});

describe('useStore - Synchronous Action Tests: setSearchQuery', () => {
  beforeEach(() => {
    useStore.setState({
      searchQuery: '',
    });
  });

  it('should set search query', () => {
    useStore.getState().setSearchQuery('mint');
    
    expect(useStore.getState().searchQuery).toBe('mint');
  });

  it('should clear search query with empty string', () => {
    useStore.getState().setSearchQuery('mint');
    expect(useStore.getState().searchQuery).toBe('mint');
    
    useStore.getState().setSearchQuery('');
    expect(useStore.getState().searchQuery).toBe('');
  });

  it('should handle special characters in query', () => {
    const query = 'Café & Mint';
    useStore.getState().setSearchQuery(query);
    
    expect(useStore.getState().searchQuery).toBe(query);
  });

  it('should handle very long query', () => {
    const longQuery = 'a'.repeat(1000);
    useStore.getState().setSearchQuery(longQuery);
    
    expect(useStore.getState().searchQuery).toBe(longQuery);
  });

  it('should handle whitespace-only query', () => {
    const whitespaceQuery = '   ';
    useStore.getState().setSearchQuery(whitespaceQuery);
    
    expect(useStore.getState().searchQuery).toBe(whitespaceQuery);
  });

  it('should update search query multiple times', () => {
    useStore.getState().setSearchQuery('mint');
    expect(useStore.getState().searchQuery).toBe('mint');
    
    useStore.getState().setSearchQuery('apple');
    expect(useStore.getState().searchQuery).toBe('apple');
    
    useStore.getState().setSearchQuery('blueberry');
    expect(useStore.getState().searchQuery).toBe('blueberry');
  });
});

describe('useStore - Synchronous Action Tests: setCurrentPage', () => {
  beforeEach(() => {
    useStore.setState({
      currentPage: 1,
    });
  });

  it('should set current page', () => {
    useStore.getState().setCurrentPage(2);
    
    expect(useStore.getState().currentPage).toBe(2);
  });

  it('should reset page to 1', () => {
    useStore.getState().setCurrentPage(5);
    expect(useStore.getState().currentPage).toBe(5);
    
    useStore.getState().setCurrentPage(1);
    expect(useStore.getState().currentPage).toBe(1);
  });

  it('should handle page 0', () => {
    useStore.getState().setCurrentPage(0);
    
    expect(useStore.getState().currentPage).toBe(0);
  });

  it('should handle negative page number', () => {
    useStore.getState().setCurrentPage(-1);
    
    expect(useStore.getState().currentPage).toBe(-1);
  });

  it('should handle very large page number', () => {
    useStore.getState().setCurrentPage(999999);
    
    expect(useStore.getState().currentPage).toBe(999999);
  });

  it('should update current page multiple times', () => {
    useStore.getState().setCurrentPage(1);
    expect(useStore.getState().currentPage).toBe(1);
    
    useStore.getState().setCurrentPage(2);
    expect(useStore.getState().currentPage).toBe(2);
    
    useStore.getState().setCurrentPage(3);
    expect(useStore.getState().currentPage).toBe(3);
  });
});

describe('useStore - Synchronous Action Tests: clearError', () => {
  beforeEach(() => {
    useStore.setState({
      error: 'Some error',
    });
  });

  it('should clear error state', () => {
    expect(useStore.getState().error).toBe('Some error');
    
    useStore.getState().clearError();
    
    expect(useStore.getState().error).toBeNull();
  });

  it('should handle clearing when error is already null', () => {
    useStore.setState({ error: null });
    expect(useStore.getState().error).toBeNull();
    
    useStore.getState().clearError();
    
    expect(useStore.getState().error).toBeNull();
  });

  it('should clear error after failed operation', async () => {
    const error = new Error('Test error');
    vi.mocked(apiService.getWishlist).mockRejectedValue(error);
    
    await useStore.getState().fetchWishlist();
    expect(useStore.getState().error).toBe('Test error');
    
    useStore.getState().clearError();
    expect(useStore.getState().error).toBeNull();
  });

  it('should clear error multiple times', () => {
    useStore.setState({ error: 'Error 1' });
    useStore.getState().clearError();
    expect(useStore.getState().error).toBeNull();
    
    useStore.setState({ error: 'Error 2' });
    useStore.getState().clearError();
    expect(useStore.getState().error).toBeNull();
  });
});

describe('useStore - State Persistence Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      wishlist: null,
      searchResults: [],
      searchQuery: '',
      currentPage: 1,
      isLoading: false,
      error: null,
    });
  });

  it('should persist state across component re-renders', () => {
    useStore.getState().setSearchQuery('mint');
    useStore.getState().setCurrentPage(2);
    
    // Simulate component re-render by getting state again
    const state1 = useStore.getState();
    expect(state1.searchQuery).toBe('mint');
    expect(state1.currentPage).toBe(2);
    
    const state2 = useStore.getState();
    expect(state2.searchQuery).toBe('mint');
    expect(state2.currentPage).toBe(2);
  });

  it('should update state correctly after multiple actions', async () => {
    vi.mocked(apiService.getWishlist).mockResolvedValue(mockWishlist);
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockSearchResults);
    
    await useStore.getState().fetchWishlist();
    expect(useStore.getState().wishlist).toEqual(mockWishlist);
    
    useStore.getState().setSearchQuery('mint');
    expect(useStore.getState().searchQuery).toBe('mint');
    
    await useStore.getState().searchTobaccos('mint');
    expect(useStore.getState().searchResults).toEqual(mockSearchResults.results);
    
    useStore.getState().setCurrentPage(2);
    expect(useStore.getState().currentPage).toBe(2);
  });

  it('should manage loading state properly across operations', async () => {
    vi.mocked(apiService.getWishlist).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockWishlist), 10))
    );
    
    const fetchPromise = useStore.getState().fetchWishlist();
    expect(useStore.getState().isLoading).toBe(true);
    
    await fetchPromise;
    expect(useStore.getState().isLoading).toBe(false);
  });

  it('should manage error state properly across operations', async () => {
    const error = new Error('Test error');
    vi.mocked(apiService.getWishlist).mockRejectedValue(error);
    
    await useStore.getState().fetchWishlist();
    expect(useStore.getState().error).toBe('Test error');
    
    useStore.getState().clearError();
    expect(useStore.getState().error).toBeNull();
    
    vi.mocked(apiService.getWishlist).mockResolvedValue(mockWishlist);
    await useStore.getState().fetchWishlist();
    expect(useStore.getState().error).toBeNull();
  });

  it('should maintain state consistency', () => {
    const initialState = useStore.getState();
    
    useStore.getState().setSearchQuery('query1');
    useStore.getState().setCurrentPage(2);
    
    expect(useStore.getState().searchQuery).toBe('query1');
    expect(useStore.getState().currentPage).toBe(2);
    expect(useStore.getState().wishlist).toBe(initialState.wishlist);
    expect(useStore.getState().searchResults).toEqual(initialState.searchResults);
  });
});

describe('useStore - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      wishlist: null,
      searchResults: [],
      searchQuery: '',
      currentPage: 1,
      isLoading: false,
      error: null,
    });
  });

  it('should handle complete workflow: fetch wishlist → add item → remove item', async () => {
    // Fetch wishlist
    vi.mocked(apiService.getWishlist).mockResolvedValue(mockEmptyWishlist);
    await useStore.getState().fetchWishlist();
    expect(useStore.getState().wishlist).toEqual(mockEmptyWishlist);
    
    // Add item
    const wishlistWithOne = createMockWishlist({
      items: [mockWishlistItem1],
      total: 1,
    });
    vi.mocked(apiService.addToWishlist).mockResolvedValue(wishlistWithOne);
    await useStore.getState().addToWishlist('tobacco-001');
    expect(useStore.getState().wishlist?.items).toHaveLength(1);
    
    // Remove item
    vi.mocked(apiService.removeFromWishlist).mockResolvedValue(mockEmptyWishlist);
    await useStore.getState().removeFromWishlist('tobacco-001');
    expect(useStore.getState().wishlist?.items).toHaveLength(0);
  });

  it('should handle search workflow: set query → search → navigate pages', async () => {
    // Set query
    useStore.getState().setSearchQuery('mint');
    expect(useStore.getState().searchQuery).toBe('mint');
    
    // Search
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockSearchResults);
    await useStore.getState().searchTobaccos('mint');
    expect(useStore.getState().searchResults).toHaveLength(5);
    expect(useStore.getState().currentPage).toBe(1);
    
    // Navigate to page 2
    const page2Results = {
      results: createMockTobaccos(5),
      total: 10,
      page: 2,
      pageSize: 5,
    };
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(page2Results);
    await useStore.getState().searchTobaccos('mint', 2);
    expect(useStore.getState().currentPage).toBe(2);
  });

  it('should handle error recovery: error → clear error → retry action', async () => {
    // First attempt fails
    const error = new Error('Network error');
    vi.mocked(apiService.getWishlist).mockRejectedValue(error);
    await useStore.getState().fetchWishlist();
    expect(useStore.getState().error).toBe('Network error');
    
    // Clear error
    useStore.getState().clearError();
    expect(useStore.getState().error).toBeNull();
    
    // Retry succeeds
    vi.mocked(apiService.getWishlist).mockResolvedValue(mockWishlist);
    await useStore.getState().fetchWishlist();
    expect(useStore.getState().wishlist).toEqual(mockWishlist);
    expect(useStore.getState().error).toBeNull();
  });

  it('should handle concurrent async operations', async () => {
    vi.mocked(apiService.getWishlist).mockResolvedValue(mockWishlist);
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockSearchResults);
    
    // Start both operations concurrently
    const fetchPromise = useStore.getState().fetchWishlist();
    const searchPromise = useStore.getState().searchTobaccos('mint');
    
    await Promise.all([fetchPromise, searchPromise]);
    
    expect(useStore.getState().wishlist).toEqual(mockWishlist);
    expect(useStore.getState().searchResults).toEqual(mockSearchResults.results);
  });

  it('should handle workflow with multiple search queries', async () => {
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockSearchResults);
    
    // Search for mint
    useStore.getState().setSearchQuery('mint');
    await useStore.getState().searchTobaccos('mint');
    expect(useStore.getState().searchQuery).toBe('mint');
    
    // Search for apple
    useStore.getState().setSearchQuery('apple');
    await useStore.getState().searchTobaccos('apple');
    expect(useStore.getState().searchQuery).toBe('apple');
    
    expect(apiService.searchTobaccos).toHaveBeenCalledTimes(2);
  });

  it('should handle workflow with multiple wishlist operations', async () => {
    vi.mocked(apiService.getWishlist).mockResolvedValue(mockEmptyWishlist);
    vi.mocked(apiService.addToWishlist).mockResolvedValue(mockWishlist);
    vi.mocked(apiService.removeFromWishlist).mockResolvedValue(mockEmptyWishlist);
    vi.mocked(apiService.clearWishlist).mockResolvedValue(undefined as any);
    
    // Fetch
    await useStore.getState().fetchWishlist();
    expect(useStore.getState().wishlist).toEqual(mockEmptyWishlist);
    
    // Add
    await useStore.getState().addToWishlist('tobacco-001');
    expect(useStore.getState().wishlist?.items).toHaveLength(3);
    
    // Remove
    await useStore.getState().removeFromWishlist('tobacco-001');
    expect(useStore.getState().wishlist?.items).toHaveLength(0);
    
    // Clear
    await useStore.getState().clearWishlist();
    expect(useStore.getState().wishlist).toBeNull();
  });
});

describe('useStore - Edge Cases and Boundary Conditions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      wishlist: null,
      searchResults: [],
      searchQuery: '',
      currentPage: 1,
      isLoading: false,
      error: null,
    });
  });

  it('should handle empty tobaccoId for addToWishlist', async () => {
    const updatedWishlist = createMockWishlist({
      items: [],
      total: 0,
    });
    vi.mocked(apiService.addToWishlist).mockResolvedValue(updatedWishlist);
    
    await useStore.getState().addToWishlist('');
    
    expect(apiService.addToWishlist).toHaveBeenCalledWith('', undefined);
  });

  it('should handle invalid tobaccoId for addToWishlist', async () => {
    const error = new Error('Invalid tobacco ID');
    vi.mocked(apiService.addToWishlist).mockRejectedValue(error);
    
    await expect(
      useStore.getState().addToWishlist('invalid-id-!@#$%')
    ).rejects.toThrow();
  });

  it('should handle very long search query', async () => {
    const longQuery = 'a'.repeat(10000);
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockEmptySearchResults);
    
    await useStore.getState().searchTobaccos(longQuery);
    
    expect(apiService.searchTobaccos).toHaveBeenCalledWith(longQuery, 1);
  });

  it('should handle special characters in search query', async () => {
    const specialQuery = 'Café & Crème Brûlée @#$%';
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockEmptySearchResults);
    
    await useStore.getState().searchTobaccos(specialQuery);
    
    expect(apiService.searchTobaccos).toHaveBeenCalledWith(specialQuery, 1);
  });

  it('should handle page number 0 for search', async () => {
    const results = {
      results: [],
      total: 0,
      page: 0,
      pageSize: 20,
    };
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(results);
    
    await useStore.getState().searchTobaccos('mint', 0);
    
    expect(useStore.getState().currentPage).toBe(0);
  });

  it('should handle negative page number for search', async () => {
    const results = {
      results: [],
      total: 0,
      page: -1,
      pageSize: 20,
    };
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(results);
    
    await useStore.getState().searchTobaccos('mint', -1);
    
    expect(useStore.getState().currentPage).toBe(-1);
  });

  it('should handle very large page size', async () => {
    const results = {
      results: createMockTobaccos(1000),
      total: 1000,
      page: 1,
      pageSize: 1000,
    };
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(results);
    
    await useStore.getState().searchTobaccos('mint');
    
    expect(useStore.getState().searchResults).toHaveLength(1000);
  });

  it('should handle empty search query', async () => {
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockEmptySearchResults);
    
    await useStore.getState().searchTobaccos('');
    
    expect(apiService.searchTobaccos).toHaveBeenCalledWith('', 1);
  });

  it('should handle whitespace-only search query', async () => {
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockEmptySearchResults);
    
    await useStore.getState().searchTobaccos('   ');
    
    expect(apiService.searchTobaccos).toHaveBeenCalledWith('   ', 1);
  });

  it('should handle concurrent addToWishlist calls', async () => {
    const wishlist1 = createMockWishlist({
      items: [mockWishlistItem1],
      total: 1,
    });
    const wishlist2 = createMockWishlist({
      items: [mockWishlistItem1, mockWishlistItem2],
      total: 2,
    });
    
    vi.mocked(apiService.addToWishlist)
      .mockResolvedValueOnce(wishlist1)
      .mockResolvedValueOnce(wishlist2);
    
    const promise1 = useStore.getState().addToWishlist('tobacco-001');
    const promise2 = useStore.getState().addToWishlist('tobacco-002');
    
    await Promise.all([promise1, promise2]);
    
    expect(apiService.addToWishlist).toHaveBeenCalledTimes(2);
  });

  it('should handle rapid state updates', () => {
    useStore.getState().setSearchQuery('a');
    useStore.getState().setSearchQuery('ab');
    useStore.getState().setSearchQuery('abc');
    useStore.getState().setSearchQuery('abcd');
    
    expect(useStore.getState().searchQuery).toBe('abcd');
  });

  it('should handle undefined notes parameter in addToWishlist', async () => {
    const updatedWishlist = createMockWishlist({
      items: [mockWishlistItem1],
      total: 1,
    });
    vi.mocked(apiService.addToWishlist).mockResolvedValue(updatedWishlist);
    
    await useStore.getState().addToWishlist('tobacco-001', undefined);
    
    expect(apiService.addToWishlist).toHaveBeenCalledWith('tobacco-001', undefined);
  });

  it('should handle null notes parameter in addToWishlist', async () => {
    const updatedWishlist = createMockWishlist({
      items: [mockWishlistItem1],
      total: 1,
    });
    vi.mocked(apiService.addToWishlist).mockResolvedValue(updatedWishlist);
    
    await useStore.getState().addToWishlist('tobacco-001', null as any);
    
    expect(apiService.addToWishlist).toHaveBeenCalledWith('tobacco-001', null);
  });

  it('should handle search with default page parameter', async () => {
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(mockSearchResults);
    
    await useStore.getState().searchTobaccos('mint');
    
    expect(apiService.searchTobaccos).toHaveBeenCalledWith('mint', 1);
  });

  it('should handle search with explicit page parameter', async () => {
    const results = {
      results: [],
      total: 0,
      page: 5,
      pageSize: 20,
    };
    vi.mocked(apiService.searchTobaccos).mockResolvedValue(results);
    
    await useStore.getState().searchTobaccos('mint', 5);
    
    expect(apiService.searchTobaccos).toHaveBeenCalledWith('mint', 5);
  });

  it('should handle error during concurrent operations', async () => {
    vi.mocked(apiService.getWishlist).mockRejectedValue(new Error('Error 1'));
    vi.mocked(apiService.searchTobaccos).mockRejectedValue(new Error('Error 2'));
    
    await useStore.getState().fetchWishlist();
    await useStore.getState().searchTobaccos('mint');
    
    expect(useStore.getState().error).toBe('Error 2'); // Last error wins
  });

  it('should handle state updates during loading', async () => {
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    
    vi.mocked(apiService.getWishlist).mockReturnValue(fetchPromise as any);
    
    const fetchCall = useStore.getState().fetchWishlist();
    expect(useStore.getState().isLoading).toBe(true);
    
    // Update state while loading
    useStore.getState().setSearchQuery('test');
    expect(useStore.getState().searchQuery).toBe('test');
    
    resolveFetch!(mockWishlist);
    await fetchCall;
    
    expect(useStore.getState().isLoading).toBe(false);
    expect(useStore.getState().wishlist).toEqual(mockWishlist);
  });
});
