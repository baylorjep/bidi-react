import React from "react";
import PhotographyStepper from "./Photography/PhotographyStepper";
import VideographyStepper from "./Videography/VideographyStepper";
import CateringStepper from "./Catering/CateringStepper";
import "../../styles/Requests.css";

function RequestStepper({ formData, setFormData, onSubmit, currentStep, setCurrentStep }) {
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      requests: {
        ...prev.requests,
        [field]: value,
      },
    }));
  };

  return (
    <div className="request-stepper">
      <div className="form-grid">
        <div className="wedding-details-container">
          <div className="custom-input-container">
            <input
              type="text"
              name="eventTitle"
              value={formData.requests.eventTitle || ""}
              onChange={(e) => handleInputChange("eventTitle", e.target.value)}
              placeholder="Event Title"
              className="custom-input"
            />
            <label htmlFor="eventTitle" className="custom-label">
              Event Title
            </label>
          </div>

          <div className="custom-input-container">
            <input
              type="text"
              name="location"
              value={formData.requests.location || ""}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Event Location"
              className="custom-input"
            />
            <label htmlFor="location" className="custom-label">
              Event Location
            </label>
          </div>

          <div className="custom-input-container">
            <input
              type="date"
              name="date"
              value={formData.requests.date || ""}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="custom-input"
            />
            <label htmlFor="date" className="custom-label">
              Event Date
            </label>
          </div>

          <div className="custom-input-container">
            <input
              type="number"
              name="numGuests"
              value={formData.requests.numGuests || ""}
              onChange={(e) => handleInputChange("numGuests", e.target.value)}
              placeholder="Number of Guests"
              className="custom-input"
              min="1"
            />
            <label htmlFor="numGuests" className="custom-label">
              Number of Guests
            </label>
          </div>
        </div>
      </div>

      <div className="form-button-container">
        <button className="request-form-back-btn" onClick={() => setCurrentStep(currentStep - 1)}>
          Back
        </button>
        <button className="request-form-back-and-foward-btn" onClick={onSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default RequestStepper;
