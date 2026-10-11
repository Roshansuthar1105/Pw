import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app.component';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let app: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should toggle sidebar collapsed state', () => {
    const initial = app.isCollapsed();
    app.isCollapsed.set(!initial);
    expect(app.isCollapsed()).toBe(!initial);
  });

  it('should render brand name in sidebar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-name')?.textContent).toContain('Medhaa');
  });

  it('should handle sidebar hover expansion when collapsed', () => {
    app.isCollapsed.set(true);
    expect(app.isSidebarHovered()).toBe(false);

    app.onSidebarMouseEnter();
    expect(app.isSidebarHovered()).toBe(true);

    app.onSidebarMouseLeave();
    expect(app.isSidebarHovered()).toBe(false);
  });

  it('should not hover-expand when sidebar is not collapsed', () => {
    app.isCollapsed.set(false);
    app.onSidebarMouseEnter();
    expect(app.isSidebarHovered()).toBe(false);
  });

  it('should toggle and close topbar user dropdown', () => {
    expect(app.isUserDropdownOpen()).toBe(false);

    const mockEvent = new MouseEvent('click');
    app.toggleUserDropdown(mockEvent);
    expect(app.isUserDropdownOpen()).toBe(true);

    app.onEscapeKey();
    expect(app.isUserDropdownOpen()).toBe(false);
  });

  it('should render user avatar in topbar with initial', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const userBtn = compiled.querySelector('#btn-topbar-user-profile');
    expect(userBtn).toBeTruthy();
    const avatar = userBtn?.querySelector('.avatar');
    expect(avatar).toBeTruthy();
  });
});
