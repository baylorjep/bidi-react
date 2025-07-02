import React from "react";
import PropTypes from "prop-types";
import ClipLoader from "react-spinners/ClipLoader";
import "../styles/LoadingSpinner.css";

const LoadingSpinner = ({ 
  color = "#ff008a", 
  size = 50, 
  variant = "default",
  text = "",
  fullScreen = false,
  className = "",
  style = {}
}) => {
  const getSpinnerContent = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      case "pulse":
        return (
          <div className="loading-pulse"></div>
        );
      case "ring":
        return (
          <div className="loading-ring"></div>
        );
      case "bars":
        return (
          <div className="loading-bars">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        );
      case "clip":
      default:
        return <ClipLoader color={color} size={size} />;
    }
  };

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    ...style
  };

  if (fullScreen) {
    containerStyle.height = "100vh";
    containerStyle.paddingTop = "20vh";
  }

  return (
    <div 
      className={`loading-spinner-container ${className}`}
      style={containerStyle}
    >
      {getSpinnerContent()}
      {text && (
        <p className="loading-text" style={{ color, margin: 0, fontSize: "1rem" }}>
          {text}
        </p>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
  variant: PropTypes.oneOf(["default", "clip", "dots", "pulse", "ring", "bars"]),
  text: PropTypes.string,
  fullScreen: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object
};

export default LoadingSpinner;
