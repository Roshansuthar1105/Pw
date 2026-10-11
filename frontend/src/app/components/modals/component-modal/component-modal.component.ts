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
import { ComponentItem, ComponentLevel } from '../../../models/rbac.model';

@Component({
  selector: 'app-component-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './component-modal.component.html',
  styleUrl: './component-modal.component.scss'
})
export class ComponentModalComponent {
  @ViewChild('modalDialog') dialog?: ElementRef<HTMLDialogElement>;

  private rbacApi = inject(RbacApiService);
  readonly i18n = inject(I18nService);

  readonly isOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly editingId = signal<number | null>(null);
  readonly allComponents = signal<ComponentItem[]>([]);

  // Form Fields
  readonly level = signal<ComponentLevel>('MENU');
  readonly parentId = signal<number | null>(null);
  readonly code = signal<string>('');
  readonly name = signal<string>('');
  readonly icon = signal<string>('layout-dashboard');
  readonly route = signal<string>('');
  readonly helpText = signal<string>('');
  readonly elementType = signal<string>('BUTTON');
  readonly sortOrder = signal<number>(1);
  readonly active = signal<boolean>(true);

  readonly saved = output<void>();

  // Filtered parent options based on strict rules:
  // MENU -> No parent
  // SUBMENU -> Parents must be MENU only
  // FUNCTIONALITY -> Parents must be SUBMENU only
  readonly eligibleParents = computed(() => {
    const curLevel = this.level();
    const list = this.allComponents();
    if (curLevel === 'SUBMENU') {
      return list.filter(c => c.level === 'MENU');
    }
    if (curLevel === 'FUNCTIONALITY') {
      return list.filter(c => c.level === 'SUBMENU');
    }
    return [];
  });

  open(
    component?: ComponentItem,
    availableComponents: ComponentItem[] = [],
    prefillLevel?: ComponentLevel,
    prefillParentId?: number
  ): void {
    this.allComponents.set(availableComponents);
    this.errorMessage.set(null);
    this.isSubmitting.set(false);

    if (component) {
      this.editingId.set(component.id);
      this.level.set(component.level);
      this.parentId.set(component.parentId ?? null);
      this.code.set(component.code);
      this.name.set(component.name);
      this.icon.set(component.icon || 'layout-dashboard');
      this.route.set(component.route || '');
      this.helpText.set(component.helpText || '');
      this.elementType.set(component.elementType || 'BUTTON');
      this.sortOrder.set(component.sortOrder ?? 0);
      this.active.set(component.active);
    } else {
      this.editingId.set(null);
      const lvl = prefillLevel || 'MENU';
      this.level.set(lvl);
      this.parentId.set(prefillParentId ?? (lvl === 'MENU' ? null : (this.eligibleParents()[0]?.id ?? null)));
      this.code.set('');
      this.name.set('');
      this.icon.set('layout-dashboard');
      this.route.set('');
      this.helpText.set('');
      this.elementType.set('BUTTON');
      this.sortOrder.set(1);
      this.active.set(true);
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

  onLevelChange(newLevel: ComponentLevel): void {
    this.level.set(newLevel);
    if (newLevel === 'MENU') {
      this.parentId.set(null);
    } else {
      const parents = this.eligibleParents();
      this.parentId.set(parents.length > 0 ? parents[0].id : null);
    }
  }

  submit(): void {
    if (!this.name().trim()) {
      this.errorMessage.set('Component name is required');
      return;
    }

    if (!this.editingId() && !this.code().trim()) {
      this.errorMessage.set('Component code is required');
      return;
    }

    if (this.level() !== 'MENU' && !this.parentId()) {
      this.errorMessage.set(`${this.level()} must have a valid parent component`);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: Partial<ComponentItem> = {
      level: this.level(),
      parentId: this.parentId(),
      code: this.code().trim().toUpperCase(),
      name: this.name().trim(),
      icon: this.level() === 'MENU' ? this.icon() : undefined,
      route: this.level() === 'SUBMENU' ? this.route().trim() : undefined,
      helpText: this.level() === 'SUBMENU' ? this.helpText().trim() : undefined,
      elementType: this.level() === 'FUNCTIONALITY' ? this.elementType() : undefined,
      sortOrder: this.sortOrder(),
      active: this.active()
    };

    const id = this.editingId();
    const req$ = id !== null
      ? this.rbacApi.updateComponent(id, payload)
      : this.rbacApi.createComponent(payload);

    req$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close();
        this.saved.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to save component');
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
