import React from "react";
import PropTypes from "prop-types";
import ClipLoader from "react-spinners/ClipLoader";

const LoadingSpinner = ({ color = "#000000", size = 50 }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        height: "100vh",
        paddingTop: "20vh",
      }}
    >
      <ClipLoader color={color} size={size} />
    </div>
  );
};

LoadingSpinner.propTypes = {
  color: PropTypes.string, // Accepts a color prop
  size: PropTypes.number, // Accepts a size prop
};

export default LoadingSpinner;
