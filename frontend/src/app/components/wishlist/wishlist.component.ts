import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';

export interface WishlistItem {
  id: string;
  tobaccoId: string;
  tobaccoName: string;
  createdAt: string;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatListModule,
  ],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'wishlist-page',
  },
})
export class WishlistComponent {
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private router = inject(Router);

  wishlist = signal<WishlistItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  removing = signal<Set<string>>(new Set());

  formattedDate = (item: WishlistItem): string => {
    return new Date(item.createdAt).toLocaleDateString();
  };

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.loading.set(true);
    this.error.set(null);
    const telegramId = this.authService.getTelegramId();

    if (!telegramId) {
      this.error.set('Telegram ID not found. Please open this app from Telegram.');
      this.loading.set(false);
      return;
    }

    this.wishlistService.getWishlist(telegramId).subscribe({
      next: (items) => {
        this.wishlist.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load wishlist');
        this.loading.set(false);
      },
    });
  }

  removeFromWishlist(item: WishlistItem): void {
    const itemId = item.id;
    const currentRemoving = this.removing();
    const newRemoving = new Set(currentRemoving);
    newRemoving.add(itemId);
    this.removing.set(newRemoving);

    this.wishlistService.removeFromWishlist(itemId).subscribe({
      next: () => {
        const currentRemoving = this.removing();
        const newRemoving = new Set(currentRemoving);
        newRemoving.delete(itemId);
        this.removing.set(newRemoving);

        this.wishlist.update((items) =>
          items.filter((i) => i.id !== itemId),
        );
      },
      error: (err) => {
        const currentRemoving = this.removing();
        const newRemoving = new Set(currentRemoving);
        newRemoving.delete(itemId);
        this.removing.set(newRemoving);
        this.error.set('Failed to remove from wishlist');
      },
    });
  }

  isRemoving(item: WishlistItem): boolean {
    return this.removing().has(item.id);
  }

  goToSearch(): void {
    this.router.navigate(['/search']);
  }
}
