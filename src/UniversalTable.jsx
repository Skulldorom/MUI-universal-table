import React from "react";
import PropTypes from "prop-types";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Paper from "@mui/material/Paper";
import {
  Button,
  IconButton,
  Tooltip,
  Typography,
  Collapse,
  Stack,
  Badge,
  TableContainer,
  Checkbox,
} from "@mui/material";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import { AddCircle, RemoveCircle, Task } from "@mui/icons-material";
import TableLoader from "./components/TableLoader";
import LazyLoadingIndicator from "./components/LazyLoadingIndicator";
import FancySearch from "./components/FancySearch";

/**
 * Standard visually-hidden style: content is accessible to screen readers
 * but invisible on screen. Defined locally to avoid importing from
 * @mui/utils which is not a declared peer dependency.
 */
const visuallyHidden = {
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

function getSelectableRowId(row, index, selectID) {
  return selectID ? row[selectID] : index;
}

function getSearchableColumnIds(headers) {
  return headers
    .filter((column) => column.searchable)
    .map((column) => column.id);
}

function filterRows(data, searchTerm, filterOptions) {
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

function useSearchableRows(data, headers) {
  const [searchDets, setSearchDets] = React.useState("");

  const filterOptions = React.useMemo(
    () => getSearchableColumnIds(headers),
    [headers],
  );

  const rows = React.useMemo(
    () => filterRows(data, searchDets, filterOptions),
    [data, filterOptions, searchDets],
  );

  return {
    rows,
    searchDets,
    setSearchDets,
  };
}

function useSelectableRows({ rows, selectRows, selectID }) {
  const [selected, setSelected] = React.useState([]);

  const clearSelection = React.useCallback(() => {
    setSelected([]);
  }, []);

  const handleSelectAllClick = React.useCallback(
    (event) => {
      if (!event.target.checked) {
        setSelected([]);
        return;
      }

      const newSelected = rows.map((row, index) =>
        getSelectableRowId(row, index, selectID),
      );
      setSelected(newSelected);
    },
    [rows, selectID],
  );

  const handleClick = React.useCallback(
    (event, id) => {
      if (!selectRows) {
        return;
      }

      setSelected((previous) =>
        previous.includes(id)
          ? previous.filter((selectedId) => selectedId !== id)
          : [...previous, id],
      );
    },
    [selectRows],
  );

  return {
    selected,
    clearSelection,
    handleSelectAllClick,
    handleClick,
  };
}

function TableSelectionBanner({ selected, onSelection, selectIcon }) {
  return (
    <Collapse in={selected.length > 0} unmountOnExit>
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
          borderRadius: 1,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <Typography variant="h6" id="tableTitle" component="div">
          {selected.length} selected
        </Typography>

        <IconButton onClick={() => onSelection(selected)}>
          {selectIcon || <Task />}
        </IconButton>
      </Box>
    </Collapse>
  );
}

function TableTitle({ name, subTable }) {
  return (
    <Typography
      variant={subTable ? "h6" : "h5"}
      color={subTable ? "secondary" : "primary"}
      sx={{ p: 2 }}
    >
      {name}
    </Typography>
  );
}

function TableToolbarContent({
  setLoading,
  reloadBtnLoading,
  searchDets,
  onSearchChange,
  name,
}) {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        pt: 2,
      }}
    >
      <Stack
        spacing={2}
        direction={{ xs: "column", md: "row" }}
        sx={{
          width: "100%",
          alignItems: { xs: "flex-start", md: "center" },
        }}
      >
        <Box sx={{ flex: "1 1 100%" }} id="tableTitle">
          <ReloadBtn setLoading={setLoading} loading={reloadBtnLoading} />
        </Box>
        <SearchArea
          current={searchDets}
          setFinalVal={onSearchChange}
          searchName={name}
        />
      </Stack>
    </Toolbar>
  );
}

export default function UniversalTable({
  loading,
  setLoading,
  lazyloading = false,
  currentPage,
  totalPages,
  data,
  headers,
  name,
  reloadBtnLoading,
  subTable = false,
  hideBadge = false,
  selectRows = false,
  selectID,
  selectIcon,
  onSelection,
}) {
  const head = headers || [];
  const { rows, searchDets, setSearchDets } = useSearchableRows(data, head);
  const { selected, clearSelection, handleSelectAllClick, handleClick } =
    useSelectableRows({
      rows,
      selectRows,
      selectID,
    });

  const handleSearchChange = React.useCallback(
    (value) => {
      clearSelection();
      setSearchDets(value);
    },
    [clearSelection, setSearchDets],
  );

  return (
    <>
      <LazyLoadingIndicator
        show={lazyloading}
        currentPage={currentPage}
        totalPages={totalPages}
      />
      <Paper
        sx={{
          ...(subTable && { boxShadow: "none" }),
        }}
      >
        <TableSelectionBanner
          selected={selected}
          onSelection={onSelection}
          selectIcon={selectIcon}
        />
        <TableTitle name={name} subTable={subTable} />
        {!subTable && (
          <TableToolbarContent
            setLoading={setLoading}
            reloadBtnLoading={reloadBtnLoading}
            searchDets={searchDets}
            onSearchChange={handleSearchChange}
            name={name}
          />
        )}
        <EnhancedTable
          headers={head}
          rows={rows}
          resetFlag={searchDets}
          subTable={subTable}
          hideBadge={hideBadge}
          loading={loading}
          selectRows={selectRows}
          handleSelectAllClick={handleSelectAllClick}
          handleClick={handleClick}
          selected={selected}
          selectID={selectID}
        />
      </Paper>
    </>
  );
}

function EnhancedTableHead(props) {
  const {
    order,
    orderBy,
    onRequestSort,
    selectRows,
    numSelected,
    rowCount,
    onSelectAllClick,
  } = props;

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {selectRows && (
          <TableCell padding="checkbox">
            <Checkbox
              color="primary"
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
            />
          </TableCell>
        )}
        {props.headings.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding="normal"
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : undefined}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function getPageOptions(rowCount) {
  if (rowCount <= 5) return [5];
  if (rowCount <= 10) return [5, rowCount];
  if (rowCount <= 25) return [5, 10, rowCount];
  if (rowCount < 50) return [5, 10, 25, rowCount];
  if (rowCount < 100) return [5, 10, 25, 50, rowCount];
  return [5, 10, 25, 50, 100, rowCount];
}

function useEnhancedTableState({ rows, subTable, resetFlag }) {
  const [order, setOrder] = React.useState("desc");
  const [orderBy, setOrderBy] = React.useState("");
  const [pagination, setPagination] = React.useState(() => ({
    page: 0,
    rowsPerPage: subTable ? rows.length : 5,
    resetFlag,
  }));

  const page = pagination.resetFlag === resetFlag ? pagination.page : 0;
  const rowsPerPage = subTable ? rows.length : pagination.rowsPerPage;

  const handleRequestSort = React.useCallback(
    (event, property) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
    },
    [order, orderBy],
  );

  const handleChangePage = React.useCallback(
    (event, newPage) => {
      setPagination((previous) => ({
        ...previous,
        page: newPage,
        resetFlag,
      }));
    },
    [resetFlag],
  );

  const handleChangeRowsPerPage = React.useCallback(
    (event) => {
      setPagination((previous) => ({
        ...previous,
        page: 0,
        rowsPerPage: Number.parseInt(event.target.value, 10),
        resetFlag,
      }));
    },
    [resetFlag],
  );

  return {
    order,
    orderBy,
    page,
    rowsPerPage,
    handleRequestSort,
    handleChangePage,
    handleChangeRowsPerPage,
  };
}

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
                const rowIndex = page * rowsPerPage + index;
                const rowID = getSelectableRowId(row, rowIndex, selectID);

                return (
                  <DataRow
                    key={rowID}
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

function splitHeaders(headers) {
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

function formatCellValue(header, rowValues) {
  if (!header.date) {
    return rowValues[header.id];
  }

  return (
    new Date(rowValues[header.id]).toDateString() +
    " " +
    new Date(rowValues[header.id]).toLocaleTimeString()
  );
}

function renderDataCells(headers, rowValues) {
  return headers.map((header, index) => (
    <TableCell key={`${header.id}-${index}`} {...header.cellProps}>
      {header.component
        ? header.component(rowValues)
        : formatCellValue(header, rowValues)}
    </TableCell>
  ));
}

function SubRowToggleCell({
  header,
  isOpen,
  onToggle,
  rowValues,
  hideBadge,
}) {
  return (
    <TableCell>
      <Tooltip title={isOpen ? `Hide ${header.id}` : `Show ${header.id}`}>
        <Box>
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            disabled={rowValues[header.id].length === 0}
            color={header.iconColor || "secondary"}
          >
            <Badge
              badgeContent={rowValues[header.id].length}
              invisible={hideBadge}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              sx={{
                "& .MuiBadge-badge": {
                  color: (theme) => theme.palette.text.primary,
                },
              }}
            >
              {isOpen
                ? header?.closeIcon || <RemoveCircle />
                : header?.openIcon || <AddCircle />}
            </Badge>
          </IconButton>
        </Box>
      </Tooltip>
    </TableCell>
  );
}

function SubTableRow({ table, isOpen, rowValues, colSpan }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} style={{ paddingBottom: 0, paddingTop: 0 }}>
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <UniversalTable
            loading={table.loading}
            setLoading={table.setLoading}
            data={rowValues[table.id]}
            headers={table.headers}
            name={table.subTitle}
            subTable
          />
        </Collapse>
      </TableCell>
    </TableRow>
  );
}

const DataRow = React.memo(function DataRow(props) {
  const { rowValues, headers, selectRows, isSelected, handleClick } = props;
  const { subTables, columns } = React.useMemo(() => splitHeaders(headers), [
    headers,
  ]);
  const hideBadge = props.hideBadge || false;
  const isItemSelected = isSelected(props.rowID);
  const [reveal, setReveal] = React.useState(
    Array.from({ length: subTables.length }).fill(false),
  );

  const toggleSubRow = React.useCallback((index) => {
    setReveal((previous) => {
      const next = [...previous];
      next[index] = !next[index];
      return next;
    });
  }, []);

  return (
    <>
      <TableRow
        tabIndex={-1}
        hover={selectRows}
        role={selectRows ? "checkbox" : "row"}
        selected={isItemSelected}
        aria-checked={isItemSelected}
      >
        {selectRows && (
          <TableCell padding="checkbox">
            <Checkbox
              color="primary"
              checked={isItemSelected}
              onClick={(event) => handleClick(event, props.rowID)}
            />
          </TableCell>
        )}
        {subTables.map((header, index) => (
          <SubRowToggleCell
            key={header.id || index}
            header={header}
            isOpen={reveal[index]}
            onToggle={() => toggleSubRow(index)}
            rowValues={rowValues}
            hideBadge={hideBadge}
          />
        ))}
        {renderDataCells(columns, rowValues)}
      </TableRow>
      {subTables.map((table, index) => (
        <SubTableRow
          key={table.id || index}
          table={table}
          isOpen={reveal[index]}
          rowValues={rowValues}
          colSpan={props.headers.length + 1}
        />
      ))}
    </>
  );
});

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator, headers) {
  const dateColumns = new Set(
    headers.filter((object) => object.date).map((value) => value.id),
  );
  const stabilizedThis = array.map((el, index) => [{ ...el }, index]);

  for (const item of stabilizedThis) {
    const object = item[0];
    for (const property in object) {
      if (dateColumns.has(property))
        object[property] = Number(new Date(object[property]));
    }
  }

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function SearchArea(props) {
  const { current, setFinalVal } = props;
  const searchVal = React.useMemo(
    () => current || sessionStorage.getItem(`searchVal:${props.searchName}`) || "",
    [current, props.searchName],
  );

  return (
    <div key="SearchArea">
      <FancySearch value={searchVal} onSubmit={setFinalVal} />
    </div>
  );
}

function ReloadBtn({ setLoading, loading }) {
  if (typeof setLoading !== "function") {
    return null;
  }

  return (
    <Tooltip title="Reload">
      <Button
        variant="contained"
        color="primary"
        onClick={() => setLoading(true)}
        disabled={loading}
      >
        <RefreshIcon />
      </Button>
    </Tooltip>
  );
}

UniversalTable.propTypes = {
  loading: PropTypes.bool,
  setLoading: PropTypes.func,
  lazyloading: PropTypes.bool,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  data: PropTypes.array.isRequired,
  headers: PropTypes.array.isRequired,
  name: PropTypes.string,
  reloadBtnLoading: PropTypes.bool,
  subTable: PropTypes.bool,
  hideBadge: PropTypes.bool,
  selectRows: PropTypes.bool,
  selectID: PropTypes.string,
  selectIcon: PropTypes.element,
  onSelection: PropTypes.func,
};

TableSelectionBanner.propTypes = {
  selected: PropTypes.array.isRequired,
  onSelection: PropTypes.func,
  selectIcon: PropTypes.element,
};

TableTitle.propTypes = {
  name: PropTypes.string,
  subTable: PropTypes.bool,
};

TableToolbarContent.propTypes = {
  setLoading: PropTypes.func,
  reloadBtnLoading: PropTypes.bool,
  searchDets: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  name: PropTypes.string,
};

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
  headings: PropTypes.array.isRequired,
  selectRows: PropTypes.bool,
  numSelected: PropTypes.number,
  rowCount: PropTypes.number,
  onSelectAllClick: PropTypes.func,
};

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

SubRowToggleCell.propTypes = {
  header: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  rowValues: PropTypes.object.isRequired,
  hideBadge: PropTypes.bool,
};

SubTableRow.propTypes = {
  table: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  rowValues: PropTypes.object.isRequired,
  colSpan: PropTypes.number.isRequired,
};

DataRow.propTypes = {
  rowValues: PropTypes.object.isRequired,
  headers: PropTypes.array.isRequired,
  selectRows: PropTypes.bool,
  isSelected: PropTypes.func.isRequired,
  handleClick: PropTypes.func,
  hideBadge: PropTypes.bool,
  rowID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

SearchArea.propTypes = {
  current: PropTypes.string,
  setFinalVal: PropTypes.func.isRequired,
  searchName: PropTypes.string,
};

ReloadBtn.propTypes = {
  setLoading: PropTypes.func,
  loading: PropTypes.bool,
};
