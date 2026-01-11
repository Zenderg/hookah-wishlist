import axios, { AxiosInstance, AxiosError } from 'axios';
import logger from '@/utils/logger';
import { Tobacco, TobaccoSearchResult, TobaccoSearchParams } from '@/models/tobacco';

class HookahDbService {
  private client: AxiosInstance;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = process.env.HOOKEH_DB_API_URL || 'https://hdb.coolify.dknas.org';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        logger.error('API Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`Cache hit for key: ${key}`);
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async searchTobaccos(params: TobaccoSearchParams): Promise<TobaccoSearchResult> {
    const cacheKey = this.getCacheKey('/search', params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get('/tobaccos', {
        params: {
          search: params.query,
          brand: params.brand,
          flavor: params.flavor,
          page: params.page || 1,
          limit: params.pageSize || 20,
        },
      });

      // Handle response safely - response.data might be undefined
      const responseData = response.data || {};
      const result: TobaccoSearchResult = {
        results: responseData.data || responseData.results || [],
        total: responseData.total || responseData.count || 0,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error('Error searching tobaccos:', error);
      throw new Error('Failed to search tobaccos. Please try again later.');
    }
  }

  async getTobaccoById(id: string): Promise<Tobacco | null> {
    const cacheKey = this.getCacheKey(`/tobaccos/${id}`);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get(`/tobaccos/${id}`);
      
      // Handle response safely - response.data might be undefined
      const responseData = response.data || {};
      const tobacco: Tobacco = responseData.data || responseData;
      
      this.setCache(cacheKey, tobacco);
      return tobacco;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      logger.error(`Error getting tobacco ${id}:`, error);
      throw new Error('Failed to get tobacco details. Please try again later.');
    }
  }

  async getBrands(): Promise<string[]> {
    const cacheKey = this.getCacheKey('/brands');
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get('/brands');
      
      // Handle response safely - response.data might be undefined
      const responseData = response.data || {};
      const brands: string[] = responseData.data || responseData || [];
      
      this.setCache(cacheKey, brands);
      return brands;
    } catch (error) {
      logger.error('Error getting brands:', error);
      throw new Error('Failed to get brands. Please try again later.');
    }
  }

  async getFlavors(): Promise<string[]> {
    const cacheKey = this.getCacheKey('/flavors');
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get('/flavors');
      
      // Handle response safely - response.data might be undefined
      const responseData = response.data || {};
      const flavors: string[] = responseData.data || responseData || [];
      
      this.setCache(cacheKey, flavors);
      return flavors;
    } catch (error) {
      logger.error('Error getting flavors:', error);
      throw new Error('Failed to get flavors. Please try again later.');
    }
  }

  clearCache(): void {
    this.cache.clear();
    logger.info('API cache cleared');
  }
}

export { HookahDbService };
export const hookahDbService = new HookahDbService();
export default hookahDbService;
