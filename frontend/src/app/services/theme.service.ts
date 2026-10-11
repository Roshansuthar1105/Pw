import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'medhaa-theme-mode';
  readonly mode = signal<ThemeMode>('light');

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage?.getItem(this.storageKey) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') {
        this.applyTheme(saved);
        return;
      }
    } catch {
      // ignore storage access issues
    }

    const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(prefersDark ? 'dark' : 'light');
  }

  toggleTheme(): void {
    const nextMode: ThemeMode = this.mode() === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextMode);
  }

  setTheme(mode: ThemeMode): void {
    this.applyTheme(mode);
  }

  private applyTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    if (typeof document !== 'undefined') {
      if (mode === 'dark') {
        document.documentElement.setAttribute('data-mode', 'dark');
      } else {
        document.documentElement.removeAttribute('data-mode');
      }
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, mode);
      }
    } catch {
      // ignore storage write errors
    }
  }
}
