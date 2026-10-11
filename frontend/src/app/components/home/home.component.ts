import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { HealthStatus } from '../../models/api-response.model';
import { I18nService } from '../../services/i18n.service';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly itemService = inject(ItemService);
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  readonly permissions = inject(PermissionService);

  readonly health = signal<HealthStatus | null>(null);
  readonly isLoadingHealth = signal<boolean>(false);
  readonly healthError = signal<string | null>(null);
  readonly showPermissionsInspector = signal<boolean>(false);

  readonly currentUser = computed(() => this.auth.currentUser());
  readonly userType = computed(() => this.auth.userType());
  readonly isSuperAdmin = computed(() => this.auth.isSuperAdmin());
  readonly assignedGroups = computed(() => this.currentUser()?.groupNames ?? []);

  readonly permittedPagesCount = computed(() => {
    const tree = this.permissions.resolvedTree();
    return tree.reduce((acc, m) => acc + (m.submenus?.length || 0), 0);
  });

  readonly grantedFunctionalitiesCount = computed(() => this.permissions.permissionCodes().size);
  readonly resolvedMenus = computed(() => this.permissions.resolvedTree());
  readonly permissionCodes = computed(() => Array.from(this.permissions.permissionCodes()));

  ngOnInit(): void {
    this.checkHealth();
  }

  checkHealth(): void {
    this.isLoadingHealth.set(true);
    this.healthError.set(null);

    this.itemService.getHealth().subscribe({
      next: (status) => {
        this.health.set(status);
        this.isLoadingHealth.set(false);
      },
      error: () => {
        this.healthError.set(this.i18n.dict().err_backend_offline);
        this.isLoadingHealth.set(false);
      }
    });
  }

  togglePermissionsInspector(): void {
    this.showPermissionsInspector.update((v) => !v);
  }
}

