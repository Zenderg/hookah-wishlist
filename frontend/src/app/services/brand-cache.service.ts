import { Injectable, signal, inject } from '@angular/core';
import { HookahDbService, type Brand } from './hookah-db.service';

@Injectable({
  providedIn: 'root',
})
export class BrandCacheService {
  private hookahDbService = inject(HookahDbService);

  private brandCache = signal<Map<string, string>>(new Map());

  getBrandCache() {
    return this.brandCache.asReadonly();
  }

  getBrandName(brandId: string): string {
    return this.brandCache().get(brandId) || brandId;
  }

  loadBrandName(brandId: string): void {
    const currentCache = this.brandCache();
    if (!currentCache.has(brandId)) {
      this.hookahDbService.getBrandById(brandId).subscribe({
        next: (brand: Brand) => {
          this.brandCache.update((cache) => new Map(cache).set(brandId, brand.name));
        },
        error: (err: any) => {
          console.error(`Failed to load brand ${brandId}:`, err);
          // Use brand ID as fallback name
          this.brandCache.update((cache) => new Map(cache).set(brandId, brandId));
        },
      });
    }
  }

  loadBrandNames(brandIds: string[]): void {
    const currentCache = this.brandCache();
    const idsToLoad = brandIds.filter((id) => !currentCache.has(id));

    idsToLoad.forEach((brandId) => {
      this.hookahDbService.getBrandById(brandId).subscribe({
        next: (brand: Brand) => {
          this.brandCache.update((cache) => new Map(cache).set(brandId, brand.name));
        },
        error: (err: any) => {
          console.error(`Failed to load brand ${brandId}:`, err);
          // Use brand ID as fallback name
          this.brandCache.update((cache) => new Map(cache).set(brandId, brandId));
        },
      });
    });
  }
}
