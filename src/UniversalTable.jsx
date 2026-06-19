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
  onReload,
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
  pageSizeOptions,
  persistSearch,
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
            onReload={onReload}
            reloadBtnLoading={reloadBtnLoading}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            name={name}
            persistSearch={persistSearch}
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
          pageSizeOptions={pageSizeOptions}
          name={name}
        />
      </Paper>
    </>
  );
}

UniversalTable.propTypes = {
  loading: PropTypes.bool,
  setLoading: PropTypes.func,
  /** Preferred callback — fires when the user clicks reload. */
  onReload: PropTypes.func,
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
  /** Override default page size options (e.g. [10, 25, 50]). Default auto-computed. */
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  /** Persist search term to sessionStorage (requires name prop). Default: false */
  persistSearch: PropTypes.bool,
};
