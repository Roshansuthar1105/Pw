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
import { Role, ComponentItem } from '../../../models/rbac.model';

interface TreeNode {
  component: ComponentItem;
  children: TreeNode[];
}

@Component({
  selector: 'app-role-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-modal.component.html',
  styleUrl: './role-modal.component.scss'
})
export class RoleModalComponent {
  @ViewChild('modalDialog') dialog?: ElementRef<HTMLDialogElement>;

  private rbacApi = inject(RbacApiService);
  readonly i18n = inject(I18nService);

  readonly isOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly editingId = signal<number | null>(null);
  readonly isSystemRole = signal<boolean>(false);
  readonly allComponents = signal<ComponentItem[]>([]);
  readonly selectedIds = signal<Set<number>>(new Set());

  readonly name = signal<string>('');
  readonly code = signal<string>('');
  readonly description = signal<string>('');

  readonly saved = output<void>();

  // Build the 3-level tree structure for the checkbox UI
  readonly componentTree = computed<TreeNode[]>(() => {
    const list = this.allComponents();
    const menus = list.filter(c => c.level === 'MENU');
    const submenus = list.filter(c => c.level === 'SUBMENU');
    const functionalities = list.filter(c => c.level === 'FUNCTIONALITY');

    return menus.map(m => {
      const mSubs = submenus.filter(s => s.parentId === m.id).map(s => {
        const sFuncs = functionalities.filter(f => f.parentId === s.id).map(f => ({
          component: f,
          children: []
        }));
        return {
          component: s,
          children: sFuncs
        };
      });
      return {
        component: m,
        children: mSubs
      };
    });
  });

  open(role?: Role, availableComponents: ComponentItem[] = []): void {
    this.allComponents.set(availableComponents);
    this.errorMessage.set(null);
    this.isSubmitting.set(false);

    if (role) {
      this.editingId.set(role.id);
      this.isSystemRole.set(role.isSystem);
      this.name.set(role.name);
      this.code.set(role.code);
      this.description.set(role.description || '');
      this.selectedIds.set(new Set(role.componentIds || []));
    } else {
      this.editingId.set(null);
      this.isSystemRole.set(false);
      this.name.set('');
      this.code.set('');
      this.description.set('');
      this.selectedIds.set(new Set());
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

  isChecked(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleNode(node: TreeNode): void {
    const next = new Set(this.selectedIds());
    const isNowChecked = !next.has(node.component.id);

    // Recursively collect all descendant IDs
    const descendantIds: number[] = [];
    const collectDescendants = (n: TreeNode) => {
      for (const child of n.children) {
        descendantIds.push(child.component.id);
        collectDescendants(child);
      }
    };
    collectDescendants(node);

    if (isNowChecked) {
      next.add(node.component.id);
      // Auto-check all descendants
      for (const dId of descendantIds) {
        next.add(dId);
      }
      // Also auto-check ancestors so path remains valid
      if (node.component.parentId) {
        next.add(node.component.parentId);
        const parentComp = this.allComponents().find(c => c.id === node.component.parentId);
        if (parentComp?.parentId) {
          next.add(parentComp.parentId);
        }
      }
    } else {
      next.delete(node.component.id);
      // Auto-uncheck all descendants
      for (const dId of descendantIds) {
        next.delete(dId);
      }
    }

    this.selectedIds.set(next);
  }

  selectAll(): void {
    const all = new Set(this.allComponents().map(c => c.id));
    this.selectedIds.set(all);
  }

  clearAll(): void {
    this.selectedIds.set(new Set());
  }

  submit(): void {
    if (!this.name().trim()) {
      this.errorMessage.set('Role name is required');
      return;
    }

    if (!this.editingId() && !this.code().trim()) {
      this.errorMessage.set('Role code is required');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const componentIds = Array.from(this.selectedIds());
    const id = this.editingId();

    const req$ = id !== null
      ? this.rbacApi.updateRole(id, {
          name: this.name().trim(),
          description: this.description().trim(),
          componentIds
        })
      : this.rbacApi.createRole({
          name: this.name().trim(),
          code: this.code().trim().toUpperCase(),
          description: this.description().trim(),
          componentIds
        });

    req$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close();
        this.saved.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to save role');
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
