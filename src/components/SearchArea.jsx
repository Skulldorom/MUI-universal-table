import React from "react";
import PropTypes from "prop-types";
import FancySearch from "./FancySearch";

function SearchArea(props) {
  const { current, setFinalVal } = props;
  const searchVal = React.useMemo(
    () =>
      current ?? sessionStorage.getItem(`searchVal:${props.searchName}`) ?? "",
    [current, props.searchName],
  );

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
};

export default SearchArea;
