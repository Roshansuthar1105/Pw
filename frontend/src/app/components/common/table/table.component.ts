import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../services/i18n.service';
import {
  TableColumn,
  TableAction,
  ColumnStyleFn,
  ColumnClassFn
} from './table.models';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent<T = any> {
  readonly i18n = inject(I18nService);

  // --- Inputs ---
  readonly data = input<T[]>([]);
  readonly columns = input<TableColumn<T>[]>([]);
  readonly tableName = input<string>('Data Table');
  readonly tableSubtitle = input<string>('');
  readonly actions = input<TableAction<T>[]>([]);
  readonly actionHeaderLabel = input<string>('');

  /** Custom styling function applied to each column */
  readonly columnStyleFn = input<ColumnStyleFn<T> | null>(null);

  /** Custom class generator function applied to each column */
  readonly columnClassFn = input<ColumnClassFn<T> | null>(null);

  /** CSV Export configurations */
  readonly exportable = input<boolean>(true);
  readonly exportBtnLabel = input<string>('');
  readonly exportFileName = input<string>('');
  readonly noOfColsToExport = input<number | null>(null);
  readonly includeColumns = input<string[] | null>(null);
  readonly excludeColumns = input<string[] | null>(null);

  /** Search & Pagination */
  readonly searchable = input<boolean>(true);
  readonly searchPlaceholder = input<string>('');
  readonly pageSize = input<number>(10);
  readonly pageSizeOptions = input<number[]>([10, 15, 25, 50, 100]);
  readonly showIndex = input<boolean>(true);
  readonly indexLabel = input<string>('');

  /** UI States */
  readonly loading = input<boolean>(false);
  readonly emptyTitle = input<string>('');
  readonly emptyMessage = input<string>('');
  readonly bordered = input<boolean>(true);
  readonly striped = input<boolean>(false);

  // --- Outputs ---
  readonly rowClick = output<T>();
  readonly sortChange = output<{ key: string; direction: 'asc' | 'desc' | null }>();
  readonly pageChange = output<{ page: number; pageSize: number }>();
  readonly exported = output<{ rowCount: number; colCount: number; fileName: string }>();

  // --- Internal State ---
  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly activePageSize = signal<number>(10);
  readonly sortKey = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc' | null>(null);

  constructor() {
    effect(() => {
      const ps = this.pageSize();
      this.activePageSize.set(ps);
    });
  }

  // --- Computed Pipeline ---
  readonly filteredData = computed(() => {
    const raw = this.data();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return raw;

    const cols = this.columns();
    return raw.filter((row) => {
      // Check defined column values
      for (const col of cols) {
        const val = this.getCellValue(row, col);
        if (val !== null && val !== undefined) {
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          if (str.toLowerCase().includes(query)) {
            return true;
          }
        }
      }
      return false;
    });
  });

  readonly sortedData = computed(() => {
    const list = [...this.filteredData()];
    const key = this.sortKey();
    const dir = this.sortDirection();

    if (!key || !dir) return list;

    const col = this.columns().find((c) => String(c.key) === key);
    if (!col) return list;

    return list.sort((a, b) => {
      const valA = this.getCellValue(a, col);
      const valB = this.getCellValue(b, col);

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        comparison = (valA ? 1 : 0) - (valB ? 1 : 0);
      } else {
        comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      }

      return dir === 'asc' ? comparison : -comparison;
    });
  });

  readonly totalPages = computed(() => {
    const count = this.sortedData().length;
    const size = this.activePageSize();
    return Math.max(1, Math.ceil(count / size));
  });

  readonly paginatedData = computed(() => {
    const list = this.sortedData();
    const page = this.currentPage();
    const size = this.activePageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  readonly startIndex = computed(() => {
    const count = this.sortedData().length;
    if (count === 0) return 0;
    return (this.currentPage() - 1) * this.activePageSize() + 1;
  });

  readonly endIndex = computed(() => {
    return Math.min(this.currentPage() * this.activePageSize(), this.sortedData().length);
  });

  readonly totalCount = computed(() => this.sortedData().length);
  readonly rawTotalCount = computed(() => this.data().length);

  // --- Handlers & Actions ---
  onSearchInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.searchQuery.set(inputEl.value || '');
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  onPageSizeChange(newSize: number | string): void {
    const size = Number(newSize) || 10;
    this.activePageSize.set(size);
    this.currentPage.set(1);
    this.pageChange.emit({ page: 1, pageSize: size });
  }

  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    this.currentPage.set(clamped);
    this.pageChange.emit({ page: clamped, pageSize: this.activePageSize() });
  }

  toggleSort(col: TableColumn<T>): void {
    if (col.sortable === false) return;

    const colKey = String(col.key);
    const currentKey = this.sortKey();
    const currentDir = this.sortDirection();

    if (currentKey !== colKey) {
      this.sortKey.set(colKey);
      this.sortDirection.set('asc');
      this.sortChange.emit({ key: colKey, direction: 'asc' });
    } else if (currentDir === 'asc') {
      this.sortDirection.set('desc');
      this.sortChange.emit({ key: colKey, direction: 'desc' });
    } else {
      this.sortKey.set(null);
      this.sortDirection.set(null);
      this.sortChange.emit({ key: colKey, direction: null });
    }
  }

  isColumnSorted(col: TableColumn<T>): boolean {
    return this.sortKey() === String(col.key);
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  // --- Column & Cell Resolvers ---
  getCellValue(row: T, col: TableColumn<T>): any {
    if (!row) return null;
    const keyStr = String(col.key);

    // Support nested path access (e.g. 'user.address.city')
    if (keyStr.includes('.')) {
      return keyStr.split('.').reduce((acc: any, part) => (acc ? acc[part] : null), row);
    }
    return (row as any)[keyStr];
  }

  getFormattedValue(row: T, col: TableColumn<T>): string {
    const val = this.getCellValue(row, col);
    if (col.formatter) {
      return col.formatter(val, row);
    }
    if (val === null || val === undefined) {
      return '—';
    }
    return String(val);
  }

  getBadge(row: T, col: TableColumn<T>) {
    if (!col.badge) return null;
    const val = this.getCellValue(row, col);
    return col.badge(val, row);
  }

  resolveColumnHeaderStyle(col: TableColumn<T>): Record<string, string> {
    const styles: Record<string, string> = {};
    if (col.width) {
      styles['width'] = col.width;
      styles['min-width'] = col.width;
    }
    const custom = this.columnStyleFn()?.(col) || {};
    return { ...styles, ...custom };
  }

  resolveColumnCellStyle(col: TableColumn<T>, row: T): Record<string, string> {
    const val = this.getCellValue(row, col);
    const styles: Record<string, string> = {};

    if (col.width) {
      styles['width'] = col.width;
    }

    // Direct column cellStyle definition
    if (col.cellStyle) {
      const colStyle =
        typeof col.cellStyle === 'function' ? col.cellStyle(row, val) : col.cellStyle;
      Object.assign(styles, colStyle);
    }

    // Component-level columnStyleFn input
    const fn = this.columnStyleFn();
    if (fn) {
      const customStyles = fn(col, row, val) || {};
      Object.assign(styles, customStyles);
    }

    return styles;
  }

  resolveColumnCellClass(col: TableColumn<T>, row: T): string {
    const val = this.getCellValue(row, col);
    const classes: string[] = [];

    if (col.align === 'num' || col.align === 'right') {
      classes.push('num');
    } else if (col.align === 'center') {
      classes.push('align-center');
    }

    // Column level cellClass
    if (col.cellClass) {
      const c = typeof col.cellClass === 'function' ? col.cellClass(row, val) : col.cellClass;
      if (c) classes.push(c);
    }

    // Component level columnClassFn input
    const fn = this.columnClassFn();
    if (fn) {
      const c = fn(col, row, val);
      if (c) classes.push(c);
    }

    return classes.join(' ');
  }

  // --- CSV Export Logic ---
  exportToCsv(): void {
    const rows = this.sortedData();
    if (rows.length === 0) return;

    // Determine candidate exportable columns
    let exportCols = this.columns().filter((c) => c.exportable !== false);

    // 1. Filter by includeColumns if specified
    const inc = this.includeColumns();
    if (inc && inc.length > 0) {
      const set = new Set(inc.map((s) => s.toLowerCase()));
      exportCols = exportCols.filter((c) => set.has(String(c.key).toLowerCase()));
    }

    // 2. Filter out excludeColumns if specified
    const exc = this.excludeColumns();
    if (exc && exc.length > 0) {
      const set = new Set(exc.map((s) => s.toLowerCase()));
      exportCols = exportCols.filter((c) => !set.has(String(c.key).toLowerCase()));
    }

    // 3. Limit by noOfColsToExport count if specified
    const limit = this.noOfColsToExport();
    if (limit && limit > 0) {
      exportCols = exportCols.slice(0, limit);
    }

    if (exportCols.length === 0) return;

    // Build CSV Headers
    const headers = exportCols.map((col) => this.escapeCsvValue(col.label));
    const lines: string[] = [headers.join(',')];

    // Build CSV Data Rows
    for (const row of rows) {
      const lineValues = exportCols.map((col) => {
        const val = this.getCellValue(row, col);
        let formatted = '';
        if (col.formatter) {
          formatted = col.formatter(val, row);
        } else if (col.badge) {
          const b = col.badge(val, row);
          formatted = b ? b.text : String(val ?? '');
        } else if (val !== null && val !== undefined) {
          formatted = String(val);
        }
        return this.escapeCsvValue(formatted);
      });
      lines.push(lineValues.join(','));
    }

    const csvContent = '\uFEFF' + lines.join('\r\n'); // UTF-8 BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const safeName = (this.exportFileName() || this.tableName() || 'export')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    const fileName = `${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.exported.emit({
      rowCount: rows.length,
      colCount: exportCols.length,
      fileName
    });
  }

  private escapeCsvValue(val: string): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}
