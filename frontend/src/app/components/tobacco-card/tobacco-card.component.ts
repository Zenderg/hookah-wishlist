import { Component, input, output, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Tobacco, TobaccoWithDetails } from '../../services/hookah-db.service';
import type { WishlistItem, WishlistItemWithDetails } from '../../services/wishlist.service';

@Component({
  selector: 'app-tobacco-card',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './tobacco-card.component.html',
  styleUrls: ['./tobacco-card.component.scss'],
})
export class TobaccoCardComponent {
  // Data inputs (all optional for flexibility)
  tobacco = input<Tobacco | null>(null);
  wishlistItem = input<WishlistItemWithDetails | null>(null);
  tobaccoName = input<string | null>(null);
  brandName = input<string | null>(null);
  lineName = input<string | null>(null);
  imageUrl = input<string | null>(null);
  rating = input<string | null>(null);
  ratingsCount = input<number | null>(null);
  formattedDate = input<string | null>(null);

  // State inputs
  inWishlist = input<boolean>(false);
  adding = input<boolean>(false);
  removing = input<boolean>(false);
  withCheckmark = input<boolean>(false);

  // Outputs
  cardClick = output<TobaccoWithDetails>();
  addToWishlist = output<Tobacco>();
  removeFromWishlist = output<Tobacco | WishlistItem>();

  // Computed values for display
  displayTobaccoName = computed(() => this.tobaccoName() || this.tobacco()?.name || '');
  displayBrandName = computed(() => this.brandName() || '');
  displayLineName = computed(() => this.lineName() || '');
  displayImageUrl = computed(() => this.imageUrl() || this.tobacco()?.imageUrl || 'https://via.placeholder.com/80');
  displayRating = computed(() => this.rating() ?? this.tobacco()?.rating ?? null);
  displayRatingFormatted = computed(() => {
    const rating = this.displayRating();
    if (rating === null) return '';
    // Remove last character (e.g., "5.00" -> "5.0")
    return rating.slice(0, -1);
  });
  displayRatingsCount = computed(() => this.ratingsCount() ?? this.tobacco()?.ratingsCount ?? null);
  displayDate = computed(() => this.formattedDate() ?? null);

  // Show rating if available, otherwise show date
  showRating = computed(() => this.displayRating() !== null && this.displayRatingsCount() !== null);
  showDate = computed(() => this.displayDate() !== null && !this.showRating());

  isLoading = computed(() => this.adding() || this.removing());

  onButtonClick(event: Event) {
    // Stop propagation to prevent card click event
    event.stopPropagation();

    if (this.inWishlist()) {
      const item = this.wishlistItem() || this.tobacco();
      if (item) {
        this.removeFromWishlist.emit(item);
      }
    } else {
      const tobacco = this.tobacco();
      if (tobacco) {
        this.addToWishlist.emit(tobacco);
      }
    }
  }

  onCardClick() {
    const tobacco = this.tobacco() as TobaccoWithDetails | null;
    const wishlistItem = this.wishlistItem();

    if (tobacco) {
      this.cardClick.emit(tobacco);
    } else if (wishlistItem?.tobacco) {
      this.cardClick.emit(wishlistItem.tobacco);
    }
  }

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'https://via.placeholder.com/80';
    }
  }
}
