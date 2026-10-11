import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ComponentsComponent } from './components.component';
import { RbacApiService } from '../../../services/rbac-api.service';
import { PermissionService } from '../../../services/permission.service';
import { ComponentItem } from '../../../models/rbac.model';

describe('ComponentsComponent', () => {
  let component: ComponentsComponent;
  let fixture: ComponentFixture<ComponentsComponent>;
  let mockRbacApi: any;
  let mockPermissionService: any;

  const sampleComponents: ComponentItem[] = [
    {
      id: 1,
      level: 'MENU',
      parentId: null,
      code: 'MENU_DASHBOARD',
      name: 'Dashboard',
      icon: 'layout-dashboard',
      sortOrder: 1,
      active: true
    },
    {
      id: 2,
      level: 'SUBMENU',
      parentId: 1,
      code: 'SUB_OVERVIEW',
      name: 'Overview',
      route: '/',
      sortOrder: 1,
      active: true
    },
    {
      id: 3,
      level: 'FUNCTIONALITY',
      parentId: 2,
      code: 'FN_REFRESH',
      name: 'Refresh Stats',
      elementType: 'BUTTON',
      sortOrder: 1,
      active: false
    }
  ];

  beforeEach(async () => {
    mockRbacApi = {
      getComponents: () => of({ success: true, message: 'OK', data: sampleComponents, timestamp: '' }),
      deleteComponent: () => of({ success: true, message: 'Deleted', data: null, timestamp: '' }),
      initDefaultComponents: () => of({ success: true, message: 'Initialized', data: sampleComponents, timestamp: '' })
    };

    mockPermissionService = {
      fetchPermissions: () => {}
    };

    await TestBed.configureTestingModule({
      imports: [ComponentsComponent],
      providers: [
        { provide: RbacApiService, useValue: mockRbacApi },
        { provide: PermissionService, useValue: mockPermissionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load components on init and populate KPIs', () => {
    expect(component.components().length).toBe(3);
    expect(component.totalCount()).toBe(3);
    expect(component.menuCount()).toBe(1);
    expect(component.submenuCount()).toBe(1);
    expect(component.funcCount()).toBe(1);
  });

  it('should filter components by search keyword', () => {
    component.onSearchChange('Overview');
    expect(component.filteredComponents().length).toBe(1);
    expect(component.filteredComponents()[0].code).toBe('SUB_OVERVIEW');
  });

  it('should filter components by level', () => {
    component.onLevelFilterChange('FUNCTIONALITY');
    expect(component.filteredComponents().length).toBe(1);
    expect(component.filteredComponents()[0].level).toBe('FUNCTIONALITY');
  });

  it('should filter components by status', () => {
    component.onStatusFilterChange('INACTIVE');
    expect(component.filteredComponents().length).toBe(1);
    expect(component.filteredComponents()[0].name).toBe('Refresh Stats');
  });

  it('should reset filters properly', () => {
    component.onSearchChange('Dashboard');
    component.onLevelFilterChange('MENU');
    component.onStatusFilterChange('ACTIVE');

    component.resetFilters();
    expect(component.searchQuery()).toBe('');
    expect(component.levelFilter()).toBe('ALL');
    expect(component.statusFilter()).toBe('ALL');
    expect(component.filteredComponents().length).toBe(3);
  });

  it('should paginate items according to page size', () => {
    component.onPageSizeChange(2);
    expect(component.paginatedComponents().length).toBe(2);
    expect(component.totalPages()).toBe(2);

    component.nextPage();
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedComponents().length).toBe(1);
  });
});
