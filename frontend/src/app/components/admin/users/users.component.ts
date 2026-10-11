import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RbacApiService } from '../../../services/rbac-api.service';
import { PermissionService } from '../../../services/permission.service';
import { I18nService } from '../../../services/i18n.service';
import { User, Group } from '../../../models/rbac.model';
import { UserModalComponent } from '../../modals/user-modal/user-modal.component';
import { UserPermissionsModalComponent } from '../../modals/user-permissions-modal/user-permissions-modal.component';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-users-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UserModalComponent,
    UserPermissionsModalComponent,
    ConfirmModalComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  @ViewChild('userModal') userModal?: UserModalComponent;
  @ViewChild('permModal') permModal?: UserPermissionsModalComponent;
  @ViewChild('confirmModal') confirmModal?: ConfirmModalComponent;

  private rbacApi = inject(RbacApiService);
  private permissionService = inject(PermissionService);
  readonly i18n = inject(I18nService);

  readonly users = signal<User[]>([]);
  readonly groups = signal<Group[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  readonly pendingDelete = signal<User | null>(null);

  // KPIs
  readonly totalUsers = computed(() => this.users().length);
  readonly superAdmins = computed(() => this.users().filter(u => u.isSuperAdmin).length);
  readonly activeUsers = computed(() => this.users().filter(u => u.active).length);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.rbacApi.getUsers().subscribe({
      next: (res) => {
        if (res.data) this.users.set(res.data);
        this.loadGroups();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load users');
      }
    });
  }

  private loadGroups(): void {
    this.rbacApi.getGroups().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) this.groups.set(res.data);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateModal(): void {
    this.userModal?.open(undefined, this.groups());
  }

  openEditModal(user: User): void {
    this.userModal?.open(user, this.groups());
  }

  openInspectPermissions(user: User): void {
    this.permModal?.open(user);
  }

  confirmDelete(user: User): void {
    this.pendingDelete.set(user);
    this.confirmModal?.open();
  }

  executeDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;

    this.rbacApi.deleteUser(target.id).subscribe({
      next: () => {
        this.showToast(`Deleted user ${target.username}`);
        this.loadData();
        this.permissionService.fetchPermissions();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete user');
      }
    });
  }

  onUserSaved(): void {
    this.showToast('User saved successfully');
    this.loadData();
    this.permissionService.fetchPermissions();
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
