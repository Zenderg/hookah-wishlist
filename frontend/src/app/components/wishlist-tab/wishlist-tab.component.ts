import { Component, inject, signal, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WishlistService, type WishlistItem } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { BrandCacheService } from '../../services/brand-cache.service';
import { TobaccoCacheService } from '../../services/tobacco-cache.service';
import { type Tobacco } from '../../services/hookah-db.service';
import { TobaccoCardComponent } from '../tobacco-card/tobacco-card.component';

@Component({
  selector: 'app-wishlist-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TobaccoCardComponent,
  ],
  templateUrl: './wishlist-tab.component.html',
  styleUrls: ['./wishlist-tab.component.scss'],
})
export class WishlistTabComponent implements OnInit {
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private brandCacheService = inject(BrandCacheService);
  private tobaccoCacheService = inject(TobaccoCacheService);

  // Outputs
  removeFromWishlist = output<WishlistItem>();

  // Wishlist state
  wishlist = signal<WishlistItem[]>([]);
  wishlistLoading = signal(false);
  wishlistError = signal<string | null>(null);
  removingFromWishlist = signal<Set<string>>(new Set());
  itemsWithCheckmark = signal<Set<string>>(new Set());

  ngOnInit() {
    this.loadWishlist();
  }

  loadWishlist() {
    const telegramId = this.authService.getTelegramId();
    if (!telegramId) {
      this.wishlistError.set('Не удалось получить данные пользователя');
      return;
    }

    this.wishlistLoading.set(true);
    this.wishlistError.set(null);

    this.wishlistService.getWishlist(telegramId).subscribe({
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
          this.removeFromWishlist.emit(wishlistItem);
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
