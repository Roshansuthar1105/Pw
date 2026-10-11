import {
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
  @ViewChild('dialog') dialog?: ElementRef<HTMLDialogElement>;

  readonly title = input<string>('Confirm Action');
  readonly message = input<string>('Are you sure you want to proceed?');
  readonly confirmText = input<string>('Confirm');
  readonly cancelText = input<string>('Cancel');
  readonly isDanger = input<boolean>(true);

  readonly isLoading = signal<boolean>(false);
  readonly isOpen = signal<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  open(): void {
    this.isOpen.set(true);
    setTimeout(() => {
      if (this.dialog?.nativeElement && !this.dialog.nativeElement.open) {
        this.dialog.nativeElement.showModal?.();
      }
    });
  }

  close(): void {
    if (this.dialog?.nativeElement?.open) {
      this.dialog.nativeElement.close?.();
    }
    this.isOpen.set(false);
  }

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.close();
    this.cancelled.emit();
  }

  onDialogCancel(event: Event): void {
    event.preventDefault();
    this.cancel();
  }

  onBackdropClick(event: MouseEvent): void {
    const el = this.dialog?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const isClickOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (isClickOutside) {
      this.cancel();
    }
  }
}
