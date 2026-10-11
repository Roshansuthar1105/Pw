import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
  output,
  HostListener,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { PermissionService } from '../../../services/permission.service';
import { I18nService } from '../../../services/i18n.service';
import { ModalScrollLockService } from '../../../services/modal-scroll-lock.service';
import { User } from '../../../models/rbac.model';

@Component({
  selector: 'app-user-switcher-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-switcher-modal.component.html',
  styleUrl: './user-switcher-modal.component.scss'
})
export class UserSwitcherModalComponent implements OnDestroy {
  @ViewChild('switcherDialog') dialog?: ElementRef<HTMLDialogElement>;

  readonly auth = inject(AuthService);
  readonly permissions = inject(PermissionService);
  readonly i18n = inject(I18nService);
  readonly scrollLock = inject(ModalScrollLockService);
  private unregisterLock?: () => void;

  readonly isOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly users = signal<User[]>([]);
  readonly switched = output<User>();

  open(): void {
    this.isOpen.set(true);
    if (!this.unregisterLock) {
      this.unregisterLock = this.scrollLock.register('user-switcher-modal', () => this.close());
    }
    this.loadUsers();
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
      this.close();
    }
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.auth.getUsersList().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.users.set(res.data);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  switchUser(user: User): void {
    if (this.auth.currentUser()?.id === user.id) {
      this.close();
      return;
    }

    this.isLoading.set(true);
    this.auth.switchUser(user.id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.close();
        this.switched.emit(user);
      },
      error: () => this.isLoading.set(false)
    });
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
