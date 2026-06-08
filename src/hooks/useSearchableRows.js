import React from "react";
import { getSearchableColumnIds, filterRows } from "../utils/tableUtils";

export default function useSearchableRows(data, headers) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filterOptions = React.useMemo(
    () => getSearchableColumnIds(headers),
    [headers],
  );

  const rows = React.useMemo(
    () => filterRows(data, searchTerm, filterOptions),
    [data, filterOptions, searchTerm],
  );

  return {
    rows,
    searchTerm,
    setSearchTerm,
  };
}
