import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { initData, type User as TMAUser } from '@tma.js/sdk';

export interface User {
  id: string;
  telegramId: string;
  username: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);

  constructor() {
    // Telegram Mini Apps SDK automatically initializes when imported
  }

  getTelegramId(): string {
    try {
      const user = initData.user();
      const telegramId = user?.id?.toString();

      if (telegramId) {
        localStorage.setItem('telegramId', telegramId);
        return telegramId;
      }

      // Fallback to localStorage or mock user for local development
      return localStorage.getItem('telegramId') || this.getMockTelegramId();
    } catch (error) {
      console.error('Failed to get Telegram ID:', error);
      // Fallback to localStorage or mock user for local development
      return localStorage.getItem('telegramId') || this.getMockTelegramId();
    }
  }

  private getMockTelegramId(): string {
    // Use mock user only in development mode
    if (!environment.production) {
      const mockId = '123456789'; // Mock Telegram ID for local development
      console.warn('Using mock Telegram ID for local development:', mockId);
      return mockId;
    }
    return '';
  }

  validateUser(telegramId: string, username?: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/validate`, {
      telegramId,
      username,
    });
  }

  authenticate(): Observable<User> {
    const telegramId = this.getTelegramId();
    const username = this.getUsername();

    if (!telegramId) {
      throw new Error('Telegram ID not available');
    }

    return this.validateUser(telegramId, username);
  }

  private getUsername(): string | undefined {
    try {
      const user = initData.user();
      return user?.username;
    } catch (error) {
      console.error('Failed to get username:', error);
      // Return mock username for local development
      if (!environment.production) {
        return 'mock_user';
      }
      return undefined;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  setCurrentUser(user: User): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('telegramId');
  }
}
