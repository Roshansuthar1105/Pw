import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close', () => {
    component.open();
    expect(component.isOpen()).toBe(true);
    component.close();
    expect(component.isOpen()).toBe(false);
  });

  it('should emit confirmed', () => {
    let confirmed = false;
    component.confirmed.subscribe(() => {
      confirmed = true;
    });

    component.confirm();
    expect(confirmed).toBe(true);
  });

  it('should emit cancelled and close', () => {
    let cancelled = false;
    component.cancelled.subscribe(() => {
      cancelled = true;
    });

    component.open();
    component.cancel();
    expect(cancelled).toBe(true);
    expect(component.isOpen()).toBe(false);
  });
});
