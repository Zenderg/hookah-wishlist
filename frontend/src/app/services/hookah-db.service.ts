import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type Brand = {
  name: string;
  slug: string;
};

export type Flavor = {
  name: string;
  slug: string;
  brand: string;
};

@Injectable({
  providedIn: 'root',
})
export class HookahDbService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getBrands(search?: string): Observable<Brand[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<Brand[]>(`${this.apiUrl}/hookah-db/brands`, {
      params,
    });
  }

  getBrandBySlug(slug: string): Observable<Brand> {
    return this.http.get<Brand>(`${this.apiUrl}/hookah-db/brands/${slug}`);
  }

  getFlavors(search?: string, brand?: string): Observable<Flavor[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (brand) {
      params = params.set('brand', brand);
    }

    return this.http.get<Flavor[]>(`${this.apiUrl}/hookah-db/flavors`, {
      params,
    });
  }

  getFlavorBySlug(slug: string): Observable<Flavor> {
    return this.http.get<Flavor>(`${this.apiUrl}/hookah-db/flavors/${slug}`);
  }
}
