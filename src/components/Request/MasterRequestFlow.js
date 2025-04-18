import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MasterRequestForm from "./MasterRequestForm";
import RequestStepper from "./RequestStepper";
import "../../styles/Requests.css";

function MasterRequestFlow() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedCategories = location.state?.selectedCategories || [];

  const [formData, setFormData] = useState({
    commonDetails: {},
    requests: {},
    selectedRequests: selectedCategories,
  });

  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 0) {
      navigate("/request-categories");
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    console.log("All requests submitted!");
    navigate("/confirmation");
  };

  return (
    <div className="request-form-overall-container">
      <div className="request-form-container-details">
        <div className="form-header-section">
          <h2 className="request-form-header">
            {currentStep === 0
              ? "Event Details"
              : `Request Details: ${
                  formData.selectedRequests[currentStep - 1]
                }`}
          </h2>
        </div>

        {currentStep === 0 ? (
          <div className="form-scrollable-content">
            <MasterRequestForm
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          </div>
        ) : (
          <div className="request-stepper-content">
            <RequestStepper
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onBack={handleBack}
            />
          </div>
        )}

        {/* Sticky Footer for Buttons */}
        <div className="form-button-container">
          <button className="request-form-back-btn" onClick={handleBack}>
            Back
          </button>
          <button
            className="request-form-back-and-foward-btn"
            onClick={currentStep === 0 ? handleNext : handleSubmit}
          >
            {currentStep === 0
              ? "Next"
              : currentStep < formData.selectedRequests.length
              ? "Next"
              : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MasterRequestFlow;
