import React from "react";
import PropTypes from "prop-types";
import {
  Checkbox,
  TableCell,
  TableRow,
} from "@mui/material";
import { SubRowToggleCell, SubTableRow } from "./SubTableRow";
import { splitHeaders, formatCellValue } from "../utils/tableUtils";

function renderDataCells(headers, rowValues) {
  return headers.map((header, index) => (
    <TableCell key={header.id || index} {...header.cellProps}>
      {header.component
        ? header.component(rowValues)
        : formatCellValue(header, rowValues)}
    </TableCell>
  ));
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

  const handleRowKeyDown = React.useCallback(
    (event) => {
      if (selectRows && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        handleClick(event, props.rowID);
      }
    },
    [selectRows, handleClick, props.rowID],
  );

  return (
    <>
      <TableRow
        tabIndex={selectRows ? 0 : -1}
        hover={selectRows}
        role={selectRows ? "checkbox" : "row"}
        selected={isItemSelected}
        aria-checked={isItemSelected}
        onKeyDown={handleRowKeyDown}
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
