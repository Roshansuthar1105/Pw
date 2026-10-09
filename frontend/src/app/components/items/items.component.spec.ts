import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ItemsComponent } from './items.component';
import { ItemService } from '../../services/item.service';
import { ApiResponse } from '../../models/api-response.model';
import { Item } from '../../models/item.model';

describe('ItemsComponent', () => {
  let component: ItemsComponent;
  let fixture: ComponentFixture<ItemsComponent>;
  let mockItemService: any;

  const mockItems: Item[] = [
    { id: 1, name: 'Item 1', description: 'Desc 1', active: true },
    { id: 2, name: 'Item 2', description: 'Desc 2', active: false }
  ];

  const mockApiResponse: ApiResponse<Item[]> = {
    success: true,
    message: 'OK',
    data: mockItems,
    timestamp: '2026-10-08T17:15:00Z'
  };

  beforeEach(async () => {
    mockItemService = {
      getItems: () => of(mockApiResponse),
      getActiveItems: () => of({ ...mockApiResponse, data: [mockItems[0]] }),
      createItem: () => of({ success: true, message: 'Created', data: mockItems[0], timestamp: '' }),
      updateItem: () => of({ success: true, message: 'Updated', data: mockItems[0], timestamp: '' }),
      deleteItem: () => of({ success: true, message: 'Deleted', data: null, timestamp: '' }),
      searchItems: () => of(mockApiResponse)
    };

    await TestBed.configureTestingModule({
      imports: [ItemsComponent],
      providers: [
        { provide: ItemService, useValue: mockItemService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', () => {
    expect(component.items().length).toBe(2);
    expect(component.isLoading()).toBe(false);
  });

  it('should start editing an item', () => {
    component.startEdit(mockItems[0]);
    expect(component.editingItemId()).toBe(1);
    expect(component.itemName()).toBe('Item 1');
  });

  it('should reset form', () => {
    component.startEdit(mockItems[0]);
    component.resetForm();
    expect(component.editingItemId()).toBeNull();
    expect(component.itemName()).toBe('');
  });
});
