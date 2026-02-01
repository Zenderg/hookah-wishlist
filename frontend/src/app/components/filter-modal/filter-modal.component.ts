import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-filter-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './filter-modal.component.html',
  styleUrls: ['./filter-modal.component.scss'],
})
export class FilterModalComponent {
  // Inputs
  open = input.required<boolean>();
  selectedStatus = input.required<string>();
  selectedCountry = input.required<string>();
  availableStatuses = input.required<string[]>();
  availableCountries = input.required<string[]>();
  hasActiveFilters = input.required<boolean>();

  // Outputs
  close = output<void>();
  statusChange = output<string>();
  countryChange = output<string>();
  resetFilters = output<void>();

  onClose() {
    this.close.emit();
  }

  onStatusChange(status: string) {
    this.statusChange.emit(status);
  }

  onCountryChange(country: string) {
    this.countryChange.emit(country);
  }

  onResetFilters() {
    this.resetFilters.emit();
  }
}
