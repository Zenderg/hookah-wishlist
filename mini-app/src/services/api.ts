import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Telegram init data to requests
api.interceptors.request.use((config) => {
  const tg = (window as any).Telegram.WebApp;
  if (tg && tg.initData) {
    config.headers['x-telegram-init-data'] = tg.initData;
  }
  return config;
});

export const apiService = {
  // Wishlist endpoints
  async getWishlist(): Promise<any> {
    const response = await api.get('/wishlist');
    return response.data;
  },

  async addToWishlist(tobaccoId: string, notes?: string): Promise<any> {
    const response = await api.post('/wishlist', { tobaccoId, notes });
    return response.data;
  },

  async removeFromWishlist(tobaccoId: string): Promise<any> {
    const response = await api.delete(`/wishlist/${tobaccoId}`);
    return response.data;
  },

  async clearWishlist(): Promise<any> {
    const response = await api.delete('/wishlist');
    return response.data;
  },

  // Search endpoints
  async searchTobaccos(query: string, page: number = 1, pageSize: number = 20): Promise<any> {
    const response = await api.get('/search', {
      params: { query, page, pageSize },
    });
    return response.data;
  },

  async getTobaccoDetails(id: string): Promise<any> {
    const response = await api.get(`/tobacco/${id}`);
    return response.data;
  },

  async getBrands(): Promise<any> {
    const response = await api.get('/search/brands');
    return response.data;
  },

  async getFlavors(): Promise<any> {
    const response = await api.get('/search/flavors');
    return response.data;
  },
};

export default apiService;
