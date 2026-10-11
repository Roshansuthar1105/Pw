import { TestBed } from '@angular/core/testing';
import { ModalScrollLockService } from './modal-scroll-lock.service';

describe('ModalScrollLockService', () => {
  let service: ModalScrollLockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalScrollLockService);
    service.forceReset();
  });

  afterEach(() => {
    service.forceReset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.isLocked()).toBe(false);
  });

  it('should add modal-open class to document element and body when modal is registered', () => {
    const unregister = service.register('test-modal', () => {});
    expect(service.isLocked()).toBe(true);
    expect(document.documentElement.classList.contains('modal-open')).toBe(true);
    expect(document.body.classList.contains('modal-open')).toBe(true);

    unregister();
    expect(service.isLocked()).toBe(false);
    expect(document.documentElement.classList.contains('modal-open')).toBe(false);
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });

  it('should maintain scroll lock for nested modals until all are closed', () => {
    const unreg1 = service.register('modal-1', () => {});
    const unreg2 = service.register('modal-2', () => {});

    expect(service.isLocked()).toBe(true);
    expect(document.body.classList.contains('modal-open')).toBe(true);

    unreg2();
    expect(service.isLocked()).toBe(true);
    expect(document.body.classList.contains('modal-open')).toBe(true);

    unreg1();
    expect(service.isLocked()).toBe(false);
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });

  it('should invoke close callback of topmost modal when Escape is pressed', () => {
    let modal1Closed = false;
    let modal2Closed = false;

    service.register('modal-1', () => {
      modal1Closed = true;
    });
    service.register('modal-2', () => {
      modal2Closed = true;
    });

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    window.dispatchEvent(escapeEvent);

    expect(modal2Closed).toBe(true);
    expect(modal1Closed).toBe(false);
  });

  it('should reset scroll lock with forceReset', () => {
    service.register('modal-1', () => {});
    expect(service.isLocked()).toBe(true);

    service.forceReset();
    expect(service.isLocked()).toBe(false);
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });
});
