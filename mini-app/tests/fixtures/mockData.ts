/**
 * Mock Data Fixtures for Mini-App Testing
 * 
 * This file provides reusable mock data for testing the hookah-wishlist mini-app.
 * Following javascript-testing-patterns skill best practices for test fixtures.
 */

import type { Tobacco, Wishlist, WishlistItem, SearchResult } from '../../src/types';

/**
 * Mock Tobacco Objects
 */

export const mockTobacco1: Tobacco = {
  id: 'tobacco-001',
  name: 'Mint',
  brand: 'Adalya',
  flavor: 'Mint',
  description: 'Refreshing mint flavor with cool sensation',
  strength: 'light',
  image: 'https://example.com/tobacco/mint.jpg',
};

export const mockTobacco2: Tobacco = {
  id: 'tobacco-002',
  name: 'Love 66',
  brand: 'Adalya',
  flavor: 'Love 66',
  description: 'Sweet and fruity blend with passion fruit, melon, and mint',
  strength: 'medium',
  image: 'https://example.com/tobacco/love66.jpg',
};

export const mockTobacco3: Tobacco = {
  id: 'tobacco-003',
  name: 'Blueberry',
  brand: 'Al Fakher',
  flavor: 'Blueberry',
  description: 'Classic blueberry flavor with sweet and tart notes',
  strength: 'light',
  image: 'https://example.com/tobacco/blueberry.jpg',
};

export const mockTobacco4: Tobacco = {
  id: 'tobacco-004',
  name: 'Double Apple',
  brand: 'Al Fakher',
  flavor: 'Double Apple',
  description: 'Traditional double apple flavor with anise notes',
  strength: 'strong',
  image: 'https://example.com/tobacco/double-apple.jpg',
};

export const mockTobacco5: Tobacco = {
  id: 'tobacco-005',
  name: 'Lemon Mint',
  brand: 'Musthave',
  flavor: 'Lemon Mint',
  description: 'Refreshing blend of lemon and mint',
  strength: 'medium',
  image: 'https://example.com/tobacco/lemon-mint.jpg',
};

/**
 * Factory function to create mock tobacco objects
 */
export function createMockTobacco(overrides?: Partial<Tobacco>): Tobacco {
  return {
    id: `tobacco-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Mock Tobacco',
    brand: 'Mock Brand',
    flavor: 'Mock Flavor',
    description: 'Mock description',
    strength: 'medium',
    image: 'https://example.com/mock.jpg',
    ...overrides,
  };
}

/**
 * Factory function to create multiple mock tobacco objects
 */
export function createMockTobaccos(count: number, overrides?: Partial<Tobacco>): Tobacco[] {
  return Array.from({ length: count }, (_, index) => 
    createMockTobacco({
      id: `tobacco-${index + 1}`,
      name: `Tobacco ${index + 1}`,
      ...overrides,
    })
  );
}

/**
 * Mock Wishlist Items
 */

export const mockWishlistItem1: WishlistItem = {
  tobaccoId: 'tobacco-001',
  addedAt: '2024-01-15T10:30:00Z',
  notes: 'Try this soon',
  tobacco: mockTobacco1,
};

export const mockWishlistItem2: WishlistItem = {
  tobaccoId: 'tobacco-002',
  addedAt: '2024-01-16T14:20:00Z',
  notes: 'Favorite flavor',
  tobacco: mockTobacco2,
};

export const mockWishlistItem3: WishlistItem = {
  tobaccoId: 'tobacco-003',
  addedAt: '2024-01-17T09:15:00Z',
  notes: '',
  tobacco: mockTobacco3,
};

/**
 * Factory function to create mock wishlist items
 */
export function createMockWishlistItem(overrides?: Partial<WishlistItem>): WishlistItem {
  const tobacco = createMockTobacco(overrides?.tobacco);
  return {
    tobaccoId: tobacco.id,
    addedAt: new Date().toISOString(),
    notes: '',
    tobacco,
    ...overrides,
  };
}

/**
 * Mock Wishlist
 */

export const mockWishlist: Wishlist = {
  userId: 123456789,
  items: [mockWishlistItem1, mockWishlistItem2, mockWishlistItem3],
  total: 3,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-17T09:15:00Z',
};

export const mockEmptyWishlist: Wishlist = {
  userId: 123456789,
  items: [],
  total: 0,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

/**
 * Factory function to create mock wishlist
 */
export function createMockWishlist(overrides?: Partial<Wishlist>): Wishlist {
  const baseItems = overrides?.items || [];
  const baseTotal = overrides?.total !== undefined ? overrides.total : baseItems.length;
  
  return {
    userId: 123456789,
    items: baseItems,
    total: baseTotal,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock Search Results
 */

export const mockSearchResults: SearchResult = {
  results: [mockTobacco1, mockTobacco2, mockTobacco3, mockTobacco4, mockTobacco5],
  total: 5,
  page: 1,
  pageSize: 20,
};

export const mockEmptySearchResults: SearchResult = {
  results: [],
  total: 0,
  page: 1,
  pageSize: 20,
};

export const mockPaginatedSearchResults: SearchResult = {
  results: createMockTobaccos(20),
  total: 45,
  page: 1,
  pageSize: 20,
};

/**
 * Factory function to create mock search results
 */
export function createMockSearchResults(overrides?: Partial<SearchResult>): SearchResult {
  const baseResults = overrides?.results || [];
  const baseTotal = overrides?.total !== undefined ? overrides.total : baseResults.length;
  
  return {
    results: baseResults,
    total: baseTotal,
    page: 1,
    pageSize: 20,
    ...overrides,
  };
}

/**
 * Mock API Responses
 */

export const mockSuccessResponse = {
  success: true,
  data: 'mock data',
};

export const mockErrorResponse = {
  success: false,
  error: 'Mock error message',
};

/**
 * Mock Wishlist API Responses
 */

export const mockGetWishlistResponse = {
  success: true,
  ...mockWishlist,
};

export const mockAddToWishlistResponse = {
  success: true,
  ...createMockWishlist({
    items: [createMockWishlistItem()],
    total: 1,
  }),
};

export const mockRemoveFromWishlistResponse = {
  success: true,
  ...createMockWishlist({
    items: [],
    total: 0,
  }),
};

export const mockClearWishlistResponse = {
  success: true,
  ...mockEmptyWishlist,
};

/**
 * Mock Search API Responses
 */

export const mockSearchTobaccosResponse = {
  success: true,
  ...mockSearchResults,
};

export const mockGetTobaccoDetailsResponse = {
  success: true,
  ...mockTobacco1,
};

export const mockGetBrandsResponse = {
  success: true,
  brands: ['Adalya', 'Al Fakher', 'Musthave', 'Tangiers', 'Starbuzz'],
};

export const mockGetFlavorsResponse = {
  success: true,
  flavors: ['Mint', 'Apple', 'Blueberry', 'Grape', 'Lemon', 'Mango'],
};

/**
 * Mock Error API Responses
 */

export const mockAuthErrorResponse = {
  success: false,
  error: 'Authentication failed. Please open this app from Telegram.',
  code: 'AUTH_FAILED',
};

export const mockNotFoundErrorResponse = {
  success: false,
  error: 'The requested resource was not found.',
  code: 'NOT_FOUND',
};

export const mockRateLimitErrorResponse = {
  success: false,
  error: 'Too many requests. Please try again later.',
  code: 'RATE_LIMIT_EXCEEDED',
};

export const mockServerErrorResponse = {
  success: false,
  error: 'Server error. Please try again later.',
  code: 'SERVER_ERROR',
};

export const mockNetworkErrorResponse = {
  success: false,
  error: 'Network error. Please check your connection and try again.',
  code: 'NETWORK_ERROR',
};

/**
 * Mock Telegram User Data
 */

export const mockTelegramUser = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'en',
  is_premium: false,
};

export const mockTelegramUserPremium = {
  id: 987654321,
  first_name: 'Premium',
  last_name: 'User',
  username: 'premiumuser',
  language_code: 'en',
  is_premium: true,
};

/**
 * Mock Telegram Init Data
 */

export const mockInitData = `user=${encodeURIComponent(JSON.stringify(mockTelegramUser))}&auth_date=${Math.floor(Date.now() / 1000)}&hash=mock_hash_for_testing`;

export const mockInitDataPremium = `user=${encodeURIComponent(JSON.stringify(mockTelegramUserPremium))}&auth_date=${Math.floor(Date.now() / 1000)}&hash=mock_hash_for_testing_premium`;

/**
 * Mock Telegram Web Apps API
 * Note: Mock functions should be created in test files using vi.fn()
 */

export const mockTelegramWebAppBase = {
  initData: mockInitData,
  initDataUnsafe: {
    user: mockTelegramUser,
    query_id: 'query123',
    auth_date: Math.floor(Date.now() / 1000),
    hash: 'mock_hash',
  },
  version: '6.9',
  platform: 'ios',
  colorScheme: 'light',
  themeParams: {
    bg_color: '#ffffff',
    text_color: '#000000',
    hint_color: '#999999',
    link_color: '#2481cc',
    button_color: '#2481cc',
    button_text_color: '#ffffff',
    secondary_bg_color: '#f0f0f0',
  },
  isExpanded: false,
  viewportHeight: 667,
  viewportStableHeight: 667,
  headerColor: '#ffffff',
  backgroundColor: '#ffffff',
  isClosingConfirmationEnabled: false,
  backButton: {
    isVisible: false,
    onClick: null,
  },
  mainButton: {
    text: 'Continue',
    color: '#2481cc',
    textColor: '#ffffff',
    isVisible: false,
    isActive: true,
    isProgressVisible: false,
    onClick: null,
  },
  hapticFeedback: {
    impactOccurred: () => {},
    notificationOccurred: () => {},
    selectionChanged: () => {},
  },
  ready: () => {},
  expand: () => {},
  close: () => {},
  enableClosingConfirmation: () => {},
  disableClosingConfirmation: () => {},
  sendData: () => {},
  switchInlineQuery: () => {},
  openLink: () => {},
  openTelegramLink: () => {},
  openPopup: () => {},
  showPopup: () => {},
  showAlert: () => {},
  showConfirm: () => {},
  requestWriteAccess: () => {},
  requestContact: () => {},
  requestFileUpload: () => {},
  downloadFile: () => {},
  readTextFromClipboard: () => {},
  requestClipboardText: () => {},
  prepareClosingConfirmation: () => {},
};

/**
 * Helper function to create mock Telegram user
 */
export function createMockTelegramUser(overrides?: Partial<typeof mockTelegramUser>): typeof mockTelegramUser {
  return {
    id: Math.floor(Math.random() * 1000000000),
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    language_code: 'en',
    is_premium: false,
    ...overrides,
  };
}

/**
 * Helper function to create mock init data string
 */
export function createMockInitDataString(user?: typeof mockTelegramUser): string {
  const userData = user || createMockTelegramUser();
  const authDate = Math.floor(Date.now() / 1000);
  
  const params = new URLSearchParams({
    user: JSON.stringify(userData),
    auth_date: authDate.toString(),
    hash: 'mock_hash_for_testing',
  });
  
  return params.toString();
}

/**
 * Mock environment variables
 */

export const mockEnvVars = {
  VITE_API_URL: 'http://localhost:3000/api/v1',
  DEV: 'true',
};

/**
 * Mock pagination data
 */

export const mockPaginationData = {
  currentPage: 1,
  totalPages: 3,
  totalItems: 45,
  itemsPerPage: 20,
  hasNextPage: true,
  hasPreviousPage: false,
};

/**
 * Mock loading states
 */

export const mockLoadingStates = {
  isLoading: true,
  isNotLoading: false,
};

/**
 * Mock error states
 */

export const mockErrorStates = {
  errorMessage: 'Something went wrong',
  authError: 'Authentication failed',
  networkError: 'Network error',
  notFoundError: 'Resource not found',
  rateLimitError: 'Too many requests',
  serverError: 'Server error',
};

/**
 * Export all mock data as a single object for convenience
 */
export const mockData = {
  tobacco: {
    tobacco1: mockTobacco1,
    tobacco2: mockTobacco2,
    tobacco3: mockTobacco3,
    tobacco4: mockTobacco4,
    tobacco5: mockTobacco5,
    create: createMockTobacco,
    createMany: createMockTobaccos,
  },
  wishlistItem: {
    item1: mockWishlistItem1,
    item2: mockWishlistItem2,
    item3: mockWishlistItem3,
    create: createMockWishlistItem,
  },
  wishlist: {
    full: mockWishlist,
    empty: mockEmptyWishlist,
    create: createMockWishlist,
  },
  searchResults: {
    full: mockSearchResults,
    empty: mockEmptySearchResults,
    paginated: mockPaginatedSearchResults,
    create: createMockSearchResults,
  },
  api: {
    success: mockSuccessResponse,
    error: mockErrorResponse,
    getWishlist: mockGetWishlistResponse,
    addToWishlist: mockAddToWishlistResponse,
    removeFromWishlist: mockRemoveFromWishlistResponse,
    clearWishlist: mockClearWishlistResponse,
    searchTobaccos: mockSearchTobaccosResponse,
    getTobaccoDetails: mockGetTobaccoDetailsResponse,
    getBrands: mockGetBrandsResponse,
    getFlavors: mockGetFlavorsResponse,
    authError: mockAuthErrorResponse,
    notFoundError: mockNotFoundErrorResponse,
    rateLimitError: mockRateLimitErrorResponse,
    serverError: mockServerErrorResponse,
    networkError: mockNetworkErrorResponse,
  },
  telegram: {
    user: mockTelegramUser,
    userPremium: mockTelegramUserPremium,
    webApp: mockTelegramWebAppBase,
    initData: mockInitData,
    initDataPremium: mockInitDataPremium,
    createUser: createMockTelegramUser,
    createInitData: createMockInitDataString,
  },
  env: mockEnvVars,
  pagination: mockPaginationData,
  loading: mockLoadingStates,
  error: mockErrorStates,
};

export default mockData;
