import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../services/item.service';
import { Item, ItemRequest } from '../../models/item.model';

@Component({
  selector: 'app-items',
  imports: [CommonModule, FormsModule],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss'
})
export class ItemsComponent implements OnInit {
  private readonly itemService = inject(ItemService);

  readonly items = signal<Item[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Search & Filter
  readonly searchQuery = signal<string>('');
  readonly filterActiveOnly = signal<boolean>(false);

  // Form State
  readonly itemName = signal<string>('');
  readonly itemDescription = signal<string>('');
  readonly itemActive = signal<boolean>(true);
  readonly editingItemId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const request$ = this.filterActiveOnly()
      ? this.itemService.getActiveItems()
      : this.itemService.getItems();

    request$.subscribe({
      next: (response) => {
        this.items.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load items. Is the backend running?');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (!query) {
      this.loadItems();
      return;
    }

    this.isLoading.set(true);
    this.itemService.searchItems(query).subscribe({
      next: (response) => {
        this.items.set(response.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Search request failed');
        this.isLoading.set(false);
      }
    });
  }

  onFilterToggle(): void {
    this.filterActiveOnly.update((v) => !v);
    this.loadItems();
  }

  saveItem(): void {
    const name = this.itemName().trim();
    if (!name) {
      this.errorMessage.set('Item name is required');
      return;
    }

    const payload: ItemRequest = {
      name,
      description: this.itemDescription().trim(),
      active: this.itemActive()
    };

    const editId = this.editingItemId();
    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (editId !== null) {
      this.itemService.updateItem(editId, payload).subscribe({
        next: () => {
          this.successMessage.set('Item updated successfully');
          this.resetForm();
          this.loadItems();
        },
        error: () => {
          this.errorMessage.set('Failed to update item');
          this.isLoading.set(false);
        }
      });
    } else {
      this.itemService.createItem(payload).subscribe({
        next: () => {
          this.successMessage.set('Item created successfully');
          this.resetForm();
          this.loadItems();
        },
        error: () => {
          this.errorMessage.set('Failed to create item');
          this.isLoading.set(false);
        }
      });
    }
  }

  startEdit(item: Item): void {
    this.editingItemId.set(item.id);
    this.itemName.set(item.name);
    this.itemDescription.set(item.description);
    this.itemActive.set(item.active);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  deleteItem(id: number): void {
    if (!confirm('Are you sure you want to delete this item?')) return;

    this.isLoading.set(true);
    this.itemService.deleteItem(id).subscribe({
      next: () => {
        this.successMessage.set('Item deleted successfully');
        this.loadItems();
      },
      error: () => {
        this.errorMessage.set('Failed to delete item');
        this.isLoading.set(false);
      }
    });
  }

  resetForm(): void {
    this.editingItemId.set(null);
    this.itemName.set('');
    this.itemDescription.set('');
    this.itemActive.set(true);
  }
}
