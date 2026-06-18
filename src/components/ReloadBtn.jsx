import React from "react";
import PropTypes from "prop-types";
import { Button, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

function ReloadBtn({ setLoading, loading, onReload }) {
  const canReload = typeof onReload === "function" || typeof setLoading === "function";

  if (!canReload) {
    return null;
  }

  const handleClick = () => {
    if (typeof onReload === "function") {
      onReload();
    } else if (typeof setLoading === "function") {
      setLoading(true);
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
  setLoading: PropTypes.func,
  loading: PropTypes.bool,
  /** Preferred callback — fires when the user clicks reload. */
  onReload: PropTypes.func,
};

export default ReloadBtn;
