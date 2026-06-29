import React from "react";
import {
  Collapse,
  Divider,
  IconButton,
  InputBase,
  Paper,
  Stack,
} from "@mui/material";
import { Clear, Search } from "@mui/icons-material";
import PropTypes from "prop-types";

export default function FancySearch({ value, onSubmit }) {
  const [hover, setHover] = React.useState(Boolean(value));
  const expanded = hover || Boolean(value);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(value);
  };

  const handleEndHover = () => {
    setHover(false);
  };

  // Sync internal state when the parent clears/changes the search term.
  // A ref tracks whether this sync came from the user typing or from a parent
  // update, so the debounce only fires for genuine user input.
  const isUserType = React.useRef(false);

  return (
    <form onSubmit={handleSubmit}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: expanded ? "24px" : "50px",
          display: "flex",
          alignItems: "center",
          transition: "all 0.5s ease-in-out",
          p: expanded ? 1 : 0.5,
          width: "fit-content",
          border: (theme) => `1px solid ${theme.palette.divider}`,
          mb: 1,
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={handleEndHover}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
      >
        <InputBase
          placeholder="Search"
          value={value}
          onChange={(e) => {
            isUserType.current = true;
            onSubmit(e.target.value);
          }}
          sx={{
            ml: 1,
            width: expanded ? "100%" : 0,
            transition: "width 0.5s ease-in-out",
            ...(expanded ? {} : { margin: 0 }),
          }}
          onBlur={handleEndHover}
        />

        <Collapse in={Boolean(value)} orientation="horizontal" unmountOnExit>
          <Stack direction="row" alignItems="center" spacing={0} sx={{ mr: 3 }}>
            <IconButton
              onClick={() => {
                isUserType.current = false;
                // Immediately clear instead of waiting for the debounce
                onSubmit("");
              }}
            >
              <Clear />
            </IconButton>
            <Divider orientation="vertical" flexItem />
          </Stack>
        </Collapse>

        <IconButton onClick={handleSubmit} type="submit">
          <Search />
        </IconButton>
      </Paper>
    </form>
  );
}

FancySearch.propTypes = {
  value: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
};
