import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemModalComponent } from './item-modal.component';
import { Item } from '../../../models/item.model';

describe('ItemModalComponent', () => {
  let component: ItemModalComponent;
  let fixture: ComponentFixture<ItemModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open in create mode with empty fields', () => {
    component.openCreate();
    expect(component.isOpen()).toBe(true);
    expect(component.editingItemId()).toBeNull();
    expect(component.itemName()).toBe('');
    expect(component.itemActive()).toBe(true);
  });

  it('should open in edit mode with item populated', () => {
    const item: Item = {
      id: 42,
      name: 'Biology Flashcards',
      description: 'Cell biology notes',
      active: false
    };

    component.openEdit(item);
    expect(component.isOpen()).toBe(true);
    expect(component.editingItemId()).toBe(42);
    expect(component.itemName()).toBe('Biology Flashcards');
    expect(component.itemDescription()).toBe('Cell biology notes');
    expect(component.itemActive()).toBe(false);
  });

  it('should show validation error when submitting with empty name', () => {
    component.openCreate();
    component.submit();
    expect(component.nameTouched()).toBe(true);
    expect(component.errorMessage()).toBeTruthy();
  });

  it('should emit save event when valid data submitted', () => {
    let emittedPayload: any = null;
    component.save.subscribe((val) => {
      emittedPayload = val;
    });

    component.openCreate();
    component.itemName.set('Chemistry Guide');
    component.itemDescription.set('Inorganic reactions');
    component.submit();

    expect(emittedPayload).toBeTruthy();
    expect(emittedPayload.id).toBeNull();
    expect(emittedPayload.payload.name).toBe('Chemistry Guide');
  });

  it('should close dialog and emit closed', () => {
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });

    component.openCreate();
    component.close();

    expect(component.isOpen()).toBe(false);
    expect(closedEmitted).toBe(true);
  });
});
