import React from "react";
import UniversalTable, { UniversalTable as NamedUniversalTable } from "../../src/index.js";
import type {
  AsyncLoadingPayload,
  FetchRowsQuery,
  FetchRowsResult,
  TableHeader,
  UniversalTableProps,
} from "../../src/index.d.ts";

const rows = [{ id: 1, name: "Ada Lovelace", createdAt: "2024-01-01T00:00:00Z" }];
const headers: TableHeader[] = [
  { id: "name", label: "Name", searchable: true },
  { id: "createdAt", label: "Created", date: true, sortable: true },
];

const nestedHeaders: TableHeader[] = [
  {
    id: "children",
    label: "Children",
    subRow: true,
    headers,
    loading: false,
    onReload: () => {},
    subTitle: "Children table",
  },
];

const asyncPayload: AsyncLoadingPayload = {
  searchTerm: "Ada",
  direction: "asc",
  column: "name",
  pages: 2,
};

asyncPayload.pages.toFixed();

const asyncProps: UniversalTableProps = {
  data: rows,
  headers,
  name: "Async users",
  loading: false,
  asyncPages: 2,
  setLoading: (payload) => {
    if (typeof payload !== "boolean") {
      payload.pages.toFixed();
      payload.searchTerm.toUpperCase();
    }
  },
  onReload: () => {},
  pageSizeOptions: [10, 25],
  persistSearch: true,
};

const syncProps: UniversalTableProps = {
  data: rows,
  headers,
  name: "Sync users",
  loading: false,
  setLoading: (loading: boolean) => {
    loading.valueOf();
  },
};

const fetchRows = async (query: FetchRowsQuery): Promise<FetchRowsResult> => {
  query.page.toFixed();
  query.searchTerm.toUpperCase();
  query.column.toUpperCase();
  query.direction.toUpperCase();
  query.signal.aborted.valueOf();
  return { rows, totalCount: rows.length };
};

const fetchProps: UniversalTableProps = {
  headers,
  name: "Server-paginated users",
  fetchRows,
  filters: { status: "open" },
  reset: 0,
  pageSizeOptions: [10, 25],
  persistSearch: true,
};

// @ts-expect-error — fetchRows mode does not accept `data`
const invalidFetchProps: UniversalTableProps = {
  headers,
  fetchRows,
  data: rows,
};

export function ConsumerExamples() {
  return (
    <>
      <UniversalTable {...asyncProps} />
      <UniversalTable {...syncProps} />
      <UniversalTable {...fetchProps} />
      <NamedUniversalTable
        data={[{ id: 1, children: rows }]}
        headers={nestedHeaders}
        name="Nested users"
        selectRows
        selectID="id"
        onSelection={(selectedIds) => {
          selectedIds.map(String);
        }}
      />
    </>
  );
}
