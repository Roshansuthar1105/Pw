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
import { Role, ComponentItem } from '../../../models/rbac.model';
import { RoleModalComponent } from '../../modals/role-modal/role-modal.component';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-roles-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RoleModalComponent, ConfirmModalComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
  @ViewChild('roleModal') roleModal?: RoleModalComponent;
  @ViewChild('confirmModal') confirmModal?: ConfirmModalComponent;

  private rbacApi = inject(RbacApiService);
  private permissionService = inject(PermissionService);
  readonly i18n = inject(I18nService);

  readonly roles = signal<Role[]>([]);
  readonly components = signal<ComponentItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  readonly pendingDelete = signal<Role | null>(null);

  // KPIs
  readonly totalRoles = computed(() => this.roles().length);
  readonly systemRoles = computed(() => this.roles().filter(r => r.isSystem).length);
  readonly customRoles = computed(() => this.roles().filter(r => !r.isSystem).length);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.rbacApi.getRoles().subscribe({
      next: (res) => {
        if (res.data) this.roles.set(res.data);
        this.loadComponents();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load roles');
      }
    });
  }

  private loadComponents(): void {
    this.rbacApi.getComponents().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) this.components.set(res.data);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateModal(): void {
    this.roleModal?.open(undefined, this.components());
  }

  openEditModal(role: Role): void {
    this.roleModal?.open(role, this.components());
  }

  confirmDelete(role: Role): void {
    this.pendingDelete.set(role);
    this.confirmModal?.open();
  }

  executeDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;

    this.rbacApi.deleteRole(target.id).subscribe({
      next: () => {
        this.showToast(`Deleted role ${target.name}`);
        this.loadData();
        this.permissionService.fetchPermissions();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete role');
      }
    });
  }

  onRoleSaved(): void {
    this.showToast('Role saved successfully');
    this.loadData();
    this.permissionService.fetchPermissions();
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
