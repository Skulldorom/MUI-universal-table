import React from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Box,
  Checkbox,
  Collapse,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { AddCircle, RemoveCircle } from "@mui/icons-material";
// UniversalTable is imported here for sub-table rendering (circular dep is safe
// because the reference is only resolved at JSX render time, not module load time)
import UniversalTable from "../UniversalTable";
import { splitHeaders } from "../utils/tableUtils";

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
    <TableCell key={header.id || index} {...header.cellProps}>
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

SubRowToggleCell.propTypes = {
  header: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  rowValues: PropTypes.object.isRequired,
  hideBadge: PropTypes.bool,
};

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

SubTableRow.propTypes = {
  table: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  rowValues: PropTypes.object.isRequired,
  colSpan: PropTypes.number.isRequired,
};

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

DataRow.propTypes = {
  rowValues: PropTypes.object.isRequired,
  headers: PropTypes.array.isRequired,
  selectRows: PropTypes.bool,
  isSelected: PropTypes.func.isRequired,
  handleClick: PropTypes.func,
  hideBadge: PropTypes.bool,
  rowID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default DataRow;
