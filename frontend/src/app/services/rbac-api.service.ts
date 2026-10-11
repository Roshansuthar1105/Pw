import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models/api-response.model';
import {
  ComponentItem,
  Role,
  Group,
  User,
  ResolvedPermissions,
  AuditLog
} from '../models/rbac.model';

@Injectable({
  providedIn: 'root'
})
export class RbacApiService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private headers() {
    return { headers: this.authService.getAuthHeaders() };
  }

  // ─── Components ──────────────────────────────────────────────────────────
  getComponents(): Observable<ApiResponse<ComponentItem[]>> {
    return this.http.get<ApiResponse<ComponentItem[]>>('/api/components', this.headers());
  }

  createComponent(data: Partial<ComponentItem>): Observable<ApiResponse<ComponentItem>> {
    return this.http.post<ApiResponse<ComponentItem>>('/api/components', data, this.headers());
  }

  updateComponent(id: number, data: Partial<ComponentItem>): Observable<ApiResponse<ComponentItem>> {
    return this.http.put<ApiResponse<ComponentItem>>(`/api/components/${id}`, data, this.headers());
  }

  deleteComponent(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/components/${id}`, this.headers());
  }

  initDefaultComponents(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/api/components/init-defaults', {}, this.headers());
  }

  // ─── Roles ───────────────────────────────────────────────────────────────
  getRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>('/api/roles', this.headers());
  }

  getRole(id: number): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`/api/roles/${id}`, this.headers());
  }

  createRole(data: { name: string; code: string; description?: string; componentIds: number[] }): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>('/api/roles', data, this.headers());
  }

  updateRole(id: number, data: { name: string; description?: string; componentIds: number[] }): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`/api/roles/${id}`, data, this.headers());
  }

  deleteRole(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/roles/${id}`, this.headers());
  }

  // ─── Groups ──────────────────────────────────────────────────────────────
  getGroups(): Observable<ApiResponse<Group[]>> {
    return this.http.get<ApiResponse<Group[]>>('/api/groups', this.headers());
  }

  getGroup(id: number): Observable<ApiResponse<Group>> {
    return this.http.get<ApiResponse<Group>>(`/api/groups/${id}`, this.headers());
  }

  getUsersInGroup(groupId: number): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`/api/groups/${groupId}/users`, this.headers());
  }

  createGroup(data: { name: string; code: string; description?: string; roleIds: number[] }): Observable<ApiResponse<Group>> {
    return this.http.post<ApiResponse<Group>>('/api/groups', data, this.headers());
  }

  updateGroup(id: number, data: { name: string; description?: string; roleIds: number[] }): Observable<ApiResponse<Group>> {
    return this.http.put<ApiResponse<Group>>(`/api/groups/${id}`, data, this.headers());
  }

  deleteGroup(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/groups/${id}`, this.headers());
  }

  // ─── Users ───────────────────────────────────────────────────────────────
  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>('/api/users', this.headers());
  }

  getUser(id: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`/api/users/${id}`, this.headers());
  }

  getUserPermissions(id: number): Observable<ApiResponse<ResolvedPermissions>> {
    return this.http.get<ApiResponse<ResolvedPermissions>>(`/api/users/${id}/permissions`, this.headers());
  }

  createUser(data: {
    username: string;
    email: string;
    password: string;
    userType: string;
    isSuperAdmin?: boolean;
    additionalGroupIds?: number[];
  }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>('/api/users', data, this.headers());
  }

  updateUser(id: number, data: {
    email: string;
    password?: string;
    userType: string;
    isSuperAdmin?: boolean;
    active?: boolean;
    groupIds?: number[];
  }): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`/api/users/${id}`, data, this.headers());
  }

  deleteUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/users/${id}`, this.headers());
  }

  // ─── Audit Logs ──────────────────────────────────────────────────────────
  getAuditLogs(limit: number = 50): Observable<ApiResponse<AuditLog[]>> {
    return this.http.get<ApiResponse<AuditLog[]>>(`/api/audit-logs?limit=${limit}`, this.headers());
  }
}
