import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableComponent } from './table.component';
import { TableColumn, TableAction } from './table.models';
import { I18nService } from '../../../services/i18n.service';

interface TestStudent {
  id: number;
  name: string;
  grade: string;
  score: number;
  status: 'passed' | 'failed';
}

describe('TableComponent', () => {
  let fixture: ComponentFixture<TableComponent<TestStudent>>;
  let component: TableComponent<TestStudent>;

  const mockData: TestStudent[] = [
    { id: 101, name: 'Aarav Patel', grade: 'A', score: 92, status: 'passed' },
    { id: 102, name: 'Bhavna Sharma', grade: 'B', score: 78, status: 'passed' },
    { id: 103, name: 'Chirag Verma', grade: 'C', score: 55, status: 'failed' },
    { id: 104, name: 'Divya Iyer', grade: 'A', score: 96, status: 'passed' },
    { id: 105, name: 'Eshaan Rao', grade: 'B', score: 81, status: 'passed' }
  ];

  const mockColumns: TableColumn<TestStudent>[] = [
    { key: 'id', label: 'Student ID', align: 'num', width: '90px' },
    { key: 'name', label: 'Full Name', sortable: true },
    { key: 'grade', label: 'Grade', align: 'center' },
    { key: 'score', label: 'Marks', align: 'num', sortable: true },
    {
      key: 'status',
      label: 'Result',
      badge: (val) => ({
        text: val === 'passed' ? 'PASS' : 'FAIL',
        variant: val === 'passed' ? 'ok' : 'bad'
      })
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent],
      providers: [I18nService]
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent<TestStudent>);
    component = fixture.componentInstance;
  });

  it('should create the TableComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should render table headers and rows accurately', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('tableName', 'Student Exam Records');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const headers = compiled.querySelectorAll('thead th');
    // 1 (Index) + 5 (Data columns) = 6 headers
    expect(headers.length).toBe(6);
    expect(headers[0].textContent?.trim()).toContain('S.No.');
    expect(headers[1].textContent?.trim()).toContain('Student ID');
    expect(headers[2].textContent?.trim()).toContain('Full Name');

    const rows = compiled.querySelectorAll('tbody tr.table-data-row');
    expect(rows.length).toBe(5);
  });

  it('should render badges for columns configured with badge resolver', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badges = compiled.querySelectorAll('.badge');
    expect(badges.length).toBe(5);
    expect(badges[0].textContent?.trim()).toBe('PASS');
    expect(badges[0].classList.contains('badge--ok')).toBe(true);
    expect(badges[2].textContent?.trim()).toBe('FAIL');
    expect(badges[2].classList.contains('badge--bad')).toBe(true);
  });

  it('should sort data ascending and descending when clicking sortable header', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.detectChanges();

    const nameCol = mockColumns[1]; // 'name'

    // Sort ascending
    component.toggleSort(nameCol);
    expect(component.sortKey()).toBe('name');
    expect(component.sortDirection()).toBe('asc');
    expect(component.paginatedData()[0].name).toBe('Aarav Patel');
    expect(component.paginatedData()[4].name).toBe('Eshaan Rao');

    // Sort descending
    component.toggleSort(nameCol);
    expect(component.sortDirection()).toBe('desc');
    expect(component.paginatedData()[0].name).toBe('Eshaan Rao');
    expect(component.paginatedData()[4].name).toBe('Aarav Patel');

    // Clear sort
    component.toggleSort(nameCol);
    expect(component.sortDirection()).toBeNull();
  });

  it('should filter table data using search query and update pagination counts', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.detectChanges();

    component.searchQuery.set('divya');
    fixture.detectChanges();

    expect(component.filteredData().length).toBe(1);
    expect(component.paginatedData()[0].name).toBe('Divya Iyer');
    expect(component.totalCount()).toBe(1);
    expect(component.rawTotalCount()).toBe(5);

    // Clear search
    component.clearSearch();
    expect(component.searchQuery()).toBe('');
    expect(component.filteredData().length).toBe(5);
  });

  it('should support pagination controls', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('pageSize', 2);
    fixture.detectChanges();

    expect(component.totalPages()).toBe(3);
    expect(component.paginatedData().length).toBe(2);
    expect(component.startIndex()).toBe(1);
    expect(component.endIndex()).toBe(2);

    // Go to next page
    component.goToPage(2);
    expect(component.currentPage()).toBe(2);
    expect(component.startIndex()).toBe(3);
    expect(component.endIndex()).toBe(4);
    expect(component.paginatedData()[0].id).toBe(103);
  });

  it('should apply custom styling via columnStyleFn and col.cellStyle', () => {
    const customStyleFn = (col: TableColumn<TestStudent>, row?: TestStudent, val?: any) => {
      if (col.key === 'score' && val > 90) {
        return { 'font-weight': 'bold', 'color': 'rgb(22, 163, 74)' };
      }
      return {};
    };

    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('columnStyleFn', customStyleFn);
    fixture.detectChanges();

    const topStudent = mockData[0]; // score 92
    const scoreCol = mockColumns[3];
    const styles = component.resolveColumnCellStyle(scoreCol, topStudent);

    expect(styles['font-weight']).toBe('bold');
    expect(styles['color']).toBe('rgb(22, 163, 74)');
  });

  it('should apply custom classes via columnClassFn', () => {
    const customClassFn = (col: TableColumn<TestStudent>, row?: TestStudent) => {
      if (col.key === 'grade') {
        return 'highlighted-grade-cell';
      }
      return '';
    };

    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('columnClassFn', customClassFn);
    fixture.detectChanges();

    const gradeCol = mockColumns[2];
    const classes = component.resolveColumnCellClass(gradeCol, mockData[0]);

    expect(classes).toContain('highlighted-grade-cell');
    expect(classes).toContain('align-center');
  });

  it('should render and handle action button clicks and visibility', () => {
    let clickedRow: TestStudent | null = null;
    let clickedIndex: number | null = null;

    const mockActions: TableAction<TestStudent>[] = [
      {
        id: 'view',
        label: 'View',
        onClick: (row, idx) => {
          clickedRow = row;
          clickedIndex = idx;
        }
      },
      {
        id: 'retry',
        label: 'Retake Exam',
        variant: 'danger',
        visible: (row) => row.status === 'failed',
        onClick: () => {}
      }
    ];

    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('actions', mockActions);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const actionButtons = compiled.querySelectorAll('.actions-group button');
    // Row 1 passed: 1 btn (View)
    // Row 2 passed: 1 btn (View)
    // Row 3 failed: 2 btns (View, Retake Exam)
    // Row 4 passed: 1 btn (View)
    // Row 5 passed: 1 btn (View)
    // Total = 6 buttons
    expect(actionButtons.length).toBe(6);

    // Simulate clicking View on first row
    (actionButtons[0] as HTMLButtonElement).click();
    expect(clickedRow).toEqual(mockData[0]);
    expect(clickedIndex).toBe(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle CSV export filtering by noOfColsToExport and column inclusion/exclusion', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('noOfColsToExport', 2);
    fixture.componentRef.setInput('tableName', 'Test Report');
    fixture.detectChanges();

    let exportEventData: { rowCount: number; colCount: number; fileName: string } | null = null;
    component.exported.subscribe((res: { rowCount: number; colCount: number; fileName: string }) => {
      exportEventData = res;
    });

    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return mockAnchor as unknown as HTMLElement;
      }
      return origCreateElement(tagName);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

    component.exportToCsv();

    expect(exportEventData).not.toBeNull();
    expect(exportEventData!.rowCount).toBe(5);
    // Limited to first 2 columns due to noOfColsToExport = 2
    expect(exportEventData!.colCount).toBe(2);
    expect(exportEventData!.fileName).toContain('test_report');
  });

  it('should respect includeColumns and excludeColumns in CSV export', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('includeColumns', ['id', 'name', 'score']);
    fixture.componentRef.setInput('excludeColumns', ['id']);
    fixture.detectChanges();

    let exportEventData: { rowCount: number; colCount: number; fileName: string } | null = null;
    component.exported.subscribe((res: { rowCount: number; colCount: number; fileName: string }) => {
      exportEventData = res;
    });

    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return mockAnchor as unknown as HTMLElement;
      }
      return origCreateElement(tagName);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

    component.exportToCsv();

    // From ['id', 'name', 'score'], 'id' excluded -> leaves 2 columns ('name', 'score')
    expect(exportEventData).not.toBeNull();
    expect(exportEventData!.colCount).toBe(2);
  });
});
