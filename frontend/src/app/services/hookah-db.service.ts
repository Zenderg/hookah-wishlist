import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type Brand = {
  id: string; // UUID
  name: string;
  slug: string;
  country: string;
  rating: number;
  ratingsCount: number;
  description: string;
  logoUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Tobacco = {
  id: string; // UUID
  name: string;
  slug: string;
  brandId: string; // UUID
  lineId: string | null; // UUID or null
  rating: number;
  ratingsCount: number;
  strengthOfficial: string;
  strengthByRatings: string;
  status: string;
  htreviewsId: string;
  imageUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type Line = {
  id: string; // UUID
  name: string;
  slug: string;
  brandId: string; // UUID
  description: string;
  imageUrl: string;
  rating: number;
  ratingsCount: number;
  strengthOfficial: string;
  strengthByRatings: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type BrandsQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'name';
  order?: 'asc' | 'desc';
  country?: string;
  status?: string;
  search?: string;
};

export type TobaccosQueryParams = {
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
};

export type LinesQueryParams = {
  page?: number;
  limit?: number;
  brandId?: string;
  search?: string;
};

@Injectable({
  providedIn: 'root',
})
export class HookahDbService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Health check (public endpoint)
  healthCheck(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.apiUrl}/hookah-db/health`);
  }

  // Brands endpoints
  getBrands(params?: BrandsQueryParams): Observable<PaginatedResponse<Brand>> {
    let httpParams = this.buildHttpParams({
      page: params?.page?.toString(),
      limit: params?.limit?.toString(),
      sortBy: params?.sortBy,
      order: params?.order,
      country: params?.country,
      status: params?.status,
      search: params?.search,
    });

    return this.http.get<PaginatedResponse<Brand>>(`${this.apiUrl}/hookah-db/brands`, {
      params: httpParams,
    });
  }

  getBrandById(id: string): Observable<Brand> {
    return this.http.get<Brand>(`${this.apiUrl}/hookah-db/brands/${id}`);
  }

  getBrandTobaccos(
    id: string,
    params?: { page?: number; limit?: number; sortBy?: 'rating' | 'name'; order?: 'asc' | 'desc' },
  ): Observable<PaginatedResponse<Tobacco>> {
    let httpParams = this.buildHttpParams({
      page: params?.page?.toString(),
      limit: params?.limit?.toString(),
      sortBy: params?.sortBy,
      order: params?.order,
    });

    return this.http.get<PaginatedResponse<Tobacco>>(`${this.apiUrl}/hookah-db/brands/${id}/tobaccos`, {
      params: httpParams,
    });
  }

  getBrandCountries(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/hookah-db/brands/countries`);
  }

  getBrandStatuses(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/hookah-db/brands/statuses`);
  }

  // Tobaccos endpoints
  getTobaccos(params?: TobaccosQueryParams): Observable<PaginatedResponse<Tobacco>> {
    let httpParams = this.buildHttpParams({
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

    return this.http.get<PaginatedResponse<Tobacco>>(`${this.apiUrl}/hookah-db/tobaccos`, {
      params: httpParams,
    });
  }

  getTobaccoById(id: string): Observable<Tobacco> {
    return this.http.get<Tobacco>(`${this.apiUrl}/hookah-db/tobaccos/${id}`);
  }

  getTobaccoStatuses(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/hookah-db/tobaccos/statuses`);
  }

  // Lines endpoints
  getLines(params?: LinesQueryParams): Observable<PaginatedResponse<Line>> {
    let httpParams = this.buildHttpParams({
      page: params?.page?.toString(),
      limit: params?.limit?.toString(),
      brandId: params?.brandId,
      search: params?.search,
    });

    return this.http.get<PaginatedResponse<Line>>(`${this.apiUrl}/hookah-db/lines`, {
      params: httpParams,
    });
  }

  getLineById(id: string): Observable<Line> {
    return this.http.get<Line>(`${this.apiUrl}/hookah-db/lines/${id}`);
  }

  getLineTobaccos(
    id: string,
    params?: { page?: number; limit?: number; sortBy?: 'rating' | 'name'; order?: 'asc' | 'desc' },
  ): Observable<PaginatedResponse<Tobacco>> {
    let httpParams = this.buildHttpParams({
      page: params?.page?.toString(),
      limit: params?.limit?.toString(),
      sortBy: params?.sortBy,
      order: params?.order,
    });

    return this.http.get<PaginatedResponse<Tobacco>>(`${this.apiUrl}/hookah-db/lines/${id}/tobaccos`, {
      params: httpParams,
    });
  }

  getLineStatuses(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/hookah-db/lines/statuses`);
  }

  private buildHttpParams(params: Record<string, string | undefined>): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        httpParams = httpParams.set(key, value);
      }
    }
    return httpParams;
  }
}
