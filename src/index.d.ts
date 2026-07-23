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
  /** Array of data objects to display */
  data: TableRowData[];
  /** Array of header configuration objects */
  headers: TableHeader[];
  /** Table title */
  name?: string;
  /** Shows loading state */
  loading?: boolean;
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
  /** Callback when rows are selected */
  onSelection?: (selectedIds: unknown[]) => void;
  /** Override default page size options (e.g. [10, 25, 50]) */
  pageSizeOptions?: number[];
  /** Persist search term to sessionStorage (requires name prop) */
  persistSearch?: boolean;
}

export interface UniversalTableSyncProps extends UniversalTableCommonProps {
  /** Function to control loading state in synchronous mode (legacy — prefer onReload) */
  setLoading?: (loading: boolean) => void;
  asyncPages?: undefined;
}

export interface UniversalTableAsyncProps extends UniversalTableCommonProps {
  /** Function to request async search/sort/reload data */
  setLoading: (loading: AsyncLoadingPayload) => void;
  /** Enables async search/sort payload mode and supplies total async pages */
  asyncPages: number;
}

export type UniversalTableProps = UniversalTableSyncProps | UniversalTableAsyncProps;

declare const UniversalTable: FC<UniversalTableProps>;

export { UniversalTable };
export default UniversalTable;
