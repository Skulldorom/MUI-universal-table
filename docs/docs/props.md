# Props Reference

## UniversalTable props

| Prop               | Type      | Default                   | Description                                                                                          |
| ------------------ | --------- | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `data`             | `array`   | **required** (sync)       | Array of data objects to display. Not used in `fetchRows` mode — the table owns the rows            |
| `headers`          | `array`   | **required**              | Array of header configuration objects                                                                |
| `name`             | `string`  | -                         | Table title                                                                                          |
| `loading`          | `bool`    | `false`                   | Shows loading state                                                                                  |
| `setLoading`       | `func`    | -                         | Called with `true` when the user clicks reload (legacy — prefer `onReload`). Not used in `fetchRows` mode |
| `onReload`         | `func`    | -                         | Preferred reload callback — takes priority for reload-button clicks                                  |
| `fetchRows`        | `func`    | -                         | Server-side pagination data source: `(query) => Promise<{ rows, totalCount? }>` — see [Async Usage](./async-usage) |
| `filters`          | `any`     | -                         | Opaque filter values passed through to `fetchRows`. Compared by value (JSON-serializable) — a change resets to page 1 |
| `reset`            | `any`     | -                         | Reset signal for `fetchRows` mode — change it (e.g. an incrementing counter) after external mutations to refetch from page 1 |
| `onStateChange`    | `func`    | -                         | `fetchRows` mode only — called with the fetch state snapshot (`loading`, `loadingMore`, `error`, `hasMore`, `totalCount`, `loadedCount`) whenever it changes |
| `loadMoreSignal`   | `any`     | -                         | `fetchRows` mode only — bump it (e.g. an incrementing counter) to append the next server page; reload is handled by `reset` |
| `selectRows`       | `bool`    | `false`                   | Enable row selection                                                                                 |
| `selectID`         | `string`  | -                         | Property to use as unique identifier for selection                                                   |
| `onSelection`      | `func`    | -                         | Callback when rows are selected                                                                      |
| `subTable`         | `bool`    | `false`                   | Whether this is a nested sub-table                                                                   |
| `hideBadge`        | `bool`    | `false`                   | Hide badges on expandable rows                                                                       |
| `reloadBtnLoading` | `bool`    | `false`                   | Loading state for reload button                                                                      |
| `selectIcon`       | `element` | -                         | Custom icon for selection action                                                                     |
| `pageSizeOptions`  | `number[]`| -                         | Override default page size options (e.g. `[10, 25, 50]`)                                             |
| `persistSearch`    | `bool`    | `false`                   | Persist the search term to `sessionStorage` (requires `name` prop)                                   |

## Header object fields

| Property     | Type      | Description                                              |
| ------------ | --------- | -------------------------------------------------------- |
| `id`         | `string`  | **Required** - Column identifier (matches data property) |
| `label`      | `string`  | **Required** - Display label for column                  |
| `searchable` | `bool`    | Whether this column is searchable                        |
| `numeric`    | `bool`    | Right-align column for numeric data                      |
| `date`       | `bool`    | Format as date/time                                      |
| `sortable`   | `bool`    | In `fetchRows` mode, marks this column as server-sortable — clicking the header requests a server sort instead of sorting client-side. Otherwise the column sorts client-side |
| `component`  | `func`    | Custom render function `(rowData) => ReactElement`       |
| `cellProps`  | `object`  | Additional props for table cells                         |
| `subRow`     | `bool`    | Column contains expandable sub-table data                |
| `iconColor`  | `string`  | Color for expand/collapse icons                          |
| `openIcon`   | `element` | Custom icon for expanding                                |
| `closeIcon`  | `element` | Custom icon for collapsing                               |
