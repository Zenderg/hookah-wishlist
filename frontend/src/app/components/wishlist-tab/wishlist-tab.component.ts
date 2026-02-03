import { Component, inject, signal, computed, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WishlistService, type WishlistItem } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { BrandCacheService } from '../../services/brand-cache.service';
import { TobaccoCacheService } from '../../services/tobacco-cache.service';
import { HookahDbService, type Tobacco, type Line } from '../../services/hookah-db.service';
import { TobaccoCardComponent } from '../tobacco-card/tobacco-card.component';
import { SkeletonCardComponent } from '../skeleton-card/skeleton-card.component';

@Component({
  selector: 'app-wishlist-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TobaccoCardComponent,
    SkeletonCardComponent,
  ],
  templateUrl: './wishlist-tab.component.html',
  styleUrls: ['./wishlist-tab.component.scss'],
})
export class WishlistTabComponent implements OnInit {
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private brandCacheService = inject(BrandCacheService);
  private tobaccoCacheService = inject(TobaccoCacheService);
  private hookahDbService = inject(HookahDbService);

  // Outputs
  removeFromWishlist = output<{ item: WishlistItem; alreadyRemoved: boolean }>();

  // Wishlist state
  wishlist = signal<WishlistItem[]>([]);
  wishlistLoading = signal(false);
  wishlistError = signal<string | null>(null);
  removingFromWishlist = signal<Set<string>>(new Set());
  itemsWithCheckmark = signal<Set<string>>(new Set());

  // Line names cache (Map<lineId, lineName>)
  lineNames = signal<Map<string, string>>(new Map<string, string>());
  dataReady = computed(() => {
    const items = this.wishlist();
    // If loading is complete and list is empty, data is ready (show empty state)
    if (!this.wishlistLoading() && items.length === 0) return true;
    // If list is empty but still loading, data is not ready (show skeleton)
    if (items.length === 0) return false;
    // Check if all items have tobacco details, brand names, and line names
    return items.every((item) => {
      const tobaccoName = this.getTobaccoName(item.tobaccoId);
      const brandName = this.getBrandNameByTobaccoId(item.tobaccoId);
      const lineName = this.getLineNameByTobaccoId(item.tobaccoId);
      const imageUrl = this.getTobaccoImageUrl(item.tobaccoId);
      // Data is ready if we have tobacco name (not UUID), brand name (not UUID), line name (not UUID), and image URL
      return (
        tobaccoName !== item.tobaccoId &&
        brandName !== item.tobaccoId &&
        lineName !== item.tobaccoId &&
        imageUrl !== ''
      );
    });
  });

  ngOnInit() {
    this.loadWishlist();
  }

  loadWishlist() {
    this.wishlistLoading.set(true);
    this.wishlistError.set(null);

    this.wishlistService.getWishlist().subscribe({
      next: (items) => {
        this.wishlist.set(items);
        this.wishlistLoading.set(false);
        // Load tobacco details for wishlist items
        this.loadTobaccoDetails(items);
      },
      error: (err) => {
        console.error('Failed to load wishlist:', err);
        this.wishlistError.set('Не удалось загрузить wishlist');
        this.wishlistLoading.set(false);
      },
    });
  }

  private loadTobaccoDetails(items: WishlistItem[]) {
    const tobaccoIds = [...new Set(items.map((item) => item.tobaccoId))];
    this.tobaccoCacheService.loadTobaccos(tobaccoIds);

    // Load brand names for tobaccos
    tobaccoIds.forEach((tobaccoId) => {
      const brandId = this.tobaccoCacheService.getBrandIdByTobaccoId(tobaccoId);
      if (brandId) {
        this.brandCacheService.loadBrandName(brandId);
      }
    });

    // Load line names for tobaccos
    tobaccoIds.forEach((tobaccoId) => {
      const lineId = this.tobaccoCacheService.getLineIdByTobaccoId(tobaccoId);
      if (lineId) {
        this.loadLineName(lineId);
      }
    });
  }

  private loadLineName(lineId: string): void {
    // Check if line name is already cached
    if (!this.lineNames().has(lineId)) {
      this.hookahDbService.getLineById(lineId).subscribe({
        next: (line: Line) => {
          this.lineNames.update((map) => new Map(map).set(lineId, line.name));
        },
        error: (err: any) => {
          console.error(`Failed to load line name for lineId ${lineId}:`, err);
          // Store lineId as name on error to prevent infinite loading
          this.lineNames.update((map) => new Map(map).set(lineId, lineId));
        },
      });
    }
  }

  onMarkAsPurchased(item: WishlistItem | Tobacco) {
    let wishlistItem: WishlistItem | undefined;

    if ('tobaccoId' in item) {
      // It's a WishlistItem
      wishlistItem = item as WishlistItem;
    } else {
      // It's a Tobacco object - find the corresponding wishlist item
      const tobacco = item as Tobacco;
      wishlistItem = this.wishlist().find(wi => wi.tobaccoId === tobacco.id);
      if (!wishlistItem) {
        console.error('Wishlist item not found for tobacco:', tobacco.id);
        return;
      }
    }

    const itemId = wishlistItem.id;

    const removingSet = this.removingFromWishlist();
    this.removingFromWishlist.set(new Set(removingSet).add(itemId));

    // Show checkmark animation
    this.itemsWithCheckmark.update((set) => new Set(set).add(itemId));

    // Wait for animation, then remove
    setTimeout(() => {
      this.wishlistService.removeFromWishlist(itemId).subscribe({
        next: () => {
          this.wishlist.update((items) => items.filter((i) => i.id !== itemId));
          this.removingFromWishlist.update((set) => {
            const newSet = new Set(set);
            newSet.delete(itemId);
            return newSet;
          });
          this.itemsWithCheckmark.update((set) => {
            const newSet = new Set(set);
            newSet.delete(itemId);
            return newSet;
          });
          this.removeFromWishlist.emit({ item: wishlistItem, alreadyRemoved: true });
        },
        error: (err) => {
          console.error('Failed to remove from wishlist:', err);
          this.removingFromWishlist.update((set) => {
            const newSet = new Set(set);
            newSet.delete(itemId);
            return newSet;
          });
          this.itemsWithCheckmark.update((set) => {
            const newSet = new Set(set);
            newSet.delete(itemId);
            return newSet;
          });
        },
      });
    }, 1500); // Wait 1.5 seconds for checkmark animation
  }

  getTobaccoName(tobaccoId: string): string {
    return this.tobaccoCacheService.getTobaccoName(tobaccoId);
  }

  getTobaccoImageUrl(tobaccoId: string): string {
    return this.tobaccoCacheService.getTobaccoImageUrl(tobaccoId);
  }

  getBrandNameByTobaccoId(tobaccoId: string): string {
    const brandId = this.tobaccoCacheService.getBrandIdByTobaccoId(tobaccoId);
    if (brandId) {
      return this.brandCacheService.getBrandName(brandId);
    }
    return tobaccoId;
  }

  getLineNameByTobaccoId(tobaccoId: string): string {
    const lineId = this.tobaccoCacheService.getLineIdByTobaccoId(tobaccoId);
    if (lineId) {
      return this.getLineName(lineId);
    }
    return tobaccoId;
  }

  getLineName(lineId: string): string {
    return this.lineNames().get(lineId) || lineId;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  trackByWishlistItemId(index: number, item: WishlistItem): string {
    return item.id;
  }
}
