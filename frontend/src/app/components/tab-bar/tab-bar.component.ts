import { Component, input, output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
})
export class TabBarComponent {
  activeTab = input<'search' | 'wishlist'>('search');
  tabChange = new EventEmitter<'search' | 'wishlist'>();

  onTabClick(tab: 'search' | 'wishlist') {
    this.tabChange.emit(tab);
  }
}
