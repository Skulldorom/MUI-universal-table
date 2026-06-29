import React from "react";
import { getSearchableColumnIds, filterRows } from "../utils/tableUtils";

export default function useSearchableRows(data, headers, async) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filterOptions = React.useMemo(
    () => getSearchableColumnIds(headers),
    [headers],
  );

  const rows = React.useMemo(
    () => (async ? data : filterRows(data, searchTerm, filterOptions)),
    [async, data, filterOptions, searchTerm],
  );

  return {
    rows,
    searchTerm,
    setSearchTerm,
  };
}
