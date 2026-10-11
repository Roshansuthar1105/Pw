import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
  output,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RbacApiService } from '../../../services/rbac-api.service';
import { I18nService } from '../../../services/i18n.service';
import { User, Group, UserType } from '../../../models/rbac.model';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-modal.component.html',
  styleUrl: './user-modal.component.scss'
})
export class UserModalComponent {
  @ViewChild('modalDialog') dialog?: ElementRef<HTMLDialogElement>;

  private rbacApi = inject(RbacApiService);
  readonly i18n = inject(I18nService);

  readonly isOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly editingId = signal<number | null>(null);
  readonly allGroups = signal<Group[]>([]);
  readonly selectedGroupIds = signal<Set<number>>(new Set());

  readonly username = signal<string>('');
  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly userType = signal<UserType>('STUDENT');
  readonly isSuperAdmin = signal<boolean>(false);
  readonly active = signal<boolean>(true);

  readonly saved = output<void>();

  // Default group corresponding to current userType
  readonly defaultGroup = computed<Group | undefined>(() => {
    return this.allGroups().find(
      g => g.isDefault && g.defaultForUserType === this.userType()
    );
  });

  open(user?: User, availableGroups: Group[] = []): void {
    this.allGroups.set(availableGroups);
    this.errorMessage.set(null);
    this.isSubmitting.set(false);

    if (user) {
      this.editingId.set(user.id);
      this.username.set(user.username);
      this.email.set(user.email);
      this.password.set('');
      this.userType.set(user.userType);
      this.isSuperAdmin.set(user.isSuperAdmin);
      this.active.set(user.active);
      this.selectedGroupIds.set(new Set(user.groupIds || []));
    } else {
      this.editingId.set(null);
      this.username.set('');
      this.email.set('');
      this.password.set('Password@123');
      this.userType.set('STUDENT');
      this.isSuperAdmin.set(false);
      this.active.set(true);

      const defGroup = availableGroups.find(
        g => g.isDefault && g.defaultForUserType === 'STUDENT'
      );
      this.selectedGroupIds.set(new Set(defGroup ? [defGroup.id] : []));
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

  onUserTypeChange(newType: UserType): void {
    this.userType.set(newType);
    // Auto-select the default group for this user type
    const def = this.allGroups().find(
      g => g.isDefault && g.defaultForUserType === newType
    );
    const next = new Set(this.selectedGroupIds());
    if (def) {
      next.add(def.id);
    }
    this.selectedGroupIds.set(next);
  }

  toggleGroup(groupId: number): void {
    const next = new Set(this.selectedGroupIds());
    const def = this.defaultGroup();

    // Protection rule: cannot remove the default system group if it is the only group
    if (next.has(groupId)) {
      if (def && def.id === groupId && next.size <= 1) {
        this.errorMessage.set('A user must remain in at least their default user_type group.');
        return;
      }
      next.delete(groupId);
    } else {
      next.add(groupId);
    }

    this.selectedGroupIds.set(next);
    this.errorMessage.set(null);
  }

  isGroupSelected(groupId: number): boolean {
    return this.selectedGroupIds().has(groupId);
  }

  submit(): void {
    if (!this.username().trim()) {
      this.errorMessage.set('Username is required');
      return;
    }
    if (!this.email().trim()) {
      this.errorMessage.set('Email is required');
      return;
    }
    if (!this.editingId() && !this.password().trim()) {
      this.errorMessage.set('Password is required');
      return;
    }

    // Ensure at least default group is assigned
    const def = this.defaultGroup();
    const groupIds = Array.from(this.selectedGroupIds());
    if (def && !groupIds.includes(def.id)) {
      groupIds.push(def.id);
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const id = this.editingId();
    const req$ = id !== null
      ? this.rbacApi.updateUser(id, {
          email: this.email().trim(),
          password: this.password().trim() || undefined,
          userType: this.userType(),
          isSuperAdmin: this.isSuperAdmin(),
          active: this.active(),
          groupIds
        })
      : this.rbacApi.createUser({
          username: this.username().trim(),
          email: this.email().trim(),
          password: this.password().trim(),
          userType: this.userType(),
          isSuperAdmin: this.isSuperAdmin(),
          additionalGroupIds: groupIds
        });

    req$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close();
        this.saved.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to save user');
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
