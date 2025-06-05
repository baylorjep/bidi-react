import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/RequestCategories.css";

function RequestCategories() {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState([]);

  const categories = [
    {
      id: "Photography",
      name: "Photography",
      icon: "fa-camera",
      description: "Professional photography services for your special day"
    },
    {
      id: "Videography",
      name: "Videography",
      icon: "fa-video",
      description: "Capture your memories in motion"
    },
    {
      id: "DJ",
      name: "DJ Services",
      icon: "fa-music",
      description: "Keep your celebration moving with great music"
    },
    {
      id: "HairAndMakeup",
      name: "Hair and Makeup",
      icon: "fa-spa",
      description: "Look your best on your special day"
    },
    {
      id: "Florist",
      name: "Florist",
      icon: "fa-leaf",
      description: "Beautiful floral arrangements for your event"
    },
    {
      id: "Catering",
      name: "Catering",
      icon: "fa-utensils",
      description: "Delicious food and beverage services"
    },
    {
      id: "WeddingPlanning",
      name: "Wedding Planning",
      icon: "fa-calendar-check",
      description: "Professional planning and coordination"
    }
  ];

  const toggleCategory = (category) => {
    setSelectedCategories(
      (prev) =>
        prev.includes(category)
          ? prev.filter((c) => c !== category)
          : [...prev, category]
    );
  };

  const handleNext = () => {
    if (selectedCategories.length > 0) {
      navigate("/master-request-flow", { 
        state: { 
          selectedCategories,
          showRequestFlow: true
        } 
      });
    }
  };

  return (
    <div className="request-categories-container">
      <div className="request-categories-form-container-details">
        <div className="request-form-header">
          What would you like to get done today?
        </div>
        <div className="request-form-subheader">
          Please select one or more services
        </div>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          color: '#FF008A',
          fontWeight: 'bold'
        }}>
          Get 5% off everything when you book through Bidi! Limited time offer.
        </div>

        <div className="request-categories-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`request-category-card ${
                selectedCategories.includes(category.id) ? "selected" : ""
              }`}
              onClick={() => toggleCategory(category.id)}
            >
              <div className="category-icon">
                <i className={`fas ${category.icon}`}></i>
              </div>
              <div className="category-content">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
              {selectedCategories.includes(category.id) && (
                <div className="selected-indicator">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="form-button-container">
          <button
            className="request-form-back-and-foward-btn"
            onClick={() => navigate("/")}
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
              cursor: selectedCategories.length === 0 ? "not-allowed" : "pointer",
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
