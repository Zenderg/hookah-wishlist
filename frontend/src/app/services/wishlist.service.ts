import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getWishlist(telegramId: string): Observable<any[]> {
    // TODO: Implement get wishlist
    return this.http.get<any[]>(`${this.apiUrl}/wishlist`, {
      body: { telegramId },
    });
  }

  addToWishlist(tobaccoId: string, tobaccoName: string): Observable<any> {
    // TODO: Implement add to wishlist
    return this.http.post(`${this.apiUrl}/wishlist`, {
      telegramId: this.getTelegramId(),
      tobaccoId,
      tobaccoName,
    });
  }

  removeFromWishlist(id: string): Observable<void> {
    // TODO: Implement remove from wishlist
    return this.http.delete<void>(`${this.apiUrl}/wishlist/${id}`, {
      body: { telegramId: this.getTelegramId() },
    });
  }

  private getTelegramId(): string {
    // TODO: Get telegram ID from Telegram WebApp
    return '';
  }
}
