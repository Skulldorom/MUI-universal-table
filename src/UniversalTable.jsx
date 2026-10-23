import React from "react";
import PropTypes from "prop-types";
import Paper from "@mui/material/Paper";
import useSearchableRows from "./hooks/useSearchableRows";
import useSelectableRows from "./hooks/useSelectableRows";
import useFetchRowsState from "./hooks/useFetchRowsState";
import { getInitialPageSize } from "./utils/tableUtils";
import TableSelectionBanner from "./components/TableSelectionBanner";
import TableTitle from "./components/TableTitle";
import TableToolbarContent from "./components/TableToolbarContent";
import EnhancedTable from "./components/EnhancedTable";

export default function UniversalTable({
  loading,
  setLoading,
  onReload,
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
  fetchRows,
  filters,
  reset,
  onStateChange,
  loadMoreSignal,
}) {
  const debounceRef = React.useRef(null);
  // Assigned after `useSelectableRows` so an external filters/reset change can
  // drop selection without the fetch hook depending on the selection hook.
  const clearSelectionRef = React.useRef(() => {});

  const fetchMode = typeof fetchRows === "function";

  // Cancel any pending search debounce so a queued reset can't fire after
  // (and supersede) a sort/reload/external reset performed in the meantime.
  const cancelPendingSearch = React.useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = null;
  }, []);

  const handleExternalReset = React.useCallback(() => {
    cancelPendingSearch();
    clearSelectionRef.current();
  }, [cancelPendingSearch]);

  const head = headers || [];
  const { rows: searchableRows, searchTerm, setSearchTerm } = useSearchableRows(
    data,
    head,
    fetchMode,
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
    onExternalReset: handleExternalReset,
    initialPageSize: getInitialPageSize(pageSizeOptions),
  });

  const rows = fetchMode ? fetchState.rows : searchableRows;
  const { resetQuery, loadMore } = fetchState;
  const { selected, clearSelection, handleSelectAllClick, handleClick } =
    useSelectableRows({
      rows,
      selectRows,
      selectID,
    });

  React.useEffect(() => {
    clearSelectionRef.current = clearSelection;
  }, [clearSelection]);

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
    } else {
      handleSearchChange(searchValue);
    }
  };

  React.useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  // Stable snapshot of the internal fetch state, published to consumers via
  // `onStateChange`.
  const fetchSnapshot = React.useMemo(
    () => ({
      loading: fetchState.loading,
      loadingMore: fetchState.loadingMore,
      loadMoreError: fetchState.loadMoreError,
      error: fetchState.error,
      hasMore: fetchState.hasMore,
      totalCount: fetchState.totalCount,
      loadedCount: fetchState.rows.length,
    }),
    [
      fetchState.loading,
      fetchState.loadingMore,
      fetchState.loadMoreError,
      fetchState.error,
      fetchState.hasMore,
      fetchState.totalCount,
      fetchState.rows.length,
    ],
  );

  // Observe: notify the consumer whenever the fetch state actually changes.
  // Seeded with the initial snapshot so the mount render doesn't emit a
  // spurious pre-fetch "idle" state.
  const emittedStateRef = React.useRef(fetchSnapshot);
  React.useEffect(() => {
    if (!fetchMode || emittedStateRef.current === fetchSnapshot) {
      return;
    }
    emittedStateRef.current = fetchSnapshot;
    onStateChange?.(fetchSnapshot);
  }, [fetchMode, fetchSnapshot, onStateChange]);

  // Command: bump `loadMoreSignal` (e.g. a counter) to append the next page.
  // Declarative equivalent of an imperative `loadMore()`; reload is already
  // covered by the `reset` prop.
  const loadMoreSignalRef = React.useRef(loadMoreSignal);
  React.useEffect(() => {
    if (!fetchMode || Object.is(loadMoreSignalRef.current, loadMoreSignal)) {
      return;
    }
    loadMoreSignalRef.current = loadMoreSignal;
    loadMore();
  }, [fetchMode, loadMoreSignal, loadMore]);

  const handleReload = React.useCallback(() => {
    if (typeof onReload === "function") {
      onReload();
      return;
    }
    if (fetchMode) {
      cancelPendingSearch();
      resetQuery();
      return;
    }
    if (typeof setLoading === "function") {
      setLoading(true);
    }
  }, [fetchMode, resetQuery, onReload, setLoading, cancelPendingSearch]);

  // Server-sort bridge: useEnhancedTableState calls its `apiCall` with a
  // payload object; in fetch mode only the column/direction matter.
  const handleFetchSort = React.useCallback(
    ({ column, direction }) => {
      cancelPendingSearch();
      resetQuery({ column, direction });
    },
    [resetQuery, cancelPendingSearch],
  );

  return (
    <>
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
            reloadBtnLoading={
              reloadBtnLoading || (fetchMode && fetchState.loading)
            }
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
          async={fetchMode}
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
                  onPageSizeChange: fetchState.changePageSize,
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
  /** Required in sync mode; unused (and optional) in `fetchRows` mode. */
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
  /**
   * Server-side pagination data source. When provided, the table owns the
   * rows state and calls this function whenever it needs a page:
   * `(filters, signal) => Promise<{ rows: array, totalCount?: number }>`
   * where `filters` is the `filters` prop merged with the table's current
   * `page`, `searchTerm`, `column` and `direction`.
   * `totalCount` should be returned on page 1 (drives the footer and
   * end-of-data detection); later pages may omit it.
   */
  fetchRows: PropTypes.func,
  /**
   * Plain, JSON-serializable filter object. Merged with the table's
   * pagination/search/sort state and passed through to `fetchRows`. Compared
   * by value — changing it resets to page 1.
   */
  filters: PropTypes.object,
  /**
   * Opaque reset signal — bump it (e.g. a counter) after external mutations
   * to make the table discard loaded rows and refetch from page 1.
   */
  reset: PropTypes.any,
  /**
   * `fetchRows` mode only. Called with the fetch state snapshot whenever it
   * changes: `{ loading, loadingMore, loadMoreError, error, hasMore, totalCount, loadedCount }`.
   * Use it to drive parent-level UI (spinners, banners, counters).
   */
  onStateChange: PropTypes.func,
  /**
   * `fetchRows` mode only. Bump this value (e.g. an incrementing counter) to
   * append the next server page — the declarative equivalent of a manual
   * "Load more". Reload is covered by the `reset` prop.
   */
  loadMoreSignal: PropTypes.any,
};
