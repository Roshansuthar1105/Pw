import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { I18nService } from './services/i18n.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App {
  readonly theme = inject(ThemeService);
  readonly i18n = inject(I18nService);

  readonly isCollapsed = signal<boolean>(false);
  readonly isDrawerOpen = signal<boolean>(false);

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
}
