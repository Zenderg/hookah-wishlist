import { Component, inject, signal, computed, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { WishlistService, type WishlistItem, type WishlistItemWithDetails } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { HookahDbService, type Tobacco, type TobaccoWithDetails } from '../../services/hookah-db.service';
import { TobaccoCardComponent } from '../tobacco-card/tobacco-card.component';
import { SkeletonCardComponent } from '../skeleton-card/skeleton-card.component';
import { TobaccoDetailsModalComponent } from '../tobacco-details-modal/tobacco-details-modal.component';

@Component({
  selector: 'app-wishlist-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
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
  private dialog = inject(MatDialog);

  // Outputs
  removeFromWishlist = output<{ item: WishlistItem; alreadyRemoved: boolean }>();

  // Wishlist state
  wishlist = signal<WishlistItemWithDetails[]>([]);
  wishlistLoading = signal(false);
  wishlistError = signal<string | null>(null);
  removingFromWishlist = signal<Set<number>>(new Set());
  itemsWithRemoveMark = signal<Set<number>>(new Set());

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
    this.itemsWithRemoveMark.update((set) => new Set(set).add(itemId));

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
          this.itemsWithRemoveMark.update((set) => {
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
          this.itemsWithRemoveMark.update((set) => {
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

  trackByWishlistItemId(index: number, item: WishlistItem): number {
    return item.id;
  }

  onCardClick(item: WishlistItemWithDetails | Tobacco) {
    // Extract wishlist item ID if available
    let wishlistItemId: number | undefined;
    if ('tobaccoId' in item) {
      // It's a WishlistItemWithDetails
      wishlistItemId = (item as WishlistItemWithDetails).id;
    }

    this.dialog.open(TobaccoDetailsModalComponent, {
      data: {
        tobacco: 'tobaccoId' in item ? item.tobacco : item,
        inWishlist: true,
        wishlistItemId,
      },
      width: '90%',
      maxWidth: '500px',
      maxHeight: '80vh',
    }).afterClosed().subscribe((result) => {
      if (!result) return;

      if (result.action === 'removed') {
        // Tobacco was removed from wishlist - update local state
        const wishlistItem = this.wishlist().find(wi => wi.tobaccoId === result.tobaccoId);
        if (wishlistItem) {
          this.wishlist.update((items) => items.filter((i) => i.id !== wishlistItem.id));
          // Notify parent
          this.removeFromWishlist.emit({ item: wishlistItem, alreadyRemoved: true });
        }
      }
    });
  }
}
