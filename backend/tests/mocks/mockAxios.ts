/**
 * Mock objects for axios HTTP requests
 */

import { Tobacco, TobaccoSearchResult } from '@/models/tobacco';

export interface MockAxiosResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: any;
}

export interface MockAxiosError {
  config?: any;
  request?: any;
  response?: {
    data: any;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
  isAxiosError: boolean;
  toJSON: () => any;
  message: string;
}

/**
 * Create a mock axios response
 */
export const createMockAxiosResponse = (data: any, status: number = 200): MockAxiosResponse => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {
    'content-type': 'application/json',
  },
  config: {},
});

/**
 * Create a mock axios error
 */
export const createMockAxiosError = (
  message: string,
  status: number = 500,
  responseData?: any
): MockAxiosError => ({
  message,
  config: {},
  response: responseData
    ? {
        data: responseData,
        status,
        statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
        headers: {},
      }
    : undefined,
  isAxiosError: true,
  toJSON: () => ({}),
});

/**
 * Mock tobacco data for hookah-db API responses
 */
export const mockTobaccos: Tobacco[] = [
  {
    id: '1',
    name: 'Mint',
    brand: 'Al Fakher',
    flavor: 'Mint',
    description: 'Classic mint flavor',
    strength: 'medium',
    image: 'https://example.com/mint.jpg',
  },
  {
    id: '2',
    name: 'Double Apple',
    brand: 'Al Fakher',
    flavor: 'Apple',
    description: 'Sweet and sour apple',
    strength: 'medium',
    image: 'https://example.com/apple.jpg',
  },
  {
    id: '3',
    name: 'Blueberry',
    brand: 'Starbuzz',
    flavor: 'Blueberry',
    description: 'Fresh blueberry taste',
    strength: 'light',
    image: 'https://example.com/blueberry.jpg',
  },
];

/**
 * Mock brands data for hookah-db API responses
 */
export const mockBrands: string[] = [
  'Al Fakher',
  'Starbuzz',
  'Tangiers',
  'Nakhla',
  'Fumari',
];

/**
 * Mock flavors data for hookah-db API responses
 */
export const mockFlavors: string[] = [
  'Mint',
  'Apple',
  'Blueberry',
  'Grape',
  'Watermelon',
  'Peach',
  'Lemon',
  'Orange',
  'Strawberry',
  'Cherry',
];

/**
 * Create mock search result
 */
export const createMockSearchResult = (
  results: Tobacco[] = mockTobaccos,
  total: number = results.length,
  page: number = 1,
  pageSize: number = 20
): TobaccoSearchResult => ({
  results,
  total,
  page,
  pageSize,
});

/**
 * Setup axios mocks for hookah-db API
 */
export const setupHookahDbApiMocks = () => {
  const axios = require('axios');

  // Mock GET /tobaccos (search)
  axios.get.mockImplementation((url: string, config?: any) => {
    if (url === '/tobaccos' || url.startsWith('/tobaccos?')) {
      const searchParams = config?.params || {};
      let filteredTobaccos = [...mockTobaccos];

      // Filter by search query
      if (searchParams.search) {
        const query = searchParams.search.toLowerCase();
        filteredTobaccos = filteredTobaccos.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            t.brand.toLowerCase().includes(query) ||
            t.flavor.toLowerCase().includes(query)
        );
      }

      // Filter by brand
      if (searchParams.brand) {
        filteredTobaccos = filteredTobaccos.filter(
          (t) => t.brand.toLowerCase() === searchParams.brand.toLowerCase()
        );
      }

      // Filter by flavor
      if (searchParams.flavor) {
        filteredTobaccos = filteredTobaccos.filter(
          (t) => t.flavor.toLowerCase() === searchParams.flavor.toLowerCase()
        );
      }

      // Pagination
      const page = searchParams.page || 1;
      const limit = searchParams.limit || 20;
      const start = (page - 1) * limit;
      const paginatedResults = filteredTobaccos.slice(start, start + limit);

      return Promise.resolve(
        createMockAxiosResponse({
          data: paginatedResults,
          total: filteredTobaccos.length,
          count: filteredTobaccos.length,
        })
      );
    }

    // Mock GET /tobaccos/:id
    if (url.startsWith('/tobaccos/')) {
      const id = url.split('/')[2];
      const tobacco = mockTobaccos.find((t) => t.id === id);
      
      if (tobacco) {
        return Promise.resolve(createMockAxiosResponse({ data: tobacco }));
      }
      
      return Promise.reject(
        createMockAxiosError('Tobacco not found', 404)
      );
    }

    // Mock GET /brands
    if (url === '/brands') {
      return Promise.resolve(
        createMockAxiosResponse({ data: mockBrands })
      );
    }

    // Mock GET /flavors
    if (url === '/flavors') {
      return Promise.resolve(
        createMockAxiosResponse({ data: mockFlavors })
      );
    }

    // Default error
    return Promise.reject(
      createMockAxiosError('Not found', 404)
    );
  });
};

/**
 * Reset all axios mocks
 */
export const resetAxiosMocks = () => {
  const axios = require('axios');
  axios.get.mockClear();
  axios.post.mockClear();
  axios.put.mockClear();
  axios.delete.mockClear();
};

/**
 * Setup axios mock to return error
 */
export const setupAxiosError = (url: string, status: number = 500, message: string = 'Internal Server Error') => {
  const axios = require('axios');
  axios.get.mockImplementation((requestUrl: string) => {
    if (requestUrl === url || requestUrl.startsWith(url)) {
      return Promise.reject(
        createMockAxiosError(message, status)
      );
    }
    return Promise.reject(
      createMockAxiosError('Not found', 404)
    );
  });
};

/**
 * Setup axios mock to return specific data
 */
export const setupAxiosResponse = (url: string, data: any, status: number = 200) => {
  const axios = require('axios');
  axios.get.mockImplementation((requestUrl: string) => {
    if (requestUrl === url || requestUrl.startsWith(url)) {
      return Promise.resolve(createMockAxiosResponse(data, status));
    }
    return Promise.reject(
      createMockAxiosError('Not found', 404)
    );
  });
};
