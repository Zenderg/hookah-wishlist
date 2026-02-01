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
    this.wishlistService.getWishlist().subscribe({
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
      // Search tab has already made the API call, just update local state
      // and show success toast
      this.wishlist.update((items) => items.filter(i => i.id !== itemId));
    }
  }

  // Handle mark as purchased from wishlist tab
  onMarkAsPurchased(item: WishlistItem) {
    // No need this yet
    // this.showSuccessToast('Удалено из wishlist');
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
