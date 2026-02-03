import { Component, input, output, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Tobacco } from '../../services/hookah-db.service';
import type { WishlistItem } from '../../services/wishlist.service';

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
  wishlistItem = input<WishlistItem | null>(null);
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

  onButtonClick() {
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

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'https://via.placeholder.com/80';
    }
  }
}
