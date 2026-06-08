import React from "react";
import PropTypes from "prop-types";
import { Typography } from "@mui/material";

function TableTitle({ name, subTable }) {
  return (
    <Typography
      variant={subTable ? "h6" : "h5"}
      color={subTable ? "secondary" : "primary"}
      sx={{ p: 2 }}
    >
      {name}
    </Typography>
  );
}

TableTitle.propTypes = {
  name: PropTypes.string,
  subTable: PropTypes.bool,
};

export default TableTitle;
