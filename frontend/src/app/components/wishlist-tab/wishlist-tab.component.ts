import { Component, inject, signal, computed, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WishlistService, type WishlistItem, type WishlistItemWithDetails } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { HookahDbService, type TobaccoWithDetails } from '../../services/hookah-db.service';
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
  private hookahDbService = inject(HookahDbService);

  // Outputs
  removeFromWishlist = output<{ item: WishlistItem; alreadyRemoved: boolean }>();

  // Wishlist state
  wishlist = signal<WishlistItemWithDetails[]>([]);
  wishlistLoading = signal(false);
  wishlistError = signal<string | null>(null);
  removingFromWishlist = signal<Set<string>>(new Set());
  itemsWithCheckmark = signal<Set<string>>(new Set());

  // Computed: Check if data is ready (wishlist has items with tobacco details)
  dataReady = computed(() => {
    const items = this.wishlist();
    // If loading is complete and list is empty, data is ready (show empty state)
    if (!this.wishlistLoading() && items.length === 0) return true;
    // If list is empty but still loading, data is not ready (show skeleton)
    if (items.length === 0) return false;
    // Check if all items have tobacco details
    return items.every((item) => item.tobacco !== undefined);
  });

  ngOnInit() {
    this.loadWishlist();
  }

  loadWishlist() {
    this.wishlistLoading.set(true);
    this.wishlistError.set(null);

    this.wishlistService.getWishlistWithDetails().subscribe({
      next: (items) => {
        this.wishlist.set(items);
        this.wishlistLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load wishlist:', err);
        this.wishlistError.set('Не удалось загрузить wishlist');
        this.wishlistLoading.set(false);
      },
    });
  }

  onMarkAsPurchased(item: WishlistItem | TobaccoWithDetails) {
    let wishlistItem: WishlistItem | undefined;

    if ('tobaccoId' in item) {
      // It's a WishlistItem
      wishlistItem = item as WishlistItem;
    } else {
      // It's a Tobacco object - find corresponding wishlist item
      const tobacco = item as TobaccoWithDetails;
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
    const item = this.wishlist().find(wi => wi.tobaccoId === tobaccoId);
    return item?.tobacco?.name || tobaccoId;
  }

  getTobaccoImageUrl(tobaccoId: string): string {
    const item = this.wishlist().find(wi => wi.tobaccoId === tobaccoId);
    return item?.tobacco?.imageUrl || 'https://via.placeholder.com/80';
  }

  getBrandNameByTobaccoId(tobaccoId: string): string {
    const item = this.wishlist().find(wi => wi.tobaccoId === tobaccoId);
    return item?.tobacco?.brand?.name || tobaccoId;
  }

  getLineNameByTobaccoId(tobaccoId: string): string {
    const item = this.wishlist().find(wi => wi.tobaccoId === tobaccoId);
    return item?.tobacco?.line?.name || '';
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
