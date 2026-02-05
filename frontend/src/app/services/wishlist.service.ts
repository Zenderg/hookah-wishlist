import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { retrieveRawInitData } from '@tma.js/sdk';
import { TobaccoWithDetails } from './hookah-db.service';

export interface WishlistItem {
  id: number;
  tobaccoId: string;
  createdAt: string;
}

// Wishlist item with full tobacco details
export interface WishlistItemWithDetails extends WishlistItem {
  tobacco: TobaccoWithDetails;
}

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getInitDataRaw(): string {
    const initDataRaw = retrieveRawInitData();
    if (!initDataRaw) {
      return localStorage.getItem('initDataRaw') || '';
    }
    localStorage.setItem('initDataRaw', initDataRaw);
    return initDataRaw;
  }

  getWishlist(): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(`${this.apiUrl}/wishlist`);
  }

  // Get wishlist with full tobacco details
  getWishlistWithDetails(): Observable<WishlistItemWithDetails[]> {
    return this.http.get<WishlistItemWithDetails[]>(`${this.apiUrl}/wishlist/with-details`);
  }

  addToWishlist(tobaccoId: string): Observable<WishlistItem> {
    return this.http.post<WishlistItem>(`${this.apiUrl}/wishlist`, {
      tobaccoId,
    });
  }

  removeFromWishlist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/wishlist/${id}`);
  }
}
