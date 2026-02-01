import { Component, inject, signal, computed, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { HookahDbService, type Tobacco, type PaginatedResponse } from '../../services/hookah-db.service';
import { WishlistService, type WishlistItem } from '../../services/wishlist.service';
import { BrandCacheService } from '../../services/brand-cache.service';
import { TobaccoCardComponent } from '../tobacco-card/tobacco-card.component';

@Component({
  selector: 'app-search-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    TobaccoCardComponent,
  ],
  templateUrl: './search-tab.component.html',
  styleUrls: ['./search-tab.component.scss'],
})
export class SearchTabComponent implements OnInit {
  private hookahDbService = inject(HookahDbService);
  private wishlistService = inject(WishlistService);
  private brandCacheService = inject(BrandCacheService);

  // Inputs
  wishlistTobaccoIds = input.required<Set<string>>();

  // Outputs
  addToWishlist = output<Tobacco>();
  removeFromWishlist = output<Tobacco | WishlistItem>();

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

  // Computed: Check if any filters are active
  hasActiveFilters = computed(() => {
    return this.selectedStatus() !== '' || this.selectedCountry() !== '';
  });

  ngOnInit() {
    this.loadFilters();
    this.setupSearchDebounce();
    this.loadTobaccos();
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

  onStatusChange(status: string) {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadTobaccos();
  }

  onCountryChange(country: string) {
    this.selectedCountry.set(country);
    this.currentPage.set(1);
    this.loadTobaccos();
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
        // Load brand names for tobaccos
        this.loadBrandNamesForTobaccos(response.data);
      },
      error: (err) => {
        console.error('Failed to load tobaccos:', err);
        this.error.set('Не удалось загрузить данные. Попробуйте позже.');
        this.loading.set(false);
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

    this.wishlistService.addToWishlist(tobacco.id).subscribe({
      next: () => {
        this.addingToWishlist.update((set) => {
          const newSet = new Set(set);
          newSet.delete(tobacco.id);
          return newSet;
        });
        this.addToWishlist.emit(tobacco);
      },
      error: (err) => {
        console.error('Failed to add to wishlist:', err);
        this.addingToWishlist.update((set) => {
          const newSet = new Set(set);
          newSet.delete(tobacco.id);
          return newSet;
        });
      },
    });
  }

  onRemoveFromWishlist(item: Tobacco | WishlistItem) {
    this.removeFromWishlist.emit(item);
  }

  private loadBrandNamesForTobaccos(tobaccos: Tobacco[]) {
    const brandIds = [...new Set(tobaccos.map((tobacco) => tobacco.brandId).filter(Boolean))];
    this.brandCacheService.loadBrandNames(brandIds);
  }

  getBrandName(brandId: string): string {
    return this.brandCacheService.getBrandName(brandId);
  }

  trackByTobaccoId(index: number, tobacco: Tobacco): string {
    return tobacco.id;
  }
}
