import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [I18nService]
    });
    service = TestBed.inject(I18nService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and default to English', () => {
    expect(service).toBeTruthy();
    expect(service.lang()).toBe('en');
    expect(service.dict().brand_name).toBe('Medhaa');
  });

  it('should toggle language between English and Hindi', () => {
    service.toggleLang();
    expect(service.lang()).toBe('hi');
    expect(service.dict().brand_name).toBe('मेधा');
    expect(document.documentElement.lang).toBe('hi');

    service.toggleLang();
    expect(service.lang()).toBe('en');
    expect(service.dict().brand_name).toBe('Medhaa');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should translate using t() method', () => {
    expect(service.t('brand_name')).toBe('Medhaa');
    service.setLang('hi');
    expect(service.t('brand_name')).toBe('मेधा');
  });

  it('should persist language to localStorage', () => {
    service.setLang('hi');
    expect(localStorage.getItem('medhaa-lang')).toBe('hi');
  });
});
