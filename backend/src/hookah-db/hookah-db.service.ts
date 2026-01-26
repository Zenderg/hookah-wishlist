import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface Brand {
  name: string;
  slug: string;
}

export interface Flavor {
  name: string;
  slug: string;
  brand: string;
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

  async getBrands(search?: string): Promise<Brand[]> {
    try {
      const params: Record<string, string> = {};
      if (search) {
        params.search = search;
      }

      const response = await firstValueFrom(
        this.httpService.get<Brand[]>(`${this.apiUrl}/api/v1/brands`, {
          headers: this.getHeaders(),
          params,
        }),
      );

      this.logger.debug(`Fetched ${response.data.length} brands`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch brands');
      throw error;
    }
  }

  async getBrandBySlug(slug: string): Promise<Brand> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Brand>(`${this.apiUrl}/api/v1/brands/${slug}`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.debug(`Fetched brand: ${slug}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch brand: ${slug}`);
      throw error;
    }
  }

  async getFlavors(search?: string, brand?: string): Promise<Flavor[]> {
    try {
      const params: Record<string, string> = {};
      if (search) {
        params.search = search;
      }
      if (brand) {
        params.brand = brand;
      }

      const response = await firstValueFrom(
        this.httpService.get<Flavor[]>(`${this.apiUrl}/api/v1/flavors`, {
          headers: this.getHeaders(),
          params,
        }),
      );

      this.logger.debug(`Fetched ${response.data.length} flavors`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch flavors');
      throw error;
    }
  }

  async getFlavorBySlug(slug: string): Promise<Flavor> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Flavor>(`${this.apiUrl}/api/v1/flavors/${slug}`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.debug(`Fetched flavor: ${slug}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch flavor: ${slug}`);
      throw error;
    }
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
