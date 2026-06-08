import React from "react";
import { Box, LinearProgress, Typography, Collapse } from "@mui/material";
import PropTypes from "prop-types";

const LazyLoadingIndicator = ({ show, currentPage, totalPages }) => {
  return (
    <Collapse in={show} timeout="auto" unmountOnExit>
      <Box sx={{ width: "100%", mb: 2, px: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Loading page {currentPage} of {totalPages}...
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(currentPage / totalPages) * 100}
        />
      </Box>
    </Collapse>
  );
};

LazyLoadingIndicator.propTypes = {
  show: PropTypes.bool.isRequired,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
};

export default LazyLoadingIndicator;
