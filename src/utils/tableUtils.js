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

const browserDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/**
 * Format a cell value for display. Handles dates safely:
 * returns the raw value for non-date headers, and a formatted
 * date string for date headers (guards against invalid dates).
 *
 * Uses `new Date(raw)` directly rather than `Date.parse(raw)` to
 * handle epoch-millisecond numbers, Date objects, and string
 * formats that Date.parse may reject.
 */
export function formatCellValue(header, rowValues) {
  const raw = rowValues[header.id];
  if (!header.date) {
    return raw;
  }

  // null and undefined produce a valid epoch-0 Date, not Invalid Date
  if (raw === null || raw === undefined) {
    return raw;
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return raw;
  }

  return browserDateTimeFormatter.format(d);
}

export function stableSort(array, comparator, headers) {
  const dateColumns = new Set(
    headers.filter((object) => object.date).map((value) => value.id),
  );

  // Build stable entries — compare pre-computed sort keys so we never
  // mutate the original data or its shallow copies.
  // Each entry is [originalRow, sortKey, index] so that the comparator
  // works on numeric-converted date values while the original rows are
  // returned unchanged (preserving the data seen by header.component).
  const stabilizedThis = array.map((el, index) => {
    const sortKey = { ...el };
    for (const property in sortKey) {
      if (dateColumns.has(property)) {
        const parsed = Number(new Date(sortKey[property]));
        // Preserve the original value for invalid dates so formatCellValue
        // can display the fallback instead of passing NaN to React children.
        if (!Number.isNaN(parsed)) {
          sortKey[property] = parsed;
        }
      }
    }
    return [el, sortKey, index];
  });

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[1], b[1]);
    if (order !== 0) return order;
    return a[2] - b[2];
  });
  return stabilizedThis.map((el) => el[0]);
}

