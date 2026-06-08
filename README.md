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
npm install mui-universale-table
```

### Local Package Testing

You can install this repository directly into another local project:

```bash
npm install /absolute/path/to/MUI-universale-table
```

If your app is configured with a folder link such as:

```json
"mui-universale-table": "file:../MUI-universale-table"
```

and you see `Invalid hook call`, you are likely loading multiple React instances during local development.

Recommended local test flow (matches published package behavior):

```bash
# from this repository
npm run pack:local

# from your consuming app
npm install ../MUI-universale-table/mui-universale-table-<version>.tgz
```

Notes:

- This package runs `prepare`, so the `dist/` output is built automatically during local installs.
- Re-run the same install command after making changes to refresh the installed package in your test project.
- Type declarations are maintained in `src/index.d.ts` and shipped with the package.

### Peer Dependencies

Make sure you have these peer dependencies installed:

```bash
npm install react react-dom @mui/material @emotion/react @emotion/styled @mui/icons-material prop-types
```

## Basic Usage

```jsx
import React from "react";
import { UniversalTable } from "mui-universale-table";

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

| Prop               | Type      | Default      | Description                                        |
| ------------------ | --------- | ------------ | -------------------------------------------------- |
| `data`             | `array`   | **required** | Array of data objects to display                   |
| `headers`          | `array`   | **required** | Array of header configuration objects              |
| `name`             | `string`  | -            | Table title                                        |
| `loading`          | `bool`    | `false`      | Shows loading state                                |
| `setLoading`       | `func`    | -            | Function to control loading state                  |
| `selectRows`       | `bool`    | `false`      | Enable row selection                               |
| `selectID`         | `string`  | -            | Property to use as unique identifier for selection |
| `onSelection`      | `func`    | -            | Callback when rows are selected                    |
| `subTable`         | `bool`    | `false`      | Whether this is a nested sub-table                 |
| `hideBadge`        | `bool`    | `false`      | Hide badges on expandable rows                     |
| `reloadBtnLoading` | `bool`    | `false`      | Loading state for reload button                    |
| `lazyloading`      | `bool`    | `false`      | Enable lazy loading indicator                      |
| `currentPage`      | `number`  | -            | Current page for lazy loading                      |
| `totalPages`       | `number`  | -            | Total pages for lazy loading                       |
| `selectIcon`       | `element` | -            | Custom icon for selection action                   |

## Header Configuration

Each header object can have the following properties:

| Property     | Type      | Description                                              |
| ------------ | --------- | -------------------------------------------------------- |
| `id`         | `string`  | **Required** - Column identifier (matches data property) |
| `label`      | `string`  | **Required** - Display label for column                  |
| `searchable` | `bool`    | Whether this column is searchable                        |
| `numeric`    | `bool`    | Right-align column for numeric data                      |
| `date`       | `bool`    | Format as date/time                                      |
| `component`  | `func`    | Custom render function `(rowData) => ReactElement`       |
| `cellProps`  | `object`  | Additional props for table cells                         |
| `subRow`     | `bool`    | Column contains expandable sub-table data                |
| `iconColor`  | `string`  | Color for expand/collapse icons                          |
| `openIcon`   | `element` | Custom icon for expanding                                |
| `closeIcon`  | `element` | Custom icon for collapsing                               |

## Advanced Examples

### With Row Selection

```jsx
<UniversalTable
  data={data}
  headers={headers}
  name="Selectable Users"
  selectRows={true}
  selectID="id"
  onSelection={(selectedIds) => {
    console.log("Selected:", selectedIds);
  }}
/>
```

### With Custom Cell Rendering

```jsx
const headers = [
  { id: "name", label: "Name", searchable: true },
  {
    id: "status",
    label: "Status",
    component: (row) => (
      <Chip
        label={row.status}
        color={row.status === "active" ? "success" : "default"}
      />
    ),
  },
];
```

### With Sub-tables

```jsx
const headers = [
  { id: "name", label: "Department", searchable: true },
  {
    id: "employees",
    label: "Employees",
    subRow: true,
    headers: [
      { id: "name", label: "Employee Name", searchable: true },
      { id: "role", label: "Role" },
    ],
  },
];
```

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
