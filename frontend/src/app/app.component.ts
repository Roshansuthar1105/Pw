import { Component, inject, signal, ViewChild, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './services/theme.service';
import { I18nService } from './services/i18n.service';
import { AuthService } from './services/auth.service';
import { PermissionService } from './services/permission.service';
import { UserSwitcherModalComponent } from './components/modals/user-switcher-modal/user-switcher-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    UserSwitcherModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App {
  @ViewChild('switcherModal') switcherModal?: UserSwitcherModalComponent;

  readonly theme = inject(ThemeService);
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  readonly permissions = inject(PermissionService);
  private router = inject(Router);

  readonly isCollapsed = signal<boolean>(false);
  readonly isDrawerOpen = signal<boolean>(false);
  readonly openMenuIds = signal<Set<number>>(new Set());

  constructor() {
    // Auto-open menu group containing active route on navigation
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        this.autoOpenActiveGroup(evt.urlAfterRedirects || evt.url);
      }
    });

    // Auto-open active group when resolvedTree loads
    effect(() => {
      const tree = this.permissions.resolvedTree();
      if (tree.length > 0) {
        this.autoOpenActiveGroup(this.router.url);
      }
    });
  }

  toggleSidebar(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      this.isDrawerOpen.update((open) => !open);
    } else {
      this.isCollapsed.update((collapsed) => !collapsed);
    }
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  closeDrawerOnNav(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      this.isDrawerOpen.set(false);
    }
  }

  toggleMenu(menuId: number): void {
    const next = new Set(this.openMenuIds());
    if (next.has(menuId)) {
      next.delete(menuId);
    } else {
      next.add(menuId);
    }
    this.openMenuIds.set(next);
  }

  isMenuOpen(menuId: number): boolean {
    return this.openMenuIds().has(menuId);
  }

  openUserSwitcher(): void {
    this.switcherModal?.open();
  }

  private autoOpenActiveGroup(currentUrl: string): void {
    const cleanUrl = currentUrl.split('?')[0].split('#')[0];
    const tree = this.permissions.resolvedTree();
    const next = new Set(this.openMenuIds());

    for (const menu of tree) {
      const hasActiveChild = menu.submenus.some((s) => s.route === cleanUrl);
      if (hasActiveChild) {
        next.add(menu.id);
      }
    }
    this.openMenuIds.set(next);
  }
}
