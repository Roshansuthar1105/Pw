import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../services/item.service';
import { Item, ItemRequest } from '../../models/item.model';
import { I18nService } from '../../services/i18n.service';
import { ItemModalComponent } from '../modals/item-modal/item-modal.component';
import { ConfirmModalComponent } from '../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemModalComponent, ConfirmModalComponent],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss'
})
export class ItemsComponent implements OnInit {
  private readonly itemService = inject(ItemService);
  readonly i18n = inject(I18nService);

  @ViewChild('itemModal') itemModal?: ItemModalComponent;
  @ViewChild('confirmDeleteModal') confirmDeleteModal?: ConfirmModalComponent;

  readonly items = signal<Item[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  // Search & Filter
  readonly searchQuery = signal<string>('');
  readonly filterActiveOnly = signal<boolean>(false);

  // Form State (kept synchronized for tests and helpers)
  readonly itemName = signal<string>('');
  readonly itemDescription = signal<string>('');
  readonly itemActive = signal<boolean>(true);
  readonly editingItemId = signal<number | null>(null);
  readonly nameTouched = signal<boolean>(false);

  // Modal State
  readonly itemPendingDelete = signal<Item | null>(null);

  // KPI Computations
  readonly totalCount = computed(() => this.items().length);
  readonly activeCount = computed(() => this.items().filter((i) => i.active).length);
  readonly inactiveCount = computed(() => this.items().filter((i) => !i.active).length);

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
      error: () => {
        this.errorMessage.set(this.i18n.dict().err_backend_offline);
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
        this.errorMessage.set(this.i18n.dict().err_search_failed);
        this.isLoading.set(false);
      }
    });
  }

  setFilter(activeOnly: boolean): void {
    this.filterActiveOnly.set(activeOnly);
    this.loadItems();
  }

  onFilterToggle(): void {
    this.filterActiveOnly.update((v) => !v);
    this.loadItems();
  }

  openCreateForm(): void {
    this.resetForm();
    this.itemModal?.openCreate();
  }

  startEdit(item: Item): void {
    this.editingItemId.set(item.id);
    this.itemName.set(item.name);
    this.itemDescription.set(item.description);
    this.itemActive.set(item.active);
    this.nameTouched.set(false);
    this.itemModal?.openEdit(item);
  }

  onItemModalSave(event: { id: number | null; payload: ItemRequest }): void {
    this.itemModal?.setSubmitting(true);

    if (event.id !== null) {
      this.itemService.updateItem(event.id, event.payload).subscribe({
        next: () => {
          this.itemModal?.setSubmitting(false);
          this.itemModal?.close();
          this.triggerToast(this.i18n.dict().toast_updated);
          this.resetForm();
          this.loadItems();
        },
        error: () => {
          this.itemModal?.setSubmitting(false);
          this.itemModal?.setError(this.i18n.dict().err_save_failed);
        }
      });
    } else {
      this.itemService.createItem(event.payload).subscribe({
        next: () => {
          this.itemModal?.setSubmitting(false);
          this.itemModal?.close();
          this.triggerToast(this.i18n.dict().toast_created);
          this.resetForm();
          this.loadItems();
        },
        error: () => {
          this.itemModal?.setSubmitting(false);
          this.itemModal?.setError(this.i18n.dict().err_save_failed);
        }
      });
    }
  }

  promptDelete(item: Item): void {
    this.itemPendingDelete.set(item);
    this.confirmDeleteModal?.open();
  }

  cancelDelete(): void {
    this.itemPendingDelete.set(null);
    this.confirmDeleteModal?.close();
  }

  confirmDelete(): void {
    const item = this.itemPendingDelete();
    if (!item) return;

    this.confirmDeleteModal?.isLoading.set(true);
    this.itemService.deleteItem(item.id).subscribe({
      next: () => {
        this.confirmDeleteModal?.isLoading.set(false);
        this.cancelDelete();
        this.triggerToast(this.i18n.dict().toast_deleted);
        this.loadItems();
      },
      error: () => {
        this.confirmDeleteModal?.isLoading.set(false);
        this.cancelDelete();
        this.errorMessage.set('Failed to delete item.');
      }
    });
  }

  resetForm(): void {
    this.editingItemId.set(null);
    this.itemName.set('');
    this.itemDescription.set('');
    this.itemActive.set(true);
    this.nameTouched.set(false);
  }

  private triggerToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}

