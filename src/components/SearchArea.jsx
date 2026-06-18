import React from "react";
import PropTypes from "prop-types";
import FancySearch from "./FancySearch";

function SearchArea(props) {
  const { current, setFinalVal, searchName, persistSearch } = props;

  const searchVal = React.useMemo(() => {
    if (current !== undefined && current !== null) return current;
    if (persistSearch && searchName) {
      return sessionStorage.getItem(`searchVal:${searchName}`) ?? "";
    }
    return "";
  }, [current, persistSearch, searchName]);

  return (
    <div key="SearchArea">
      <FancySearch value={searchVal} onSubmit={setFinalVal} />
    </div>
  );
}

SearchArea.propTypes = {
  current: PropTypes.string,
  setFinalVal: PropTypes.func.isRequired,
  searchName: PropTypes.string,
  /** Persist search term to sessionStorage (requires searchName). Default: false */
  persistSearch: PropTypes.bool,
};

export default SearchArea;
