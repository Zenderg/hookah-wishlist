/**
 * Unit tests for SearchController
 */

import { searchController } from '@/api/controllers/search.controller';
import searchService from '@/services/search.service';
import {
  createMockResponse,
  createAuthenticatedRequest,
  testController,
} from '../../../tests/mocks/mockExpress';
import { createTobacco, createTobaccos, sampleBrands, sampleFlavors } from '../../../tests/fixtures/mockData';

// Mock the search service
jest.mock('@/services/search.service');

describe('SearchController', () => {
  let mockSearchService: jest.Mocked<typeof searchService>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Get the mocked service
    mockSearchService = searchService as jest.Mocked<typeof searchService>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('search', () => {
    describe('Request validation', () => {
      it('should return 400 when query parameter is missing', async () => {
        const req = createAuthenticatedRequest(123456789, {
          query: {},
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'query parameter is required' });
        expect(mockSearchService.search).not.toHaveBeenCalled();
      });

      it('should return 400 when query parameter is empty string', async () => {
        const req = createAuthenticatedRequest(123456789, {
          query: { query: '' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'query parameter is required' });
        expect(mockSearchService.search).not.toHaveBeenCalled();
      });

      it('should return 400 when query parameter is not a string', async () => {
        const req = createAuthenticatedRequest(123456789, {
          query: { query: 123 },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'query parameter is required' });
        expect(mockSearchService.search).not.toHaveBeenCalled();
      });

      it('should accept valid query with default pagination', async () => {
        const mockResult = {
          results: [createTobacco()],
          total: 1,
          page: 1,
          pageSize: 20,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'mint' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockSearchService.search).toHaveBeenCalledWith('mint', 1, 20);
      });

      it('should accept valid query with custom pagination', async () => {
        const mockResult = {
          results: [createTobacco()],
          total: 1,
          page: 2,
          pageSize: 10,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'apple', page: '2', pageSize: '10' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockSearchService.search).toHaveBeenCalledWith('apple', 2, 10);
      });
    });

    describe('Success cases', () => {
      it('should return search results with single tobacco', async () => {
        const mockResult = {
          results: [createTobacco({ id: '1', name: 'Mint', brand: 'Al Fakher' })],
          total: 1,
          page: 1,
          pageSize: 20,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'mint' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockResult);
        expect(mockSearchService.search).toHaveBeenCalledWith('mint', 1, 20);
      });

      it('should return search results with multiple tobaccos', async () => {
        const mockTobaccos = createTobaccos(5);
        const mockResult = {
          results: mockTobaccos,
          total: 5,
          page: 1,
          pageSize: 20,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'apple' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.results).toHaveLength(5);
        expect(res.body.total).toBe(5);
      });

      it('should return empty results when no matches found', async () => {
        const mockResult = {
          results: [],
          total: 0,
          page: 1,
          pageSize: 20,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'nonexistent' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.results).toHaveLength(0);
        expect(res.body.total).toBe(0);
      });

      it('should handle pagination correctly', async () => {
        const mockResult = {
          results: createTobaccos(10),
          total: 50,
          page: 2,
          pageSize: 10,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'mint', page: '2', pageSize: '10' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.page).toBe(2);
        expect(res.body.pageSize).toBe(10);
        expect(res.body.total).toBe(50);
      });
    });

    describe('Error handling', () => {
      it('should return 500 when service throws error', async () => {
        mockSearchService.search.mockRejectedValue(new Error('API error'));

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'mint' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to search' });
      });

      it('should return 500 when service throws unexpected error', async () => {
        mockSearchService.search.mockRejectedValue(new Error('Unexpected error'));

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'apple' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to search' });
      });
    });

    describe('Edge cases', () => {
      it('should handle empty search query with spaces', async () => {
        const req = createAuthenticatedRequest(123456789, {
          query: { query: '   ' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'query parameter is required' });
      });

      it('should handle special characters in query', async () => {
        const mockResult = {
          results: [createTobacco()],
          total: 1,
          page: 1,
          pageSize: 20,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'mint & apple' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockSearchService.search).toHaveBeenCalledWith('mint & apple', 1, 20);
      });

      it('should handle very long query', async () => {
        const longQuery = 'a'.repeat(1000);
        const mockResult = {
          results: [],
          total: 0,
          page: 1,
          pageSize: 20,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: longQuery },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockSearchService.search).toHaveBeenCalledWith(longQuery, 1, 20);
      });

      it('should handle invalid pagination parameters', async () => {
        const mockResult = {
          results: [createTobacco()],
          total: 1,
          page: 1,
          pageSize: 20,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'mint', page: 'invalid', pageSize: 'invalid' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        // parseInt('invalid') returns NaN, but the controller doesn't validate this
        // The service should handle invalid pagination
        expect(mockSearchService.search).toHaveBeenCalledWith('mint', NaN, NaN);
      });

      it('should handle large result set', async () => {
        const largeResult = {
          results: createTobaccos(100),
          total: 1000,
          page: 1,
          pageSize: 100,
        };

        mockSearchService.search.mockResolvedValue(largeResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'mint', pageSize: '100' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.results).toHaveLength(100);
        expect(res.body.total).toBe(1000);
      });

      it('should handle pagination edge case - page 1', async () => {
        const mockResult = {
          results: [createTobacco()],
          total: 1,
          page: 1,
          pageSize: 20,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'mint', page: '1' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockSearchService.search).toHaveBeenCalledWith('mint', 1, 20);
      });

      it('should handle pagination edge case - large page number', async () => {
        const mockResult = {
          results: [],
          total: 100,
          page: 1000,
          pageSize: 20,
        };

        mockSearchService.search.mockResolvedValue(mockResult);

        const req = createAuthenticatedRequest(123456789, {
          query: { query: 'mint', page: '1000' },
        });
        const res = createMockResponse();

        await testController(searchController.search.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockSearchService.search).toHaveBeenCalledWith('mint', 1000, 20);
      });
    });
  });

  describe('getTobaccoDetails', () => {
    describe('Request validation', () => {
      it('should accept valid tobacco ID', async () => {
        const mockTobacco = createTobacco({ id: '1' });

        mockSearchService.getTobaccoDetails.mockResolvedValue(mockTobacco);

        const req = createAuthenticatedRequest(123456789, {
          params: { id: '1' },
        });
        const res = createMockResponse();

        await testController(searchController.getTobaccoDetails.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockTobacco);
        expect(mockSearchService.getTobaccoDetails).toHaveBeenCalledWith('1');
      });
    });

    describe('Success cases', () => {
      it('should return tobacco details when found', async () => {
        const mockTobacco = createTobacco({
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
          description: 'Classic mint flavor',
          strength: 'medium',
        });

        mockSearchService.getTobaccoDetails.mockResolvedValue(mockTobacco);

        const req = createAuthenticatedRequest(123456789, {
          params: { id: '1' },
        });
        const res = createMockResponse();

        await testController(searchController.getTobaccoDetails.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockTobacco);
        expect(mockSearchService.getTobaccoDetails).toHaveBeenCalledWith('1');
      });

      it('should return tobacco with all fields', async () => {
        const mockTobacco = createTobacco({
          id: '1',
          name: 'Mint',
          brand: 'Al Fakher',
          flavor: 'Mint',
          description: 'Classic mint flavor with a refreshing taste',
          strength: 'medium',
          image: 'https://example.com/mint.jpg',
        });

        mockSearchService.getTobaccoDetails.mockResolvedValue(mockTobacco);

        const req = createAuthenticatedRequest(123456789, {
          params: { id: '1' },
        });
        const res = createMockResponse();

        await testController(searchController.getTobaccoDetails.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.image).toBe('https://example.com/mint.jpg');
        expect(res.body.description).toBe('Classic mint flavor with a refreshing taste');
      });
    });

    describe('Error handling', () => {
      it('should return 404 when tobacco not found', async () => {
        mockSearchService.getTobaccoDetails.mockResolvedValue(null);

        const req = createAuthenticatedRequest(123456789, {
          params: { id: '999' },
        });
        const res = createMockResponse();

        await testController(searchController.getTobaccoDetails.bind(searchController), req, res);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: 'Tobacco not found' });
        expect(mockSearchService.getTobaccoDetails).toHaveBeenCalledWith('999');
      });

      it('should return 500 when service throws error', async () => {
        mockSearchService.getTobaccoDetails.mockRejectedValue(new Error('Database error'));

        const req = createAuthenticatedRequest(123456789, {
          params: { id: '1' },
        });
        const res = createMockResponse();

        await testController(searchController.getTobaccoDetails.bind(searchController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to get tobacco details' });
      });

      it('should return 500 when service throws unexpected error', async () => {
        mockSearchService.getTobaccoDetails.mockRejectedValue(new Error('Unexpected error'));

        const req = createAuthenticatedRequest(123456789, {
          params: { id: '1' },
        });
        const res = createMockResponse();

        await testController(searchController.getTobaccoDetails.bind(searchController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to get tobacco details' });
      });
    });

    describe('Edge cases', () => {
      it('should handle special characters in tobacco ID', async () => {
        const mockTobacco = createTobacco({ id: 'tobacco-123_abc' });

        mockSearchService.getTobaccoDetails.mockResolvedValue(mockTobacco);

        const req = createAuthenticatedRequest(123456789, {
          params: { id: 'tobacco-123_abc' },
        });
        const res = createMockResponse();

        await testController(searchController.getTobaccoDetails.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockSearchService.getTobaccoDetails).toHaveBeenCalledWith('tobacco-123_abc');
      });

      it('should handle very long tobacco ID', async () => {
        const longId = 'a'.repeat(1000);
        const mockTobacco = createTobacco({ id: longId });

        mockSearchService.getTobaccoDetails.mockResolvedValue(mockTobacco);

        const req = createAuthenticatedRequest(123456789, {
          params: { id: longId },
        });
        const res = createMockResponse();

        await testController(searchController.getTobaccoDetails.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockSearchService.getTobaccoDetails).toHaveBeenCalledWith(longId);
      });

      it('should handle empty string tobacco ID', async () => {
        mockSearchService.getTobaccoDetails.mockResolvedValue(null);

        const req = createAuthenticatedRequest(123456789, {
          params: { id: '' },
        });
        const res = createMockResponse();

        await testController(searchController.getTobaccoDetails.bind(searchController), req, res);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: 'Tobacco not found' });
      });

      it('should handle numeric string tobacco ID', async () => {
        const mockTobacco = createTobacco({ id: '12345' });

        mockSearchService.getTobaccoDetails.mockResolvedValue(mockTobacco);

        const req = createAuthenticatedRequest(123456789, {
          params: { id: '12345' },
        });
        const res = createMockResponse();

        await testController(searchController.getTobaccoDetails.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(mockSearchService.getTobaccoDetails).toHaveBeenCalledWith('12345');
      });
    });
  });

  describe('getBrands', () => {
    describe('Success cases', () => {
      it('should return list of available brands', async () => {
        mockSearchService.getAvailableBrands.mockResolvedValue(sampleBrands);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getBrands.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ brands: sampleBrands });
        expect(mockSearchService.getAvailableBrands).toHaveBeenCalled();
      });

      it('should return empty array when no brands available', async () => {
        mockSearchService.getAvailableBrands.mockResolvedValue([]);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getBrands.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ brands: [] });
      });

      it('should return single brand', async () => {
        mockSearchService.getAvailableBrands.mockResolvedValue(['Al Fakher']);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getBrands.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.brands).toHaveLength(1);
        expect(res.body.brands[0]).toBe('Al Fakher');
      });
    });

    describe('Error handling', () => {
      it('should return 500 when service throws error', async () => {
        mockSearchService.getAvailableBrands.mockRejectedValue(new Error('API error'));

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getBrands.bind(searchController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to get brands' });
      });

      it('should return 500 when service throws unexpected error', async () => {
        mockSearchService.getAvailableBrands.mockRejectedValue(new Error('Unexpected error'));

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getBrands.bind(searchController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to get brands' });
      });
    });

    describe('Edge cases', () => {
      it('should handle large list of brands', async () => {
        const largeBrands = Array.from({ length: 100 }, (_, i) => `Brand ${i}`);
        mockSearchService.getAvailableBrands.mockResolvedValue(largeBrands);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getBrands.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.brands).toHaveLength(100);
      });

      it('should handle brands with special characters', async () => {
        const specialBrands = ['Al-Fakher', 'Starbuzz™', 'Tangiers®', 'Nakhla\'s'];
        mockSearchService.getAvailableBrands.mockResolvedValue(specialBrands);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getBrands.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.brands).toEqual(specialBrands);
      });
    });
  });

  describe('getFlavors', () => {
    describe('Success cases', () => {
      it('should return list of available flavors', async () => {
        mockSearchService.getAvailableFlavors.mockResolvedValue(sampleFlavors);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getFlavors.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ flavors: sampleFlavors });
        expect(mockSearchService.getAvailableFlavors).toHaveBeenCalled();
      });

      it('should return empty array when no flavors available', async () => {
        mockSearchService.getAvailableFlavors.mockResolvedValue([]);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getFlavors.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ flavors: [] });
      });

      it('should return single flavor', async () => {
        mockSearchService.getAvailableFlavors.mockResolvedValue(['Mint']);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getFlavors.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.flavors).toHaveLength(1);
        expect(res.body.flavors[0]).toBe('Mint');
      });
    });

    describe('Error handling', () => {
      it('should return 500 when service throws error', async () => {
        mockSearchService.getAvailableFlavors.mockRejectedValue(new Error('API error'));

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getFlavors.bind(searchController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to get flavors' });
      });

      it('should return 500 when service throws unexpected error', async () => {
        mockSearchService.getAvailableFlavors.mockRejectedValue(new Error('Unexpected error'));

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getFlavors.bind(searchController), req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to get flavors' });
      });
    });

    describe('Edge cases', () => {
      it('should handle large list of flavors', async () => {
        const largeFlavors = Array.from({ length: 100 }, (_, i) => `Flavor ${i}`);
        mockSearchService.getAvailableFlavors.mockResolvedValue(largeFlavors);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getFlavors.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.flavors).toHaveLength(100);
      });

      it('should handle flavors with special characters', async () => {
        const specialFlavors = ['Mint & Lemon', 'Apple-Pie', 'Cinnamon™', 'Vanilla\'s Dream'];
        mockSearchService.getAvailableFlavors.mockResolvedValue(specialFlavors);

        const req = createAuthenticatedRequest(123456789);
        const res = createMockResponse();

        await testController(searchController.getFlavors.bind(searchController), req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.flavors).toEqual(specialFlavors);
      });
    });
  });
});
