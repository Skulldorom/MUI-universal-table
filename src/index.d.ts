/* eslint-disable no-unused-vars */
import { FC, ReactElement } from "react";

export interface TableRowData {
  [key: string]: unknown;
}

/**
 * First argument passed to `fetchRows`: the `filters` prop merged with the
 * table's current query state. Must be JSON-serializable.
 */
export interface FetchRowsQuery {
  /** Server page being requested (1-based). */
  page: number;
  /** Rows requested for this page (the table's current rows-per-page). */
  pageSize: number;
  searchTerm: string;
  column: string;
  direction: "asc" | "desc";
  /** Pass-through of the `filters` prop (JSON-serializable values). */
  [key: string]: unknown;
}

export interface FetchRowsResult {
  rows: TableRowData[];
  /**
   * Server-side total row count. Should be provided on page 1 (drives the
   * pagination footer and end-of-data detection); later pages may omit it.
   */
  totalCount?: number;
}

/** Snapshot of the table-owned fetch state, published via `onStateChange`. */
export interface FetchRowsState {
  /** A full (re)load is in progress: initial load, search, sort, filters, reset or reload. */
  loading: boolean;
  /** The next server page is being appended in the background. */
  loadingMore: boolean;
  /** The latest next-page (append) request failed. */
  loadMoreError: boolean;
  /** The latest full (re)load failed. */
  error: boolean;
  /** Whether another server page is available. */
  hasMore: boolean;
  /** Server total row count, or `null` until the first page resolves with one. */
  totalCount: number | null;
  /** Number of rows currently loaded into the table. */
  loadedCount: number;
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
  /** Function notified when a reload is requested (legacy — prefer onReload) */
  setLoading?: (loading: boolean) => void;
  fetchRows?: undefined;
}

export interface UniversalTableFetchProps extends UniversalTableCommonProps {
  /**
   * Server-side pagination data source. The table calls this whenever it
   * needs a page: page 1 on mount / search / sort / reload / filters or
   * reset changes, and the next page as the user reaches the end of the
   * rows loaded so far.
   */
  fetchRows: (
    filters: FetchRowsQuery,
    signal: AbortSignal,
  ) => Promise<FetchRowsResult>;
  /**
   * Plain object of filter values merged into the `filters` query sent to
   * `fetchRows`. Compared by value, so it must be JSON-serializable; a change
   * resets the table to page 1.
   */
  filters?: Record<string, unknown>;
  /**
   * Opaque reset signal — change it (e.g. an incrementing counter) after
   * external mutations to make the table discard loaded rows and refetch
   * from page 1.
   */
  reset?: unknown;
  /**
   * Called with the fetch state snapshot whenever it changes, so parent UI can
   * react to the table-owned loading/error/pagination state.
   */
  onStateChange?: (state: FetchRowsState) => void;
  /**
   * Bump this value (e.g. an incrementing counter) to append the next server
   * page — the declarative equivalent of a manual "Load more".
   */
  loadMoreSignal?: unknown;
  data?: undefined;
  loading?: undefined;
  setLoading?: undefined;
}

export type UniversalTableProps = UniversalTableSyncProps | UniversalTableFetchProps;

declare const UniversalTable: FC<UniversalTableProps>;

export { UniversalTable };
export default UniversalTable;
