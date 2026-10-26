import React from "react";
import { getSearchableColumnIds, filterRows } from "../utils/tableUtils";

export default function useSearchableRows(data, headers, serverSide) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filterOptions = React.useMemo(
    () => getSearchableColumnIds(headers),
    [headers],
  );

  const rows = React.useMemo(
    () => (serverSide ? data : filterRows(data, searchTerm, filterOptions)),
    [serverSide, data, filterOptions, searchTerm],
  );

  return {
    rows,
    searchTerm,
    setSearchTerm,
  };
}
