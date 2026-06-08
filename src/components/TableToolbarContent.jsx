import React from "react";
import PropTypes from "prop-types";
import { Box, Stack, Toolbar } from "@mui/material";
import ReloadBtn from "./ReloadBtn";
import SearchArea from "./SearchArea";

function TableToolbarContent({
  setLoading,
  reloadBtnLoading,
  searchTerm,
  onSearchChange,
  name,
}) {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        pt: 2,
      }}
    >
      <Stack
        spacing={2}
        direction={{ xs: "column", md: "row" }}
        sx={{
          width: "100%",
          alignItems: { xs: "flex-start", md: "center" },
        }}
      >
        <Box sx={{ flex: "1 1 100%" }} id="tableTitle">
          <ReloadBtn setLoading={setLoading} loading={reloadBtnLoading} />
        </Box>
        <SearchArea
          current={searchTerm}
          setFinalVal={onSearchChange}
          searchName={name}
        />
      </Stack>
    </Toolbar>
  );
}

TableToolbarContent.propTypes = {
  setLoading: PropTypes.func,
  reloadBtnLoading: PropTypes.bool,
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  name: PropTypes.string,
};

export default TableToolbarContent;
