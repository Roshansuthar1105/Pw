import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { User, AuthResponse } from '../models/rbac.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly TOKEN_KEY = 'pw_auth_token';

  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isSuperAdmin = computed(() => !!this.currentUser()?.isSuperAdmin);
  readonly userType = computed(() => this.currentUser()?.userType ?? null);

  constructor() {
    this.initSession();
  }

  initSession(): void {
    const savedToken = localStorage.getItem(this.TOKEN_KEY);
    if (savedToken) {
      this.http.get<ApiResponse<AuthResponse>>('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      }).pipe(
        tap(res => {
          if (res.data) {
            this.setSession(res.data);
          }
        }),
        catchError(() => {
          this.clearSession();
          return of(null);
        })
      ).subscribe();
    }
  }

  login(username: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>('/api/auth/login', { username, password }).pipe(
      tap(res => {
        if (res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  switchUser(userId: number): Observable<ApiResponse<AuthResponse>> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse<AuthResponse>>(`/api/auth/switch/${userId}`, {}, { headers }).pipe(
      tap(res => {
        if (res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  getUsersList(): Observable<ApiResponse<User[]>> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<User[]>>('/api/auth/users-list', { headers });
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  setSession(authData: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authData.token);
    this.token.set(authData.token);
    this.currentUser.set(authData.user);
  }

  getAuthHeaders(): { [header: string]: string } {
    const t = this.token();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }
}
