import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Brand {
  name: string;
  slug: string;
}

export interface Flavor {
  name: string;
  slug: string;
  brand: string;
}

@Injectable({
  providedIn: 'root',
})
export class HookahDbService {
  private apiUrl = environment.hookahDbApiUrl;
  private apiKey = environment.hookahDbApiKey;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-API-Key': this.apiKey,
    });
  }

  getBrands(search?: string): Observable<Brand[]> {
    // TODO: Implement get brands
    const params = search ? { search } : {};
    return this.http.get<Brand[]>(`${this.apiUrl}/api/v1/brands`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getBrandBySlug(slug: string): Observable<Brand> {
    // TODO: Implement get brand by slug
    return this.http.get<Brand>(`${this.apiUrl}/api/v1/brands/${slug}`, {
      headers: this.getHeaders(),
    });
  }

  getFlavors(search?: string, brand?: string): Observable<Flavor[]> {
    // TODO: Implement get flavors
    const params: any = {};
    if (search) params.search = search;
    if (brand) params.brand = brand;
    return this.http.get<Flavor[]>(`${this.apiUrl}/api/v1/flavors`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getFlavorBySlug(slug: string): Observable<Flavor> {
    // TODO: Implement get flavor by slug
    return this.http.get<Flavor>(`${this.apiUrl}/api/v1/flavors/${slug}`, {
      headers: this.getHeaders(),
    });
  }
}
