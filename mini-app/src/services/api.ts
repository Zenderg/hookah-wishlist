import axios, { 
  AxiosError, 
  AxiosResponse,
  InternalAxiosRequestConfig 
} from 'axios';
import type { WebApp } from '@twa-dev/types';

// Import existing types
import type { Tobacco, Wishlist, SearchResult } from '../types';

/**
 * Extended types for API responses
 */
export interface WishlistResponse extends Wishlist {
  success: boolean;
}

export interface TobaccoResponse extends Tobacco {
  success: boolean;
}

export interface SearchResponse extends SearchResult {
  success: boolean;
}

/**
 * Telegram Web Apps API configuration
 */
const TELEGRAM_INIT_DATA_HEADER = 'X-Telegram-Init-Data';

/**
 * Extracts Telegram Web Apps init data
 * Handles both production (Telegram) and development (browser) environments
 * 
 * @returns The init data string, or mock data for development
 */
const getTelegramInitData = (): string => {
  // Check if running in development mode
  const isDevelopment = import.meta.env.DEV;
  console.log('[API DEBUG] isDevelopment:', isDevelopment);
  
  // Try to access Telegram Web Apps API
  const telegramWebApp = (window as any).Telegram?.WebApp as WebApp | undefined;
  console.log('[API DEBUG] telegramWebApp exists:', !!telegramWebApp);
  console.log('[API DEBUG] telegramWebApp.initData:', telegramWebApp?.initData ? 'PRESENT' : 'MISSING');
  
  if (telegramWebApp?.initData) {
    // Production: Use real init data from Telegram
    console.log('[API DEBUG] Using real Telegram init data');
    console.log('[API DEBUG] initData length:', telegramWebApp.initData.length);
    console.log('[API DEBUG] initData preview:', telegramWebApp.initData.substring(0, 100) + '...');
    return telegramWebApp.initData;
  }
  
  if (isDevelopment) {
    // Development: Use mock init data for testing
    console.warn('[API] Development mode: Using mock Telegram init data');
    return createMockInitData();
  }
  
  // Production without Telegram: Return empty string (will cause 401 errors)
  console.error('[API] Telegram Web Apps API not available and not in development mode');
  console.error('[API] This app must be opened from Telegram to work in production');
  return '';
};

/**
 * Creates mock init data for development/testing purposes
 * This simulates the format of real Telegram init data
 * 
 * @returns Mock init data string
 */
const createMockInitData = (): string => {
  const mockUser = {
    id: 123456789,
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    language_code: 'en',
  };
  
  const authDate = Math.floor(Date.now() / 1000);
  
  // Create URL-encoded query string format (similar to real init data)
  const params = new URLSearchParams({
    user: JSON.stringify(mockUser),
    auth_date: authDate.toString(),
    hash: 'mock_hash_for_development',
  });
  
  return params.toString();
};

/**
 * API base URL configuration
 * Falls back to localhost if not specified in environment
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
console.log('[API DEBUG] API_BASE_URL:', API_BASE_URL);

/**
 * Axios instance configured for API requests
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add Telegram init data to all requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const initData = getTelegramInitData();
    console.log('[API DEBUG] Request interceptor - initData present:', !!initData);
    
    if (initData) {
      config.headers = config.headers || {};
      config.headers[TELEGRAM_INIT_DATA_HEADER] = initData;
      console.log('[API DEBUG] Added X-Telegram-Init-Data header to request');
    } else {
      console.error('[API DEBUG] No initData available - authentication will fail');
    }
    
    console.log('[API DEBUG] Request URL:', config.url);
    console.log('[API DEBUG] Request headers:', JSON.stringify(config.headers, null, 2));
    
    return config;
  },
  (error: AxiosError) => {
    console.error('[API DEBUG] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[API DEBUG] Response successful:', response.status);
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    console.log('[API DEBUG] Response error:', status);
    console.log('[API DEBUG] Error response data:', error.response?.data);
    
    if (status === 401) {
      // Authentication failed - invalid or missing init data
      console.error('[API] Authentication failed: Invalid or missing Telegram init data');
      console.error('[API] Error details:', error.response?.data);
      return Promise.reject(new Error('Authentication failed. Please open this app from Telegram.'));
    }
    
    if (status === 403) {
      // Forbidden - user doesn't have permission
      console.error('[API] Access forbidden');
      return Promise.reject(new Error('Access denied. You do not have permission to perform this action.'));
    }
    
    if (status === 404) {
      // Resource not found
      console.error('[API] Resource not found');
      return Promise.reject(new Error('The requested resource was not found.'));
    }
    
    if (status === 429) {
      // Rate limit exceeded
      console.error('[API] Rate limit exceeded');
      return Promise.reject(new Error('Too many requests. Please try again later.'));
    }
    
    if (status && status >= 500) {
      // Server error
      console.error('[API] Server error:', status);
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    // Network error or other issues
    if (!error.response) {
      console.error('[API] Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }
    
    // Generic error
    console.error('[API] API error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * API service for backend communication
 * All methods include Telegram authentication via init data header
 */
export const apiService = {
  /**
   * Retrieves the user's wishlist
   * 
   * @returns Promise resolving to the user's wishlist
   * @throws Error if authentication fails or wishlist cannot be retrieved
   */
  async getWishlist(): Promise<Wishlist> {
    const response = await api.get<WishlistResponse>('/wishlist');
    return response.data;
  },

  /**
   * Adds a tobacco item to the user's wishlist
   * 
   * @param tobaccoId - The ID of the tobacco to add
   * @param notes - Optional notes about the tobacco
   * @returns Promise resolving to the updated wishlist
   * @throws Error if authentication fails or tobacco cannot be added
   */
  async addToWishlist(tobaccoId: string, notes?: string): Promise<Wishlist> {
    const response = await api.post<WishlistResponse>('/wishlist', { 
      tobaccoId, 
      notes 
    });
    return response.data;
  },

  /**
   * Removes a tobacco item from the user's wishlist
   * 
   * @param tobaccoId - The ID of the tobacco to remove
   * @returns Promise resolving to the updated wishlist
   * @throws Error if authentication fails or tobacco cannot be removed
   */
  async removeFromWishlist(tobaccoId: string): Promise<Wishlist> {
    const response = await api.delete<WishlistResponse>(`/wishlist/${tobaccoId}`);
    return response.data;
  },

  /**
   * Clears all items from the user's wishlist
   * 
   * @returns Promise resolving to the empty wishlist
   * @throws Error if authentication fails or wishlist cannot be cleared
   */
  async clearWishlist(): Promise<Wishlist> {
    const response = await api.delete<WishlistResponse>('/wishlist');
    return response.data;
  },

  /**
   * Searches for tobaccos based on a query
   * 
   * @param query - The search query string
   * @param page - The page number (default: 1)
   * @param pageSize - The number of results per page (default: 20)
   * @returns Promise resolving to search results
   * @throws Error if search fails
   */
  async searchTobaccos(
    query: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<SearchResult> {
    const response = await api.get<SearchResponse>('/search', {
      params: { query, page, pageSize },
    });
    return response.data;
  },

  /**
   * Retrieves details for a specific tobacco
   * 
   * @param id - The ID of the tobacco
   * @returns Promise resolving to tobacco details
   * @throws Error if tobacco cannot be found
   */
  async getTobaccoDetails(id: string): Promise<Tobacco> {
    const response = await api.get<TobaccoResponse>(`/tobacco/${id}`);
    return response.data;
  },

  /**
   * Retrieves all available tobacco brands
   * 
   * @returns Promise resolving to list of brands
   * @throws Error if brands cannot be retrieved
   */
  async getBrands(): Promise<string[]> {
    const response = await api.get<{ success: boolean; brands: string[] }>('/search/brands');
    return response.data.brands;
  },

  /**
   * Retrieves all available tobacco flavors
   * 
   * @returns Promise resolving to list of flavors
   * @throws Error if flavors cannot be retrieved
   */
  async getFlavors(): Promise<string[]> {
    const response = await api.get<{ success: boolean; flavors: string[] }>('/search/flavors');
    return response.data.flavors;
  },

  /**
   * Checks if the Telegram Web Apps API is available
   * Useful for conditional rendering or feature detection
   * 
   * @returns True if running in Telegram, false otherwise
   */
  isTelegramAvailable(): boolean {
    const telegramWebApp = (window as any).Telegram?.WebApp as WebApp | undefined;
    return !!telegramWebApp?.initData;
  },

  /**
   * Gets the current Telegram user information
   * Returns null if not running in Telegram
   * 
   * @returns Telegram user information or null
   */
  getTelegramUser(): WebApp['initDataUnsafe']['user'] | null {
    const telegramWebApp = (window as any).Telegram?.WebApp as WebApp | undefined;
    return telegramWebApp?.initDataUnsafe?.user || null;
  },

  /**
   * Initializes the Telegram Web Apps API
   * Should be called when the app mounts
   * 
   * @returns The WebApp instance or null if not available
   */
  initializeTelegram(): WebApp | null {
    const telegramWebApp = (window as any).Telegram?.WebApp as WebApp | undefined;
    
    if (telegramWebApp) {
      // Tell Telegram the app is ready
      telegramWebApp.ready();
      
      // Expand the app to full height
      telegramWebApp.expand();
      
      console.log('[API] Telegram Web Apps API initialized successfully');
      return telegramWebApp;
    }
    
    console.warn('[API] Telegram Web Apps API not available');
    return null;
  },
};

/**
 * Export the axios instance for custom requests if needed
 */
export { api };

/**
 * Export the init data header constant for reference
 */
export { TELEGRAM_INIT_DATA_HEADER };

export default apiService;
