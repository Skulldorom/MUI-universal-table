import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  Typography,
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
    fetchState,
  } = props;
  const fetchMode = Boolean(fetchState);
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

  const effectiveRowsPerPage = rowsPerPage === -1 ? rows.length : rowsPerPage;

  const emptyRows = Math.max(
    0,
    effectiveRowsPerPage -
      Math.min(effectiveRowsPerPage, rows.length - page * effectiveRowsPerPage),
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
    ).slice(
      page * effectiveRowsPerPage,
      page * effectiveRowsPerPage + effectiveRowsPerPage,
    );
  }, [effectiveRowsPerPage, headers, order, orderBy, page, rows]);

  // Server pagination ("fetch rows" mode): when the visible window extends
  // past the rows loaded so far, pull in the next server page. The strict `>`
  // means a fully-covered first page does not trigger an eager fetch.
  const onLoadMore = fetchState?.onLoadMore;
  React.useEffect(() => {
    if (!fetchMode || typeof onLoadMore !== "function") {
      return;
    }
    if (
      props.loading ||
      fetchState.loadingMore ||
      fetchState.loadMoreError ||
      !fetchState.hasMore
    ) {
      return;
    }
    if ((page + 1) * effectiveRowsPerPage > rows.length && rows.length > 0) {
      onLoadMore();
    }
  }, [
    fetchMode,
    onLoadMore,
    props.loading,
    fetchState?.loadingMore,
    fetchState?.loadMoreError,
    fetchState?.hasMore,
    page,
    effectiveRowsPerPage,
    rows.length,
  ]);

  const columnCount = headers.length + (props.selectRows ? 1 : 0);
  const onLastLoadedPage =
    rows.length === 0 ||
    (page + 1) * effectiveRowsPerPage >= rows.length;
  const showEndOfData =
    fetchMode &&
    !fetchState.hasMore &&
    !fetchState.loadingMore &&
    !fetchState.loadMoreError &&
    rows.length > 0 &&
    onLastLoadedPage;
  const showEmptyFiller =
    !subTable &&
    emptyRows > 0 &&
    !fetchState?.loadingMore &&
    !fetchState?.loadMoreError &&
    !showEndOfData;

  return (
    <TableContainer>
      <Table
        sx={{ minWidth: 750 }}
        size={dense ? "small" : "medium"}
        aria-label={props.name || "data table"}
      >
        {props.loading ? (
          <TableLoader />
        ) : fetchState?.error ? (
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
              <TableRow>
                <TableCell colSpan={columnCount} align="center">
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      py: 2,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" color="error">
                      Couldn&apos;t load data.
                    </Typography>
                    <Button size="small" onClick={() => fetchState.onRetry()}>
                      Retry
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            </TableBody>
          </>
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
                  : `row-${page * effectiveRowsPerPage + index}`;
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
              {fetchMode && fetchState.loadingMore && (
                <TableRow>
                  <TableCell colSpan={columnCount}>
                    <Skeleton height={30} />
                  </TableCell>
                </TableRow>
              )}
              {fetchMode && fetchState.loadMoreError && (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center">
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ justifyContent: "center", alignItems: "center" }}
                    >
                      <Typography variant="body2" color="error">
                        Couldn&apos;t load more results.
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => fetchState.onLoadMore()}
                      >
                        Retry
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
              {showEndOfData && (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No more results
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {showEmptyFiller && (
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
          count={fetchMode ? (fetchState.totalCount ?? rows.length) : rows.length}
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
  resetFlag: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  name: PropTypes.string,
  setLoading: PropTypes.func,
  searchTerm: PropTypes.string,
  setOrder: PropTypes.func,
  setOrderBy: PropTypes.func,
  order: PropTypes.string,
  orderBy: PropTypes.string,
  asyncPages: PropTypes.number,
  fetchState: PropTypes.shape({
    totalCount: PropTypes.number,
    hasMore: PropTypes.bool,
    loadingMore: PropTypes.bool,
    loadMoreError: PropTypes.bool,
    error: PropTypes.bool,
    onLoadMore: PropTypes.func,
    onRetry: PropTypes.func,
  }),
};

export default EnhancedTable;
