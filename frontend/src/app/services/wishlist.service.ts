import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { retrieveRawInitData } from '@tma.js/sdk';

export interface WishlistItem {
  id: string;
  tobaccoId: string;
  createdAt: string;
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

  addToWishlist(tobaccoId: string): Observable<WishlistItem> {
    return this.http.post<WishlistItem>(`${this.apiUrl}/wishlist`, {
      tobaccoId,
    });
  }

  removeFromWishlist(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/wishlist/${id}`);
  }
}
