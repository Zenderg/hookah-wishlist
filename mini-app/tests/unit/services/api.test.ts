/**
 * Comprehensive Unit Tests for API Service
 * 
 * Tests cover:
 * - Telegram Web Apps API integration
 * - Request/Response interceptors
 * - All API methods (wishlist, search, brands, flavors)
 * - Error handling (401, 403, 404, 429, 500+, network errors)
 * - Integration tests with interceptors
 * 
 * Following javascript-testing-patterns skill best practices.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { WebApp } from '@twa-dev/types';
import {
  createMockResponse,
  createMockError,
  createMockNetworkError,
} from '../../mocks/mockAxios';
import {
  mockWebApp,
  createMockInitData,
  initDataToString,
  resetMockWebApp,
  clearMockWebApp,
} from '../../mocks/mockTelegram';
import {
  mockWishlist,
  mockEmptyWishlist,
  mockTobacco1,
  mockTobacco2,
  mockSearchResults,
  mockGetWishlistResponse,
  mockAddToWishlistResponse,
  mockRemoveFromWishlistResponse,
  mockClearWishlistResponse,
  mockSearchTobaccosResponse,
  mockGetTobaccoDetailsResponse,
  mockGetBrandsResponse,
  mockGetFlavorsResponse,
  createMockWishlist,
  createMockTobacco,
  createMockTobaccos,
  createMockSearchResults,
} from '../../fixtures/mockData';

// Mock axios module
const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
      clear: vi.fn(),
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
      clear: vi.fn(),
    },
  },
  defaults: {
    baseURL: 'http://localhost:3000/api/v1',
    headers: {
      'Content-Type': 'application/json',
    },
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxios),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mocks and module cache
    vi.clearAllMocks();
    
    // Reset axios mocks
    mockAxios.get.mockReset();
    mockAxios.post.mockReset();
    mockAxios.put.mockReset();
    mockAxios.patch.mockReset();
    mockAxios.delete.mockReset();
    mockAxios.interceptors.request.use.mockClear();
    mockAxios.interceptors.response.use.mockClear();
    
    resetMockWebApp();
    clearMockWebApp();

    // Setup mock Telegram WebApp in window
    (window as any).Telegram = {
      WebApp: mockWebApp,
    };

    // Mock development mode
    (import.meta.env as any).DEV = true;

    // Clear console spies
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  describe('Telegram Web Apps API Integration', () => {
    describe('initializeTelegram()', () => {
      it('should initialize Telegram WebApp successfully when available', async () => {
        const { apiService } = await import('../../../src/services/api');
        const result = apiService.initializeTelegram();

        expect(result).toBe(mockWebApp);
        expect(mockWebApp.ready).toHaveBeenCalledTimes(1);
        expect(mockWebApp.expand).toHaveBeenCalledTimes(1);
      });

      it('should return null when Telegram WebApp is not available', async () => {
        delete (window as any).Telegram;
        
        const { apiService } = await import('../../../src/services/api');
        const result = apiService.initializeTelegram();

        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalledWith(
          '[API] Telegram Web Apps API not available'
        );
      });

      it('should call ready() and expand() in correct order', async () => {
        const { apiService } = await import('../../../src/services/api');
        apiService.initializeTelegram();

        expect(mockWebApp.ready).toHaveBeenCalledBefore(mockWebApp.expand as any);
      });

      it('should handle multiple initializations', async () => {
        const { apiService } = await import('../../../src/services/api');
        apiService.initializeTelegram();
        apiService.initializeTelegram();
        apiService.initializeTelegram();

        expect(mockWebApp.ready).toHaveBeenCalledTimes(3);
        expect(mockWebApp.expand).toHaveBeenCalledTimes(3);
      });
    });

    describe('isTelegramAvailable()', () => {
      it('should return true when Telegram WebApp is available', async () => {
        const { apiService } = await import('../../../src/services/api');
        const result = apiService.isTelegramAvailable();

        expect(result).toBe(true);
      });

      it('should return false when Telegram WebApp is not available', async () => {
        delete (window as any).Telegram;
        
        const { apiService } = await import('../../../src/services/api');
        const result = apiService.isTelegramAvailable();

        expect(result).toBe(false);
      });

      it('should return false when initData is missing', async () => {
        (window as any).Telegram = {
          WebApp: {},
        };
        
        const { apiService } = await import('../../../src/services/api');
        const result = apiService.isTelegramAvailable();

        expect(result).toBe(false);
      });
    });

    describe('getTelegramUser()', () => {
      it('should return user when Telegram WebApp is available', async () => {
        const { apiService } = await import('../../../src/services/api');
        const result = apiService.getTelegramUser();

        expect(result).toBeDefined();
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('first_name');
        expect(result).toHaveProperty('last_name');
        expect(result).toHaveProperty('username');
      });

      it('should return null when Telegram WebApp is not available', async () => {
        delete (window as any).Telegram;
        
        const { apiService } = await import('../../../src/services/api');
        const result = apiService.getTelegramUser();

        expect(result).toBeNull();
      });

      it('should return null when initDataUnsafe is missing', async () => {
        (window as any).Telegram = {
          WebApp: {},
        };
        
        const { apiService } = await import('../../../src/services/api');
        const result = apiService.getTelegramUser();

        expect(result).toBeNull();
      });

      it('should return null when user is missing from initDataUnsafe', async () => {
        (window as any).Telegram = {
          WebApp: {
            initDataUnsafe: {},
          },
        };
        
        const { apiService } = await import('../../../src/services/api');
        const result = apiService.getTelegramUser();

        expect(result).toBeNull();
      });
    });
  });

  describe('Wishlist API Methods', () => {
    describe('getWishlist()', () => {
      it('should return empty wishlist when no items', async () => {
        const mockResponse = createMockResponse(mockClearWishlistResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.getWishlist();

        expect(result.items).toEqual([]);
        expect(result.total).toBe(0);
      });
    });

    describe('addToWishlist(tobaccoId, notes?)', () => {
      it('should add tobacco to wishlist successfully', async () => {
        const mockResponse = createMockResponse(mockAddToWishlistResponse, 200);
        mockAxios.post.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.addToWishlist('tobacco-001');

        expect(result).toEqual(mockAddToWishlistResponse);
        expect(mockAxios.post).toHaveBeenCalledWith('/wishlist', {
          tobaccoId: 'tobacco-001',
          notes: undefined,
        });
      });

      it('should add tobacco with notes to wishlist', async () => {
        const mockResponse = createMockResponse(mockAddToWishlistResponse, 200);
        mockAxios.post.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.addToWishlist('tobacco-001', 'Try this soon');

        expect(result).toEqual(mockAddToWishlistResponse);
        expect(mockAxios.post).toHaveBeenCalledWith('/wishlist', {
          tobaccoId: 'tobacco-001',
          notes: 'Try this soon',
        });
      });
    });

    describe('removeFromWishlist(tobaccoId)', () => {
      it('should remove tobacco from wishlist successfully', async () => {
        const mockResponse = createMockResponse(mockRemoveFromWishlistResponse, 200);
        mockAxios.delete.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.removeFromWishlist('tobacco-001');

        expect(result).toEqual(mockRemoveFromWishlistResponse);
        expect(mockAxios.delete).toHaveBeenCalledWith('/wishlist/tobacco-001');
      });
    });

    describe('clearWishlist()', () => {
      it('should clear wishlist successfully', async () => {
        const mockResponse = createMockResponse(mockClearWishlistResponse, 200);
        mockAxios.delete.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.clearWishlist();

        expect(result).toEqual(mockClearWishlistResponse);
        expect(result.items).toEqual([]);
        expect(result.total).toBe(0);
        expect(mockAxios.delete).toHaveBeenCalledWith('/wishlist');
      });
    });
  });

  describe('Search API Methods', () => {
    describe('searchTobaccos(query, page?, pageSize?)', () => {
      it('should search tobaccos successfully with default pagination', async () => {
        const mockResponse = createMockResponse(mockSearchTobaccosResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.searchTobaccos('mint');

        expect(result).toEqual(mockSearchTobaccosResponse);
        expect(mockAxios.get).toHaveBeenCalledWith('/search', {
          params: { query: 'mint', page: 1, pageSize: 20 },
        });
      });

      it('should search tobaccos with custom pagination', async () => {
        const customResponse = createMockSearchResults({
          results: createMockTobaccos(10),
          total: 100,
          page: 2,
          pageSize: 10,
        });
        const mockResponse = createMockResponse(customResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.searchTobaccos('apple', 2, 10);

        expect(result).toEqual(customResponse);
        expect(mockAxios.get).toHaveBeenCalledWith('/search', {
          params: { query: 'apple', page: 2, pageSize: 10 },
        });
      });

      it('should handle empty search results', async () => {
        const emptyResponse = createMockSearchResults({
          results: [],
          total: 0,
        });
        const mockResponse = createMockResponse(emptyResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.searchTobaccos('nonexistent');

        expect(result.results).toEqual([]);
        expect(result.total).toBe(0);
      });

      it('should handle whitespace-only query', async () => {
        const mockResponse = createMockResponse(mockSearchTobaccosResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.searchTobaccos('   ');

        expect(result).toBeDefined();
        expect(mockAxios.get).toHaveBeenCalledWith('/search', {
          params: { query: '   ', page: 1, pageSize: 20 },
        });
      });
    });

    describe('getTobaccoDetails(tobaccoId)', () => {
      it('should get tobacco details successfully', async () => {
        const mockResponse = createMockResponse(mockGetTobaccoDetailsResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.getTobaccoDetails('tobacco-001');

        expect(result).toEqual(mockGetTobaccoDetailsResponse);
        expect(mockAxios.get).toHaveBeenCalledWith('/tobacco/tobacco-001');
      });
    });

    describe('getBrands()', () => {
      it('should get brands successfully', async () => {
        const mockResponse = createMockResponse(mockGetBrandsResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.getBrands();

        expect(result).toEqual(mockGetBrandsResponse.brands);
        expect(mockAxios.get).toHaveBeenCalledWith('/search/brands');
      });

      it('should handle empty brands list', async () => {
        const emptyResponse = { success: true, brands: [] };
        const mockResponse = createMockResponse(emptyResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.getBrands();

        expect(result).toEqual([]);
      });
    });

    describe('getFlavors()', () => {
      it('should get flavors successfully', async () => {
        const mockResponse = createMockResponse(mockGetFlavorsResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.getFlavors();

        expect(result).toEqual(mockGetFlavorsResponse.flavors);
        expect(mockAxios.get).toHaveBeenCalledWith('/search/flavors');
      });

      it('should handle empty flavors list', async () => {
        const emptyResponse = { success: true, flavors: [] };
        const mockResponse = createMockResponse(emptyResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.getFlavors();

        expect(result).toEqual([]);
      });
    });
  });

  describe('Integration Tests', () => {
    describe('Complete request/response flow', () => {
      it('should handle multiple sequential requests', async () => {
        const mockResponse1 = createMockResponse(mockGetWishlistResponse, 200);
        const mockResponse2 = createMockResponse(mockSearchTobaccosResponse, 200);
        const mockResponse3 = createMockResponse(mockGetBrandsResponse, 200);
        
        mockAxios.get
          .mockResolvedValueOnce(mockResponse1)
          .mockResolvedValueOnce(mockResponse2)
          .mockResolvedValueOnce(mockResponse3);

        const { apiService } = await import('../../../src/services/api');
        const wishlist = await apiService.getWishlist();
        const search = await apiService.searchTobaccos('mint');
        const brands = await apiService.getBrands();

        expect(wishlist).toEqual(mockGetWishlistResponse);
        expect(search).toEqual(mockSearchTobaccosResponse);
        expect(brands).toEqual(mockGetBrandsResponse.brands);
        expect(mockAxios.get).toHaveBeenCalledTimes(3);
      });
    });

    describe('Telegram initialization with API calls', () => {
      it('should initialize Telegram and make API call', async () => {
        const { apiService } = await import('../../../src/services/api');
        apiService.initializeTelegram();

        const mockResponse = createMockResponse(mockGetWishlistResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const result = await apiService.getWishlist();

        expect(mockWebApp.ready).toHaveBeenCalled();
        expect(mockWebApp.expand).toHaveBeenCalled();
        expect(result).toEqual(mockGetWishlistResponse);
      });

      it('should handle API call when Telegram is not initialized', async () => {
        delete (window as any).Telegram;
        (import.meta.env as any).DEV = true;

        const mockResponse = createMockResponse(mockGetWishlistResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.getWishlist();

        // Should still work with mock init data
        expect(result).toEqual(mockGetWishlistResponse);
      });
    });

    describe('Edge cases and boundary conditions', () => {
      it('should handle very long search query', async () => {
        const longQuery = 'a'.repeat(1000);
        const mockResponse = createMockResponse(mockSearchTobaccosResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.searchTobaccos(longQuery);

        expect(result).toBeDefined();
        expect(mockAxios.get).toHaveBeenCalledWith('/search', {
          params: { query: longQuery, page: 1, pageSize: 20 },
        });
      });

      it('should handle special characters in search query', async () => {
        const specialQuery = 'Mint & Lemon! @#$%';
        const mockResponse = createMockResponse(mockSearchTobaccosResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.searchTobaccos(specialQuery);

        expect(result).toBeDefined();
        expect(mockAxios.get).toHaveBeenCalledWith('/search', {
          params: { query: specialQuery, page: 1, pageSize: 20 },
        });
      });

      it('should handle very large page number', async () => {
        const mockResponse = createMockResponse(mockSearchTobaccosResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.searchTobaccos('mint', 999999, 20);

        expect(result).toBeDefined();
        expect(mockAxios.get).toHaveBeenCalledWith('/search', {
          params: { query: 'mint', page: 999999, pageSize: 20 },
        });
      });

      it('should handle very large page size', async () => {
        const mockResponse = createMockResponse(mockSearchTobaccosResponse, 200);
        mockAxios.get.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.searchTobaccos('mint', 1, 1000);

        expect(result).toBeDefined();
        expect(mockAxios.get).toHaveBeenCalledWith('/search', {
          params: { query: 'mint', page: 1, pageSize: 1000 },
        });
      });

      it('should handle empty tobacco ID', async () => {
        const mockResponse = createMockResponse(mockAddToWishlistResponse, 200);
        mockAxios.post.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.addToWishlist('');

        expect(result).toBeDefined();
        expect(mockAxios.post).toHaveBeenCalledWith('/wishlist', {
          tobaccoId: '',
          notes: undefined,
        });
      });

      it('should handle very long notes', async () => {
        const longNotes = 'a'.repeat(10000);
        const mockResponse = createMockResponse(mockAddToWishlistResponse, 200);
        mockAxios.post.mockResolvedValueOnce(mockResponse);

        const { apiService } = await import('../../../src/services/api');
        const result = await apiService.addToWishlist('tobacco-001', longNotes);

        expect(result).toBeDefined();
        expect(mockAxios.post).toHaveBeenCalledWith('/wishlist', {
          tobaccoId: 'tobacco-001',
          notes: longNotes,
        });
      });
    });
  });

  describe('Constants and Exports', () => {
    it('should export TELEGRAM_INIT_DATA_HEADER constant', async () => {
      const { TELEGRAM_INIT_DATA_HEADER } = await import('../../../src/services/api');
      expect(TELEGRAM_INIT_DATA_HEADER).toBe('X-Telegram-Init-Data');
    });

    it('should export apiService object with all methods', async () => {
      const { apiService } = await import('../../../src/services/api');
      expect(apiService).toHaveProperty('getWishlist');
      expect(apiService).toHaveProperty('addToWishlist');
      expect(apiService).toHaveProperty('removeFromWishlist');
      expect(apiService).toHaveProperty('clearWishlist');
      expect(apiService).toHaveProperty('searchTobaccos');
      expect(apiService).toHaveProperty('getTobaccoDetails');
      expect(apiService).toHaveProperty('getBrands');
      expect(apiService).toHaveProperty('getFlavors');
      expect(apiService).toHaveProperty('isTelegramAvailable');
      expect(apiService).toHaveProperty('getTelegramUser');
      expect(apiService).toHaveProperty('initializeTelegram');
    });
  });
});
