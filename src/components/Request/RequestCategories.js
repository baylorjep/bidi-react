import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function RequestCategories() {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState([]);

  const categories = [
    "Photography",
    "Videography",
    "DJ",
    "HairAndMakeup",
    "Florist",
    "Catering",
    "WeddingPlanning"
  ];

  const toggleCategory = (category) => {
    setSelectedCategories(
      (prev) =>
        prev.includes(category)
          ? prev.filter((c) => c !== category) // Remove category if already selected
          : [...prev, category] // Add category if not selected
    );
  };

  const handleNext = () => {
    if (selectedCategories.length > 0) {
      // Pass selected categories to the next step
      navigate("/master-request-flow", { state: { selectedCategories } });
    }
  };

  const getDisplayName = (category) => {
    switch (category) {
      case "DJ":
        return "DJ Services";
      case "HairAndMakeup":
        return "Hair and Makeup Artist";
      case "WeddingPlanning":
        return "Wedding Planning";
      default:
        return category;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "64px",
        justifyContent: "center",
        alignItems: "center",
        height: "85vh",
      }}
    >
      <div className="request-form-container-details">
        <div className="request-form-header" style={{ marginTop: "20px" }}>
          What would you like to get done today?
        </div>
        <div
          className="Sign-Up-Page-Subheader"
          style={{ marginTop: "20px", marginBottom: "20px" }}
        >
          Please select one or more
        </div>

        {/* Grid Container for Category Buttons */}
        <div className="event-grid-container">
          {categories.map((cat, index) => (
            <button
              key={index}
              className={`selector-buttons ${
                selectedCategories.includes(cat) ? "selected-event" : ""
              }`}
              onClick={() => toggleCategory(cat)}
            >
              {getDisplayName(cat)}
            </button>
          ))}
        </div>

        <div className="form-button-container">
          <button
            className="request-form-back-and-foward-btn"
            onClick={() => navigate("/")} // Changed to go to home page
          >
            Back
          </button>
          <button
            className={`request-form-back-and-foward-btn ${
              selectedCategories.length > 0 ? "selected-border" : ""
            }`}
            onClick={handleNext}
            disabled={selectedCategories.length === 0}
            style={{
              backgroundColor:
                selectedCategories.length === 0 ? "#9F8AB3" : "#a328f4",
              cursor:
                selectedCategories.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequestCategories;
