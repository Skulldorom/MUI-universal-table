import React from "react";
import PropTypes from "prop-types";
import Paper from "@mui/material/Paper";
import LazyLoadingIndicator from "./components/LazyLoadingIndicator";
import useSearchableRows from "./hooks/useSearchableRows";
import useSelectableRows from "./hooks/useSelectableRows";
import TableSelectionBanner from "./components/TableSelectionBanner";
import TableTitle from "./components/TableTitle";
import TableToolbarContent from "./components/TableToolbarContent";
import EnhancedTable from "./components/EnhancedTable";

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
  const { rows, searchTerm, setSearchTerm } = useSearchableRows(data, head);
  const { selected, clearSelection, handleSelectAllClick, handleClick } =
    useSelectableRows({
      rows,
      selectRows,
      selectID,
    });

  const handleSearchChange = React.useCallback(
    (value) => {
      clearSelection();
      setSearchTerm(value);
    },
    [clearSelection, setSearchTerm],
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
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            name={name}
          />
        )}
        <EnhancedTable
          headers={head}
          rows={rows}
          resetFlag={searchTerm}
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
