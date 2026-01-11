/**
 * Unit tests for SearchService
 */

import { SearchService } from '@/services/search.service';
import { Tobacco, TobaccoSearchResult } from '@/models/tobacco';
import { createMockSearchResult, mockTobaccos, mockBrands, mockFlavors } from '../../mocks/mockAxios';
import { setupTestEnv, resetTestEnv, clearAllMocks, resetAllMocks } from '../../utils/testHelpers';

// Mock the hookah-db service
jest.mock('@/services/hookah-db.service', () => {
  const mockHookahDbService = {
    searchTobaccos: jest.fn(),
    getTobaccoById: jest.fn(),
    getBrands: jest.fn(),
    getFlavors: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockHookahDbService,
    hookahDbService: mockHookahDbService,
  };
});

import hookahDbService from '@/services/hookah-db.service';

describe('SearchService', () => {
  let searchService: SearchService;

  beforeAll(() => {
    setupTestEnv();
  });

  afterAll(() => {
    resetTestEnv();
  });

  beforeEach(() => {
    clearAllMocks();
    searchService = new SearchService();
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('Constructor', () => {
    it('should create a new SearchService instance', () => {
      expect(searchService).toBeInstanceOf(SearchService);
    });

    it('should have all required methods', () => {
      expect(typeof searchService.search).toBe('function');
      expect(typeof searchService.searchByBrand).toBe('function');
      expect(typeof searchService.searchByFlavor).toBe('function');
      expect(typeof searchService.getTobaccoDetails).toBe('function');
      expect(typeof searchService.getAvailableBrands).toBe('function');
      expect(typeof searchService.getAvailableFlavors).toBe('function');
      expect(typeof searchService.formatSearchResults).toBe('function');
    });
  });

  describe('search()', () => {
    it('should search for tobaccos with a query', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(mockTobaccos, 3, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('mint');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: 'mint',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should search with custom page and pageSize', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(mockTobaccos, 3, 2, 20);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('apple', 2, 20);

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: 'apple',
        page: 2,
        pageSize: 20,
      });
      expect(result).toEqual(mockResult);
    });

    it('should use default page and pageSize when not provided', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(mockTobaccos, 3, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('blueberry');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: 'blueberry',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle empty search query', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: '',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle search with special characters', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(mockTobaccos, 3, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('mint & apple!');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: 'mint & apple!',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle search with unicode characters', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(mockTobaccos, 3, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('мята');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: 'мята',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle large result sets', async () => {
      const largeResults: Tobacco[] = Array.from({ length: 100 }, (_, i) => ({
        id: String(i + 1),
        name: `Tobacco ${i + 1}`,
        brand: 'Test Brand',
        flavor: 'Test Flavor',
        description: 'Test description',
        strength: 'medium' as const,
      }));
      const mockResult: TobaccoSearchResult = createMockSearchResult(largeResults, 100, 1, 100);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('test', 1, 100);

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: 'test',
        page: 1,
        pageSize: 100,
      });
      expect(result.total).toBe(100);
      expect(result.results.length).toBe(100);
    });

    it('should handle no results found', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('nonexistent');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: 'nonexistent',
        page: 1,
        pageSize: 10,
      });
      expect(result.total).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to search tobaccos. Please try again later.');
      (hookahDbService.searchTobaccos as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.search('test')).rejects.toThrow('Failed to search tobaccos. Please try again later.');
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');
      (hookahDbService.searchTobaccos as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.search('test')).rejects.toThrow('Network error');
    });

    it('should handle rate limiting errors', async () => {
      const mockError = new Error('Too Many Requests');
      (hookahDbService.searchTobaccos as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.search('test')).rejects.toThrow('Too Many Requests');
    });
  });

  describe('searchByBrand()', () => {
    it('should search for tobaccos by brand', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(
        mockTobaccos.filter(t => t.brand === 'Al Fakher'),
        2,
        1,
        10
      );
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.searchByBrand('Al Fakher');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        brand: 'Al Fakher',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should search by brand with custom pagination', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(
        mockTobaccos.filter(t => t.brand === 'Al Fakher'),
        2,
        2,
        20
      );
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.searchByBrand('Al Fakher', 2, 20);

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        brand: 'Al Fakher',
        page: 2,
        pageSize: 20,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle brand with special characters', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.searchByBrand('Test & Co.');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        brand: 'Test & Co.',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle empty brand', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.searchByBrand('');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        brand: '',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle brand with unicode characters', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.searchByBrand('Аль Фахер');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        brand: 'Аль Фахер',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to search tobaccos. Please try again later.');
      (hookahDbService.searchTobaccos as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.searchByBrand('Test Brand')).rejects.toThrow('Failed to search tobaccos. Please try again later.');
    });
  });

  describe('searchByFlavor()', () => {
    it('should search for tobaccos by flavor', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(
        mockTobaccos.filter(t => t.flavor === 'Mint'),
        1,
        1,
        10
      );
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.searchByFlavor('Mint');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        flavor: 'Mint',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should search by flavor with custom pagination', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(
        mockTobaccos.filter(t => t.flavor === 'Mint'),
        1,
        2,
        20
      );
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.searchByFlavor('Mint', 2, 20);

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        flavor: 'Mint',
        page: 2,
        pageSize: 20,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle flavor with special characters', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.searchByFlavor('Mint & Lemon');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        flavor: 'Mint & Lemon',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle empty flavor', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.searchByFlavor('');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        flavor: '',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle flavor with unicode characters', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.searchByFlavor('мята');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        flavor: 'мята',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to search tobaccos. Please try again later.');
      (hookahDbService.searchTobaccos as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.searchByFlavor('Test Flavor')).rejects.toThrow('Failed to search tobaccos. Please try again later.');
    });
  });

  describe('getTobaccoDetails()', () => {
    it('should get tobacco details by ID', async () => {
      const mockTobacco: Tobacco = mockTobaccos[0];
      (hookahDbService.getTobaccoById as jest.Mock).mockResolvedValue(mockTobacco);

      const result = await searchService.getTobaccoDetails('1');

      expect(hookahDbService.getTobaccoById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTobacco);
    });

    it('should return null for non-existent tobacco', async () => {
      (hookahDbService.getTobaccoById as jest.Mock).mockResolvedValue(null);

      const result = await searchService.getTobaccoDetails('999');

      expect(hookahDbService.getTobaccoById).toHaveBeenCalledWith('999');
      expect(result).toBeNull();
    });

    it('should handle empty ID', async () => {
      (hookahDbService.getTobaccoById as jest.Mock).mockResolvedValue(null);

      const result = await searchService.getTobaccoDetails('');

      expect(hookahDbService.getTobaccoById).toHaveBeenCalledWith('');
      expect(result).toBeNull();
    });

    it('should handle ID with special characters', async () => {
      (hookahDbService.getTobaccoById as jest.Mock).mockResolvedValue(null);

      const result = await searchService.getTobaccoDetails('test-123_abc');

      expect(hookahDbService.getTobaccoById).toHaveBeenCalledWith('test-123_abc');
      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to get tobacco details. Please try again later.');
      (hookahDbService.getTobaccoById as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.getTobaccoDetails('1')).rejects.toThrow('Failed to get tobacco details. Please try again later.');
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');
      (hookahDbService.getTobaccoById as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.getTobaccoDetails('1')).rejects.toThrow('Network error');
    });
  });

  describe('getAvailableBrands()', () => {
    it('should get available brands', async () => {
      (hookahDbService.getBrands as jest.Mock).mockResolvedValue(mockBrands);

      const result = await searchService.getAvailableBrands();

      expect(hookahDbService.getBrands).toHaveBeenCalled();
      expect(result).toEqual(mockBrands);
    });

    it('should handle empty brands list', async () => {
      (hookahDbService.getBrands as jest.Mock).mockResolvedValue([]);

      const result = await searchService.getAvailableBrands();

      expect(hookahDbService.getBrands).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to get brands. Please try again later.');
      (hookahDbService.getBrands as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.getAvailableBrands()).rejects.toThrow('Failed to get brands. Please try again later.');
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');
      (hookahDbService.getBrands as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.getAvailableBrands()).rejects.toThrow('Network error');
    });
  });

  describe('getAvailableFlavors()', () => {
    it('should get available flavors', async () => {
      (hookahDbService.getFlavors as jest.Mock).mockResolvedValue(mockFlavors);

      const result = await searchService.getAvailableFlavors();

      expect(hookahDbService.getFlavors).toHaveBeenCalled();
      expect(result).toEqual(mockFlavors);
    });

    it('should handle empty flavors list', async () => {
      (hookahDbService.getFlavors as jest.Mock).mockResolvedValue([]);

      const result = await searchService.getAvailableFlavors();

      expect(hookahDbService.getFlavors).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to get flavors. Please try again later.');
      (hookahDbService.getFlavors as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.getAvailableFlavors()).rejects.toThrow('Failed to get flavors. Please try again later.');
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');
      (hookahDbService.getFlavors as jest.Mock).mockRejectedValue(mockError);

      await expect(searchService.getAvailableFlavors()).rejects.toThrow('Network error');
    });
  });

  describe('formatSearchResults()', () => {
    it('should format search results correctly', () => {
      const results: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
          description: 'Classic mint flavor',
          strength: 'medium',
        },
      ];
      const formatted = searchService.formatSearchResults(results, 1, 1);

      expect(formatted).toContain('📊 Search Results (Page 1)');
      expect(formatted).toContain('Found 1 tobacco(s)');
      expect(formatted).toContain('1. Al Fakher - Mint');
      expect(formatted).toContain('🏷️ ID: 1');
      expect(formatted).toContain('🍃 Flavor: Mint');
      expect(formatted).toContain('💪 Strength: medium');
      expect(formatted).toContain('Use /add <tobacco_id> to add to your wishlist');
    });

    it('should handle empty results', () => {
      const formatted = searchService.formatSearchResults([], 1, 0);

      expect(formatted).toBe('No tobaccos found. Try a different search term.');
    });

    it('should format multiple results', () => {
      const results: Tobacco[] = [
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
      const formatted = searchService.formatSearchResults(results, 1, 2);

      expect(formatted).toContain('📊 Search Results (Page 1)');
      expect(formatted).toContain('Found 2 tobacco(s)');
      expect(formatted).toContain('1. Al Fakher - Mint');
      expect(formatted).toContain('2. Al Fakher - Double Apple');
    });

    it('should handle results without optional fields', () => {
      const results: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
        },
      ];
      const formatted = searchService.formatSearchResults(results, 1, 1);

      expect(formatted).toContain('📊 Search Results (Page 1)');
      expect(formatted).toContain('Found 1 tobacco(s)');
      expect(formatted).toContain('1. Al Fakher - Mint');
      expect(formatted).toContain('🏷️ ID: 1');
      expect(formatted).toContain('🍃 Flavor: Mint');
      expect(formatted).not.toContain('💪 Strength:');
    });

    it('should handle results with light strength', () => {
      const results: Tobacco[] = [
        {
          id: '1',
          name: 'Blueberry',
          brand: 'Starbuzz',
          flavor: 'Blueberry',
          description: 'Fresh blueberry taste',
          strength: 'light',
        },
      ];
      const formatted = searchService.formatSearchResults(results, 1, 1);

      expect(formatted).toContain('💪 Strength: light');
    });

    it('should handle results with strong strength', () => {
      const results: Tobacco[] = [
        {
          id: '1',
          name: 'Strong Tobacco',
          brand: 'Test Brand',
          flavor: 'Strong',
          description: 'Strong tobacco',
          strength: 'strong',
        },
      ];
      const formatted = searchService.formatSearchResults(results, 1, 1);

      expect(formatted).toContain('💪 Strength: strong');
    });

    it('should handle different page numbers', () => {
      const results: Tobacco[] = [
        {
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
        },
      ];
      const formatted = searchService.formatSearchResults(results, 5, 100);

      expect(formatted).toContain('📊 Search Results (Page 5)');
      expect(formatted).toContain('Found 100 tobacco(s)');
    });

    it('should handle results without flavor (empty string)', () => {
      const results: Tobacco[] = [
        {
          id: '1',
          name: 'Unknown',
          brand: 'Test Brand',
          flavor: '',
        },
      ];
      const formatted = searchService.formatSearchResults(results, 1, 1);

      expect(formatted).toContain('1. Test Brand - Unknown');
      expect(formatted).toContain('🏷️ ID: 1');
      // Empty flavor should not be displayed
      expect(formatted).not.toContain('🍃 Flavor:');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle concurrent search requests', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(mockTobaccos, 3, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const promises = [
        searchService.search('mint'),
        searchService.search('apple'),
        searchService.search('blueberry'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual(mockResult);
      });
    });

    it('should handle search with very long query', async () => {
      const longQuery = 'a'.repeat(1000);
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search(longQuery);

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: longQuery,
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle search with whitespace-only query', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('   ');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: '   ',
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle pagination with page 0', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(mockTobaccos, 3, 0, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('mint', 0, 10);

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: 'mint',
        page: 0,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle pagination with very large page number', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult([], 0, 9999, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('mint', 9999, 10);

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: 'mint',
        page: 9999,
        pageSize: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle pagination with very large pageSize', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(mockTobaccos, 3, 1, 1000);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      const result = await searchService.search('mint', 1, 1000);

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledWith({
        query: 'mint',
        page: 1,
        pageSize: 1000,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle brand search with case sensitivity', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(mockTobaccos, 3, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      await searchService.searchByBrand('AL FAKHER');
      await searchService.searchByBrand('al fakher');
      await searchService.searchByBrand('Al Fakher');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledTimes(3);
      expect(hookahDbService.searchTobaccos).toHaveBeenNthCalledWith(1, {
        brand: 'AL FAKHER',
        page: 1,
        pageSize: 10,
      });
      expect(hookahDbService.searchTobaccos).toHaveBeenNthCalledWith(2, {
        brand: 'al fakher',
        page: 1,
        pageSize: 10,
      });
      expect(hookahDbService.searchTobaccos).toHaveBeenNthCalledWith(3, {
        brand: 'Al Fakher',
        page: 1,
        pageSize: 10,
      });
    });

    it('should handle flavor search with case sensitivity', async () => {
      const mockResult: TobaccoSearchResult = createMockSearchResult(mockTobaccos, 3, 1, 10);
      (hookahDbService.searchTobaccos as jest.Mock).mockResolvedValue(mockResult);

      await searchService.searchByFlavor('MINT');
      await searchService.searchByFlavor('mint');
      await searchService.searchByFlavor('Mint');

      expect(hookahDbService.searchTobaccos).toHaveBeenCalledTimes(3);
      expect(hookahDbService.searchTobaccos).toHaveBeenNthCalledWith(1, {
        flavor: 'MINT',
        page: 1,
        pageSize: 10,
      });
      expect(hookahDbService.searchTobaccos).toHaveBeenNthCalledWith(2, {
        flavor: 'mint',
        page: 1,
        pageSize: 10,
      });
      expect(hookahDbService.searchTobaccos).toHaveBeenNthCalledWith(3, {
        flavor: 'Mint',
        page: 1,
        pageSize: 10,
      });
    });
  });
});
