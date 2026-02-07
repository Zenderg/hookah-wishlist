import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
})
export class TabBarComponent {
  activeTab = input<'search' | 'wishlist'>('search');
  tabChange = output<'search' | 'wishlist'>();

  onTabClick(tab: 'search' | 'wishlist') {
    this.tabChange.emit(tab);
  }
}
