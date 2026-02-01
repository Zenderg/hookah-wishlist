import { Component, input, output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { WishlistItem } from '../../services/wishlist.service';

@Component({
  selector: 'app-wishlist-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './wishlist-card.component.html',
  styleUrls: ['./wishlist-card.component.scss'],
})
export class WishlistCardComponent {
  item = input.required<WishlistItem>();
  brandName = input.required<string>();
  formattedDate = input.required<string>();
  removing = input<boolean>(false);
  withCheckmark = input<boolean>(false);
  markAsPurchased = new EventEmitter<WishlistItem>();
}
