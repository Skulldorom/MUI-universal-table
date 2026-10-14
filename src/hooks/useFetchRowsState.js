import React from "react";

function sortDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }
  if (value !== null && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortDeep(value[key]);
        return accumulator;
      }, {});
  }
  return value;
}

/**
 * Value-based (not identity-based) serialization, so inline `filters={{...}}`
 * objects don't retrigger resets on every render. Filters/reset signals must
 * be JSON-serializable; unserializable values are treated as "unchanged".
 */
function serialize(value) {
  if (value === undefined) {
    return undefined;
  }
  try {
    return JSON.stringify(sortDeep(value));
  } catch {
    return null;
  }
}

const initialState = {
  rows: [],
  totalCount: null,
  lastPage: 0,
  lastPageHadRows: false,
  loading: false,
  loadingMore: false,
  error: false,
  loadMoreError: false,
  queryVersion: 0,
};

/**
 * Whether another server page should be fetched. A zero-row page is treated
 * as end-of-data even when `totalCount` still implies more, so a stale count
 * (concurrent deletes, filters, server bug) can't spin into an endless fetch
 * loop.
 */
function computeHasMore(state) {
  if (!state.lastPageHadRows) {
    return false;
  }
  return state.totalCount === null || state.rows.length < state.totalCount;
}

/**
 * Table-owned server pagination state machine ("fetch rows" mode).
 *
 * The consumer provides `fetchRows(query)`; this hook owns the loaded rows,
 * the server total, request sequencing (abort + stale-generation guards), and
 * the distinct loading / loading-more / error states.
 *
 * - `resetQuery(overrides?)` — new query: aborts in-flight requests, clears
 *   loaded rows, and fetches page 1. Used for search, sort, reload, and
 *   external `filters` / `reset` prop changes.
 * - `loadMore()` — appends the next server page. Guarded against concurrent
 *   calls and end-of-data; safe to call repeatedly (e.g. as a retry).
 */
export default function useFetchRowsState({
  enabled,
  fetchRows,
  filters,
  resetSignal,
  searchTerm,
  column,
  direction,
}) {
  const [state, setState] = React.useState(initialState);

  const stateRef = React.useRef(state);
  const generationRef = React.useRef(0);
  const controllerRef = React.useRef(null);
  const latestRef = React.useRef({
    enabled,
    fetchRows,
    filters,
    searchTerm,
    column,
    direction,
  });

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    latestRef.current = {
      enabled,
      fetchRows,
      filters,
      searchTerm,
      column,
      direction,
    };
  });

  const runFetch = React.useCallback((page, { append, newGeneration }) => {
    const current = latestRef.current;
    if (!current.enabled || typeof current.fetchRows !== "function") {
      return;
    }

    if (newGeneration) {
      generationRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();
    }
    const generation = generationRef.current;
    const signal = controllerRef.current
      ? controllerRef.current.signal
      : undefined;

    setState((previous) =>
      append
        ? { ...previous, loadingMore: true, loadMoreError: false }
        : {
            ...initialState,
            loading: true,
            queryVersion: previous.queryVersion + 1,
          },
    );

    current
      .fetchRows({
        page,
        searchTerm: current.searchTerm,
        column: current.column,
        direction: current.direction,
        filters: current.filters,
        signal,
      })
      .then((result) => {
        if (generation !== generationRef.current) {
          return;
        }
        const rows = Array.isArray(result?.rows) ? result.rows : [];
        setState((previous) => ({
          ...previous,
          rows: append ? [...previous.rows, ...rows] : rows,
          totalCount:
            typeof result?.totalCount === "number"
              ? result.totalCount
              : previous.totalCount,
          lastPage: page,
          lastPageHadRows: rows.length > 0,
          loading: false,
          loadingMore: false,
        }));
      })
      .catch(() => {
        if (generation !== generationRef.current) {
          return;
        }
        setState((previous) => ({
          ...previous,
          loading: false,
          loadingMore: false,
          ...(append ? { loadMoreError: true } : { error: true }),
        }));
      });
  }, []);

  const resetQuery = React.useCallback(
    (overrides) => {
      if (overrides && typeof overrides === "object") {
        latestRef.current = { ...latestRef.current, ...overrides };
      }
      runFetch(1, { append: false, newGeneration: true });
    },
    [runFetch],
  );

  const loadMore = React.useCallback(() => {
    const current = stateRef.current;
    if (current.loading || current.loadingMore || current.error) {
      return;
    }
    if (current.lastPage === 0) {
      return;
    }
    if (!computeHasMore(current)) {
      return;
    }
    runFetch(current.lastPage + 1, { append: true, newGeneration: false });
  }, [runFetch]);

  // Initial load.
  React.useEffect(() => {
    resetQuery();
  }, [resetQuery]);

  // External watched values: a *value* change to `filters` or the `reset`
  // signal restarts the query from page 1. The initial mount is ignored —
  // the mount effect above owns the first fetch.
  const filtersSerialized = serialize(filters);
  const resetSerialized = serialize(resetSignal);
  const watchedRef = React.useRef({
    filters: filtersSerialized,
    reset: resetSerialized,
  });

  React.useEffect(() => {
    const previous = watchedRef.current;
    watchedRef.current = { filters: filtersSerialized, reset: resetSerialized };
    if (
      previous.filters === filtersSerialized &&
      previous.reset === resetSerialized
    ) {
      return;
    }
    resetQuery();
  }, [filtersSerialized, resetSerialized, resetQuery]);

  // Drop late responses and abort in-flight requests on unmount.
  React.useEffect(() => {
    return () => {
      generationRef.current += 1;
      controllerRef.current?.abort();
    };
  }, []);

  const hasMore = computeHasMore(state);

  return {
    rows: state.rows,
    totalCount: state.totalCount,
    hasMore,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    loadMoreError: state.loadMoreError,
    queryVersion: state.queryVersion,
    resetQuery,
    loadMore,
  };
}
