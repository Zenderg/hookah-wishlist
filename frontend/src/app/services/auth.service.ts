import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { retrieveRawInitData } from '@tma.js/sdk';

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

  getInitDataRaw(): string {
    const initDataRaw = retrieveRawInitData();
    if (!initDataRaw) {
      return localStorage.getItem('initDataRaw') || '';
    }
    localStorage.setItem('initDataRaw', initDataRaw);
    return initDataRaw;
  }

  getTelegramId(): string {
    const initDataRaw = this.getInitDataRaw();
    if (!initDataRaw) {
      return localStorage.getItem('telegramId') || this.getMockTelegramId();
    }

    const params = new URLSearchParams(initDataRaw);
    const userParam = params.get('user');
    if (!userParam) {
      return localStorage.getItem('telegramId') || this.getMockTelegramId();
    }

    const user = JSON.parse(userParam);
    const telegramId = user.id?.toString();

    if (telegramId) {
      localStorage.setItem('telegramId', telegramId);
      return telegramId;
    }

    return localStorage.getItem('telegramId') || this.getMockTelegramId();
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

  private getUsername(): string | undefined {
    const initDataRaw = this.getInitDataRaw();
    if (!initDataRaw) {
      // Return mock username for local development
      if (!environment.production) {
        return 'mock_user';
      }
      return undefined;
    }

    const params = new URLSearchParams(initDataRaw);
    const userParam = params.get('user');
    if (!userParam) {
      // Return mock username for local development
      if (!environment.production) {
        return 'mock_user';
      }
      return undefined;
    }

    const user = JSON.parse(userParam);
    return user?.username;
  }

  validateUser(telegramId: string, username?: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/validate`, {
      telegramId,
      username,
    });
  }

  authenticateWithInitData(): Observable<User> {
    const initDataRaw = this.getInitDataRaw();
    if (!initDataRaw) {
      throw new Error('Init data not available');
    }

    return this.http.post<User>(`${this.apiUrl}/auth/validate-init-data`, {
      initData: initDataRaw,
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
    localStorage.removeItem('initDataRaw');
  }
}
