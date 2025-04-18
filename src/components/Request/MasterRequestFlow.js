import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MasterRequestForm from "./MasterRequestForm";
import RequestStepper from "./RequestStepper";
import StatusBar from "./StatusBar";
import { Spinner } from "react-bootstrap";
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
  const [missingFields, setMissingFields] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSteps = () => [
    "Event Details",
    ...formData.selectedRequests.map((request) => `${request} Details`),
  ];

  const validateRequiredFields = () => {
    const requiredFields = [];
    const { commonDetails, requests } = formData;

    // Validate MasterRequestForm fields
    if (!commonDetails.eventType) requiredFields.push("Event Type");
    if (!commonDetails.location) requiredFields.push("Location");
    if (!commonDetails.numGuests) requiredFields.push("Number of Guests");
    if (
      commonDetails.dateFlexibility === "specific" &&
      !commonDetails.startDate
    ) {
      requiredFields.push("Event Date");
    }
    if (
      commonDetails.dateFlexibility === "range" &&
      (!commonDetails.startDate || !commonDetails.endDate)
    ) {
      requiredFields.push("Date Range");
    }
    if (
      commonDetails.dateFlexibility === "flexible" &&
      !commonDetails.dateTimeframe
    ) {
      requiredFields.push("Preferred Timeframe");
    }

    // Validate individual request forms
    formData.selectedRequests.forEach((request) => {
      const requestData = requests[request] || {};
      if (!requestData.stylePreferences) {
        requiredFields.push(`${request}: Style Preferences`);
      }
      if (!requestData.deliverables) {
        requiredFields.push(`${request}: Deliverables`);
      }
    });

    setMissingFields(requiredFields);
    return requiredFields.length === 0;
  };

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

  const handleSubmit = async () => {
    // if (!validateRequiredFields()) {
    //   setCurrentStep(getSteps().length - 1); // Navigate to the Review step
    //   return;
    // }

    setIsSubmitting(true);
    try {
      console.log("Submitting form data:", formData);
      navigate("/confirmation");
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="request-form-overall-container">
      {/* Status Bar */}
      <div
        className="request-form-status-container desktop-only"
        style={{ height: "75vh", padding: "40px" }}
      >
        <div className="request-form-box">
          <StatusBar steps={getSteps()} currentStep={currentStep} />
        </div>
      </div>
      <div
        className="request-form-container-details"
        style={{ alignItems: "normal" }}
      >
        <div className="request-form-status-container mobile-only">
          <div className="request-form-box">
            <StatusBar steps={getSteps()} currentStep={currentStep} />
          </div>
        </div>

        <div className="form-header-section">
          <h2 className="request-form-header">{getSteps()[currentStep]}</h2>
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
              // onBack={handleBack}
              currentStep={currentStep - 1}
              setCurrentStep={(step) => setCurrentStep(step + 1)}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="form-button-container">
          {currentStep === 0 && (
            <button
              className="request-form-back-btn"
              onClick={() => navigate("/request-categories")}
              disabled={isSubmitting}
            >
              Back
            </button>
          )}
          {currentStep > 0 && (
            <button
              className="request-form-back-btn"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </button>
          )}
          {currentStep < getSteps().length - 1 && (
            <button
              className="request-form-back-and-foward-btn"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Next
            </button>
          )}
          {currentStep === getSteps().length - 1 && (
            <button
              className="request-form-back-and-foward-btn"
              onClick={handleSubmit}
              disabled={isSubmitting || missingFields.length > 0}
            >
              {isSubmitting ? <Spinner size="sm" /> : "Submit"}
            </button>
          )}
        </div>

        {/* Display Missing Fields */}
        {currentStep === getSteps().length - 1 && missingFields.length > 0 && (
          <div className="missing-fields">
            <h4>Missing Required Fields:</h4>
            <ul>
              {missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default MasterRequestFlow;
