import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

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
  private authService = inject(AuthService);

  getWishlist(telegramId: string): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(`${this.apiUrl}/wishlist`, {
      params: { telegramId },
    });
  }

  addToWishlist(tobaccoId: string): Observable<WishlistItem> {
    const telegramId = this.authService.getTelegramId();

    return this.http.post<WishlistItem>(`${this.apiUrl}/wishlist`, {
      telegramId,
      tobaccoId,
    });
  }

  removeFromWishlist(id: string): Observable<void> {
    const telegramId = this.authService.getTelegramId();

    return this.http.delete<void>(`${this.apiUrl}/wishlist/${id}`, {
      params: { telegramId },
    });
  }

  removeFromWishlistByTobaccoId(tobaccoId: string): Observable<void> {
    const telegramId = this.authService.getTelegramId();

    return this.http.delete<void>(`${this.apiUrl}/wishlist/tobacco/${tobaccoId}`, {
      params: { telegramId },
    });
  }
}
