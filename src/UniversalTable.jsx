/* global process */
import React from "react";
import PropTypes from "prop-types";
import Paper from "@mui/material/Paper";
import LazyLoadingIndicator from "./components/LazyLoadingIndicator";
import useSearchableRows from "./hooks/useSearchableRows";
import useSelectableRows from "./hooks/useSelectableRows";
import useFetchRowsState from "./hooks/useFetchRowsState";
import TableSelectionBanner from "./components/TableSelectionBanner";
import TableTitle from "./components/TableTitle";
import TableToolbarContent from "./components/TableToolbarContent";
import EnhancedTable from "./components/EnhancedTable";

let asyncPagesDeprecationWarned = false;

function warnAsyncPagesDeprecated() {
  if (asyncPagesDeprecationWarned) {
    return;
  }
  asyncPagesDeprecationWarned = true;
  // Dev-only notice: guarded so browsers without `process` never crash and
  // test/production builds never emit it.
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "development"
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "UniversalTable: `asyncPages` is deprecated and will be removed in a future major release. " +
        "Use `fetchRows` for true incremental server-side pagination instead.",
    );
  }
}

export default function UniversalTable({
  loading,
  setLoading,
  onReload,
  lazyloading = false,
  currentPage,
  totalPages,
  data = [],
  headers,
  name,
  reloadBtnLoading,
  subTable = false,
  hideBadge = false,
  selectRows = false,
  selectID,
  selectIcon,
  onSelection,
  pageSizeOptions,
  persistSearch,
  asyncPages,
  fetchRows,
  filters,
  reset,
}) {
  const debounceRef = React.useRef(null);
  const hasLoadedInitialAsyncPageRef = React.useRef(false);

  const fetchMode = typeof fetchRows === "function";
  const legacyAsync =
    !fetchMode && typeof asyncPages === "number" && asyncPages > 0;
  const async = fetchMode || legacyAsync;

  const head = headers || [];
  const { rows: searchableRows, searchTerm, setSearchTerm } = useSearchableRows(
    data,
    head,
    async,
  );
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("");

  const fetchState = useFetchRowsState({
    enabled: fetchMode,
    fetchRows,
    filters,
    resetSignal: reset,
    searchTerm,
    column: orderBy,
    direction: order,
  });

  const rows = fetchMode ? fetchState.rows : searchableRows;
  const { resetQuery } = fetchState;
  const { selected, clearSelection, handleSelectAllClick, handleClick } =
    useSelectableRows({
      rows,
      selectRows,
      selectID,
    });

  const handleSearchChange = React.useCallback(
    (value) => {
      clearSelection();
      setSearchTerm(value);
    },
    [clearSelection, setSearchTerm],
  );

  const handleSelection = React.useCallback(
    (selectedIds) => {
      if (typeof onSelection !== "function") {
        return;
      }
      const result = onSelection(selectedIds);
      if (result instanceof Promise) {
        result.then(() => clearSelection());
        return;
      }
      clearSelection();
    },
    [onSelection, clearSelection],
  );

  const handleSearch = (searchValue) => {
    if (fetchMode) {
      clearSelection();
      setSearchTerm(searchValue);
      clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        fetchState.resetQuery({ searchTerm: searchValue });
      }, 500);
    } else if (legacyAsync) {
      setSearchTerm(searchValue);
      clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        setLoading({
          searchTerm: searchValue,
          direction: order,
          column: orderBy,
          pages: asyncPages,
        });
      }, 500);
    } else {
      handleSearchChange(searchValue);
    }
  };

  React.useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  React.useEffect(() => {
    if (!legacyAsync || hasLoadedInitialAsyncPageRef.current) {
      return;
    }

    hasLoadedInitialAsyncPageRef.current = true;
    setLoading({
      searchTerm,
      direction: order,
      column: orderBy,
      pages: asyncPages,
    });
  }, [legacyAsync, asyncPages, order, orderBy, searchTerm, setLoading]);

  React.useEffect(() => {
    if (legacyAsync) {
      warnAsyncPagesDeprecated();
    }
  }, [legacyAsync]);

  const handleReload = React.useCallback(() => {
    if (typeof onReload === "function") {
      onReload();
      return;
    }
    if (fetchMode) {
      resetQuery();
      return;
    }
    if (typeof setLoading === "function") {
      setLoading(
        legacyAsync
          ? { searchTerm, direction: order, column: orderBy, pages: asyncPages }
          : true,
      );
    }
  }, [
    fetchMode,
    resetQuery,
    legacyAsync,
    onReload,
    setLoading,
    searchTerm,
    order,
    orderBy,
    asyncPages,
  ]);

  // Server-sort bridge: useEnhancedTableState calls its `apiCall` with a
  // payload object; in fetch mode only the column/direction matter.
  const handleFetchSort = React.useCallback(
    ({ column, direction }) => {
      resetQuery({ column, direction });
    },
    [resetQuery],
  );

  return (
    <>
      <LazyLoadingIndicator
        show={lazyloading}
        currentPage={currentPage}
        totalPages={totalPages}
      />
      <Paper
        sx={{
          ...(subTable && { boxShadow: "none" }),
        }}
      >
        <TableSelectionBanner
          selected={selected}
          onSelection={handleSelection}
          selectIcon={selectIcon}
        />
        <TableTitle name={name} subTable={subTable} />
        {!subTable && (
          <TableToolbarContent
            onReload={
              typeof onReload === "function" ||
              typeof setLoading === "function" ||
              fetchMode
                ? handleReload
                : undefined
            }
            reloadBtnLoading={reloadBtnLoading}
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            name={name}
            persistSearch={persistSearch}
          />
        )}
        <EnhancedTable
          headers={head}
          rows={rows}
          resetFlag={fetchMode ? fetchState.queryVersion : searchTerm}
          searchTerm={searchTerm}
          subTable={subTable}
          hideBadge={hideBadge}
          loading={fetchMode ? fetchState.loading : loading}
          selectRows={selectRows}
          handleSelectAllClick={handleSelectAllClick}
          handleClick={handleClick}
          selected={selected}
          selectID={selectID}
          pageSizeOptions={pageSizeOptions}
          name={name}
          setLoading={fetchMode ? handleFetchSort : setLoading}
          order={order}
          orderBy={orderBy}
          setOrder={setOrder}
          setOrderBy={setOrderBy}
          asyncPages={asyncPages}
          async={async}
          fetchState={
            fetchMode
              ? {
                  totalCount: fetchState.totalCount,
                  hasMore: fetchState.hasMore,
                  loadingMore: fetchState.loadingMore,
                  loadMoreError: fetchState.loadMoreError,
                  error: fetchState.error,
                  onLoadMore: fetchState.loadMore,
                  onRetry: fetchState.resetQuery,
                }
              : undefined
          }
        />
      </Paper>
    </>
  );
}

UniversalTable.propTypes = {
  loading: PropTypes.bool,
  setLoading: PropTypes.func,
  /** Preferred callback — fires when the user clicks reload. */
  onReload: PropTypes.func,
  lazyloading: PropTypes.bool,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  /** Required in sync/async modes; unused (and optional) in `fetchRows` mode. */
  data: PropTypes.array,
  headers: PropTypes.array.isRequired,
  name: PropTypes.string,
  reloadBtnLoading: PropTypes.bool,
  subTable: PropTypes.bool,
  hideBadge: PropTypes.bool,
  selectRows: PropTypes.bool,
  selectID: PropTypes.string,
  selectIcon: PropTypes.element,
  onSelection: PropTypes.func,
  /** Override default page size options (e.g. [10, 25, 50]). Default auto-computed. */
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  /** Persist search term to sessionStorage (requires name prop). Default: false */
  persistSearch: PropTypes.bool,
  /** @deprecated Use `fetchRows` for true server-side pagination. */
  asyncPages: PropTypes.number,
  /**
   * Server-side pagination data source. When provided, the table owns the
   * rows state and calls this function whenever it needs a page:
   * `(query: { page, searchTerm, column, direction, filters, signal }) =>
   *   Promise<{ rows: array, totalCount?: number }>`
   * `totalCount` should be returned on page 1 (drives the footer and
   * end-of-data detection); later pages may omit it.
   */
  fetchRows: PropTypes.func,
  /**
   * Opaque consumer filter values passed through to `fetchRows`. Compared by
   * value (must be JSON-serializable) — changing it resets to page 1.
   */
  filters: PropTypes.any,
  /**
   * Opaque reset signal — bump it (e.g. a counter) after external mutations
   * to make the table discard loaded rows and refetch from page 1.
   */
  reset: PropTypes.any,
};
