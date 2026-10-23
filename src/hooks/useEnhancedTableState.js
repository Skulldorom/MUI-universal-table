import React from "react";
import { getInitialPageSize } from "../utils/tableUtils";

function getInitialRowsPerPage({ rows, subTable, pageSizeOptions }) {
  if (subTable) return rows.length;
  return getInitialPageSize(pageSizeOptions);
}

export default function useEnhancedTableState({
  rows,
  subTable,
  pageSizeOptions,
  resetFlag,
  apiCall,
  searchTerm,
  setOrder,
  setOrderBy,
  order,
  orderBy,
  onRowsPerPageChange,
}) {
  const [pagination, setPagination] = React.useState(() => ({
    page: 0,
    rowsPerPage: getInitialRowsPerPage({ rows, subTable, pageSizeOptions }),
    resetFlag,
  }));

  React.useEffect(() => {
    // Resetting derived pagination state here intentionally preserves the
    // current rows-per-page choice while jumping back to the first page.
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setPagination((previous) => {
      if (previous.resetFlag === resetFlag) {
        return previous;
      }

      return {
        ...previous,
        page: 0,
        resetFlag,
      };
    });
  }, [resetFlag]);

  const page = pagination.page;
  const rowsPerPage = subTable ? rows.length : pagination.rowsPerPage;

  const handleRequestSort = React.useCallback(
    (property) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
    },
    [order, orderBy, setOrder, setOrderBy],
  );

  const handleChangePage = React.useCallback((event, newPage) => {
    setPagination((previous) => ({
      ...previous,
      page: newPage,
    }));
  }, []);

  const handleChangeRowsPerPage = React.useCallback(
    (event) => {
      const nextRowsPerPage = Number.parseInt(event.target.value, 10);
      setPagination((previous) => ({
        ...previous,
        page: 0,
        rowsPerPage: nextRowsPerPage,
      }));
      onRowsPerPageChange?.(nextRowsPerPage);
    },
    [onRowsPerPageChange],
  );

  const handleSort = (column, apiSortable) => {
    if (apiSortable) {
      const direction = order === "asc" ? "desc" : "asc";
      apiCall({ searchTerm, column, direction });
      setOrder(direction);
      setOrderBy(column);
      return;
    }
    handleRequestSort(column);
  };

  return {
    order,
    orderBy,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSort,
  };
}
