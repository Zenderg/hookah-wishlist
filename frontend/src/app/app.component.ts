import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { HookahDbService, type Tobacco } from './services/hookah-db.service';
import { WishlistService, type WishlistItem } from './services/wishlist.service';
import { AuthService } from './services/auth.service';
import { TabBarComponent } from './components/tab-bar/tab-bar.component';
import { SearchTabComponent } from './components/search-tab/search-tab.component';
import { WishlistTabComponent } from './components/wishlist-tab/wishlist-tab.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    TabBarComponent,
    SearchTabComponent,
    WishlistTabComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    '[class.app-root]': 'true',
  },
})
export class AppComponent implements OnInit, OnDestroy {
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // Tab navigation
  activeTab = signal<'search' | 'wishlist'>('search');

  // Wishlist state for search tab
  wishlist = signal<WishlistItem[]>([]);
  wishlistTobaccoIds = computed(() => new Set(this.wishlist().map(item => item.tobaccoId)));

  // Load wishlist on init
  ngOnInit() {
    this.loadWishlist();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  // Tab navigation
  onTabChange(tab: 'search' | 'wishlist') {
    this.activeTab.set(tab);
  }

  // Load wishlist
  private loadWishlist() {
    const telegramId = this.authService.getTelegramId();
    if (!telegramId) {
      return;
    }

    this.wishlistService.getWishlist(telegramId).subscribe({
      next: (items) => {
        this.wishlist.set(items);
      },
      error: (err) => {
        console.error('Failed to load wishlist:', err);
      },
    });
  }

  // Handle add to wishlist from search tab
  onAddToWishlist(wishlistItem: WishlistItem) {
    this.wishlist.update((items) => [...items, wishlistItem]);
    this.showSuccessToast('Добавлено в wishlist');
  }

  // Handle remove from wishlist
  onRemoveFromWishlist(item: Tobacco | WishlistItem, alreadyRemoved: boolean = false) {
    let wishlistItem: WishlistItem | undefined;

    if ('tobaccoId' in item) {
      // It's a WishlistItem
      wishlistItem = item as WishlistItem;
    } else {
      // It's a Tobacco object
      const tobacco = item as Tobacco;
      wishlistItem = this.wishlist().find(wi => wi.tobaccoId === tobacco.id);
      if (!wishlistItem) {
        console.error('Wishlist item not found for tobacco:', tobacco.id);
        return;
      }
    }

    const itemId = wishlistItem.id;

    if (alreadyRemoved) {
      // Item was already removed by WishlistTabComponent, just update local state
      this.wishlist.update((items) => items.filter(i => i.id !== itemId));
    } else {
      // Remove from wishlist via API (called from SearchTabComponent)
      this.wishlistService.removeFromWishlist(itemId).subscribe({
        next: () => {
          this.wishlist.update((items) => items.filter(i => i.id !== itemId));
          this.showSuccessToast('Удалено из wishlist');
        },
        error: (err) => {
          console.error('Failed to remove from wishlist:', err);
          this.showErrorToast('Не удалось удалить из wishlist');
        },
      });
    }
  }

  // Handle item removed animation complete (from search tab)
  onItemRemoved(tobaccoId: string) {
    // Find the wishlist item and remove it via API
    const wishlistItem = this.wishlist().find(wi => wi.tobaccoId === tobaccoId);
    if (!wishlistItem) {
      console.error('Wishlist item not found for tobacco:', tobaccoId);
      // Don't return - still try to remove via API (item might not be in wishlist yet)
      // Try to get item ID from tobaccoId directly
      this.wishlistService.removeFromWishlistByTobaccoId(tobaccoId).subscribe({
        next: () => {
          // Item removed successfully, refresh wishlist
          this.loadWishlist();
          this.showSuccessToast('Удалено из wishlist');
        },
        error: (err) => {
          console.error('Failed to remove from wishlist:', err);
          this.showErrorToast('Не удалось удалить из wishlist');
        },
      });
      return;
    }

    this.wishlistService.removeFromWishlist(wishlistItem.id).subscribe({
      next: () => {
        this.wishlist.update((items) => items.filter(i => i.id !== wishlistItem.id));
        this.showSuccessToast('Удалено из wishlist');
      },
      error: (err) => {
        console.error('Failed to remove from wishlist:', err);
        this.showErrorToast('Не удалось удалить из wishlist');
      },
    });
  }

  // Handle mark as purchased from wishlist tab
  onMarkAsPurchased(item: WishlistItem) {
    this.showSuccessToast('Удалено из wishlist');
  }

  // Toast notifications
  private showSuccessToast(message: string) {
    this.snackBar.open(message, '', {
      duration: 2000,
      panelClass: 'toast-success',
    });
  }

  private showErrorToast(message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: 'toast-error',
    });
  }
}
