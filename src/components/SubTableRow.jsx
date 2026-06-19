import React from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Box,
  Collapse,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { AddCircle, RemoveCircle } from "@mui/icons-material";

/**
 * Lazily import UniversalTable to statically break the circular dependency:
 *   UniversalTable → EnhancedTable → DataRow → SubTableRow → UniversalTable
 * React.lazy resolves the import at render time, so the module graph stays acyclic.
 */
const UniversalTable = React.lazy(() => import("../UniversalTable"));

// ---------------------------------------------------------------------------
// SubRowToggleCell
// ---------------------------------------------------------------------------

export function SubRowToggleCell({ header, isOpen, onToggle, rowValues, hideBadge }) {
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

// ---------------------------------------------------------------------------
// SubTableRow
// ---------------------------------------------------------------------------

export function SubTableRow({ table, isOpen, rowValues, colSpan }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} style={{ paddingBottom: 0, paddingTop: 0 }}>
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <React.Suspense fallback={null}>
            <UniversalTable
              loading={table.loading}
              setLoading={table.setLoading}
              onReload={table.onReload}
              data={rowValues[table.id]}
              headers={table.headers}
              name={table.subTitle}
              subTable
            />
          </React.Suspense>
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
