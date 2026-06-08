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
  const { headers, rows, subTable, selected, selectID } = props;
  const dense = true;
  const {
    order,
    orderBy,
    page,
    rowsPerPage,
    handleRequestSort,
    handleChangePage,
    handleChangeRowsPerPage,
  } = useEnhancedTableState({
    rows,
    subTable,
    resetFlag: props.resetFlag,
  });

  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

  const isSelected = React.useCallback(
    (id) => selected.includes(id),
    [selected],
  );

  const visibleRows = React.useMemo(
    () =>
      stableSort(rows, getComparator(order, orderBy), headers).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [headers, order, orderBy, page, rows, rowsPerPage],
  );

  return (
    <TableContainer>
      <Table sx={{ minWidth: 750 }} size={dense ? "small" : "medium"}>
        {props.loading ? (
          <TableLoader />
        ) : (
          <>
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              headings={headers}
              selectRows={props.selectRows}
              numSelected={selected.length}
              rowCount={rows.length}
              onSelectAllClick={props.handleSelectAllClick}
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
          rowsPerPageOptions={getPageOptions(rows.length)}
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
  resetFlag: PropTypes.string,
};

export default EnhancedTable;
