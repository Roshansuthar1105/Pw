export type ColumnAlign = 'left' | 'center' | 'right' | 'num';
export type ActionVariant = 'primary' | 'outline' | 'danger';
export type BadgeVariant = 'ok' | 'warn' | 'bad' | 'neutral' | 'primary';

export interface ColumnBadgeConfig {
  text: string;
  variant?: BadgeVariant;
}

export interface TableColumn<T = any> {
  /** Property key of the row data or custom identifier */
  key: keyof T | string;
  /** Display label in the table header */
  label: string;
  /** Text alignment (default: 'left', numbers use 'num'/'right') */
  align?: ColumnAlign;
  /** Fixed or minimum width (e.g., '120px', '20%') */
  width?: string;
  /** Enable column click-to-sort (default: true) */
  sortable?: boolean;
  /** Whether column is included in CSV export (default: true) */
  exportable?: boolean;
  /** Optional custom cell value formatter function */
  formatter?: (value: any, row: T) => string;
  /** Custom CSS classes applied to column cells */
  cellClass?: string | ((row: T, value: any) => string);
  /** Custom inline style map applied to column cells */
  cellStyle?: Record<string, string> | ((row: T, value: any) => Record<string, string>);
  /** Optional badge rendering configuration */
  badge?: (value: any, row: T) => ColumnBadgeConfig | null;
}

export interface TableAction<T = any> {
  /** Unique action identifier */
  id: string;
  /** Button text label */
  label: string;
  /** Optional icon SVG or indicator */
  icon?: string;
  /** Button style variant */
  variant?: ActionVariant;
  /** Click handler callback */
  onClick: (row: T, index: number) => void;
  /** Conditional visibility function */
  visible?: (row: T) => boolean;
  /** Conditional disabled state */
  disabled?: (row: T) => boolean;
  /** Tooltip or title text */
  title?: string;
}

export interface TableExportConfig {
  /** Output file name (defaults to table name + .csv) */
  fileName?: string;
  /** Maximum number of exportable columns to include from the start */
  noOfColsToExport?: number;
  /** Explicit list of column keys to include in export */
  includeColumns?: string[];
  /** Explicit list of column keys to exclude from export */
  excludeColumns?: string[];
}

export type ColumnStyleFn<T = any> = (
  col: TableColumn<T>,
  row?: T,
  value?: any
) => Record<string, string>;

export type ColumnClassFn<T = any> = (
  col: TableColumn<T>,
  row?: T,
  value?: any
) => string;
