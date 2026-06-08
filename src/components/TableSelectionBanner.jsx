import React from "react";
import PropTypes from "prop-types";
import { Box, Collapse, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Task } from "@mui/icons-material";

function TableSelectionBanner({ selected, onSelection, selectIcon }) {
  return (
    <Collapse in={selected.length > 0} unmountOnExit>
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
          borderRadius: 1,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <Typography variant="h6" id="tableTitle" component="div">
          {selected.length} selected
        </Typography>

        <IconButton onClick={() => onSelection(selected)}>
          {selectIcon || <Task />}
        </IconButton>
      </Box>
    </Collapse>
  );
}

TableSelectionBanner.propTypes = {
  selected: PropTypes.array.isRequired,
  onSelection: PropTypes.func,
  selectIcon: PropTypes.element,
};

export default TableSelectionBanner;
