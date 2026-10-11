import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Item, ItemRequest } from '../../../models/item.model';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-modal.component.html',
  styleUrl: './item-modal.component.scss'
})
export class ItemModalComponent {
  readonly i18n = inject(I18nService);

  @ViewChild('modalDialog') modalDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('nameInput') nameInput?: ElementRef<HTMLInputElement>;

  readonly isOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly editingItemId = signal<number | null>(null);
  readonly itemName = signal<string>('');
  readonly itemDescription = signal<string>('');
  readonly itemActive = signal<boolean>(true);
  readonly nameTouched = signal<boolean>(false);

  readonly save = output<{ id: number | null; payload: ItemRequest }>();
  readonly closed = output<void>();

  openCreate(): void {
    this.resetState();
    this.editingItemId.set(null);
    this.openDialog();
  }

  openEdit(item: Item): void {
    this.resetState();
    this.editingItemId.set(item.id);
    this.itemName.set(item.name);
    this.itemDescription.set(item.description);
    this.itemActive.set(item.active);
    this.openDialog();
  }

  close(): void {
    if (this.modalDialog?.nativeElement?.open) {
      this.modalDialog.nativeElement.close?.();
    }
    this.isOpen.set(false);
    this.closed.emit();
  }

  setSubmitting(submitting: boolean): void {
    this.isSubmitting.set(submitting);
  }

  setError(error: string | null): void {
    this.errorMessage.set(error);
  }

  submit(): void {
    this.nameTouched.set(true);
    const name = this.itemName().trim();
    if (!name) {
      this.errorMessage.set(this.i18n.dict().err_name_required);
      return;
    }

    this.errorMessage.set(null);
    const payload: ItemRequest = {
      name,
      description: this.itemDescription().trim(),
      active: this.itemActive()
    };

    this.save.emit({
      id: this.editingItemId(),
      payload
    });
  }

  onDialogCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  onBackdropClick(event: MouseEvent): void {
    const dialog = this.modalDialog?.nativeElement;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isClickOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (isClickOutside) {
      this.close();
    }
  }

  private openDialog(): void {
    this.isOpen.set(true);
    // Open native dialog modal
    setTimeout(() => {
      if (this.modalDialog?.nativeElement && !this.modalDialog.nativeElement.open) {
        this.modalDialog.nativeElement.showModal?.();
        this.nameInput?.nativeElement?.focus?.();
      }
    });
  }

  private resetState(): void {
    this.itemName.set('');
    this.itemDescription.set('');
    this.itemActive.set(true);
    this.nameTouched.set(false);
    this.errorMessage.set(null);
    this.isSubmitting.set(false);
  }
}
