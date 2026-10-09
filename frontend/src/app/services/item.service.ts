import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, HealthStatus } from '../models/api-response.model';
import { Item, ItemRequest } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/items';
  private readonly healthUrl = '/api/health';

  getHealth(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(this.healthUrl);
  }

  getItems(): Observable<ApiResponse<Item[]>> {
    return this.http.get<ApiResponse<Item[]>>(this.baseUrl);
  }

  getActiveItems(): Observable<ApiResponse<Item[]>> {
    return this.http.get<ApiResponse<Item[]>>(`${this.baseUrl}/active`);
  }

  getItemById(id: number): Observable<ApiResponse<Item>> {
    return this.http.get<ApiResponse<Item>>(`${this.baseUrl}/${id}`);
  }

  searchItems(query: string): Observable<ApiResponse<Item[]>> {
    return this.http.get<ApiResponse<Item[]>>(`${this.baseUrl}/search`, {
      params: { q: query }
    });
  }

  createItem(item: ItemRequest): Observable<ApiResponse<Item>> {
    return this.http.post<ApiResponse<Item>>(this.baseUrl, item);
  }

  updateItem(id: number, item: ItemRequest): Observable<ApiResponse<Item>> {
    return this.http.put<ApiResponse<Item>>(`${this.baseUrl}/${id}`, item);
  }

  deleteItem(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
