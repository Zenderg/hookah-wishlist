import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { HookahDbService, type Tobacco, type PaginatedResponse, type Brand } from './services/hookah-db.service';
import { WishlistService, type WishlistItem } from './services/wishlist.service';
import { AuthService } from './services/auth.service';
import { TabBarComponent } from './components/tab-bar/tab-bar.component';
import { TobaccoCardComponent } from './components/tobacco-card/tobacco-card.component';
import { WishlistCardComponent } from './components/wishlist-card/wishlist-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    TabBarComponent,
    TobaccoCardComponent,
    WishlistCardComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    '[class.app-root]': 'true',
  },
})
export class AppComponent implements OnInit, OnDestroy {
  private hookahDbService = inject(HookahDbService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // Search state
  searchQuery = signal('');
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Tobacco data state
  tobaccos = signal<Tobacco[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  addingToWishlist = signal<Set<string>>(new Set());

  // Pagination state
  currentPage = signal(1);
  totalPages = signal(0);
  hasMore = computed(() => this.currentPage() < this.totalPages());

  // Filter state
  showFilterModal = signal(false);
  selectedStatus = signal<string>('');
  selectedCountry = signal<string>('');

  // Filter options
  availableStatuses = signal<string[]>([]);
  availableCountries = signal<string[]>([]);
  loadingFilters = signal(false);

  // Tab navigation
  activeTab = signal<'search' | 'wishlist'>('search');

  // Wishlist state
  wishlist = signal<WishlistItem[]>([]);
  wishlistLoading = signal(false);
  wishlistError = signal<string | null>(null);
  removingFromWishlist = signal<Set<string>>(new Set());
  itemsWithCheckmark = signal<Set<string>>(new Set());
  wishlistTobaccoIds = computed(() => new Set(this.wishlist().map(item => item.tobaccoId)));

  // Brand cache for displaying brand names
  brandCache = signal<Map<string, string>>(new Map());

  ngOnInit() {
    this.loadFilters();
    this.setupSearchDebounce();
    this.loadTobaccos();
    this.loadWishlist();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadTobaccos();
      });
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  onFilterClick() {
    this.showFilterModal.set(true);
  }

  onFilterModalClose() {
    this.showFilterModal.set(false);
  }

  onApplyFilters() {
    this.currentPage.set(1);
    this.loadTobaccos();
    this.showFilterModal.set(false);
  }

  onResetFilters() {
    this.selectedStatus.set('');
    this.selectedCountry.set('');
    this.currentPage.set(1);
    this.loadTobaccos();
    this.showFilterModal.set(false);
  }

  private loadFilters() {
    this.loadingFilters.set(true);
    this.hookahDbService.getTobaccoStatuses().subscribe({
      next: (statuses) => {
        this.availableStatuses.set(statuses);
      },
      error: (err) => {
        console.error('Failed to load statuses:', err);
        this.loadingFilters.set(false);
      },
    });

    this.hookahDbService.getBrandCountries().subscribe({
      next: (countries) => {
        this.availableCountries.set(countries);
        this.loadingFilters.set(false);
      },
      error: (err) => {
        console.error('Failed to load countries:', err);
        this.loadingFilters.set(false);
      },
    });
  }

  loadTobaccos() {
    this.loading.set(true);
    this.error.set(null);

    const params = {
      page: this.currentPage(),
      limit: 20,
      search: this.searchQuery() || undefined,
      status: this.selectedStatus() || undefined,
      country: this.selectedCountry() || undefined,
    };

    this.hookahDbService.getTobaccos(params).subscribe({
      next: (response: PaginatedResponse<Tobacco>) => {
        if (this.currentPage() === 1) {
          this.tobaccos.set(response.data);
        } else {
          this.tobaccos.update((current) => [...current, ...response.data]);
        }
        this.totalPages.set(response.pages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tobaccos:', err);
        this.error.set('Не удалось загрузить данные. Попробуйте позже.');
        this.loading.set(false);
        this.showErrorToast('Не удалось загрузить данные');
      },
    });
  }

  onLoadMore() {
    if (!this.loading() && this.hasMore()) {
      this.currentPage.update((page) => page + 1);
      this.loadTobaccos();
    }
  }

  onAddToWishlist(tobacco: Tobacco) {
    const addingSet = this.addingToWishlist();
    this.addingToWishlist.set(new Set(addingSet).add(tobacco.id));

    this.wishlistService.addToWishlist(tobacco.id, tobacco.name).subscribe({
      next: (item) => {
        this.addingToWishlist.update((set) => {
          const newSet = new Set(set);
          newSet.delete(tobacco.id);
          return newSet;
        });
        this.wishlist.update((items) => [...items, item]);
        this.showSuccessToast('Добавлено в wishlist');
      },
      error: (err) => {
        console.error('Failed to add to wishlist:', err);
        this.addingToWishlist.update((set) => {
          const newSet = new Set(set);
          newSet.delete(tobacco.id);
          return newSet;
        });
        this.showErrorToast('Не удалось добавить в wishlist');
      },
    });
  }

  onRemoveFromWishlist(tobacco: Tobacco) {
    const wishlistItem = this.wishlist().find(item => item.tobaccoId === tobacco.id);
    if (!wishlistItem) {
      console.error('Wishlist item not found for tobacco:', tobacco.id);
      return;
    }

    const addingSet = this.addingToWishlist();
    this.addingToWishlist.set(new Set(addingSet).add(tobacco.id));

    this.wishlistService.removeFromWishlist(wishlistItem.id).subscribe({
      next: () => {
        this.addingToWishlist.update((set) => {
          const newSet = new Set(set);
          newSet.delete(tobacco.id);
          return newSet;
        });
        this.wishlist.update((items) => items.filter(item => item.id !== wishlistItem.id));
        this.showSuccessToast('Удалено из wishlist');
      },
      error: (err) => {
        console.error('Failed to remove from wishlist:', err);
        this.addingToWishlist.update((set) => {
          const newSet = new Set(set);
          newSet.delete(tobacco.id);
          return newSet;
        });
        this.showErrorToast('Не удалось удалить из wishlist');
      },
    });
  }

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

  trackByTobaccoId(index: number, tobacco: Tobacco): string {
    return tobacco.id;
  }

  // Tab navigation
  onTabChange(tab: 'search' | 'wishlist') {
    this.activeTab.set(tab);
    if (tab === 'wishlist' && this.wishlist().length === 0 && !this.wishlistLoading()) {
      this.loadWishlist();
    }
  }

  // Wishlist methods
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
        // Load brand names for wishlist items
        this.loadBrandNamesForWishlist(items);
      },
      error: (err) => {
        console.error('Failed to load wishlist:', err);
        this.wishlistError.set('Не удалось загрузить wishlist');
        this.wishlistLoading.set(false);
      },
    });
  }

  private loadBrandNamesForWishlist(items: WishlistItem[]) {
    const brandIds = [...new Set(items.map((item) => item.tobaccoId))];
    const currentCache = this.brandCache();

    brandIds.forEach((brandId) => {
      if (!currentCache.has(brandId)) {
        this.hookahDbService.getBrandById(brandId).subscribe({
          next: (brand) => {
            this.brandCache.update((cache) => new Map(cache).set(brandId, brand.name));
          },
          error: (err) => {
            console.error(`Failed to load brand ${brandId}:`, err);
            // Use brand ID as fallback name
            this.brandCache.update((cache) => new Map(cache).set(brandId, brandId));
          },
        });
      }
    });
  }

  getBrandName(brandId: string): string {
    return this.brandCache().get(brandId) || brandId;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  onMarkAsPurchased(item: WishlistItem) {
    const removingSet = this.removingFromWishlist();
    this.removingFromWishlist.set(new Set(removingSet).add(item.id));

    // Show checkmark animation
    this.itemsWithCheckmark.update((set) => new Set(set).add(item.id));

    // Wait for animation, then remove
    setTimeout(() => {
      this.wishlistService.removeFromWishlist(item.id).subscribe({
        next: () => {
          this.wishlist.update((items) => items.filter((i) => i.id !== item.id));
          this.removingFromWishlist.update((set) => {
            const newSet = new Set(set);
            newSet.delete(item.id);
            return newSet;
          });
          this.itemsWithCheckmark.update((set) => {
            const newSet = new Set(set);
            newSet.delete(item.id);
            return newSet;
          });
          this.showSuccessToast('Удалено из wishlist');
        },
        error: (err) => {
          console.error('Failed to remove from wishlist:', err);
          this.removingFromWishlist.update((set) => {
            const newSet = new Set(set);
            newSet.delete(item.id);
            return newSet;
          });
          this.itemsWithCheckmark.update((set) => {
            const newSet = new Set(set);
            newSet.delete(item.id);
            return newSet;
          });
          this.showErrorToast('Не удалось удалить из wishlist');
        },
      });
    }, 1500); // Wait 1.5 seconds for checkmark animation
  }

  trackByWishlistItemId(index: number, item: WishlistItem): string {
    return item.id;
  }
}
