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
  asyncPages,
}) {
  const debounceRef = React.useRef(null);

  const async = typeof asyncPages === "number" && asyncPages > 0;

  const head = headers || [];
  const { rows, searchTerm, setSearchTerm } = useSearchableRows(
    data,
    head,
    async,
  );
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("");
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
  const handleSearch = (searchValue) => {
    if (async) {
      setSearchTerm(searchValue);
      clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        setLoading({
          searchTerm: searchValue,
          direction: order,
          column: orderBy,
          pages: asyncPages,
        });
      }, 500);
    } else {
      handleSearchChange(searchValue);
    }
  };

  React.useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleReload = React.useCallback(() => {
    if (typeof onReload === "function") {
      onReload();
      return;
    }
    if (typeof setLoading === "function") {
      setLoading(
        async
          ? { searchTerm, direction: order, column: orderBy, pages: asyncPages }
          : true,
      );
    }
  }, [async, onReload, setLoading, searchTerm, order, orderBy, asyncPages]);

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
            onReload={handleReload}
            reloadBtnLoading={reloadBtnLoading}
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            name={name}
            persistSearch={persistSearch}
          />
        )}
        <EnhancedTable
          headers={head}
          rows={rows}
          resetFlag={searchTerm}
          searchTerm={searchTerm}
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
          setLoading={setLoading}
          order={order}
          orderBy={orderBy}
          setOrder={setOrder}
          setOrderBy={setOrderBy}
          asyncPages={asyncPages}
          async={async}
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
  asyncPages: PropTypes.number,
};
