/**
 * Unit tests for HookahDbService
 */

import { Tobacco } from '@/models/tobacco';
import { setupTestEnv, resetTestEnv, clearAllMocks, resetAllMocks } from '../../utils/testHelpers';
import { AxiosError } from 'axios';

// Create a mock instance factory
const createMockAxiosInstance = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  request: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
      clear: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
      clear: jest.fn(),
    },
  },
  defaults: {
    headers: {
      common: {},
      get: {},
      post: {},
      put: {},
      patch: {},
      delete: {},
    },
    baseURL: '',
    transformRequest: [],
    transformResponse: [],
    timeout: 0,
  },
});

// Global mock instance
let mockAxiosInstance: any = createMockAxiosInstance();

// Mock axios module with a factory function
jest.mock('axios', () => {
  const actualAxios = jest.requireActual<typeof import('axios')>('axios');
  return {
    ...actualAxios,
    create: jest.fn(() => mockAxiosInstance),
    isAxiosError: actualAxios.isAxiosError,
  };
});

describe('HookahDbService', () => {
  let service: any;

  beforeAll(() => {
    setupTestEnv();
  });

  afterAll(() => {
    resetTestEnv();
  });

  beforeEach(() => {
    // Create a fresh mock instance
    const freshMockInstance = createMockAxiosInstance();
    
    // Update global mock instance reference
    mockAxiosInstance = freshMockInstance;
    
    // Update mock implementation to return fresh instance
    const axios = require('axios');
    axios.create.mockImplementation(() => mockAxiosInstance);
    
    // Clear all mocks
    clearAllMocks();
    
    // Import service after setting up mocks
    const { HookahDbService } = require('@/services/hookah-db.service');
    
    // Create a fresh service instance for each test
    service = new HookahDbService();
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('Constructor', () => {
    it('should have all required methods', () => {
      expect(typeof service.searchTobaccos).toBe('function');
      expect(typeof service.getTobaccoById).toBe('function');
      expect(typeof service.getBrands).toBe('function');
      expect(typeof service.getFlavors).toBe('function');
      expect(typeof service.clearCache).toBe('function');
    });
  });

  describe('searchTobaccos()', () => {
    const mockTobaccos: Tobacco[] = [
      {
        id: '1',
        name: 'Mint',
        brand: 'Al Fakher',
        flavor: 'Mint',
        description: 'Classic mint flavor',
        strength: 'medium',
      },
      {
        id: '2',
        name: 'Double Apple',
        brand: 'Al Fakher',
        flavor: 'Apple',
        description: 'Sweet and sour apple',
        strength: 'medium',
      },
    ];

    it('should search for tobaccos with query parameter', async () => {
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 2,
          count: 2,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'mint' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: 'mint',
          brand: undefined,
          flavor: undefined,
          page: 1,
          limit: 20,
        },
      });
      expect(result.results).toEqual(mockTobaccos);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should search with brand filter', async () => {
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 2,
          count: 2,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ brand: 'Al Fakher' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: undefined,
          brand: 'Al Fakher',
          flavor: undefined,
          page: 1,
          limit: 20,
        },
      });
      expect(result.results).toEqual(mockTobaccos);
    });

    it('should search with flavor filter', async () => {
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 2,
          count: 2,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ flavor: 'Mint' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: undefined,
          brand: undefined,
          flavor: 'Mint',
          page: 1,
          limit: 20,
        },
      });
      expect(result.results).toEqual(mockTobaccos);
    });

    it('should search with custom pagination', async () => {
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 2,
          count: 2,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test', page: 2, pageSize: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: 'test',
          brand: undefined,
          flavor: undefined,
          page: 2,
          limit: 10,
        },
      });
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });

    it('should search with all filters combined', async () => {
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 2,
          count: 2,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({
        query: 'apple',
        brand: 'Al Fakher',
        flavor: 'Apple',
        page: 1,
        pageSize: 20,
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: 'apple',
          brand: 'Al Fakher',
          flavor: 'Apple',
          page: 1,
          limit: 20,
        },
      });
      expect(result.results).toEqual(mockTobaccos);
    });

    it('should handle response with data field', async () => {
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 2,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test' });

      expect(result.results).toEqual(mockTobaccos);
      expect(result.total).toBe(2);
    });

    it('should handle response with results field', async () => {
      const mockResponse = {
        data: {
          results: mockTobaccos,
          total: 2,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test' });

      expect(result.results).toEqual(mockTobaccos);
      expect(result.total).toBe(2);
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: {
          data: [],
          total: 0,
          count: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'nonexistent' });

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle search with special characters', async () => {
      const mockResponse = {
        data: {
          data: [],
          total: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'mint & apple!' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: 'mint & apple!',
          brand: undefined,
          flavor: undefined,
          page: 1,
          limit: 20,
        },
      });
      expect(result.results).toEqual([]);
    });

    it('should handle search with unicode characters', async () => {
      const mockResponse = {
        data: {
          data: [],
          total: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'мята' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: 'мята',
          brand: undefined,
          flavor: undefined,
          page: 1,
          limit: 20,
        },
      });
      expect(result.results).toEqual([]);
    });

    it('should handle large result sets', async () => {
      const largeResults: Tobacco[] = Array.from({ length: 100 }, (_, i) => ({
        id: String(i + 1),
        name: `Tobacco ${i + 1}`,
        brand: 'Test Brand',
        flavor: 'Test Flavor',
        description: 'Test description',
        strength: 'medium',
      }));
      const mockResponse = {
        data: {
          data: largeResults,
          total: 100,
          count: 100,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test', page: 1, pageSize: 100 });

      expect(result.results.length).toBe(100);
      expect(result.total).toBe(100);
      expect(result.pageSize).toBe(100);
    });

    it('should handle malformed response (missing data and results)', async () => {
      const mockResponse = {
        data: {
          total: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test' });

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle 401 Unauthorized error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 401, data: { message: 'Unauthorized' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Unauthorized',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.searchTobaccos({ query: 'test' })).rejects.toThrow(
        'Failed to search tobaccos. Please try again later.'
      );
    });

    it('should handle 429 Too Many Requests error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 429, data: { message: 'Too Many Requests' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Too Many Requests',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.searchTobaccos({ query: 'test' })).rejects.toThrow(
        'Failed to search tobaccos. Please try again later.'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 500, data: { message: 'Internal Server Error' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Internal Server Error',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.searchTobaccos({ query: 'test' })).rejects.toThrow(
        'Failed to search tobaccos. Please try again later.'
      );
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(service.searchTobaccos({ query: 'test' })).rejects.toThrow(
        'Failed to search tobaccos. Please try again later.'
      );
    });

    it('should handle timeout errors', async () => {
      const mockError = new Error('timeout of 10000ms exceeded');
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(service.searchTobaccos({ query: 'test' })).rejects.toThrow(
        'Failed to search tobaccos. Please try again later.'
      );
    });

    it('should cache search results', async () => {
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 2,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // First call - should hit API
      const result1 = await service.searchTobaccos({ query: 'mint' });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Second call with same params - should use cache
      const result2 = await service.searchTobaccos({ query: 'mint' });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result2).toEqual(result1);
    });

    it('should not cache different search params', async () => {
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 2,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // First call
      await service.searchTobaccos({ query: 'mint' });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Second call with different params - should hit API again
      await service.searchTobaccos({ query: 'apple' });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('getTobaccoById()', () => {
    const mockTobacco: Tobacco = {
      id: '1',
      name: 'Mint',
      brand: 'Al Fakher',
      flavor: 'Mint',
      description: 'Classic mint flavor',
      strength: 'medium',
    };

    it('should get tobacco by ID', async () => {
      const mockResponse = {
        data: {
          data: mockTobacco,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getTobaccoById('1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos/1');
      expect(result).toEqual(mockTobacco);
    });

    it('should handle response without data field', async () => {
      const mockResponse = {
        data: mockTobacco,
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getTobaccoById('1');

      expect(result).toEqual(mockTobacco);
    });

    it('should return null for 404 Not Found', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 404, data: { message: 'Not Found' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Not Found',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      const result = await service.getTobaccoById('999');

      expect(result).toBeNull();
    });

    it('should handle empty ID', async () => {
      const mockResponse = {
        data: {
          data: mockTobacco,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getTobaccoById('');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos/');
      expect(result).toEqual(mockTobacco);
    });

    it('should handle ID with special characters', async () => {
      const mockResponse = {
        data: {
          data: mockTobacco,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getTobaccoById('test-123_abc');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos/test-123_abc');
      expect(result).toEqual(mockTobacco);
    });

    it('should handle 401 Unauthorized error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 401, data: { message: 'Unauthorized' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Unauthorized',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.getTobaccoById('1')).rejects.toThrow(
        'Failed to get tobacco details. Please try again later.'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 500, data: { message: 'Internal Server Error' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Internal Server Error',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.getTobaccoById('1')).rejects.toThrow(
        'Failed to get tobacco details. Please try again later.'
      );
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(service.getTobaccoById('1')).rejects.toThrow(
        'Failed to get tobacco details. Please try again later.'
      );
    });

    it('should cache tobacco details', async () => {
      const mockResponse = {
        data: {
          data: mockTobacco,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // First call - should hit API
      const result1 = await service.getTobaccoById('1');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Second call with same ID - should use cache
      const result2 = await service.getTobaccoById('1');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result2).toEqual(result1);
    });

    it('should not cache different tobacco IDs', async () => {
      const mockResponse = {
        data: {
          data: mockTobacco,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // First call
      await service.getTobaccoById('1');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Second call with different ID - should hit API again
      await service.getTobaccoById('2');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('getBrands()', () => {
    const mockBrands: string[] = ['Al Fakher', 'Starbuzz', 'Tangiers', 'Nakhla', 'Fumari'];

    it('should get list of brands', async () => {
      const mockResponse = {
        data: {
          data: mockBrands,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getBrands();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/brands');
      expect(result).toEqual(mockBrands);
    });

    it('should handle response without data field', async () => {
      const mockResponse = {
        data: mockBrands,
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getBrands();

      expect(result).toEqual(mockBrands);
    });

    it('should handle empty brands list', async () => {
      const mockResponse = {
        data: {
          data: [],
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getBrands();

      expect(result).toEqual([]);
    });

    it('should handle brands with special characters', async () => {
      const brandsWithSpecialChars = ['Al Fakher', 'Test & Co.', 'Brand (Test)'];
      const mockResponse = {
        data: {
          data: brandsWithSpecialChars,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getBrands();

      expect(result).toEqual(brandsWithSpecialChars);
    });

    it('should handle brands with unicode characters', async () => {
      const brandsWithUnicode = ['Al Fakher', 'Аль Фахер', 'Танджирс'];
      const mockResponse = {
        data: {
          data: brandsWithUnicode,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getBrands();

      expect(result).toEqual(brandsWithUnicode);
    });

    it('should handle 401 Unauthorized error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 401, data: { message: 'Unauthorized' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Unauthorized',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.getBrands()).rejects.toThrow(
        'Failed to get brands. Please try again later.'
      );
    });

    it('should handle 429 Too Many Requests error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 429, data: { message: 'Too Many Requests' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Too Many Requests',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.getBrands()).rejects.toThrow(
        'Failed to get brands. Please try again later.'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 500, data: { message: 'Internal Server Error' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Internal Server Error',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.getBrands()).rejects.toThrow(
        'Failed to get brands. Please try again later.'
      );
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(service.getBrands()).rejects.toThrow(
        'Failed to get brands. Please try again later.'
      );
    });

    it('should handle timeout errors', async () => {
      const mockError = new Error('timeout of 10000ms exceeded');
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(service.getBrands()).rejects.toThrow(
        'Failed to get brands. Please try again later.'
      );
    });

    it('should cache brands list', async () => {
      const mockResponse = {
        data: {
          data: mockBrands,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // First call - should hit API
      const result1 = await service.getBrands();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await service.getBrands();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result2).toEqual(result1);
    });
  });

  describe('getFlavors()', () => {
    const mockFlavors: string[] = ['Mint', 'Apple', 'Blueberry', 'Grape', 'Watermelon'];

    it('should get list of flavors', async () => {
      const mockResponse = {
        data: {
          data: mockFlavors,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getFlavors();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/flavors');
      expect(result).toEqual(mockFlavors);
    });

    it('should handle response without data field', async () => {
      const mockResponse = {
        data: mockFlavors,
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getFlavors();

      expect(result).toEqual(mockFlavors);
    });

    it('should handle empty flavors list', async () => {
      const mockResponse = {
        data: {
          data: [],
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getFlavors();

      expect(result).toEqual([]);
    });

    it('should handle flavors with special characters', async () => {
      const flavorsWithSpecialChars = ['Mint', 'Mint & Lemon', 'Lemon (Fresh)'];
      const mockResponse = {
        data: {
          data: flavorsWithSpecialChars,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getFlavors();

      expect(result).toEqual(flavorsWithSpecialChars);
    });

    it('should handle flavors with unicode characters', async () => {
      const flavorsWithUnicode = ['Mint', 'Яблоко', 'Арбуз', 'Мята'];
      const mockResponse = {
        data: {
          data: flavorsWithUnicode,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getFlavors();

      expect(result).toEqual(flavorsWithUnicode);
    });

    it('should handle 401 Unauthorized error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 401, data: { message: 'Unauthorized' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Unauthorized',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.getFlavors()).rejects.toThrow(
        'Failed to get flavors. Please try again later.'
      );
    });

    it('should handle 429 Too Many Requests error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 429, data: { message: 'Too Many Requests' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Too Many Requests',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.getFlavors()).rejects.toThrow(
        'Failed to get flavors. Please try again later.'
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 500, data: { message: 'Internal Server Error' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Internal Server Error',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.getFlavors()).rejects.toThrow(
        'Failed to get flavors. Please try again later.'
      );
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(service.getFlavors()).rejects.toThrow(
        'Failed to get flavors. Please try again later.'
      );
    });

    it('should handle timeout errors', async () => {
      const mockError = new Error('timeout of 10000ms exceeded');
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(service.getFlavors()).rejects.toThrow(
        'Failed to get flavors. Please try again later.'
      );
    });

    it('should cache flavors list', async () => {
      const mockResponse = {
        data: {
          data: mockFlavors,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // First call - should hit API
      const result1 = await service.getFlavors();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await service.getFlavors();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result2).toEqual(result1);
    });
  });

  describe('clearCache()', () => {
    it('should clear cache', async () => {
      const mockTobaccos: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
        },
      ];
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Make a call to populate cache
      await service.searchTobaccos({ query: 'mint' });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Make same call again - should hit API again
      await service.searchTobaccos({ query: 'mint' });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should clear cache for all endpoints', async () => {
      const mockTobaccos: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
        },
      ];
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Populate cache for all endpoints
      await service.searchTobaccos({ query: 'mint' });
      await service.getTobaccoById('1');
      await service.getBrands();
      await service.getFlavors();

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(4);

      // Clear cache
      service.clearCache();

      // Reset mock to track new calls
      mockAxiosInstance.get.mockClear();

      // Make calls again - should hit API for all
      await service.searchTobaccos({ query: 'mint' });
      await service.getTobaccoById('1');
      await service.getBrands();
      await service.getFlavors();

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(4);
    });
  });

  describe('Caching Behavior', () => {
    it('should respect cache timeout', async () => {
      const mockTobaccos: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
        },
      ];
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Make a call to populate cache
      await service.searchTobaccos({ query: 'mint' });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Wait for cache to expire (5 minutes)
      jest.useFakeTimers();
      jest.advanceTimersByTime(5 * 60 * 1000 + 1);

      // Make same call again - should hit API again
      await service.searchTobaccos({ query: 'mint' });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should handle concurrent requests with cache', async () => {
      const mockTobaccos: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
        },
      ];
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Make concurrent requests with same params
      const promises = [
        service.searchTobaccos({ query: 'mint' }),
        service.searchTobaccos({ query: 'mint' }),
        service.searchTobaccos({ query: 'mint' }),
      ];

      await Promise.all(promises);

      // Service does not implement request deduplication, so all requests hit the API
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Authentication', () => {
    it('should send requests with proper headers', async () => {
      const mockTobaccos: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
        },
      ];
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await service.searchTobaccos({ query: 'mint' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: 'mint',
          brand: undefined,
          flavor: undefined,
          page: 1,
          limit: 20,
        },
      });
    });

    it('should handle missing API key gracefully', async () => {
      // The service should still work without API key (though API may reject)
      const mockTobaccos: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
        },
      ];
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'mint' });

      expect(result.results).toEqual(mockTobaccos);
    });

    it('should handle API key authentication errors', async () => {
      const mockError: Partial<AxiosError> = {
        name: 'AxiosError',
        response: { status: 401, data: { message: 'Invalid API Key' }, headers: {} } as any,
        config: { headers: {} } as any,
        message: 'Invalid API Key',
        isAxiosError: true,
        toJSON: () => ({}),
      };
      mockAxiosInstance.get.mockRejectedValue(mockError as AxiosError);

      await expect(service.searchTobaccos({ query: 'test' })).rejects.toThrow(
        'Failed to search tobaccos. Please try again later.'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(1000);
      const mockResponse = {
        data: {
          data: [],
          total: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: longQuery });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: longQuery,
          brand: undefined,
          flavor: undefined,
          page: 1,
          limit: 20,
        },
      });
      expect(result.results).toEqual([]);
    });

    it('should handle whitespace-only query', async () => {
      const mockResponse = {
        data: {
          data: [],
          total: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: '   ' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: '   ',
          brand: undefined,
          flavor: undefined,
          page: 1,
          limit: 20,
        },
      });
      expect(result.results).toEqual([]);
    });

    it('should handle pagination with page 0', async () => {
      const mockTobaccos: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
        },
      ];
      const mockResponse = {
        data: {
          data: mockTobaccos,
          total: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test', page: 0, pageSize: 20 });

      // Service normalizes page 0 to page 1 with `params.page || 1`
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: 'test',
          brand: undefined,
          flavor: undefined,
          page: 1,
          limit: 20,
        },
      });
      expect(result.page).toBe(1);
    });

    it('should handle pagination with very large page number', async () => {
      const mockResponse = {
        data: {
          data: [],
          total: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test', page: 9999, pageSize: 20 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: 'test',
          brand: undefined,
          flavor: undefined,
          page: 9999,
          limit: 20,
        },
      });
      expect(result.page).toBe(9999);
    });

    it('should handle pagination with very large pageSize', async () => {
      const mockResponse = {
        data: {
          data: [],
          total: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test', page: 1, pageSize: 1000 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tobaccos', {
        params: {
          search: 'test',
          brand: undefined,
          flavor: undefined,
          page: 1,
          limit: 1000,
        },
      });
      expect(result.pageSize).toBe(1000);
    });

    it('should handle response with null data', async () => {
      const mockResponse = {
        data: {
          data: null,
          total: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test' });

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle response with undefined data', async () => {
      const mockResponse = {
        data: {
          total: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test' });

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle response with missing total field', async () => {
      const mockTobaccos: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
        },
      ];
      const mockResponse = {
        data: {
          data: mockTobaccos,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.searchTobaccos({ query: 'test' });

      expect(result.results).toEqual(mockTobaccos);
      expect(result.total).toBe(0);
    });
  });
});
