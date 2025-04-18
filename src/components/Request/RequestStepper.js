import React, { useState } from "react";
import PhotographyRequest from "../Request/Photography/PhotographyRequest";
import VideographyRequest from "../Request/Videography/VideographyRequest";
import DjRequest from "../Request/DJ/DjRequest";
import HairAndMakeUpRequest from "../Request/Beauty/HairAndMakeUpRequest";
import FloristRequest from "../Request/Florist/FloristRequest";
import CateringRequest from "../Request/Catering/CateringRequest";
// import { submitRequests } from "../../api/requests"; // Adjust the path as needed

function RequestStepper({
  formData,
  setFormData,
  currentStep,
  setCurrentStep,
  onSubmit,
}) {
  const requestComponents = {
    Photography: PhotographyRequest,
    Videography: VideographyRequest,
    "DJ Services": DjRequest,
    "Hair and Makeup Artist": HairAndMakeUpRequest,
    Florist: FloristRequest,
    Catering: CateringRequest,
  };

  // const CurrentRequestForm =
  //   requestComponents[formData.selectedRequests[currentStep]];

  // Get the current request type based on the current step
  const currentRequestType = formData.selectedRequests[currentStep];
  const CurrentRequestForm = requestComponents[currentRequestType];

  const handleNext = () => {
    if (currentStep < formData.selectedRequests.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const { commonDetails, requests } = formData;
    const payload = formData.selectedRequests.map((type) => ({
      ...commonDetails,
      ...requests[type],
    }));

    try {
      //   await submitRequests(payload);
      alert("Requests submitted successfully!");
      onSubmit(); // Call the parent onSubmit function to reset or navigate
    } catch (error) {
      console.error("Error submitting requests:", error);
    }
  };

  const updateRequestData = (type, data) => {
    setFormData((prev) => ({
      ...prev,
      requests: {
        ...prev.requests,
        [type]: data,
      },
    }));
  };

  return (
    <div>
      {/* <h2>
        Step {currentStep + 1} of {formData.selectedRequests.length}:{" "}
        {currentRequestType} Details
      </h2> */}
      {CurrentRequestForm ? (
        <CurrentRequestForm
          formData={formData.requests[currentRequestType] || {}}
          setFormData={(data) => updateRequestData(currentRequestType, data)}
          onNext={handleNext}
        />
      ) : (
        <p>Error: Unable to load the request form for {currentRequestType}.</p>
      )}
      {/* <div style={{ marginTop: "20px" }}>
        {currentStep > 0 && (
          <button onClick={handleBack} className="request-form-back-btn">
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          className="request-form-back-and-foward-btn"
        >
          {currentStep < formData.selectedRequests.length - 1
            ? "Next"
            : "Submit"}
        </button>
      </div> */}
    </div>
  );
}

export default RequestStepper;
