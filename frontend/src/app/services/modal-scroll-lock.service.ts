import { Injectable, OnDestroy } from '@angular/core';

export interface ModalRegistration {
  id: string;
  close: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalScrollLockService implements OnDestroy {
  private openStack: ModalRegistration[] = [];
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.initKeydownListener();
  }

  private initKeydownListener(): void {
    if (typeof window === 'undefined') return;

    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.openStack.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        const top = this.openStack[this.openStack.length - 1];
        if (top && typeof top.close === 'function') {
          top.close();
        }
      }
    };

    window.addEventListener('keydown', this.keydownListener, true);
  }

  /**
   * Register a modal as open. Locks background scroll and pushes modal to top of stack.
   * Returns a cleanup unregister function.
   */
  register(id: string, closeFn: () => void): () => void {
    const entry: ModalRegistration = { id, close: closeFn };
    this.openStack.push(entry);
    this.applyLock();

    let unregistered = false;
    return () => {
      if (unregistered) return;
      unregistered = true;
      const index = this.openStack.indexOf(entry);
      if (index !== -1) {
        this.openStack.splice(index, 1);
      }
      if (this.openStack.length === 0) {
        this.removeLock();
      }
    };
  }

  /**
   * Manually unlock or close by modal id if needed.
   */
  unregisterById(id: string): void {
    this.openStack = this.openStack.filter((m) => m.id !== id);
    if (this.openStack.length === 0) {
      this.removeLock();
    }
  }

  /**
   * Check if any modal is currently locking scroll.
   */
  isLocked(): boolean {
    return this.openStack.length > 0;
  }

  /**
   * Reset all locks (useful for test tear down or navigation).
   */
  forceReset(): void {
    this.openStack = [];
    this.removeLock();
  }

  private applyLock(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
  }

  private removeLock(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }

  ngOnDestroy(): void {
    if (this.keydownListener && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownListener, true);
    }
    this.removeLock();
  }
}
