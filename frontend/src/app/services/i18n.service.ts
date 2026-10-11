import { Injectable, computed, signal } from '@angular/core';

import en from '../i18n/en.json';
import hi from '../i18n/hi.json';

export type SupportedLang = 'en' | 'hi';

export const TRANSLATIONS = {
  en,
  hi
} as const;

export type TranslationKey = keyof typeof en;

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly storageKey = 'medhaa-lang';
  readonly lang = signal<SupportedLang>('en');

  readonly dict = computed<typeof en>(() => TRANSLATIONS[this.lang()] as unknown as typeof en);

  constructor() {
    this.initLang();
  }

  private initLang(): void {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(this.storageKey) as SupportedLang | null;
    if (saved === 'en' || saved === 'hi') {
      this.setLang(saved);
    }
  }

  toggleLang(): void {
    const nextLang: SupportedLang = this.lang() === 'en' ? 'hi' : 'en';
    this.setLang(nextLang);
  }

  setLang(lang: SupportedLang): void {
    this.lang.set(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, lang);
    }
  }

  t(key: TranslationKey): string {
    return this.dict()[key] ?? key;
  }
}
