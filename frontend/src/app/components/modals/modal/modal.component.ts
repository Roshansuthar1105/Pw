import {
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  input,
  model,
  output,
  OnDestroy,
  Type,
  HostListener
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { I18nService } from '../../../services/i18n.service';
import { ModalScrollLockService } from '../../../services/modal-scroll-lock.service';

export type ModalPresetSize = 'xs' | 's' | 'sm' | 'm' | 'md' | 'l' | 'lg' | 'xl' | 'full';
export type ModalSize = ModalPresetSize | string;

const SIZE_PRESETS: Record<string, string> = {
  xs: '380px',
  s: '460px',
  sm: '460px',
  m: '580px',
  md: '580px',
  l: '760px',
  lg: '760px',
  xl: '960px',
  full: 'calc(100vw - 32px)'
};

let nextModalId = 0;

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {
  readonly i18n = inject(I18nService);

  @ViewChild('dialogElement') dialogElement?: ElementRef<HTMLDialogElement>;

  /** Size variant: 'xs', 's', 'm', 'l', 'xl', 'full' or explicit CSS units like '500px', '60%', '80vw' */
  readonly size = input<ModalSize>('md');

  /** Modal title heading */
  readonly heading = input<string>('');

  /** Optional subtitle below heading */
  readonly subtitle = input<string>('');

  /** Optional component type to dynamically instantiate within the modal */
  readonly component = input<Type<any> | null>(null);

  /** Inputs map for dynamically instantiated component */
  readonly componentInputs = input<Record<string, any>>({});

  /** Whether to render the 'X' button on top right */
  readonly showCloseButton = input<boolean>(true);

  /** Whether clicking the backdrop closes the modal */
  readonly closeOnBackdropClick = input<boolean>(true);

  /** Whether pressing Escape closes the modal */
  readonly closeOnEscape = input<boolean>(true);

  /** Accessibility label for close button */
  readonly closeAriaLabel = input<string>('');

  /** Accessibility label for dialog element when heading is not provided */
  readonly ariaLabel = input<string>('');

  /** Open state model */
  readonly isOpen = model<boolean>(false);

  /** Emitted when modal closes */
  readonly closed = output<void>();

  /** Emitted when modal opens */
  readonly opened = output<void>();

  readonly headingId = `app-modal-heading-${++nextModalId}`;

  readonly resolvedMaxWidth = computed(() => {
    const raw = (this.size() || 'md').toString().trim().toLowerCase();
    if (SIZE_PRESETS[raw]) {
      return SIZE_PRESETS[raw];
    }
    if (/^\d+(\.\d+)?$/.test(raw)) {
      return `${raw}px`;
    }
    return raw;
  });

  readonly normalizedSize = computed(() => {
    const raw = (this.size() || 'md').toString().trim().toLowerCase();
    return SIZE_PRESETS[raw] ? raw : 'custom';
  });

  private isDestroyed = false;
  readonly scrollLock = inject(ModalScrollLockService);
  private unregisterLock?: () => void;

  open(): void {
    this.isOpen.set(true);
    if (!this.unregisterLock) {
      this.unregisterLock = this.scrollLock.register(this.headingId, () => {
        if (this.closeOnEscape()) {
          this.close();
        }
      });
    }

    const show = () => {
      if (this.isDestroyed) return;
      const dlg = this.dialogElement?.nativeElement;
      if (dlg && !dlg.open) {
        dlg.showModal?.();
      }
      this.opened.emit();
    };

    if (this.dialogElement?.nativeElement) {
      show();
    } else {
      setTimeout(show);
    }
  }

  close(): void {
    this.unregisterLock?.();
    this.unregisterLock = undefined;

    const dlg = this.dialogElement?.nativeElement;
    if (dlg?.open) {
      dlg.close?.();
    }
    this.isOpen.set(false);
    if (!this.isDestroyed) {
      this.closed.emit();
    }
  }

  ngOnDestroy(): void {
    this.unregisterLock?.();
    this.unregisterLock = undefined;
    this.isDestroyed = true;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event?: Event): void {
    if (this.isOpen() && this.closeOnEscape()) {
      event?.preventDefault();
      event?.stopPropagation();
      this.close();
    }
  }

  onDialogCancel(event: Event): void {
    event.preventDefault();
    if (this.closeOnEscape()) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.closeOnBackdropClick()) return;
    const dlg = this.dialogElement?.nativeElement;
    if (!dlg) return;

    const rect = dlg.getBoundingClientRect();
    const isClickOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (isClickOutside) {
      this.close();
    }
  }
}
