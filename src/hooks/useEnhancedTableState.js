import React from "react";

export default function useEnhancedTableState({
  rows,
  subTable,
  resetFlag,
  apiCall,
  searchTerm,
  setOrder,
  setOrderBy,
  order,
  orderBy,
}) {
  const [pagination, setPagination] = React.useState(() => ({
    page: 0,
    rowsPerPage: subTable ? rows.length : 5,
    resetFlag,
  }));

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleChangeRowsPerPage = React.useCallback((event) => {
    setPagination((previous) => ({
      ...previous,
      page: 0,
      rowsPerPage: Number.parseInt(event.target.value, 10),
    }));
  }, []);

  const handleSort = (column, api) => {
    if (api) {
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
