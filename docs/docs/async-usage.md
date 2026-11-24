# Async / Server-side Usage

Use `fetchRows` mode when your API handles searching, sorting, and pagination.
The table owns the rows state and fetches one server page at a time, on demand —
no eager multi-page waterfalls, and the pagination footer reflects the real
server total.

## 1) Provide a data source

```jsx
<UniversalTable
  headers={headers}
  name="Users"
  fetchRows={async (filters, signal) => {
    if (filters.page === 1) {
      const [rows, count] = await Promise.all([
        api.getUsers(filters, signal),
        api.getUserCount(filters),
      ]);
      return { rows, totalCount: count };
    }
    const rows = await api.getUsers(filters, signal);
    return { rows };
  }}
/>
```

`fetchRows` is called with two arguments — the filter payload and an abort
signal:

```ts
fetchRows(filters, signal);

// filters:
{
  page: number;                  // server page requested (1-based)
  pageSize: number;              // rows requested (current rows-per-page)
  searchTerm: string;
  column: string;
  direction: "asc" | "desc";
  ...yourFilters;                // spread of the `filters` prop
}

// signal: AbortSignal — aborted when the query is superseded
```

Return `{ rows, totalCount }`. Return at most `pageSize` rows for the requested
page. Provide `totalCount` on page 1 — it drives the pagination footer
("1–25 of 4,321") and end-of-data detection. Later pages may omit it.

The table handles the rest:

- **Initial load** fetches exactly page 1 (skeleton while in flight) with the
  current `pageSize`.
- **Rows per page** controls `pageSize`. Changing it resets to page 1 and
  refetches, so the server always knows how many rows the table expects.
- **Sequential pagination**: the footer exposes the loaded rows plus, at most,
  one page of headroom. Clicking next/last requests the immediate next server
  page, so navigation is one page at a time — there is no "jump to page 50"
  (the table can only append). `totalCount` still drives the "1–25 of 4,321"
  label; without it the label reads "1–25+" and the next button stays enabled
  until a page comes back empty.
- **Load more** fires automatically when the pager reaches the last loaded
  page, showing an inline "loading more" indicator distinct from the initial
  skeleton.
- **Search** (500 ms debounce), **sortable header clicks**, and the **reload
  button** reset to page 1, clear stale rows, and abort in-flight requests.
  Only columns marked `sortable: true` are sortable in this mode; every other
  header is disabled (the server owns the ordering).
- **Already-loaded pages are cached** — paging backwards costs no request.
- **Failures** show a retry control; a failed next-page fetch keeps all
  previously loaded rows.

## 2) External filters (`filters` prop)

Pass domain-specific filter values (advanced search panels, dropdowns…) via
the `filters` prop. It must be a plain, JSON-serializable object. The table
compares it **by value** and resets to page 1 whenever it changes. The table's
own `page`, `searchTerm`, `column` and `direction` are merged into it for you,
so just forward the whole object:

```jsx
const [filters, setFilters] = React.useState({ status: "", currency: "" });

<UniversalTable
  headers={headers}
  name="Orders"
  filters={filters}
  fetchRows={async (filters, signal) => {
    const rows = await api.getOrders(filters, signal);
    return { rows };
  }}
/>

// "Search" button in your filter panel:
const applyFilters = () => setFilters(draftFilters);
```

Inline objects are safe — <span v-pre>`filters={{ status: "open" }}`</span> will
not cause refetch loops, because comparison is by value, not identity.
Unserializable `filters` values are unsupported and ignored for change
detection.

## 3) Refresh after mutations (`reset` prop)

When data changes outside the table (create / edit / delete), change the
`reset` signal to make the table discard loaded rows and refetch from page 1:

```jsx
const [reset, setReset] = React.useState(0);

const saveNote = async (note) => {
  await api.editOrderNote(note);
  setReset((value) => value + 1); // table refetches from page 1
};

<UniversalTable ... reset={reset} />
```

Use an incrementing counter (not a boolean toggle) so consecutive resets
always register.

## 4) Custom reload behavior

`onReload` still takes priority for reload-button clicks, in every mode.

## 5) Parent access to the table state (optional)

In `fetchRows` mode the table owns its state. Two opt-in hooks let the parent
observe it and drive it.

### Observe state — `onStateChange`

`onStateChange` fires with a snapshot whenever the fetch state actually changes:

```jsx
const [tableState, setTableState] = React.useState(null);

<>
  <GlobalSpinner visible={tableState?.loading ?? true} />
  <UniversalTable
    headers={headers}
    name="Users"
    fetchRows={fetchRows}
    onStateChange={setTableState}
  />
</>
```

The snapshot is:

```ts
{
  loading: boolean;        // full (re)load in progress
  loadingMore: boolean;    // appending the next page
  loadMoreError: boolean;  // latest next-page (append) failed
  error: boolean;          // latest full load failed
  hasMore: boolean;        // another page is available
  totalCount: number | null;
  loadedCount: number;     // rows currently loaded
}
```

This is a one-way, read-only mirror — the table stays the source of truth.
Don't feed the snapshot back in as props; use the commands below to influence
the table. Store only the fields you need if re-renders matter.

### Command the table — `reset` and `loadMoreSignal`

Both commands are declarative: you change a prop and the table reacts.

```jsx
const [reset, setReset] = React.useState(0);
const [loadMore, setLoadMore] = React.useState(0);

<>
  <button onClick={() => setReset((n) => n + 1)}>Refresh</button>
  <button onClick={() => setLoadMore((n) => n + 1)}>Load more</button>
  <UniversalTable
    headers={headers}
    name="Users"
    fetchRows={fetchRows}
    reset={reset}
    loadMoreSignal={loadMore}
  />
</>
```

- `reset` — discard loaded rows and refetch from page 1 (also used after
  external mutations).
- `loadMoreSignal` — append the next server page. Bump it (an incrementing
  counter, not a boolean) so repeated clicks always register. No-op while a
  request is in flight or at end of data.

Prefer `onStateChange` for reactive state; there is no imperative getter.

## Upgrading from `asyncPages` (removed)

The legacy `asyncPages` prop and its `setLoading` payload mode have been
removed. It eagerly fetched N pages up front and paginated client-side over
only those rows, so rows beyond page N were silently unreachable. Replace it
with `fetchRows`:

```diff
- <UniversalTable
-   data={data}
-   loading={loading}
-   setLoading={loadFiltered}
-   asyncPages={5}
- />
+ <UniversalTable
+   filters={filters}
+   reset={reset}
+   fetchRows={async (filters, signal) => {
+     if (filters.page === 1) {
+       const [rows, pages] = await Promise.all([
+         getOrders(filters, signal),
+         getOrderPages(filters),
+       ]);
+       return { rows, totalCount: pages.filterCount * PAGE_SIZE };
+     }
+     return { rows: await getOrders(filters, signal) };
+   }}
+ />
```

- Search, sort and filters now flow through `fetchRows` automatically.
- Post-mutation refresh → bump the `reset` prop.
- Loading state you previously drove via `setLoading` → observe with
  `onStateChange`; trigger actions with `reset` / `loadMoreSignal`.

