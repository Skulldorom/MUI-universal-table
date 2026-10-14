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
  fetchRows={async ({ page, searchTerm, column, direction, signal }) => {
    if (page === 1) {
      const [rows, count] = await Promise.all([
        api.getUsers({ page, searchTerm, column, direction }, signal),
        api.getUserCount({ searchTerm }),
      ]);
      return { rows, totalCount: count };
    }
    const rows = await api.getUsers({ page, searchTerm, column, direction }, signal);
    return { rows };
  }}
/>
```

The query object the table passes to `fetchRows`:

```ts
{
  page: number;                    // server page requested (1-based)
  searchTerm: string;
  column: string;
  direction: "asc" | "desc";
  filters?: unknown;               // pass-through of the `filters` prop
  signal: AbortSignal;             // aborted when the query is superseded
}
```

Return `{ rows, totalCount }`. Provide `totalCount` on page 1 — it drives the
pagination footer ("1–25 of 4,321") and end-of-data detection. Later pages may
omit it.

The table handles the rest:

- **Initial load** fetches exactly page 1 (skeleton while in flight).
- **Load more** fires automatically when the user paginates to the end of the
  loaded rows, with an inline "loading more" indicator distinct from the
  initial skeleton.
- **Search** (500 ms debounce), **sortable header clicks**, and the **reload
  button** reset to page 1, clear stale rows, and abort in-flight requests.
- **Already-loaded pages are cached** — paging backwards costs no request.
- **Failures** show a retry control; a failed next-page fetch keeps all
  previously loaded rows.

## 2) External filters (`filters` prop)

Pass domain-specific filter values (advanced search panels, dropdowns…) via
the `filters` prop. The table compares it **by value** (it must be
JSON-serializable) and resets to page 1 whenever it changes:

```jsx
const [filters, setFilters] = React.useState({ status: "", currency: "" });

<UniversalTable
  headers={headers}
  name="Orders"
  filters={filters}
  fetchRows={async ({ page, filters, signal }) => {
    const rows = await api.getOrders({ page, ...filters }, signal);
    return { rows };
  }}
/>

// "Search" button in your filter panel:
const applyFilters = () => setFilters(draftFilters);
```

Inline objects are safe — `filters={{ status: "open" }}` will not cause
refetch loops, because comparison is by value, not identity.

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

## Migrating from `asyncPages` (deprecated)

`asyncPages` keeps working, but it eagerly fetches N pages up front and
paginates client-side over only those rows — rows beyond page N are silently
unreachable. Migrate like so:

```diff
- const { loadingIndicator, currentPage, totalPages, loading, data, loadFiltered } =
-   usePagesLoading({ getData: getOrders, getPages: getOrderPages, getFilterData });
+ const [filters, setFilters] = React.useState(initialFilters);
+ const [reset, setReset] = React.useState(0);

  <UniversalTable
    headers={headers}
    name="Orders"
-   data={data}
-   loading={loading}
-   lazyloading={loadingIndicator}
-   currentPage={currentPage}
-   totalPages={totalPages}
-   setLoading={loadFiltered}
-   asyncPages={5}
+   filters={filters}
+   reset={reset}
+   fetchRows={async ({ page, searchTerm, column, direction, filters, signal }) => {
+     const query = { ...filters, searchTerm, column, direction, currentPage: page };
+     if (page === 1) {
+       const [rows, pages] = await Promise.all([getOrders(query, signal), getOrderPages(query)]);
+       return { rows, totalCount: pages.filterCount * PAGE_SIZE };
+     }
+     return { rows: await getOrders(query, signal) };
+   }}
  />
```

- Advanced-search "apply" button → `setFilters(draft)`.
- Post-mutation refresh → `setReset((v) => v + 1)`.
- Client-side `setData(filtered)` shortcuts → delete; a reset now costs one
  page request.
