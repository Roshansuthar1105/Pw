import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, untracked } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  private requiredCode: string = '';
  private hasView = false;

  @Input() set hasPermission(code: string) {
    this.requiredCode = code;
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate whenever permissions change
      this.permissionService.permissionCodes();
      untracked(() => {
        this.updateView();
      });
    });
  }

  private updateView(): void {
    if (!this.requiredCode) {
      if (!this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
      return;
    }

    const permitted = this.permissionService.hasPermission(this.requiredCode);
    if (permitted && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!permitted && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
