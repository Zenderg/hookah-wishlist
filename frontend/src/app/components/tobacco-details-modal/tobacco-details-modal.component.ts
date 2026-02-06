import { Component, inject, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type TobaccoWithDetails } from '../../services/hookah-db.service';
import { WishlistService } from '../../services/wishlist.service';

export interface TobaccoDetailsModalData {
  tobacco: TobaccoWithDetails;
  inWishlist: boolean;
  wishlistItemId?: number; // Only needed when inWishlist is true
}

@Component({
  selector: 'app-tobacco-details-modal',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule],
  templateUrl: './tobacco-details-modal.component.html',
  styleUrls: ['./tobacco-details-modal.component.scss'],
})
export class TobaccoDetailsModalComponent {
  private dialogRef = inject(MatDialogRef<TobaccoDetailsModalComponent>);
  private data = inject<TobaccoDetailsModalData>(MAT_DIALOG_DATA);
  private wishlistService = inject(WishlistService);
  private snackBar = inject(MatSnackBar);

  // Input data (passed via MatDialogConfig.data)
  tobacco = computed(() => this.data.tobacco);
  inWishlist = computed(() => this.data.inWishlist);
  wishlistItemId = computed(() => this.data.wishlistItemId);

  // State
  loading = false;

  // Computed values
  displayRatingFormatted = computed(() => {
    const rating = this.tobacco().rating;
    // Remove last character (e.g., "5.00" -> "5.0")
    return rating.slice(0, -1);
  });

  displayBrandWithCountry = computed(() => {
    const brand = this.tobacco().brand;
    if (!brand) return '';
    return `${brand.name} (${brand.country})`;
  });

  buttonText = computed(() => (this.inWishlist() ? 'Удалить' : 'Добавить'));

  onAddRemoveClick() {
    const tobacco = this.tobacco();

    if (this.inWishlist()) {
      // Remove from wishlist - use wishlistItemId instead of tobacco.id
      const itemId = this.wishlistItemId();
      if (!itemId) {
        console.error('Cannot remove from wishlist: wishlistItemId is not provided');
        this.snackBar.open('Ошибка: не удалось удалить из wishlist', '', { duration: 2000 });
        return;
      }

      this.loading = true;
      this.wishlistService.removeFromWishlist(itemId).subscribe({
        next: () => {
          this.loading = false;
          // this.snackBar.open('Удалено из wishlist', '', { duration: 2000 });
          this.dialogRef.close({ action: 'removed', tobaccoId: tobacco.id });
        },
        error: (err) => {
          console.error('Failed to remove from wishlist:', err);
          this.loading = false;
          this.snackBar.open('Не удалось удалить из wishlist', '', { duration: 2000 });
        },
      });
    } else {
      // Add to wishlist
      this.loading = true;
      this.wishlistService.addToWishlist(tobacco.id).subscribe({
        next: (wishlistItem) => {
          this.loading = false;
          // this.snackBar.open('Добавлено в wishlist', '', { duration: 2000 });
          // Return the wishlist item ID (not the tobacco ID)
          this.dialogRef.close({ action: 'added', tobaccoId: tobacco.id, wishlistItemId: wishlistItem.id });
        },
        error: (err) => {
          console.error('Failed to add to wishlist:', err);
          this.loading = false;
          this.snackBar.open('Не удалось добавить в wishlist', '', { duration: 2000 });
        },
      });
    }
  }

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'https://via.placeholder.com/500';
    }
  }
}
