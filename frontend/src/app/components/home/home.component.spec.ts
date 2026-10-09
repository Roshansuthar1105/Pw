import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { ItemService } from '../../services/item.service';
import { HealthStatus } from '../../models/api-response.model';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockItemService: any;

  const mockHealthData: HealthStatus = {
    status: 'UP',
    service: 'angular-springboot-template',
    profile: 'dev',
    timestamp: '2026-10-08T17:15:00Z'
  };

  beforeEach(async () => {
    mockItemService = {
      getHealth: () => of(mockHealthData)
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: ItemService, useValue: mockItemService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load health status on init', () => {
    expect(component.health()).toEqual(mockHealthData);
    expect(component.isLoadingHealth()).toBe(false);
  });

  it('should handle health check error', () => {
    mockItemService.getHealth = () => throwError(() => new Error('Network error'));
    component.checkHealth();
    expect(component.healthError()).toBeTruthy();
  });
});
