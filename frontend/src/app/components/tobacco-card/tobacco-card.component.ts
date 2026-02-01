import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Tobacco } from '../../services/hookah-db.service';

@Component({
  selector: 'app-tobacco-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './tobacco-card.component.html',
  styleUrls: ['./tobacco-card.component.scss'],
})
export class TobaccoCardComponent {
  tobacco = input.required<Tobacco>();
  adding = input<boolean>(false);
  addToWishlist = output<Tobacco>();
}
