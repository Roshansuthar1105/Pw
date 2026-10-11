import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RbacApiService } from '../../../services/rbac-api.service';
import { I18nService } from '../../../services/i18n.service';
import { Group, Role } from '../../../models/rbac.model';

@Component({
  selector: 'app-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-modal.component.html',
  styleUrl: './group-modal.component.scss'
})
export class GroupModalComponent {
  @ViewChild('modalDialog') dialog?: ElementRef<HTMLDialogElement>;

  private rbacApi = inject(RbacApiService);
  readonly i18n = inject(I18nService);

  readonly isOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly editingId = signal<number | null>(null);
  readonly isProtected = signal<boolean>(false);
  readonly allRoles = signal<Role[]>([]);
  readonly selectedRoleIds = signal<Set<number>>(new Set());

  readonly name = signal<string>('');
  readonly code = signal<string>('');
  readonly description = signal<string>('');

  readonly saved = output<void>();

  open(group?: Group, availableRoles: Role[] = []): void {
    this.allRoles.set(availableRoles);
    this.errorMessage.set(null);
    this.isSubmitting.set(false);

    if (group) {
      this.editingId.set(group.id);
      this.isProtected.set(group.isSystem || group.isDefault);
      this.name.set(group.name);
      this.code.set(group.code);
      this.description.set(group.description || '');
      this.selectedRoleIds.set(new Set(group.roleIds || []));
    } else {
      this.editingId.set(null);
      this.isProtected.set(false);
      this.name.set('');
      this.code.set('');
      this.description.set('');
      this.selectedRoleIds.set(new Set());
    }

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

  toggleRole(roleId: number): void {
    const next = new Set(this.selectedRoleIds());
    if (next.has(roleId)) {
      next.delete(roleId);
    } else {
      next.add(roleId);
    }
    this.selectedRoleIds.set(next);
  }

  isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds().has(roleId);
  }

  submit(): void {
    if (!this.name().trim()) {
      this.errorMessage.set('Group name is required');
      return;
    }

    if (!this.editingId() && !this.code().trim()) {
      this.errorMessage.set('Group code is required');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const roleIds = Array.from(this.selectedRoleIds());
    const id = this.editingId();

    const req$ = id !== null
      ? this.rbacApi.updateGroup(id, {
          name: this.name().trim(),
          description: this.description().trim(),
          roleIds
        })
      : this.rbacApi.createGroup({
          name: this.name().trim(),
          code: this.code().trim().toUpperCase(),
          description: this.description().trim(),
          roleIds
        });

    req$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close();
        this.saved.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to save group');
      }
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
