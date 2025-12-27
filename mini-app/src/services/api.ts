import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API service functions
export const api = {
  // Auth endpoints
  auth: {
    loginWithTelegram: (initData: string) => apiClient.post('/auth/telegram', { initData }),
  },

  // User endpoints
  users: {
    getMe: () => apiClient.get('/users/me'),
  },

  // Tobacco endpoints
  tobaccos: {
    search: (query: string, page = 1, limit = 20) =>
      apiClient.get('/tobaccos', { params: { q: query, page, limit } }),
    getById: (id: number) => apiClient.get(`/tobaccos/${id}`),
  },

  // Brand endpoints
  brands: {
    list: () => apiClient.get('/brands'),
    getBySlug: (slug: string) => apiClient.get(`/brands/${slug}`),
  },

  // Wishlist endpoints
  wishlist: {
    getItems: () => apiClient.get('/wishlist'),
    addItem: (tobaccoId: number) => apiClient.post('/wishlist/items', { tobaccoId }),
    addCustomItem: (customName: string, customBrand: string) =>
      apiClient.post('/wishlist/items', { customName, customBrand }),
    removeItem: (itemId: number) => apiClient.delete(`/wishlist/items/${itemId}`),
    updateItem: (itemId: number, updates: { isPurchased?: boolean }) =>
      apiClient.patch(`/wishlist/items/${itemId}`, updates),
  },
};

export default api;
