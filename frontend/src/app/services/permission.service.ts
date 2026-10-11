import { Injectable, signal, inject, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { MenuTree, ResolvedPermissions, AuthResponse } from '../models/rbac.model';
import { ApiResponse } from '../models/api-response.model';
import { tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  readonly resolvedTree = signal<MenuTree[]>([]);
  readonly permissionCodes = signal<Set<string>>(new Set());
  readonly isLoading = signal<boolean>(false);

  constructor() {
    // Whenever currentUser changes in AuthService, refresh permissions
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        untracked(() => {
          this.fetchPermissions();
        });
      } else {
        this.resolvedTree.set([]);
        this.permissionCodes.set(new Set());
      }
    }, { allowSignalWrites: true });
  }

  fetchPermissions(): void {
    const headers = this.authService.getAuthHeaders();
    if (!headers['Authorization']) return;

    this.isLoading.set(true);
    this.http.get<ApiResponse<AuthResponse>>('/api/auth/me', { headers }).pipe(
      tap(res => {
        this.isLoading.set(false);
        if (res.data?.permissions) {
          this.setPermissions(res.data.permissions);
        }
      }),
      catchError(err => {
        this.isLoading.set(false);
        console.warn('Failed to load permissions:', err);
        return of(null);
      })
    ).subscribe();
  }

  setPermissions(permissions: ResolvedPermissions): void {
    const codes = new Set<string>(permissions.flatCodes || []);
    this.permissionCodes.set(codes);
    this.resolvedTree.set(permissions.tree || []);
  }

  hasPermission(code: string): boolean {
    if (this.authService.isSuperAdmin()) {
      return true;
    }
    return this.permissionCodes().has(code);
  }

  canAccessRoute(route: string): boolean {
    if (this.authService.isSuperAdmin()) {
      return true;
    }
    const cleanRoute = route.split('?')[0].split('#')[0];
    if (cleanRoute === '/' || cleanRoute === '') {
      return true; // Allow dashboard overview
    }

    // Search inside resolvedTree
    for (const menu of this.resolvedTree()) {
      for (const submenu of menu.submenus) {
        if (submenu.route === cleanRoute) {
          return this.permissionCodes().has(submenu.code);
        }
      }
    }

    return false;
  }

  bootstrapDefaultComponents(): void {
    const headers = this.authService.getAuthHeaders();
    this.http.post<ApiResponse<void>>('/api/components/init-defaults', {}, { headers }).pipe(
      tap(() => this.fetchPermissions())
    ).subscribe();
  }
}
