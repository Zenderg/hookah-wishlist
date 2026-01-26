import { Component, inject, signal, computed, ChangeDetectionStrategy, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { HookahDbService, Brand, Flavor } from '../../services/hookah-db.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTabsModule,
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'search-page',
  },
})
export class SearchComponent {
  private hookahDbService = inject(HookahDbService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private router = inject(Router);

  searchQuery = model('');
  selectedBrand = model<string | null>(null);
  brands = signal<Brand[]>([]);
  flavors = signal<Flavor[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  addingToWishlist = signal<Set<string>>(new Set());

  filteredBrands = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const brands = this.brands();
    if (!query) return brands;
    return brands.filter((brand) =>
      brand.name.toLowerCase().includes(query),
    );
  });

  selectedBrandName = computed(() => {
    const brandSlug = this.selectedBrand();
    if (!brandSlug) return '';
    const brand = this.brands().find((b) => b.slug === brandSlug);
    return brand?.name || '';
  });

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.loading.set(true);
    this.error.set(null);
    this.hookahDbService.getBrands().subscribe({
      next: (brands) => {
        this.brands.set(brands);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load brands');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    if (!this.searchQuery() && !this.selectedBrand()) {
      this.flavors.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.hookahDbService
      .getFlavors(this.searchQuery() || undefined, this.selectedBrand() || undefined)
      .subscribe({
        next: (flavors) => {
          this.flavors.set(flavors);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to search flavors');
          this.loading.set(false);
        },
      });
  }

  onBrandSelect(brandSlug: string): void {
    this.selectedBrand.set(brandSlug);
    this.onSearch();
  }

  onClearBrand(): void {
    this.selectedBrand.set(null);
    this.onSearch();
  }

  addToWishlist(flavor: Flavor): void {
    const flavorId = flavor.slug;
    const currentAdding = this.addingToWishlist();
    const newAdding = new Set(currentAdding);
    newAdding.add(flavorId);
    this.addingToWishlist.set(newAdding);

    this.wishlistService.addToWishlist(flavor.slug, flavor.name).subscribe({
      next: () => {
        const currentAdding = this.addingToWishlist();
        const newAdding = new Set(currentAdding);
        newAdding.delete(flavorId);
        this.addingToWishlist.set(newAdding);
      },
      error: (err) => {
        const currentAdding = this.addingToWishlist();
        const newAdding = new Set(currentAdding);
        newAdding.delete(flavorId);
        this.addingToWishlist.set(newAdding);
        this.error.set('Failed to add to wishlist');
      },
    });
  }

  isAdding(flavor: Flavor): boolean {
    return this.addingToWishlist().has(flavor.slug);
  }

  goToWishlist(): void {
    this.router.navigate(['/wishlist']);
  }
}
