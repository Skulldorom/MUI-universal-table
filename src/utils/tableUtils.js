/**
 * Standard visually-hidden style: content is accessible to screen readers
 * but invisible on screen. Defined locally to avoid importing from
 * @mui/utils which is not a declared peer dependency.
 */
export const visuallyHidden = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
};

export function getSelectableRowId(row, index, selectID) {
  return selectID ? row[selectID] : index;
}

export function getSearchableColumnIds(headers) {
  return headers
    .filter((column) => column.searchable)
    .map((column) => column.id);
}

export function filterRows(data, searchTerm, filterOptions) {
  if (!searchTerm) {
    return data;
  }

  const term = searchTerm.toLocaleLowerCase();
  return data.filter((row) =>
    filterOptions.some((filterOption) =>
      String(row[filterOption]).toLocaleLowerCase().includes(term),
    ),
  );
}

export function getPageOptions(rowCount) {
  if (rowCount <= 5) return [5];
  if (rowCount <= 10) return [5, rowCount];
  if (rowCount <= 25) return [5, 10, rowCount];
  if (rowCount < 50) return [5, 10, 25, rowCount];
  if (rowCount < 100) return [5, 10, 25, 50, rowCount];
  return [5, 10, 25, 50, 100, rowCount];
}

export function splitHeaders(headers) {
  return headers.reduce(
    (groups, header) => {
      if (header.subRow) {
        groups.subTables.push(header);
      } else {
        groups.columns.push(header);
      }

      return groups;
    },
    { subTables: [], columns: [] },
  );
}

export function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

export function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

/**
 * Format a cell value for display. Handles dates safely:
 * returns the raw value for non-date headers, and a formatted
 * date string for date headers (guards against invalid dates).
 */
export function formatCellValue(header, rowValues) {
  const raw = rowValues[header.id];
  if (!header.date) {
    return raw;
  }

  const timestamp = Date.parse(raw);
  if (Number.isNaN(timestamp)) {
    return raw;
  }

  const d = new Date(timestamp);
  return d.toDateString() + " " + d.toLocaleTimeString();
}

export function stableSort(array, comparator, headers) {
  const dateColumns = new Set(
    headers.filter((object) => object.date).map((value) => value.id),
  );

  // Build stable entries — compare pre-computed sort keys so we never
  // mutate the original data or its shallow copies.
  const stabilizedThis = array.map((el, index) => {
    const sortKey = { ...el };
    for (const property in sortKey) {
      if (dateColumns.has(property)) {
        sortKey[property] = Number(new Date(sortKey[property]));
      }
    }
    return [sortKey, index];
  });

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}


