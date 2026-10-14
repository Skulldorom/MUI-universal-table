/* eslint-disable no-unused-vars */
import { FC, ReactElement } from "react";

export interface TableRowData {
  [key: string]: unknown;
}

export interface AsyncLoadingPayload {
  searchTerm: string;
  direction: "asc" | "desc";
  column: string;
  pages: number;
}

/** Query the table sends to `fetchRows` when it needs a server page. */
export interface FetchRowsQuery {
  /** Server page being requested (1-based). */
  page: number;
  searchTerm: string;
  column: string;
  direction: "asc" | "desc";
  /** Pass-through of the `filters` prop. */
  filters?: unknown;
  /** Aborted when the query is superseded or the table unmounts. */
  signal: AbortSignal;
}

export interface FetchRowsResult {
  rows: TableRowData[];
  /**
   * Server-side total row count. Should be provided on page 1 (drives the
   * pagination footer and end-of-data detection); later pages may omit it.
   */
  totalCount?: number;
}

export interface TableHeader {
  id: string;
  label: string;
  searchable?: boolean;
  numeric?: boolean;
  date?: boolean;
  sortable?: boolean;
  component?: (rowData: TableRowData) => ReactElement;
  cellProps?: Record<string, unknown>;
  subRow?: boolean;
  iconColor?: string;
  openIcon?: ReactElement;
  closeIcon?: ReactElement;
  headers?: TableHeader[];
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  /** Preferred callback — fires when the user clicks reload on a sub-table. */
  onReload?: () => void;
  subTitle?: string;
}

interface UniversalTableCommonProps {
  /** Array of header configuration objects */
  headers: TableHeader[];
  /** Table title */
  name?: string;
  /** Fires when the user clicks the reload button */
  onReload?: () => void;
  /** Enable lazy loading indicator */
  lazyloading?: boolean;
  /** Current page for lazy loading */
  currentPage?: number;
  /** Total pages for lazy loading */
  totalPages?: number;
  /** Loading state for reload button */
  reloadBtnLoading?: boolean;
  /** Whether this is a nested sub-table */
  subTable?: boolean;
  /** Hide badges on expandable rows */
  hideBadge?: boolean;
  /** Enable row selection */
  selectRows?: boolean;
  /** Property to use as unique identifier for selection */
  selectID?: string;
  /** Custom icon for selection action */
  selectIcon?: ReactElement;
  /** Callback when rows are selected — can return void or a Promise for async batch operations */
  onSelection?: (selectedIds: unknown[]) => void | Promise<void>;
  /** Override default page size options (e.g. [10, 25, 50]) */
  pageSizeOptions?: number[];
  /** Persist search term to sessionStorage (requires name prop) */
  persistSearch?: boolean;
}

export interface UniversalTableSyncProps extends UniversalTableCommonProps {
  /** Array of data objects to display */
  data: TableRowData[];
  /** Shows loading state */
  loading?: boolean;
  /** Function to control loading state in synchronous mode (legacy — prefer onReload) */
  setLoading?: (loading: boolean) => void;
  asyncPages?: undefined;
  fetchRows?: undefined;
}

export interface UniversalTableAsyncProps extends UniversalTableCommonProps {
  /** Array of data objects to display */
  data: TableRowData[];
  /** Shows loading state */
  loading?: boolean;
  /** Function to request async search/sort/reload data */
  setLoading: (loading: AsyncLoadingPayload) => void;
  /**
   * Enables async search/sort payload mode and supplies total async pages.
   * @deprecated Use `fetchRows` for true incremental server-side pagination.
   */
  asyncPages: number;
  fetchRows?: undefined;
}

export interface UniversalTableFetchProps extends UniversalTableCommonProps {
  /**
   * Server-side pagination data source. The table calls this whenever it
   * needs a page: page 1 on mount / search / sort / reload / filters or
   * reset changes, and the next page as the user reaches the end of the
   * rows loaded so far.
   */
  fetchRows: (query: FetchRowsQuery) => Promise<FetchRowsResult>;
  /**
   * Opaque filter values passed through to `fetchRows`. Compared by value
   * (must be JSON-serializable) — a change resets the table to page 1.
   */
  filters?: unknown;
  /**
   * Opaque reset signal — change it (e.g. an incrementing counter) after
   * external mutations to make the table discard loaded rows and refetch
   * from page 1.
   */
  reset?: unknown;
  data?: undefined;
  loading?: undefined;
  setLoading?: undefined;
  asyncPages?: undefined;
}

export type UniversalTableProps =
  | UniversalTableSyncProps
  | UniversalTableAsyncProps
  | UniversalTableFetchProps;

declare const UniversalTable: FC<UniversalTableProps>;

export { UniversalTable };
export default UniversalTable;
