import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  country: string;
  rating: number;
  ratingsCount: number;
  description: string;
  logoUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tobacco {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  lineId: string | null;
  rating: number;
  ratingsCount: number;
  strengthOfficial: string;
  strengthByRatings: string;
  status: string;
  htreviewsId: string;
  imageUrl: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Line {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  description: string;
  imageUrl: string;
  rating: number;
  ratingsCount: number;
  strengthOfficial: string;
  strengthByRatings: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BrandsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'name';
  order?: 'asc' | 'desc';
  country?: string;
  status?: string;
  search?: string;
}

export interface TobaccosQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'name';
  order?: 'asc' | 'desc';
  brandId?: string;
  lineId?: string;
  minRating?: number;
  maxRating?: number;
  country?: string;
  status?: string;
  search?: string;
}

export interface LinesQueryParams {
  page?: number;
  limit?: number;
  brandId?: string;
  search?: string;
}

@Injectable()
export class HookahDbService {
  private readonly logger = new Logger(HookahDbService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('HOOKAH_DB_API_URL') || 'https://hdb.coolify.dknas.org';
    this.apiKey = this.configService.get<string>('HOOKAH_DB_API_KEY');

    if (!this.apiKey) {
      this.logger.warn('HOOKAH_DB_API_KEY is not configured. API calls will fail.');
    }
  }

  private getHeaders() {
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // Health check (public endpoint, no API key required)
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ status: string }>(`${this.apiUrl}/health`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to check health');
      throw error;
    }
  }

  // Brands endpoints
  async getBrands(params?: BrandsQueryParams): Promise<PaginatedResponse<Brand>> {
    try {
      const queryParams = this.buildQueryParams({
        page: params?.page?.toString(),
        limit: params?.limit?.toString(),
        sortBy: params?.sortBy,
        order: params?.order,
        country: params?.country,
        status: params?.status,
        search: params?.search,
      });

      const response = await firstValueFrom(
        this.httpService.get<PaginatedResponse<Brand>>(`${this.apiUrl}/brands`, {
          headers: this.getHeaders(),
          params: queryParams,
        }),
      );

      this.logger.debug(`Fetched ${response.data.data.length} brands (page ${response.data.page})`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch brands');
      throw error;
    }
  }

  async getBrandById(id: string): Promise<Brand> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Brand>(`${this.apiUrl}/brands/${id}`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.debug(`Fetched brand: ${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch brand: ${id}`);
      throw error;
    }
  }

  async getBrandTobaccos(id: string, params?: { page?: number; limit?: number; sortBy?: 'rating' | 'name'; order?: 'asc' | 'desc' }): Promise<PaginatedResponse<Tobacco>> {
    try {
      const queryParams = this.buildQueryParams({
        page: params?.page?.toString(),
        limit: params?.limit?.toString(),
        sortBy: params?.sortBy,
        order: params?.order,
      });

      const response = await firstValueFrom(
        this.httpService.get<PaginatedResponse<Tobacco>>(`${this.apiUrl}/brands/${id}/tobaccos`, {
          headers: this.getHeaders(),
          params: queryParams,
        }),
      );

      this.logger.debug(`Fetched ${response.data.data.length} tobaccos for brand: ${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch tobaccos for brand: ${id}`);
      throw error;
    }
  }

  async getBrandCountries(): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<string[]>(`${this.apiUrl}/brands/countries`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.debug(`Fetched ${response.data.length} brand countries`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch brand countries');
      throw error;
    }
  }

  async getBrandStatuses(): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<string[]>(`${this.apiUrl}/brands/statuses`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.debug(`Fetched ${response.data.length} brand statuses`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch brand statuses');
      throw error;
    }
  }

  // Tobaccos endpoints
  async getTobaccos(params?: TobaccosQueryParams): Promise<PaginatedResponse<Tobacco>> {
    try {
      const queryParams = this.buildQueryParams({
        page: params?.page?.toString(),
        limit: params?.limit?.toString(),
        sortBy: params?.sortBy,
        order: params?.order,
        brandId: params?.brandId,
        lineId: params?.lineId,
        minRating: params?.minRating?.toString(),
        maxRating: params?.maxRating?.toString(),
        country: params?.country,
        status: params?.status,
        search: params?.search,
      });

      const response = await firstValueFrom(
        this.httpService.get<PaginatedResponse<Tobacco>>(`${this.apiUrl}/tobaccos`, {
          headers: this.getHeaders(),
          params: queryParams,
        }),
      );

      this.logger.debug(`Fetched ${response.data.data.length} tobaccos (page ${response.data.page})`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch tobaccos');
      throw error;
    }
  }

  async getTobaccoById(id: string): Promise<Tobacco> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Tobacco>(`${this.apiUrl}/tobaccos/${id}`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.debug(`Fetched tobacco: ${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch tobacco: ${id}`);
      throw error;
    }
  }

  async getTobaccoStatuses(): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<string[]>(`${this.apiUrl}/tobaccos/statuses`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.debug(`Fetched ${response.data.length} tobacco statuses`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch tobacco statuses');
      throw error;
    }
  }

  async getTobaccoByUrl(url: string): Promise<Tobacco> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Tobacco>(`${this.apiUrl}/tobaccos/by-url`, {
          headers: this.getHeaders(),
          params: { url },
        }),
      );

      this.logger.debug(`Fetched tobacco by URL: ${url}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch tobacco by URL: ${url}`);
      throw error;
    }
  }

  // Lines endpoints
  async getLines(params?: LinesQueryParams): Promise<PaginatedResponse<Line>> {
    try {
      const queryParams = this.buildQueryParams({
        page: params?.page?.toString(),
        limit: params?.limit?.toString(),
        brandId: params?.brandId,
        search: params?.search,
      });

      const response = await firstValueFrom(
        this.httpService.get<PaginatedResponse<Line>>(`${this.apiUrl}/lines`, {
          headers: this.getHeaders(),
          params: queryParams,
        }),
      );

      this.logger.debug(`Fetched ${response.data.data.length} lines (page ${response.data.page})`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch lines');
      throw error;
    }
  }

  async getLineById(id: string): Promise<Line> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Line>(`${this.apiUrl}/lines/${id}`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.debug(`Fetched line: ${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch line: ${id}`);
      throw error;
    }
  }

  async getLineTobaccos(id: string, params?: { page?: number; limit?: number; sortBy?: 'rating' | 'name'; order?: 'asc' | 'desc' }): Promise<PaginatedResponse<Tobacco>> {
    try {
      const queryParams = this.buildQueryParams({
        page: params?.page?.toString(),
        limit: params?.limit?.toString(),
        sortBy: params?.sortBy,
        order: params?.order,
      });

      const response = await firstValueFrom(
        this.httpService.get<PaginatedResponse<Tobacco>>(`${this.apiUrl}/lines/${id}/tobaccos`, {
          headers: this.getHeaders(),
          params: queryParams,
        }),
      );

      this.logger.debug(`Fetched ${response.data.data.length} tobaccos for line: ${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch tobaccos for line: ${id}`);
      throw error;
    }
  }

  async getLineStatuses(): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<string[]>(`${this.apiUrl}/lines/statuses`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.debug(`Fetched ${response.data.length} line statuses`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch line statuses');
      throw error;
    }
  }

  // Legacy methods for backward compatibility (deprecated)
  async getFlavors(search?: string, brand?: string): Promise<Tobacco[]> {
    this.logger.warn('getFlavors() is deprecated. Use getTobaccos() instead.');
    const result = await this.getTobaccos({ search, brandId: brand });
    return result.data;
  }

  async getFlavorBySlug(slug: string): Promise<Tobacco> {
    this.logger.warn('getFlavorBySlug() is deprecated. Use getTobaccoById() instead.');
    // Note: This won't work correctly as the new API uses UUIDs, not slugs
    // This is kept for backward compatibility but should be removed
    throw new Error('getFlavorBySlug() is deprecated. Use getTobaccoById() with UUID instead.');
  }

  private buildQueryParams(params: Record<string, string | undefined>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  private handleError(error: unknown, message: string): void {
    if (error instanceof AxiosError) {
      this.logger.error(
        `${message}. Status: ${error.response?.status}. Message: ${error.message}`,
      );
    } else {
      this.logger.error(`${message}. Error: ${error}`);
    }
  }
}
