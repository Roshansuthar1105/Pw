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

  // Filter & Search Controls
  readonly searchQuery = signal<string>('');
  readonly levelFilter = signal<string>('ALL');
  readonly statusFilter = signal<string>('ALL');

  // Pagination & Display
  readonly pageSize = signal<number>(15);
  readonly currentPage = signal<number>(1);
  readonly viewMode = signal<'TABLE' | 'HIERARCHY'>('TABLE');

  // KPIs
  readonly totalCount = computed(() => this.components().length);
  readonly menuCount = computed(() => this.components().filter(c => c.level === 'MENU').length);
  readonly submenuCount = computed(() => this.components().filter(c => c.level === 'SUBMENU').length);
  readonly funcCount = computed(() => this.components().filter(c => c.level === 'FUNCTIONALITY').length);

  // Hierarchy Tree structure for optional cards view
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

  // Filtered tabular list
  readonly filteredComponents = computed<ComponentItem[]>(() => {
    let list = this.components();
    const q = this.searchQuery().trim().toLowerCase();
    const lvl = this.levelFilter();
    const st = this.statusFilter();

    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.route && c.route.toLowerCase().includes(q)) ||
        (c.helpText && c.helpText.toLowerCase().includes(q)) ||
        (c.elementType && c.elementType.toLowerCase().includes(q))
      );
    }

    if (lvl !== 'ALL') {
      list = list.filter(c => c.level === lvl);
    }

    if (st === 'ACTIVE') {
      list = list.filter(c => c.active === true);
    } else if (st === 'INACTIVE') {
      list = list.filter(c => c.active === false);
    }

    return list;
  });

  // Paginated tabular rows
  readonly paginatedComponents = computed<ComponentItem[]>(() => {
    const list = this.filteredComponents();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  readonly totalPages = computed(() => {
    const total = this.filteredComponents().length;
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  readonly startEntryIndex = computed(() => {
    if (this.filteredComponents().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly endEntryIndex = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.filteredComponents().length);
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

  getParentName(parentId?: number | null): string {
    if (!parentId) return '— (Top-Level Menu)';
    const parent = this.components().find(c => c.id === parentId);
    return parent ? `${parent.name} [${parent.level}]` : `#${parentId}`;
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  onLevelFilterChange(val: string): void {
    this.levelFilter.set(val);
    this.currentPage.set(1);
  }

  onStatusFilterChange(val: string): void {
    this.statusFilter.set(val);
    this.currentPage.set(1);
  }

  onPageSizeChange(val: number | string): void {
    this.pageSize.set(Number(val) || 15);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.levelFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.currentPage.set(1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  exportToCsv(): void {
    const list = this.filteredComponents();
    if (list.length === 0) return;

    const headers = ['S.No', 'ID', 'Component Name', 'Code', 'Level', 'Parent', 'Route / Element', 'Sort Order', 'Status'];
    const rows = list.map((c, i) => [
      i + 1,
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.code,
      c.level,
      `"${this.getParentName(c.parentId).replace(/"/g, '""')}"`,
      c.route || c.elementType || '—',
      c.sortOrder,
      c.active ? 'ACTIVE' : 'INACTIVE'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `components_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
