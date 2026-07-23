import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
} from "@mui/material";
import useEnhancedTableState from "../hooks/useEnhancedTableState";
import {
  getComparator,
  getPageOptions,
  getSelectableRowId,
  stableSort,
} from "../utils/tableUtils";
import EnhancedTableHead from "./EnhancedTableHead";
import DataRow from "./DataRow";
import TableLoader from "./TableLoader";

function EnhancedTable(props) {
  const {
    headers,
    rows,
    subTable,
    selected,
    selectID,
    setLoading,
    searchTerm,
    setOrder,
    setOrderBy,
    order,
    orderBy,
    async,
    asyncPages,
  } = props;
  const dense = true;
  const {
    page,
    rowsPerPage,
    handleSort,
    handleChangePage,
    handleChangeRowsPerPage,
  } = useEnhancedTableState({
    rows,
    subTable,
    pageSizeOptions: props.pageSizeOptions,
    resetFlag: props.resetFlag,
    apiCall: setLoading,
    searchTerm,
    setOrder,
    setOrderBy,
    order,
    orderBy,
    asyncPages,
  });

  const emptyRows = Math.max(
    0,
    rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage),
  );

  const isSelected = React.useCallback(
    (id) => selected.includes(id),
    [selected],
  );

  const visibleRows = React.useMemo(() => {
    return stableSort(
      rows,
      getComparator(order, orderBy),
      headers,
      orderBy,
    ).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [headers, order, orderBy, page, rows, rowsPerPage]);

  return (
    <TableContainer>
      <Table
        sx={{ minWidth: 750 }}
        size={dense ? "small" : "medium"}
        aria-label={props.name || "data table"}
      >
        {props.loading ? (
          <TableLoader />
        ) : (
          <>
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleSort}
              headings={headers}
              selectRows={props.selectRows}
              numSelected={selected.length}
              rowCount={rows.length}
              onSelectAllClick={props.handleSelectAllClick}
              async={async}
            />

            <TableBody>
              {visibleRows.map((row, index) => {
                const rowKey = selectID
                  ? row[selectID]
                  : `row-${page * rowsPerPage + index}`;
                const rowID = getSelectableRowId(row, index, selectID);

                return (
                  <DataRow
                    key={rowKey}
                    rowID={rowID}
                    headers={headers}
                    rowValues={row}
                    hideBadge={props.hideBadge}
                    selectRows={props.selectRows}
                    handleClick={props.handleClick}
                    isSelected={isSelected}
                  />
                );
              })}
              {!subTable && emptyRows > 0 && (
                <TableRow style={{ height: (dense ? 33 : 53) * emptyRows }}>
                  <TableCell colSpan={headers.length} />
                </TableRow>
              )}
            </TableBody>
          </>
        )}
      </Table>
      {subTable ? (
        <Box sx={{ mb: 3 }} />
      ) : (
        <TablePagination
          rowsPerPageOptions={
            props.pageSizeOptions || getPageOptions(rows.length)
          }
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ overflow: "visible" }}
          showFirstButton
          showLastButton
        />
      )}
    </TableContainer>
  );
}

EnhancedTable.propTypes = {
  headers: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  subTable: PropTypes.bool,
  hideBadge: PropTypes.bool,
  loading: PropTypes.bool,
  selectRows: PropTypes.bool,
  handleSelectAllClick: PropTypes.func,
  handleClick: PropTypes.func,
  selected: PropTypes.array,
  selectID: PropTypes.string,
  async: PropTypes.bool,
  resetFlag: PropTypes.string,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  name: PropTypes.string,
  setLoading: PropTypes.func,
  searchTerm: PropTypes.string,
  setOrder: PropTypes.func,
  setOrderBy: PropTypes.func,
  order: PropTypes.string,
  orderBy: PropTypes.string,
  asyncPages: PropTypes.number,
};

export default EnhancedTable;
