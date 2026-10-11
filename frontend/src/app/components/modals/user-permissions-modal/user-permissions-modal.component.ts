import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
  HostListener,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RbacApiService } from '../../../services/rbac-api.service';
import { ModalScrollLockService } from '../../../services/modal-scroll-lock.service';
import { User, ResolvedPermissions } from '../../../models/rbac.model';

@Component({
  selector: 'app-user-permissions-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-permissions-modal.component.html',
  styleUrl: './user-permissions-modal.component.scss'
})
export class UserPermissionsModalComponent implements OnDestroy {
  @ViewChild('modalDialog') dialog?: ElementRef<HTMLDialogElement>;

  private rbacApi = inject(RbacApiService);
  readonly scrollLock = inject(ModalScrollLockService);
  private unregisterLock?: () => void;

  readonly isOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly user = signal<User | null>(null);
  readonly permissions = signal<ResolvedPermissions | null>(null);

  open(user: User): void {
    this.user.set(user);
    this.permissions.set(null);
    this.isLoading.set(true);

    this.isOpen.set(true);
    if (!this.unregisterLock) {
      this.unregisterLock = this.scrollLock.register('user-permissions-modal', () => this.close());
    }
    setTimeout(() => {
      if (this.dialog?.nativeElement && !this.dialog.nativeElement.open) {
        this.dialog.nativeElement.showModal?.();
      }
    });

    this.rbacApi.getUserPermissions(user.id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.permissions.set(res.data);
        }
      },
      error: () => this.isLoading.set(false)
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
      this.close();
    }
  }

  onDialogCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  onBackdropClick(event: MouseEvent): void {
    const el = this.dialog?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      this.close();
    }
  }
}
