import {
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
  signal,
  inject,
  HostListener,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalScrollLockService } from '../../../services/modal-scroll-lock.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent implements OnDestroy {
  readonly scrollLock = inject(ModalScrollLockService);
  private unregisterLock?: () => void;
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
    if (!this.unregisterLock) {
      this.unregisterLock = this.scrollLock.register('confirm-modal', () => this.cancel());
    }
    setTimeout(() => {
      if (this.dialog?.nativeElement && !this.dialog.nativeElement.open) {
        this.dialog.nativeElement.showModal?.();
      }
    });
  }

  close(): void {
    this.unregisterLock?.();
    this.unregisterLock = undefined;
    if (this.dialog?.nativeElement?.open) {
      this.dialog.nativeElement.close?.();
    }
    this.isOpen.set(false);
  }

  ngOnDestroy(): void {
    this.unregisterLock?.();
    this.unregisterLock = undefined;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event?: Event): void {
    if (this.isOpen()) {
      event?.preventDefault();
      event?.stopPropagation();
      this.cancel();
    }
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
