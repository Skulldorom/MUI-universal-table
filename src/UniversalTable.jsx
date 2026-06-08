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
import TableLoader from "./components/TableLoader";
import RefreshIcon from "@mui/icons-material/Refresh";
import { AddCircle, RemoveCircle, Task } from "@mui/icons-material";

import { alpha } from "@mui/material/styles";
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

  const [rows, setRows] = React.useState(data);
  const [searchDets, setSearchDets] = React.useState("");
  const [autoFocus, setAutoFocus] = React.useState(false);
  const [selected, setSelected] = React.useState([]);

  const filterOptions = React.useMemo(() => {
    return headers
      .filter((column) => column.searchable)
      .map((column) => column.id);
  }, [headers]);

  const filteredRows = React.useMemo(() => {
    if (searchDets) {
      const term = searchDets.toLocaleLowerCase();
      return data.filter((val) => {
        let found = false;
        for (const filterOption of filterOptions) {
          found =
            found ||
            String(val[filterOption]).toLocaleLowerCase().includes(term);
        }
        return found;
      });
    }
    return data;
  }, [searchDets, data, filterOptions]);

  React.useEffect(() => {
    setRows(filteredRows);
  }, [filteredRows]);

  React.useEffect(() => {
    setSelected([]);
  }, [searchDets]);

  const handleSearchChange = React.useCallback((value) => {
    setSearchDets(value);
  }, []);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((row, index) =>
        selectID ? row[selectID] : index,
      );
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = React.useCallback(
    (event, id) => {
      if (!selectRows) return;
      const selectedIndex = selected.indexOf(id);
      let newSelected = [];

      if (selectedIndex === -1) {
        // Item not selected, add it
        newSelected = [...selected, id];
      } else {
        // Item is selected, remove it
        newSelected = selected.filter((selectedId) => selectedId !== id);
      }
      setSelected(newSelected);
    },
    [selected, selectRows],
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
        <Typography
          variant={subTable ? "h6" : "h5"}
          color={subTable ? "secondary" : "primary"}
          sx={{ p: 2 }}
        >
          {name}
        </Typography>
        {!subTable && (
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
                setFinalVal={handleSearchChange}
                autoFocus={autoFocus}
                setAutoFocus={setAutoFocus}
                searchName={name}
              />
            </Stack>
          </Toolbar>
        )}
        <EnhancedTable
          headers={head}
          name={
            !subTable && (
              <ReloadBtn setLoading={setLoading} loading={reloadBtnLoading} />
            )
          }
          rows={rows || []}
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
  const headCells = props.headings;

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
        {headCells.map((headCell) => (
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

function EnhancedTable(props) {
  const [order, setOrder] = React.useState("desc");
  const [orderBy, setOrderBy] = React.useState("");
  const [page, setPage] = React.useState(0);
  const subTable = props.subTable;
  const rows = props.rows;
  const [rowsPerPage, setRowsPerPage] = React.useState(
    subTable ? rows.length : 5,
  );
  const selected = props.selected;
  const selectID = props.selectID;

  const dense = true;

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

  const resetFlag = props.resetFlag;

  React.useEffect(() => {
    setPage(0);
  }, [resetFlag]);

  const pageOptions = () => {
    if (rows.length <= 5) return [5];
    if (rows.length <= 10) return [5, rows.length];
    if (rows.length <= 25) return [5, 10, rows.length];
    if (rows.length < 50) return [5, 10, 25, rows.length];
    if (rows.length < 100) return [5, 10, 25, 50, rows.length];
    return [5, 10, 25, 50, 100, rows.length];
  };

  const isSelected = React.useCallback(
    (id) => selected.includes(id),
    [selected],
  );

  const visibleRows = React.useMemo(
    () =>
      stableSort(rows, getComparator(order, orderBy), props.headers).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [rows, order, orderBy, props.headers, page, rowsPerPage],
  );

  return (
    <>
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
                headings={props.headers}
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
                  return (
                    <DataRow
                      key={rowKey}
                      rowID={selectID ? row[selectID] : index}
                      headers={props.headers}
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
                    <TableCell colSpan={props.headers.length} />
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
            rowsPerPageOptions={pageOptions()}
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
    </>
  );
}

const DataRow = React.memo(function DataRow(props) {
  const { rowValues, headers, selectRows, isSelected, handleClick } = props;
  const subTables = headers.filter((header) => header.subRow);
  const component = headers.filter((header) => !header.subRow);
  const hideBadge = props.hideBadge || false;

  const isItemSelected = isSelected(props.rowID);

  const [reveal, setReveal] = React.useState(
    Array.from({ length: subTables.length }).fill(false),
  );

  const revealSubRow = React.useCallback((index) => {
    setReveal((previous) => {
      previous[index] = !previous[index];
      return [...previous];
    });
  }, []);

  const generateCell = React.useCallback(
    (value, key, cellProps) => (
      <TableCell key={key} {...cellProps}>
        {value}
      </TableCell>
    ),
    [],
  );

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
          <TableCell key={index}>
            <Tooltip
              title={reveal[index] ? `Hide ${header.id}` : `Show ${header.id}`}
            >
              <Box>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    revealSubRow(index);
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
                    {reveal[index]
                      ? header?.closeIcon || <RemoveCircle />
                      : header?.openIcon || <AddCircle />}
                  </Badge>
                </IconButton>
              </Box>
            </Tooltip>
          </TableCell>
        ))}
        {component.map((header, index) => {
          const value = header.date
            ? new Date(rowValues[header.id]).toDateString() +
              " " +
              new Date(rowValues[header.id]).toLocaleTimeString()
            : rowValues[header.id];
          const cell = header.component
            ? generateCell(header.component(rowValues), index, header.cellProps)
            : generateCell(value, index, header.cellProps);
          return cell;
        })}
      </TableRow>
      {subTables.map((table, index) => (
        <TableRow key={index}>
          <TableCell
            colSpan={props.headers.length + 1}
            style={{ paddingBottom: 0, paddingTop: 0 }}
          >
            <Collapse in={reveal[index]} timeout="auto" unmountOnExit>
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
    () =>
      current || sessionStorage.getItem(`searchVal:${props.searchName}`) || "",
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
    <Tooltip title={"Reload"}>
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

// Add PropTypes for the main component
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

// PropTypes for internal components
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
