import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  private http = inject(HttpClient);
  private apiUrl = environment.hookahDbApiUrl;
  private apiKey = environment.hookahDbApiKey;

  private getHeaders(): Record<string, string> {
    return {
      'X-API-Key': this.apiKey,
    };
  }

  getBrands(search?: string): Observable<Brand[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<Brand[]>(`${this.apiUrl}/api/v1/brands`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getBrandBySlug(slug: string): Observable<Brand> {
    return this.http.get<Brand>(`${this.apiUrl}/api/v1/brands/${slug}`, {
      headers: this.getHeaders(),
    });
  }

  getFlavors(search?: string, brand?: string): Observable<Flavor[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (brand) {
      params = params.set('brand', brand);
    }

    return this.http.get<Flavor[]>(`${this.apiUrl}/api/v1/flavors`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getFlavorBySlug(slug: string): Observable<Flavor> {
    return this.http.get<Flavor>(`${this.apiUrl}/api/v1/flavors/${slug}`, {
      headers: this.getHeaders(),
    });
  }
}
