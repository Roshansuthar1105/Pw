import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ModalComponent } from './modal.component';

@Component({
  standalone: true,
  template: `<div id="dynamic-sample-content">Dynamic Page Content</div>`
})
class SampleDynamicComponent {}

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve preset sizes correctly', () => {
    fixture.componentRef.setInput('size', 'xs');
    expect(component.resolvedMaxWidth()).toBe('380px');

    fixture.componentRef.setInput('size', 's');
    expect(component.resolvedMaxWidth()).toBe('460px');

    fixture.componentRef.setInput('size', 'md');
    expect(component.resolvedMaxWidth()).toBe('580px');

    fixture.componentRef.setInput('size', 'l');
    expect(component.resolvedMaxWidth()).toBe('760px');

    fixture.componentRef.setInput('size', 'xl');
    expect(component.resolvedMaxWidth()).toBe('960px');
  });

  it('should resolve custom sizes in px and %', () => {
    fixture.componentRef.setInput('size', '520px');
    expect(component.resolvedMaxWidth()).toBe('520px');

    fixture.componentRef.setInput('size', '70%');
    expect(component.resolvedMaxWidth()).toBe('70%');

    fixture.componentRef.setInput('size', '85vw');
    expect(component.resolvedMaxWidth()).toBe('85vw');

    fixture.componentRef.setInput('size', '600');
    expect(component.resolvedMaxWidth()).toBe('600px');
  });

  it('should render heading and subtitle', () => {
    fixture.componentRef.setInput('heading', 'Edit Profile');
    fixture.componentRef.setInput('subtitle', 'Update your personal details');
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.modal-title');
    const subEl = fixture.nativeElement.querySelector('.modal-subtitle');

    expect(titleEl?.textContent?.trim()).toBe('Edit Profile');
    expect(subEl?.textContent?.trim()).toBe('Update your personal details');
  });

  it('should open and close modal and emit events', () => {
    let closedCalled = false;

    component.closed.subscribe(() => {
      closedCalled = true;
    });

    component.open();
    expect(component.isOpen()).toBe(true);

    component.close();
    expect(component.isOpen()).toBe(false);
    expect(closedCalled).toBe(true);
  });

  it('should close when top-right close button is clicked', () => {
    fixture.componentRef.setInput('heading', 'Test Modal');
    fixture.detectChanges();

    let closedTriggered = false;
    component.closed.subscribe(() => {
      closedTriggered = true;
    });

    component.open();
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.modal-close-btn');
    expect(closeBtn).toBeTruthy();

    closeBtn.click();
    expect(component.isOpen()).toBe(false);
    expect(closedTriggered).toBe(true);
  });

  it('should render dynamic component if passed in component input', () => {
    fixture.componentRef.setInput('component', SampleDynamicComponent);
    fixture.detectChanges();

    const dynEl = fixture.nativeElement.querySelector('#dynamic-sample-content');
    expect(dynEl).toBeTruthy();
    expect(dynEl?.textContent).toContain('Dynamic Page Content');
  });

  it('should lock background scroll when open and unlock when closed', () => {
    expect(document.body.classList.contains('modal-open')).toBe(false);

    component.open();
    expect(component.isOpen()).toBe(true);
    expect(document.body.classList.contains('modal-open')).toBe(true);

    component.close();
    expect(component.isOpen()).toBe(false);
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });

  it('should close when Escape key is pressed', () => {
    component.open();
    expect(component.isOpen()).toBe(true);

    const escapeEvt = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    component.onEscapeKey(escapeEvt);

    expect(component.isOpen()).toBe(false);
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });
});
