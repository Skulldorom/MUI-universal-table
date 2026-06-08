import React from "react";
import PropTypes from "prop-types";
import { Button, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

function ReloadBtn({ setLoading, loading }) {
  if (typeof setLoading !== "function") {
    return null;
  }

  return (
    <Tooltip title="Reload">
      <Button
        variant="contained"
        color="primary"
        onClick={() => setLoading(true)}
        disabled={loading}
      >
        <RefreshIcon />
      </Button>
    </Tooltip>
  );
}

ReloadBtn.propTypes = {
  setLoading: PropTypes.func,
  loading: PropTypes.bool,
};

export default ReloadBtn;
