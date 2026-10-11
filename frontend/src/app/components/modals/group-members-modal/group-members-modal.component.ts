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
import { Group, User } from '../../../models/rbac.model';

@Component({
  selector: 'app-group-members-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-members-modal.component.html',
  styleUrl: './group-members-modal.component.scss'
})
export class GroupMembersModalComponent implements OnDestroy {
  @ViewChild('modalDialog') dialog?: ElementRef<HTMLDialogElement>;

  private rbacApi = inject(RbacApiService);
  readonly scrollLock = inject(ModalScrollLockService);
  private unregisterLock?: () => void;

  readonly isOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly group = signal<Group | null>(null);
  readonly members = signal<User[]>([]);

  open(group: Group): void {
    this.group.set(group);
    this.members.set([]);
    this.isLoading.set(true);

    this.isOpen.set(true);
    if (!this.unregisterLock) {
      this.unregisterLock = this.scrollLock.register('group-members-modal', () => this.close());
    }
    setTimeout(() => {
      if (this.dialog?.nativeElement && !this.dialog.nativeElement.open) {
        this.dialog.nativeElement.showModal?.();
      }
    });

    this.rbacApi.getUsersInGroup(group.id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.members.set(res.data);
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
