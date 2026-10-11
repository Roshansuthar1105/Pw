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
import { Group, Role } from '../../../models/rbac.model';
import { GroupModalComponent } from '../../modals/group-modal/group-modal.component';
import { GroupMembersModalComponent } from '../../modals/group-members-modal/group-members-modal.component';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-groups-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GroupModalComponent,
    GroupMembersModalComponent,
    ConfirmModalComponent
  ],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss'
})
export class GroupsComponent implements OnInit {
  @ViewChild('groupModal') groupModal?: GroupModalComponent;
  @ViewChild('membersModal') membersModal?: GroupMembersModalComponent;
  @ViewChild('confirmModal') confirmModal?: ConfirmModalComponent;

  private rbacApi = inject(RbacApiService);
  private permissionService = inject(PermissionService);
  readonly i18n = inject(I18nService);

  readonly groups = signal<Group[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  readonly pendingDelete = signal<Group | null>(null);

  // KPIs
  readonly totalGroups = computed(() => this.groups().length);
  readonly defaultGroups = computed(() => this.groups().filter(g => g.isDefault).length);
  readonly customCohorts = computed(() => this.groups().filter(g => !g.isDefault).length);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.rbacApi.getGroups().subscribe({
      next: (res) => {
        if (res.data) this.groups.set(res.data);
        this.loadRoles();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load groups');
      }
    });
  }

  private loadRoles(): void {
    this.rbacApi.getRoles().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) this.roles.set(res.data);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateModal(): void {
    this.groupModal?.open(undefined, this.roles());
  }

  openEditModal(group: Group): void {
    this.groupModal?.open(group, this.roles());
  }

  openMembersModal(group: Group): void {
    this.membersModal?.open(group);
  }

  confirmDelete(group: Group): void {
    this.pendingDelete.set(group);
    this.confirmModal?.open();
  }

  executeDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;

    this.rbacApi.deleteGroup(target.id).subscribe({
      next: () => {
        this.showToast(`Deleted group ${target.name}`);
        this.loadData();
        this.permissionService.fetchPermissions();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete group');
      }
    });
  }

  onGroupSaved(): void {
    this.showToast('Group saved successfully');
    this.loadData();
    this.permissionService.fetchPermissions();
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
