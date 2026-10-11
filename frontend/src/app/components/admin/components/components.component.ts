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
import { ComponentItem, ComponentLevel } from '../../../models/rbac.model';
import { ComponentModalComponent } from '../../modals/component-modal/component-modal.component';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

interface HierarchyMenu {
  menu: ComponentItem;
  submenus: {
    submenu: ComponentItem;
    functionalities: ComponentItem[];
  }[];
}

@Component({
  selector: 'app-components-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ComponentModalComponent, ConfirmModalComponent],
  templateUrl: './components.component.html',
  styleUrl: './components.component.scss'
})
export class ComponentsComponent implements OnInit {
  @ViewChild('compModal') compModal?: ComponentModalComponent;
  @ViewChild('confirmModal') confirmModal?: ConfirmModalComponent;

  private rbacApi = inject(RbacApiService);
  private permissionService = inject(PermissionService);
  readonly i18n = inject(I18nService);

  readonly components = signal<ComponentItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  readonly pendingDelete = signal<ComponentItem | null>(null);

  // KPIs
  readonly totalCount = computed(() => this.components().length);
  readonly menuCount = computed(() => this.components().filter(c => c.level === 'MENU').length);
  readonly submenuCount = computed(() => this.components().filter(c => c.level === 'SUBMENU').length);
  readonly funcCount = computed(() => this.components().filter(c => c.level === 'FUNCTIONALITY').length);

  // Hierarchy Tree structure
  readonly hierarchy = computed<HierarchyMenu[]>(() => {
    const list = this.components();
    const menus = list.filter(c => c.level === 'MENU').sort((a, b) => a.sortOrder - b.sortOrder);
    const submenus = list.filter(c => c.level === 'SUBMENU').sort((a, b) => a.sortOrder - b.sortOrder);
    const funcs = list.filter(c => c.level === 'FUNCTIONALITY').sort((a, b) => a.sortOrder - b.sortOrder);

    return menus.map(m => {
      const mSubs = submenus.filter(s => s.parentId === m.id).map(s => {
        const sFuncs = funcs.filter(f => f.parentId === s.id);
        return {
          submenu: s,
          functionalities: sFuncs
        };
      });
      return {
        menu: m,
        submenus: mSubs
      };
    });
  });

  ngOnInit(): void {
    this.loadComponents();
  }

  loadComponents(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.rbacApi.getComponents().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.components.set(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load components');
      }
    });
  }

  openCreateModal(level?: ComponentLevel, parentId?: number): void {
    this.compModal?.open(undefined, this.components(), level, parentId);
  }

  openEditModal(comp: ComponentItem): void {
    this.compModal?.open(comp, this.components());
  }

  confirmDelete(comp: ComponentItem): void {
    this.pendingDelete.set(comp);
    this.confirmModal?.open();
  }

  executeDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;

    this.rbacApi.deleteComponent(target.id).subscribe({
      next: () => {
        this.showToast(`Deleted component ${target.name}`);
        this.loadComponents();
        this.permissionService.fetchPermissions();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete component');
      }
    });
  }

  bootstrapDefaults(): void {
    this.isLoading.set(true);
    this.rbacApi.initDefaultComponents().subscribe({
      next: () => {
        this.showToast('Initialized default platform components');
        this.loadComponents();
        this.permissionService.fetchPermissions();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to bootstrap defaults');
      }
    });
  }

  onComponentSaved(): void {
    this.showToast('Component saved successfully');
    this.loadComponents();
    this.permissionService.fetchPermissions();
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
