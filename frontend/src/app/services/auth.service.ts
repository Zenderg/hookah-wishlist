import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  validateUser(telegramId: string, username?: string): Observable<any> {
    // TODO: Implement user validation
    return this.http.post(`${this.apiUrl}/auth/validate`, {
      telegramId,
      username,
    });
  }
}
