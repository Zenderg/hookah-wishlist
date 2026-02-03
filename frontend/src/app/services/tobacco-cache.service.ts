import { Injectable, signal, inject } from '@angular/core';
import { HookahDbService, type Tobacco } from './hookah-db.service';

@Injectable({
  providedIn: 'root',
})
export class TobaccoCacheService {
  private hookahDbService = inject(HookahDbService);

  private tobaccoCache = signal<Map<string, Tobacco>>(new Map());

  getTobaccoCache() {
    return this.tobaccoCache.asReadonly();
  }

  getTobacco(tobaccoId: string): Tobacco | undefined {
    return this.tobaccoCache().get(tobaccoId);
  }

  getTobaccoName(tobaccoId: string): string {
    const tobacco = this.tobaccoCache().get(tobaccoId);
    return tobacco?.name || tobaccoId;
  }

  getTobaccoImageUrl(tobaccoId: string): string {
    const tobacco = this.tobaccoCache().get(tobaccoId);
    return tobacco?.imageUrl || 'https://via.placeholder.com/80';
  }

  getBrandIdByTobaccoId(tobaccoId: string): string | undefined {
    const tobacco = this.tobaccoCache().get(tobaccoId);
    return tobacco?.brandId;
  }

  getLineIdByTobaccoId(tobaccoId: string): string | null {
    const tobacco = this.tobaccoCache().get(tobaccoId);
    return tobacco?.lineId || null;
  }

  loadTobacco(tobaccoId: string): void {
    const currentCache = this.tobaccoCache();
    if (!currentCache.has(tobaccoId)) {
      this.hookahDbService.getTobaccoById(tobaccoId).subscribe({
        next: (tobacco: Tobacco) => {
          this.tobaccoCache.update((cache) => new Map(cache).set(tobaccoId, tobacco));
        },
        error: (err: any) => {
          console.error(`Failed to load tobacco ${tobaccoId}:`, err);
        },
      });
    }
  }

  loadTobaccos(tobaccoIds: string[]): void {
    const currentCache = this.tobaccoCache();
    const idsToLoad = tobaccoIds.filter((id) => !currentCache.has(id));

    idsToLoad.forEach((tobaccoId) => {
      this.hookahDbService.getTobaccoById(tobaccoId).subscribe({
        next: (tobacco: Tobacco) => {
          this.tobaccoCache.update((cache) => new Map(cache).set(tobaccoId, tobacco));
        },
        error: (err: any) => {
          console.error(`Failed to load tobacco ${tobaccoId}:`, err);
        },
      });
    });
  }
}
