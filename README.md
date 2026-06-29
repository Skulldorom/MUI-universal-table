# MUI Universal Table

A comprehensive, feature-rich table component built with Material-UI for React applications.

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

| Prop               | Type       | Default      | Description                                                                                                                                               |
| ------------------ | ---------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`             | `array`    | **required** | Array of data objects to display                                                                                                                          |
| `headers`          | `array`    | **required** | Array of header configuration objects                                                                                                                     |
| `name`             | `string`   | -            | Table title                                                                                                                                               |
| `loading`          | `bool`     | `false`      | Shows skeleton loading state over the table                                                                                                               |
| `setLoading`       | `func`     | -            | Called when the table needs new data. In async mode receives a payload object (see [Async Mode](#async--server-side-mode)); otherwise called with `true`  |
| `onReload`         | `func`     | -            | Preferred reload callback — fires when the user clicks the reload button. Takes priority over `setLoading` for reload                                     |
| `asyncPages`       | `number`   | -            | Enables server-side search and sort. Set to the number of pages to request. When provided, `setLoading` is called with a payload object instead of `true` |
| `selectRows`       | `bool`     | `false`      | Enable row selection                                                                                                                                      |
| `selectID`         | `string`   | -            | Property to use as unique identifier for selection                                                                                                        |
| `onSelection`      | `func`     | -            | Callback when rows are selected                                                                                                                           |
| `subTable`         | `bool`     | `false`      | Whether this is a nested sub-table                                                                                                                        |
| `hideBadge`        | `bool`     | `false`      | Hide badges on expandable rows                                                                                                                            |
| `reloadBtnLoading` | `bool`     | `false`      | Loading state for reload button                                                                                                                           |
| `lazyloading`      | `bool`     | `false`      | Enable lazy loading indicator                                                                                                                             |
| `currentPage`      | `number`   | -            | Current page for lazy loading                                                                                                                             |
| `totalPages`       | `number`   | -            | Total pages for lazy loading                                                                                                                              |
| `selectIcon`       | `element`  | -            | Custom icon for selection action                                                                                                                          |
| `pageSizeOptions`  | `number[]` | -            | Override default page size options (e.g. `[10, 25, 50]`)                                                                                                  |
| `persistSearch`    | `bool`     | `false`      | Persist the search term to `sessionStorage` (requires `name` prop)                                                                                        |

## Header Configuration

Each header object can have the following properties:

| Property     | Type      | Description                                                                                                                                                                             |
| ------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `string`  | **Required** - Column identifier (matches data property)                                                                                                                                |
| `label`      | `string`  | **Required** - Display label for column                                                                                                                                                 |
| `searchable` | `bool`    | Whether this column is searchable                                                                                                                                                       |
| `numeric`    | `bool`    | Right-align column for numeric data                                                                                                                                                     |
| `date`       | `bool`    | Format as date/time                                                                                                                                                                     |
| `sortable`   | `bool`    | In async mode, marks this column as server-sortable — clicking the header calls `setLoading` with a payload instead of sorting client-side. Has no effect when `asyncPages` is not set. |
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

## Documentation Site (Docusaurus)

This repository includes a Docusaurus site in `/docs`.

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
