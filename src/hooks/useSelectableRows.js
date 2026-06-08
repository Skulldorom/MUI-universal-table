import React from "react";
import { getSelectableRowId } from "../utils/tableUtils";

export default function useSelectableRows({ rows, selectRows, selectID }) {
  const [selected, setSelected] = React.useState([]);

  const clearSelection = React.useCallback(() => {
    setSelected([]);
  }, []);

  const handleSelectAllClick = React.useCallback(
    (event) => {
      if (!event.target.checked) {
        setSelected([]);
        return;
      }

      const newSelected = rows.map((row, index) =>
        getSelectableRowId(row, index, selectID),
      );
      setSelected(newSelected);
    },
    [rows, selectID],
  );

  const handleClick = React.useCallback(
    (event, id) => {
      if (!selectRows) {
        return;
      }

      setSelected((previous) =>
        previous.includes(id)
          ? previous.filter((selectedId) => selectedId !== id)
          : [...previous, id],
      );
    },
    [selectRows],
  );

  return {
    selected,
    clearSelection,
    handleSelectAllClick,
    handleClick,
  };
}
