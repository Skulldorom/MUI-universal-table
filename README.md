# MUI Universal Table

[![Tests](https://github.com/Skulldorom/MUI-universal-table/actions/workflows/tests.yml/badge.svg)](https://github.com/Skulldorom/MUI-universal-table/actions/workflows/tests.yml)
[![Release](https://github.com/Skulldorom/MUI-universal-table/actions/workflows/release.yml/badge.svg)](https://github.com/Skulldorom/MUI-universal-table/actions/workflows/release.yml)
[![GitHub release](https://img.shields.io/github/v/release/Skulldorom/MUI-universal-table)](https://github.com/Skulldorom/MUI-universal-table/releases)
[![Ko-fi](https://img.shields.io/badge/Support%20on-Ko--fi-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/skulldorom)

A comprehensive, feature-rich table component built with Material-UI for React applications.

<p align="center">
  <a href="https://ko-fi.com/skulldorom"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi" /></a>
</p>

## Features

- 🔍 **Built-in Search** - Filter data across searchable columns
- 📄 **Pagination** - Handle large datasets with customizable page sizes
- 🔄 **Sorting** - Sort by any column with visual indicators
- ✅ **Row Selection** - Single or multiple row selection with checkboxes
- 📊 **Sub-tables** - Expandable nested tables for hierarchical data
- 🎨 **Customizable** - Extensive styling and behavior customization
- ⚡ **Performance** - Optimized for large datasets with lazy loading support
- 🔄 **Refresh** - Built-in reload functionality
- 📱 **Responsive** - Mobile-friendly design

## Installation

```bash
npm install mui-universal-table
```

### Peer Dependencies

Make sure you have these peer dependencies installed:

```bash
npm install react react-dom @mui/material @emotion/react @emotion/styled @mui/icons-material prop-types
```

## Basic Usage

```jsx
import React from "react";
import { UniversalTable } from "mui-universal-table";

const headers = [
  { id: "name", label: "Name", searchable: true },
  { id: "email", label: "Email", searchable: true },
  { id: "age", label: "Age", numeric: true },
];

const data = [
  { name: "John Doe", email: "john@example.com", age: 30 },
  { name: "Jane Smith", email: "jane@example.com", age: 25 },
];

function MyTable() {
  const [loading, setLoading] = React.useState(false);

  return (
    <UniversalTable
      data={data}
      headers={headers}
      name="Users"
      loading={loading}
      setLoading={setLoading}
    />
  );
}
```

## Props

| Prop               | Type       | Default                     | Description                                                                                                                                              |
| ------------------ | ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`             | `array`    | **required** (sync)         | Array of data objects to display. Not used in `fetchRows` mode — the table owns the rows                                                                 |
| `headers`          | `array`    | **required**                | Array of header configuration objects                                                                                                                    |
| `name`             | `string`   | -                           | Table title                                                                                                                                              |
| `loading`          | `bool`     | `false`                     | Shows skeleton loading state over the table                                                                                                              |
| `setLoading`       | `func`     | -                           | Called with `true` when the user clicks reload (legacy — prefer `onReload`). Not used in `fetchRows` mode                                                |
| `onReload`         | `func`     | -                           | Preferred reload callback — fires when the user clicks the reload button. Takes priority over `setLoading`/internal refetch for reload                   |
| `fetchRows`        | `func`     | -                           | Server-side pagination data source: `(filters, signal) => Promise<{ rows, totalCount? }>` where `filters` is your `filters` prop merged with `page`/`pageSize`/`searchTerm`/`column`/`direction`. Return at most `pageSize` rows. The table fetches page 1 on mount/query changes and appends pages on demand — see [Server-side pagination](https://skulldorom.github.io/MUI-universal-table/docs/async-usage) |
| `filters`          | `object`   | -                           | Plain JSON-serializable filter object merged into the `filters` query sent to `fetchRows`. Compared by value — a change resets the table to page 1  |
| `reset`            | `any`      | -                           | Reset signal for `fetchRows` mode — change it (e.g. an incrementing counter) after external mutations to discard loaded rows and refetch from page 1      |
| `onStateChange`    | `func`     | -                           | `fetchRows` mode only — called with the fetch state snapshot (`loading`, `loadingMore`, `loadMoreError`, `error`, `hasMore`, `totalCount`, `loadedCount`) whenever it changes |
| `loadMoreSignal`   | `any`      | -                           | `fetchRows` mode only — bump it (e.g. an incrementing counter) to append the next server page; reload is handled by `reset`                               |
| `selectRows`       | `bool`     | `false`                     | Enable row selection                                                                                                                                     |
| `selectID`         | `string`   | -                           | Property to use as unique identifier for selection                                                                                                       |
| `onSelection`      | `func`     | -                           | Callback when rows are selected                                                                                                                          |
| `subTable`         | `bool`     | `false`                     | Whether this is a nested sub-table                                                                                                                       |
| `hideBadge`        | `bool`     | `false`                     | Hide badges on expandable rows                                                                                                                           |
| `reloadBtnLoading` | `bool`     | `false`                     | Loading state for reload button                                                                                                                          |
| `selectIcon`       | `element`  | -                           | Custom icon for selection action                                                                                                                         |
| `pageSizeOptions`  | `number[]` | -                           | Override default page size options (e.g. `[10, 25, 50]`). In `fetchRows` mode the selected size is sent as `pageSize`                                                                                                |
| `persistSearch`    | `bool`     | `false`                     | Persist the search term to `sessionStorage` (requires `name` prop)                                                                                       |

## Header Configuration

Each header object can have the following properties:

| Property     | Type      | Description                                                                                                                                                                             |
| ------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `string`  | **Required** - Column identifier (matches data property)                                                                                                                                |
| `label`      | `string`  | **Required** - Display label for column                                                                                                                                                 |
| `searchable` | `bool`    | Whether this column is searchable                                                                                                                                                       |
| `numeric`    | `bool`    | Right-align column for numeric data                                                                                                                                                     |
| `date`       | `bool`    | Format as date/time                                                                                                                                                                     |
| `sortable`   | `bool`    | In `fetchRows` mode, marks this column as server-sortable — clicking the header requests a server sort. All other columns are disabled in this mode. In sync mode the property is ignored and every column sorts client-side. |
| `component`  | `func`    | Custom render function `(rowData) => ReactElement`                                                                                                                                      |
| `cellProps`  | `object`  | Additional props for table cells                                                                                                                                                        |
| `subRow`     | `bool`    | Column contains expandable sub-table data                                                                                                                                               |
| `iconColor`  | `string`  | Color for expand/collapse icons                                                                                                                                                         |
| `openIcon`   | `element` | Custom icon for expanding                                                                                                                                                               |
| `closeIcon`  | `element` | Custom icon for collapsing                                                                                                                                                              |

## Advanced Usage

Advanced usage examples (row selection, custom cells, and sub-tables) plus async/server-side guidance have moved to the docs site:

- https://skulldorom.github.io/MUI-universal-table/docs/advanced-usage
- https://skulldorom.github.io/MUI-universal-table/docs/async-usage

## License

MIT

## Documentation Site (VitePress)

This repository includes a VitePress site in `/docs`.

Run it locally:

```bash
npm run docs:start
```

Build static docs:

```bash
npm run docs:build
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
