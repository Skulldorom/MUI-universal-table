import React from "react";
import PropTypes from "prop-types";
import { Button, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

function ReloadBtn({ loading, onReload }) {
  const canReload = typeof onReload === "function";

  if (!canReload) {
    return null;
  }

  const handleClick = () => {
    if (typeof onReload === "function") {
      onReload();
    }
  };

  return (
    <Tooltip title="Reload">
      <Button
        variant="contained"
        color="primary"
        onClick={handleClick}
        disabled={loading}
      >
        <RefreshIcon />
      </Button>
    </Tooltip>
  );
}

ReloadBtn.propTypes = {
  loading: PropTypes.bool,
  /** Preferred callback — fires when the user clicks reload. */
  onReload: PropTypes.func,
};

export default ReloadBtn;
