import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactQuill from "react-quill";
import { supabase } from "../../../supabaseClient";
import { Spinner } from "react-bootstrap";
import SignInModal from "../Event/SignInModal";
import StatusBar from "../StatusBar"; // Add this import
import { v4 as uuidv4 } from "uuid";
import "react-quill/dist/quill.snow.css";
import "../../../styles/Photography.css";
import AuthModal from "../Authentication/AuthModal";

const PhotoGrid = ({ photos, removePhoto, openModal }) => {
  return (
    <div className="photo-grid">
      {photos.map((photo, index) => (
        <div key={index} className="photo-grid-item">
          <img
            src={photo.url}
            alt={`Uploaded ${index}`}
            className="photo-grid-image"
            onClick={() => openModal(photo)}
          />
          <button
            className="remove-photo-button"
            onClick={(e) => {
              e.stopPropagation();
              removePhoto(index);
            }}
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
};

const PhotoModal = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-photo" onClick={(e) => e.stopPropagation()}>
        <button
          className="remove-photo-button"
          style={{ position: "absolute", right: "10px", top: "10px" }}
          onClick={onClose}
        >
          X
        </button>
        <img src={photo.url} alt="Full size" />
      </div>
    </div>
  );
};

function PhotographyRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(0);
  const [addMoreLoading, setAddMoreLoading] = useState(false);
  const [detailsSubStep, setDetailsSubStep] = useState(0);
  const [bidScore, setBidScore] = useState(0);
  const [scoreMessage, setScoreMessage] = useState("");
  const [earnedCoupon, setEarnedCoupon] = useState(false);

  // Add state for selected vendor
  const [selectedVendor, setSelectedVendor] = useState(
    location.state?.vendor || null
  );
  const [vendorImage, setVendorImage] = useState(location.state?.image || null);

  // Consolidated state
  const [formData, setFormData] = useState(() => {
    const saved = JSON.parse(
      localStorage.getItem("photographyRequest") || "{}"
    );
    return {
      eventType: saved.eventType || "",
      eventDetails: {
        eventTitle: saved.eventDetails?.eventTitle || "",
        dateType: saved.eventDetails?.dateType || "specific",
        location: saved.eventDetails?.location || "",
        dateFlexibility: saved.eventDetails?.dateFlexibility || "specific",
        startDate: saved.eventDetails?.startDate || "",
        endDate: saved.eventDetails?.endDate || "",
        dateTimeframe: saved.eventDetails?.dateTimeframe || "",
        timeOfDay: saved.eventDetails?.timeOfDay || "",
        startTime: saved.eventDetails?.startTime || "",
        endTime: saved.eventDetails?.endTime || "",
        startTimeUnknown: saved.eventDetails?.startTimeUnknown || false,
        endTimeUnknown: saved.eventDetails?.endTimeUnknown || false,
        numPeople: saved.eventDetails?.numPeople || "",
        numPeopleUnknown: saved.eventDetails?.numPeopleUnknown || false,
        duration: saved.eventDetails?.duration || "",
        durationUnknown: saved.eventDetails?.durationUnknown || false,
        indoorOutdoor: saved.eventDetails?.indoorOutdoor || "",
        secondPhotographer: saved.eventDetails?.secondPhotographer || "",
        secondPhotographerUnknown:
          saved.eventDetails?.secondPhotographerUnknown || false,
        stylePreferences: saved.eventDetails?.stylePreferences || {},
        deliverables: saved.eventDetails?.deliverables || {},
        weddingDetails: saved.eventDetails?.weddingDetails || {},
        priceRange: saved.eventDetails?.priceRange || "",
        pinterestBoard: saved.eventDetails?.pinterestBoard || "",
        additionalInfo: saved.eventDetails?.additionalInfo || "",
        extras: saved.eventDetails?.extras || {}, // Add this field
        priceQualityPreference:
          saved.eventDetails?.priceQualityPreference || "2",
      },
      personalDetails: saved.personalDetails || {
        firstName: "",
        lastName: "",
        phoneNumber: "",
      },
      photos: saved.photos || [],
    };
  });

  const getSteps = () => [
    "Photography Details",
    formData.eventType ? `${formData.eventType} Details` : "Event Details",
    "Personal Details",
    "Inspiration",
    "Review",
  ];

  const getDetailsSubSteps = () => {
    switch (formData.eventType) {
      case "Wedding":
        return [
          "Basic Details",
          "Coverage",
          "Style & Deliverables",
          "Budget & Additional Info",
        ];
      default:
        return [
          "Basic Info",
          "Coverage",
          "Style & Deliverables",
          "Additional Details",
        ];
    }
  };

  const handleEventSelect = (event) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        eventType: event,
      };
      localStorage.setItem("photographyRequest", JSON.stringify(newData));
      setTimeout(() => updateBidScore(), 0);
      return newData;
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      let newData;
      if (field === "eventDetails") {
        newData = {
          ...prev,
          eventDetails: {
            ...prev.eventDetails,
            ...value,
          },
        };
      } else {
        newData = { ...prev, [field]: value };
      }

      localStorage.setItem("photographyRequest", JSON.stringify(newData));
      setTimeout(() => updateBidScore(), 0);
      return newData;
    });
  };

  // Event Selection Component
  const renderEventSelection = () => {
    const eventOptions = [
      "Wedding",
      "Engagement",
      "Graduation",
      "Couples Session",
      "Family",
      "Headshots",
      "Event",
      "Product",
      "Maternity",
      "Newborn",
      "Boudoir Session",
    ];

    return (
      <div className="event-grid-container">
        {eventOptions.map((event, index) => (
          <button
            key={index}
            className={`selector-buttons ${
              formData.eventType === event ? "selected-event" : ""
            }`}
            onClick={() => handleEventSelect(event)}
          >
            {event}
          </button>
        ))}
      </div>
    );
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  const renderEventDetailsSubStep = () => {
    switch (detailsSubStep) {
      case 0: // Basic Wedding Details
        return (
          <div className="form-grid">
            <div className="custom-input-container required">
              <input
                type="text"
                name="location"
                value={formData.eventDetails.location}
                onChange={(e) =>
                  handleInputChange("eventDetails", {
                    ...formData.eventDetails,
                    location: e.target.value,
                  })
                }
                placeholder="Can be a city, county, address, or venue name"
                className="custom-input"
              />
              <label htmlFor="location" className="custom-label">
                Location
              </label>
            </div>

            <div className="custom-input-container">
              <select
                name="dateFlexibility"
                value={formData.eventDetails.dateFlexibility}
                onChange={(e) =>
                  handleInputChange("eventDetails", {
                    ...formData.eventDetails,
                    dateFlexibility: e.target.value,
                  })
                }
                className="custom-input"
              >
                <option value="specific">Specific Date</option>
                <option value="range">Date Range</option>
                <option value="flexible">I'm Flexible</option>
              </select>
              <label htmlFor="dateFlexibility" className="custom-label">
                Date Flexibility
              </label>
            </div>

            {formData.eventDetails.dateFlexibility === "specific" && (
              <div className="custom-input-container">
                <input
                  type="date"
                  name="startDate"
                  value={formData.eventDetails.startDate}
                  onChange={(e) =>
                    handleInputChange("eventDetails", {
                      ...formData.eventDetails,
                      startDate: e.target.value,
                    })
                  }
                  className="custom-input"
                />
                <label htmlFor="startDate" className="custom-label">
                  Wedding Date
                </label>
              </div>
            )}

            {formData.eventDetails.dateFlexibility === "range" && (
              <>
                <div className="custom-input-container">
                  <input
                    type="date"
                    name="startDate"
                    value={formData.eventDetails.startDate}
                    onChange={(e) =>
                      handleInputChange("eventDetails", {
                        ...formData.eventDetails,
                        startDate: e.target.value,
                      })
                    }
                    className="custom-input"
                  />
                  <label htmlFor="startDate" className="custom-label">
                    Earliest Date
                  </label>
                </div>

                <div className="custom-input-container">
                  <input
                    type="date"
                    name="endDate"
                    value={formData.eventDetails.endDate}
                    onChange={(e) =>
                      handleInputChange("eventDetails", {
                        ...formData.eventDetails,
                        endDate: e.target.value,
                      })
                    }
                    className="custom-input"
                  />
                  <label htmlFor="endDate" className="custom-label">
                    Latest Date
                  </label>
                </div>
              </>
            )}

            {formData.eventDetails.dateFlexibility === "flexible" && (
              <div className="custom-input-container">
                <select
                  name="dateTimeframe"
                  value={formData.eventDetails.dateTimeframe}
                  onChange={(e) =>
                    handleInputChange("eventDetails", {
                      ...formData.eventDetails,
                      dateTimeframe: e.target.value,
                    })
                  }
                  className="custom-input"
                >
                  <option value="">Select timeframe</option>
                  <option value="3months">Within 3 months</option>
                  <option value="6months">Within 6 months</option>
                  <option value="1year">Within 1 year</option>
                  <option value="more">More than 1 year</option>
                </select>
                <label htmlFor="dateTimeframe" className="custom-label">
                  Preferred Timeframe
                </label>
              </div>
            )}

            {/* Rest of the time inputs */}
            <div className="start-end-time">
              <div className="custom-input-container">
                <div className="input-with-unknown">
                  <input
                    type="time"
                    name="startTime"
                    value={formData.eventDetails.startTime}
                    onChange={(e) =>
                      handleInputChange("eventDetails", {
                        ...formData.eventDetails,
                        startTime: e.target.value,
                        startTimeUnknown: false,
                      })
                    }
                    className="custom-input"
                    disabled={formData.eventDetails.startTimeUnknown}
                  />
                  <label className="unknown-checkbox-container">
                    <input
                      type="checkbox"
                      checked={formData.eventDetails.startTimeUnknown}
                      onChange={(e) =>
                        handleInputChange("eventDetails", {
                          ...formData.eventDetails,
                          startTime: "",
                          startTimeUnknown: e.target.checked,
                        })
                      }
                    />
                    <span className="unknown-checkbox-label">Not sure</span>
                  </label>
                </div>
                <label htmlFor="startTime" className="custom-label">
                  Start Time
                </label>
              </div>

              <div className="custom-input-container">
                <div className="input-with-unknown">
                  <input
                    type="time"
                    name="endTime"
                    value={formData.eventDetails.endTime}
                    onChange={(e) =>
                      handleInputChange("eventDetails", {
                        ...formData.eventDetails,
                        endTime: e.target.value,
                        endTimeUnknown: false,
                      })
                    }
                    className="custom-input"
                    disabled={formData.eventDetails.endTimeUnknown}
                  />
                  <label className="unknown-checkbox-container">
                    <input
                      type="checkbox"
                      checked={formData.eventDetails.endTimeUnknown}
                      onChange={(e) =>
                        handleInputChange("eventDetails", {
                          ...formData.eventDetails,
                          endTime: "",
                          endTimeUnknown: e.target.checked,
                        })
                      }
                    />
                    <span className="unknown-checkbox-label">Not sure</span>
                  </label>
                </div>
                <label htmlFor="endTime" className="custom-label">
                  End Time
                </label>
              </div>
            </div>

            <div className="custom-input-container">
              <select
                name="indoorOutdoor"
                value={formData.eventDetails.indoorOutdoor}
                onChange={(e) =>
                  handleInputChange("eventDetails", {
                    ...formData.eventDetails,
                    indoorOutdoor: e.target.value,
                  })
                }
                className="custom-input"
              >
                <option value="">Select</option>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="both">Both</option>
              </select>
              <label htmlFor="indoorOutdoor" className="custom-label">
                Indoor or Outdoor
              </label>
            </div>
          </div>
        );

      case 1: // Coverage Preferences
        return (
          <div className="wedding-details-container">
            {formData.eventType === "Wedding" && (
              <div
                className="wedding-photo-options"
                style={{ paddingTop: "0", paddingBottom: "0" }}
              >
                <div className="photo-options-header">
                  What moments do you want captured?
                </div>
                <div className="photo-options-grid">
                  {[
                    { key: "preCeremony", label: "Pre-Ceremony" },
                    { key: "ceremony", label: "Ceremony" },
                    { key: "luncheon", label: "Luncheon" },
                    { key: "reception", label: "Reception" },
                  ].map(({ key, label }) => (
                    <div key={key} className="photo-option-item">
                      <input
                        type="checkbox"
                        id={key}
                        checked={
                          formData.eventDetails.weddingDetails?.[key] || false
                        }
                        onChange={(e) =>
                          handleInputChange("eventDetails", {
                            ...formData.eventDetails,
                            weddingDetails: {
                              ...formData.eventDetails.weddingDetails,
                              [key]: e.target.checked,
                            },
                          })
                        }
                      />
                      <label htmlFor={key}>{label}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="custom-input-container">
              <div className="input-with-unknown">
                <input
                  type="number"
                  name="duration"
                  value={formData.eventDetails.duration}
                  onChange={(e) =>
                    handleInputChange("eventDetails", {
                      ...formData.eventDetails,
                      duration: e.target.value,
                      durationUnknown: false,
                    })
                  }
                  className="custom-input"
                  disabled={formData.eventDetails.durationUnknown}
                  min="1"
                />
                <label className="unknown-checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.eventDetails.durationUnknown}
                    onChange={(e) =>
                      handleInputChange("eventDetails", {
                        ...formData.eventDetails,
                        duration: "",
                        durationUnknown: e.target.checked,
                      })
                    }
                  />
                  <span className="unknown-checkbox-label">Not sure</span>
                </label>
              </div>
              <label htmlFor="duration" className="custom-label">
                Hours of Coverage Needed
              </label>
            </div>

            <div className="custom-input-container">
              <div className="input-with-unknown">
                <input
                  type="number"
                  name="numPeople"
                  value={formData.eventDetails.numPeople}
                  onChange={(e) =>
                    handleInputChange("eventDetails", {
                      ...formData.eventDetails,
                      numPeople: e.target.value,
                      numPeopleUnknown: false,
                    })
                  }
                  className="custom-input"
                  disabled={formData.eventDetails.numPeopleUnknown}
                  min="1"
                />
                <label className="unknown-checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.eventDetails.numPeopleUnknown}
                    onChange={(e) =>
                      handleInputChange("eventDetails", {
                        ...formData.eventDetails,
                        numPeople: "",
                        numPeopleUnknown: e.target.checked,
                      })
                    }
                  />
                  <span className="unknown-checkbox-label">Not sure</span>
                </label>
              </div>
              <label htmlFor="numPeople" className="custom-label">
                Expected Number of People
              </label>
            </div>

            <div className="custom-input-container">
              <select
                name="secondPhotographer"
                value={formData.eventDetails.secondPhotographer}
                onChange={(e) =>
                  handleInputChange("eventDetails", {
                    ...formData.eventDetails,
                    secondPhotographer: e.target.value,
                  })
                }
                className="custom-input"
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="undecided">Let photographer recommend</option>
              </select>
              <label htmlFor="secondPhotographer" className="custom-label">
                Second Photographer?
              </label>
            </div>
          </div>
        );

      case 2: // Style & Deliverables
        return (
          <div className="wedding-details-container">
            <div className="wedding-photo-options">
              <div className="photo-options-header">
                Preferred Photography Style
              </div>
              <div className="photo-options-grid">
                {[
                  { key: "brightAiry", label: "Bright & Airy" },
                  { key: "darkMoody", label: "Dark & Moody" },
                  { key: "filmEmulation", label: "Film-Like" },
                  { key: "traditional", label: "Traditional/Classic" },
                  { key: "documentary", label: "Documentary/Candid" },
                  { key: "artistic", label: "Artistic/Creative" },
                ].map(({ key, label }) => (
                  <div key={key} className="photo-option-item">
                    <input
                      type="checkbox"
                      id={key}
                      checked={
                        formData.eventDetails.stylePreferences?.[key] || false
                      }
                      onChange={(e) =>
                        handleInputChange("eventDetails", {
                          ...formData.eventDetails,
                          stylePreferences: {
                            ...formData.eventDetails.stylePreferences,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                    <label htmlFor={key}>{label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="wedding-photo-options">
              <div className="photo-options-header">Desired Deliverables</div>
              <div className="photo-options-grid">
                {[
                  { key: "digitalFiles", label: "Digital Files" },
                  { key: "printRelease", label: "Print Release" },
                  { key: "weddingAlbum", label: "Wedding Album" },
                  { key: "prints", label: "Professional Prints" },
                  { key: "rawFiles", label: "RAW Files" },
                  { key: "engagement", label: "Engagement Session" },
                ].map(({ key, label }) => (
                  <div key={key} className="photo-option-item">
                    <input
                      type="checkbox"
                      id={key}
                      checked={
                        formData.eventDetails.deliverables?.[key] || false
                      }
                      onChange={(e) =>
                        handleInputChange("eventDetails", {
                          ...formData.eventDetails,
                          deliverables: {
                            ...formData.eventDetails.deliverables,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                    <label htmlFor={key}>{label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Budget & Additional Info
        return (
          <div className="form-grid">
            <div className="budget-guidance-container">
              <div className="price-quality-slider-container">
                <h3 className="slider-header">What matters most to you?</h3>
                <div className="slider-labels">
                  <span>Budget Conscious</span>
                  <span>Balanced</span>
                  <span>Quality Focused</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={formData.eventDetails.priceQualityPreference || "2"}
                  onChange={(e) => {
                    const newPreference = e.target.value;
                    const recommendation = getBudgetRecommendation(
                      newPreference,
                      formData.eventType,
                      formData.eventDetails
                    );
                    handleInputChange("eventDetails", {
                      ...formData.eventDetails,
                      priceQualityPreference: newPreference,
                      priceRange: recommendation[newPreference].range,
                    });
                  }}
                  className="price-quality-slider"
                />
                <div className="preference-description">
                  {getPriceQualityDescription(
                    formData.eventDetails.priceQualityPreference
                  )}
                </div>
                <div className="budget-recommendation">
                  {(() => {
                    const recommendation = getBudgetRecommendation(
                      formData.eventDetails.priceQualityPreference,
                      formData.eventType,
                      formData.eventDetails
                    )[formData.eventDetails.priceQualityPreference];

                    return (
                      <>
                        <div className="recommendation-header">
                          {recommendation.message}
                        </div>
                        <div className="recommendation-factors">
                          <p>This recommendation is based on:</p>
                          <ul>
                            {recommendation.analysis.factors.map(
                              (factor, index) => (
                                <li key={index}>{factor}</li>
                              )
                            )}
                          </ul>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="budget-range-selector">
                <div className="custom-input-container">
                  <select
                    name="priceRange"
                    value={formData.eventDetails.priceRange}
                    onChange={(e) => {
                      handleInputChange("eventDetails", {
                        ...formData.eventDetails,
                        priceRange: e.target.value,
                      });
                    }}
                    className="custom-input"
                  >
                    <option value="">Select Budget Range</option>
                    <option value="0-1000">$0 - $1,000</option>
                    <option value="1000-2000">$1,000 - $2,000</option>
                    <option value="2000-3000">$2,000 - $3,000</option>
                    <option value="3000-4000">$3,000 - $4,000</option>
                    <option value="4000-5000">$4,000 - $5,000</option>
                    <option value="5000+">$5,000+</option>
                  </select>
                  <label htmlFor="priceRange" className="custom-label">
                    Budget Range
                  </label>
                </div>
              </div>

              {formData.eventDetails.priceRange && (
                <div className="budget-insights">
                  <div className="budget-insight-header">
                    What to expect in this budget range:
                  </div>
                  {getBudgetInsights(
                    formData.eventDetails.priceRange,
                    formData.eventType
                  )}
                </div>
              )}
            </div>

            <div className="custom-input-container">
              <ReactQuill
                value={formData.eventDetails.additionalInfo || ""}
                onChange={(content) =>
                  handleInputChange("eventDetails", {
                    ...formData.eventDetails,
                    additionalInfo: content,
                  })
                }
                modules={modules}
                placeholder="Any special requests or additional information photographers should know..."
              />
              <label htmlFor="additionalInfo" className="custom-label">
                Additional Information
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderEventDetails = () => {
    const subSteps = getDetailsSubSteps();

    return (
      <div>
        {error && (
          <div style={{ textAlign: "center", color: "red", padding: "10px" }}>
            {error}
          </div>
        )}
        <div className="sub-steps-indicator">
          {subSteps.map((step, index) => (
            <div
              key={index}
              className={`sub-step ${index === detailsSubStep ? "active" : ""} 
                                      ${
                                        index < detailsSubStep
                                          ? "completed"
                                          : ""
                                      }`}
              onClick={() => setDetailsSubStep(index)}
            >
              {step}
            </div>
          ))}
        </div>

        {renderEventDetailsSubStep()}
      </div>
    );
  };

  // Personal Details Component
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (currentStep === 2) {
        // Personal Details step
        setLoading(true);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: userData, error: userError } = await supabase
              .from("individual_profiles")
              .select("first_name, last_name, phone")
              .eq("id", user.id)
              .single();

            if (userError) throw userError;

            setFormData((prev) => ({
              ...prev,
              personalDetails: {
                firstName: userData.first_name || "",
                lastName: userData.last_name || "",
                phoneNumber: userData.phone || "",
              },
            }));
          }
        } catch (err) {
          setError("Error loading user information");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserInfo();
  }, [currentStep]);

  const renderPersonalDetails = () => {
    if (loading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "45vh",
          }}
        >
          <Spinner />
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: "center", color: "red", padding: "20px" }}>
          {error}
        </div>
      );
    }

    return (
      <form style={{ minWidth: "100%" }}>
        <div
          style={{
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
            height: "45vh",
          }}
        >
          <div>
            <p
              className="Sign-Up-Page-Subheader"
              style={{ textAlign: "center", marginBottom: "20px" }}
            >
              Please confirm your details below
            </p>
            <div className="custom-input-container">
              <input
                type="text"
                name="firstName"
                value={formData.personalDetails.firstName}
                onChange={(e) =>
                  handleInputChange("personalDetails", {
                    ...formData.personalDetails,
                    firstName: e.target.value,
                  })
                }
                className="custom-input"
              />
              <label htmlFor="firstName" className="custom-label">
                First Name
              </label>
            </div>
            <div className="custom-input-container">
              <input
                type="text"
                name="lastName"
                value={formData.personalDetails.lastName}
                onChange={(e) =>
                  handleInputChange("personalDetails", {
                    ...formData.personalDetails,
                    lastName: e.target.value,
                  })
                }
                className="custom-input"
              />
              <label htmlFor="lastName" className="custom-label">
                Last Name
              </label>
            </div>
            <div className="custom-input-container">
              <input
                type="tel"
                name="phoneNumber"
                value={formData.personalDetails.phoneNumber}
                onChange={(e) =>
                  handleInputChange("personalDetails", {
                    ...formData.personalDetails,
                    phoneNumber: e.target.value,
                  })
                }
                className="custom-input"
              />
              <label htmlFor="phoneNumber" className="custom-label">
                Phone Number
              </label>
            </div>
          </div>
        </div>
      </form>
    );
  };

  // Photo Upload Component
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return setError("No file selected");

    // Validate file types
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/jpg",
    ];
    const invalidFiles = files.filter(
      (file) => !validImageTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      setError("Please only upload image files (JPEG, PNG, GIF, WEBP)");
      return;
    }

    setLoading(true);
    setAddMoreLoading(true);

    try {
      const newPhotos = files.map((file) => ({
        file: file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
      }));

      // Update local state first
      setFormData((prev) => {
        const updatedPhotos = [...prev.photos, ...newPhotos];
        const newData = { ...prev, photos: updatedPhotos };
        localStorage.setItem("photographyRequest", JSON.stringify(newData));
        setTimeout(() => updateBidScore(), 0);
        return newData;
      });
    } catch (err) {
      console.error("Error processing files:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setAddMoreLoading(false);
    }
  };

  const handleRemovePhoto = async (photoUrl) => {
    try {
      setDeletingPhotoUrl(photoUrl);
      const filePathMatch = photoUrl.match(/request-media\/(.+)/);
      if (!filePathMatch) {
        console.error("Invalid file path:", photoUrl);
        return;
      }

      const filePath = filePathMatch[1];

      const { error: storageError } = await supabase.storage
        .from("request-media")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        return;
      }

      const { error: dbError } = await supabase
        .from("event_photos")
        .delete()
        .match({ photo_url: photoUrl });

      if (dbError) {
        console.error("Database deletion error:", dbError);
        return;
      }

      setFormData((prev) => {
        const updatedPhotos = prev.photos.filter(
          (photo) => photo.url !== photoUrl
        );
        const newData = { ...prev, photos: updatedPhotos };
        localStorage.setItem("photographyRequest", JSON.stringify(newData));
        setTimeout(() => updateBidScore(), 0);
        return newData;
      });
    } catch (error) {
      console.error("Error in removal process:", error);
    } finally {
      setDeletingPhotoUrl(null);
    }
  };

  const renderRemoveButton = (photo) => {
    return (
      <div
        className="remove-photo-overlay"
        style={{ color: "black" }}
        onClick={() => handleRemovePhoto(photo.url)}
      >
        {deletingPhotoUrl === photo.url ? (
          <div>
            <Spinner />
          </div>
        ) : (
          "×"
        )}
      </div>
    );
  };

  const renderPhotoUpload = () => {
    return (
      <div className="photo-upload-section">
        <div className="photo-preview-container">
          {formData.photos.length === 0 ? (
            <div
              className="photo-upload-box"
              onClick={() => document.getElementById("file-input").click()}
            >
              <input
                type="file"
                id="file-input"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="54"
                height="45"
                viewBox="0 0 54 45"
                fill="none"
              >
                <path
                  d="M40.6939 15.6916C40.7126 15.6915 40.7313 15.6915 40.75 15.6915C46.9632 15.6915 52 20.2889 52 25.9601C52 31.2456 47.6249 35.5984 42 36.166M40.6939 15.6916C40.731 15.3158 40.75 14.9352 40.75 14.5505C40.75 7.61906 34.5939 2 27 2C19.8081 2 13.9058 7.03987 13.3011 13.4614M40.6939 15.6916C40.4383 18.2803 39.3216 20.6423 37.6071 22.5372M13.3011 13.4614C6.95995 14.0121 2 18.8869 2 24.8191C2 30.339 6.2944 34.9433 12 36.0004M13.3011 13.4614C13.6956 13.4271 14.0956 13.4096 14.5 13.4096C17.3146 13.4096 19.9119 14.2586 22.0012 15.6915"
                  stroke="#141B34"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M27 24.7783L27 43.0002M27 24.7783C25.2494 24.7783 21.9788 29.3208 20.75 30.4727M27 24.7783C28.7506 24.7783 32.0212 29.3208 33.25 30.4727"
                  stroke="#141B34"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div className="photo-upload-text">
                Drag & Drop to Upload or Click to Browse
              </div>
            </div>
          ) : (
            <>
              <PhotoGrid
                photos={formData.photos}
                removePhoto={(index) => {
                  const newPhotos = formData.photos.filter(
                    (_, i) => i !== index
                  );
                  handleInputChange("photos", newPhotos);
                }}
                openModal={(photo) => {
                  setSelectedPhoto(photo);
                  setIsPhotoModalOpen(true);
                }}
              />
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  onClick={() =>
                    document.getElementById("file-input-more").click()
                  }
                  className="add-more-photos-btn"
                >
                  <input
                    type="file"
                    id="file-input-more"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <span className="add-more-text">Add More Photos</span>
                </button>
              </div>
            </>
          )}
        </div>
        {isPhotoModalOpen && (
          <PhotoModal
            photo={selectedPhoto}
            onClose={() => {
              setSelectedPhoto(null);
              setIsPhotoModalOpen(false);
            }}
          />
        )}
        <div className="custom-input-container" style={{ marginTop: "20px" }}>
          <input
            type="url"
            name="pinterestBoard"
            value={formData.eventDetails.pinterestBoard || ""}
            onChange={(e) =>
              handleInputChange("eventDetails", {
                ...formData.eventDetails,
                pinterestBoard: e.target.value,
              })
            }
            placeholder="Paste your Pinterest board link here"
            className="custom-input"
          />
          <label htmlFor="pinterestBoard" className="custom-label">
            Pinterest Board Link
          </label>
        </div>
      </div>
    );
  };

  // Summary Component
  const renderSummary = () => {
    const { score } = calculateBidScore(formData);
    console.log("Current score:", score);
    console.log("Current step:", currentStep);
    console.log("Total steps:", getSteps().length);
    console.log("Earned coupon:", earnedCoupon);

    // Add the renderDateInfo function here
    const renderDateInfo = () => {
      switch (formData.eventDetails.dateFlexibility) {
        case "specific":
          return (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div className="request-subtype">Date</div>
              <div className="request-info">
                {formData.eventDetails.startDate
                  ? new Date(
                      formData.eventDetails.startDate
                    ).toLocaleDateString()
                  : "Not specified"}
              </div>
            </div>
          );
        case "range":
          return (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div className="request-subtype">Date Range</div>
              <div className="request-info">
                {`${
                  formData.eventDetails.startDate
                    ? new Date(
                        formData.eventDetails.startDate
                      ).toLocaleDateString()
                    : "Not specified"
                } - ${
                  formData.eventDetails.endDate
                    ? new Date(
                        formData.eventDetails.endDate
                      ).toLocaleDateString()
                    : "Not specified"
                }`}
              </div>
            </div>
          );
        case "flexible":
          return (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div className="request-subtype">Date Preference</div>
              <div className="request-info">
                {formData.eventDetails.dateTimeframe === "3months" &&
                  "Within 3 months"}
                {formData.eventDetails.dateTimeframe === "6months" &&
                  "Within 6 months"}
                {formData.eventDetails.dateTimeframe === "1year" &&
                  "Within 1 year"}
                {formData.eventDetails.dateTimeframe === "more" &&
                  "More than 1 year"}
                {!formData.eventDetails.dateTimeframe && "Not specified"}
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="event-summary-container" style={{ padding: "0" }}>
        {score >= 80 && !earnedCoupon && (
          <div className="coupon-earned-section">
            <h3>🎉 You've Earned a Reward!</h3>
            <p>
              For providing detailed information, you've earned a $25 coupon
              that will be automatically applied to your request.
            </p>
            <button
              className="apply-coupon-btn"
              onClick={() => {
                setEarnedCoupon(true);
                handleEarnedCoupon();
              }}
            >
              Apply $25 Coupon
            </button>
          </div>
        )}

        {earnedCoupon && (
          <div className="coupon-earned-section">
            <h3>✅ Coupon Applied!</h3>
            <p>Your $25 discount will be applied to your request.</p>
          </div>
        )}

        <div className="request-summary-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Event Type</div>
            <div className="request-info">{formData.eventType}</div>
          </div>

          {renderDateInfo()}

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Location</div>
            <div className="request-info">{formData.eventDetails.location}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Number of People</div>
            <div className="request-info">
              {formData.eventDetails.numPeople}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Duration (in hours)</div>
            <div className="request-info">{formData.eventDetails.duration}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Indoor/Outdoor</div>
            <div className="request-info">
              {formData.eventDetails.indoorOutdoor}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Budget</div>
            <div className="request-info">
              {formData.eventDetails.priceRange}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Pinterest Board Link</div>
            <div className="request-info">
              {formData.eventDetails.pinterestBoard}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Time</div>
            <div className="request-info">
              {formData.eventDetails.startTime || "Not specified"} -{" "}
              {formData.eventDetails.endTime || "Not specified"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Second Photographer</div>
            <div className="request-info">
              {formData.eventDetails.secondPhotographer}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Style Preferences</div>
            <div className="request-info">
              {Object.keys(formData.eventDetails.stylePreferences || {})
                .filter((key) => formData.eventDetails.stylePreferences[key])
                .join(", ")}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="request-subtype">Deliverables</div>
            <div className="request-info">
              {Object.keys(formData.eventDetails.deliverables || {})
                .filter((key) => formData.eventDetails.deliverables[key])
                .join(", ")}
            </div>
          </div>
        </div>

        {formData.eventDetails.additionalInfo && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignItems: "flex-start",
              marginTop: "20px",
            }}
          >
            <div className="request-subtype">Additional Information</div>
            <div
              className="quill-content"
              dangerouslySetInnerHTML={{
                __html: formData.eventDetails.additionalInfo,
              }}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="custom-input-container"
              style={{ marginBottom: "0" }}
            >
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="custom-input"
                style={{
                  backgroundColor: appliedCoupon ? "#f0fff0" : "white",
                }}
              />
              <label htmlFor="coupon" className="custom-label">
                Coupon
              </label>
            </div>
            <button
              onClick={handleApplyCoupon}
              className="request-form-back-and-foward-btn"
              style={{ padding: "8px 12px", fontSize: "16px" }}
              disabled={couponLoading}
            >
              {couponLoading ? <Spinner size="sm" /> : "Verify"}
            </button>
          </div>
          {couponMessage && (
            <div
              className={`coupon-message ${
                appliedCoupon ? "success" : "error"
              }`}
            >
              {couponMessage}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;

    setCouponLoading(true);
    try {
      // Verify the coupon exists and is valid
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .eq("valid", true)
        .single();

      if (error || !coupon) {
        setCouponMessage("Invalid or expired coupon code");
        setAppliedCoupon(null);
        return;
      }

      // Check if coupon is expired
      if (new Date(coupon.expiration_date) < new Date()) {
        setCouponMessage("This coupon has expired");
        setAppliedCoupon(null);
        return;
      }

      // Apply the coupon
      setAppliedCoupon(coupon);
      setCouponMessage(
        `$${coupon.discount_amount} discount applied successfully!`
      );
    } catch (err) {
      console.error("Error applying coupon:", err);
      setCouponMessage("Error applying coupon");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // Validation remains the same
    if (
      !formData.eventDetails.location ||
      (formData.eventDetails.dateFlexibility === "specific" &&
        !formData.eventDetails.startDate) ||
      (formData.eventDetails.dateFlexibility === "range" &&
        (!formData.eventDetails.startDate || !formData.eventDetails.endDate)) ||
      (formData.eventDetails.dateFlexibility === "flexible" &&
        !formData.eventDetails.dateTimeframe) ||
      !formData.eventDetails.priceRange
    ) {
      setError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsModalOpen(true);
        return;
      }

      // Add this section to get user's first name
      const { data: userData, error: userError } = await supabase
        .from("individual_profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      // Create title
      const eventTitle = `${userData.first_name}'s ${formData.eventType} Photography Request`;

      // Coupon check remains the same
      if (appliedCoupon) {
        const { data: existingRequest, error: checkError } = await supabase
          .from("photography_requests")
          .select("id")
          .eq("coupon_code", appliedCoupon.code)
          .single();

        if (checkError && checkError.code !== "PGRST116") throw checkError;

        if (existingRequest) {
          setError("This coupon code has already been used.");
          setIsSubmitting(false);
          return;
        }
      }

      // Base request data
      const requestData = {
        profile_id: user.id,
        event_type: formData.eventType,
        event_title: eventTitle, // Add the generated title here
        location: formData.eventDetails.location,
        start_date:
          formData.eventDetails.dateFlexibility !== "flexible"
            ? formData.eventDetails.startDate
            : null,
        end_date:
          formData.eventDetails.dateFlexibility === "range"
            ? formData.eventDetails.endDate
            : null,
        date_flexibility: formData.eventDetails.dateFlexibility,
        date_timeframe:
          formData.eventDetails.dateFlexibility === "flexible"
            ? formData.eventDetails.dateTimeframe
            : null,
        time_of_day: formData.eventDetails.timeOfDay,
        start_time: formData.eventDetails.startTime || null,
        end_time: formData.eventDetails.endTime || null,
        num_people: formData.eventDetails.numPeople
          ? parseInt(formData.eventDetails.numPeople, 10)
          : null,
        duration: formData.eventDetails.duration
          ? parseInt(formData.eventDetails.duration, 10)
          : null,
        indoor_outdoor: formData.eventDetails.indoorOutdoor,
        price_range: formData.eventDetails.priceRange,
        additional_info: formData.eventDetails.additionalInfo,
        date_type: formData.eventDetails.dateType,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        pinterest_link: formData.eventDetails.pinterestBoard,
        status: "open",
        vendor_id: selectedVendor?.id, // Add the selected vendor's ID here
      };

      // Additional fields including unknown flags and JSONB data
      const finalRequestData = {
        ...requestData,
        start_time_unknown: formData.eventDetails.startTimeUnknown ?? false,
        end_time_unknown: formData.eventDetails.endTimeUnknown ?? false,
        second_photographer: formData.eventDetails.secondPhotographer || null,
        second_photographer_unknown:
          formData.eventDetails.secondPhotographerUnknown ?? false,
        duration_unknown: formData.eventDetails.durationUnknown ?? false,
        num_people_unknown: formData.eventDetails.numPeopleUnknown ?? false,
        extras: formData.eventDetails.extras || null,
        // Ensure JSONB fields are properly stringified
        style_preferences: JSON.stringify(
          formData.eventDetails.stylePreferences || {}
        ),
        deliverables: JSON.stringify(formData.eventDetails.deliverables || {}),
        wedding_details: JSON.stringify(
          formData.eventDetails.weddingDetails || null
        ),
      };

      // Insert the request with all fields
      const { data: request, error: requestError } = await supabase
        .from("photography_requests")
        .insert([finalRequestData])
        .select()
        .single();

      if (requestError) throw requestError;

      // Photo upload logic remains the same
      if (formData.photos.length > 0) {
        const uploadPromises = formData.photos.map(async (photo) => {
          const fileExt = photo.name.split(".").pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `${user.id}/${request.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("request-media")
            .upload(filePath, photo.file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("request-media").getPublicUrl(filePath);

          const { error: photoError } = await supabase
            .from("event_photos")
            .insert([
              {
                request_id: request.id,
                photo_url: publicUrl,
                file_path: filePath,
                user_id: user.id,
              },
            ]);

          if (photoError) throw photoError;
          return publicUrl;
        });

        await Promise.all(uploadPromises);
      }

      // Success navigation remains the same
      localStorage.removeItem("photographyRequest");
      navigate("/success-request", {
        state: {
          requestId: request.id,
          category: "photography",
          message: "Your photography request has been submitted successfully!",
        },
      });
    } catch (err) {
      setError("Failed to submit request. Please try again.");
      console.error("Error submitting request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkAuthentication = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  };

  const updateUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { error: updateError } = await supabase
        .from("individual_profiles")
        .update({
          first_name: formData.personalDetails.firstName,
          last_name: formData.personalDetails.lastName,
          phone: formData.personalDetails.phoneNumber,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile information");
      return false;
    }
  };

  const getCurrentComponent = () => {
    const currentSteps = getSteps(); // Get fresh steps array
    switch (currentStep) {
      case 0:
        return renderEventSelection();
      case 1:
        return renderEventDetails();
      case 2:
        return renderPersonalDetails();
      case 3:
        return renderPhotoUpload();
      case 4:
        return renderSummary();
      default:
        return null;
    }
  };

  // Modify the handleBack function to handle sub-steps
  const handleBack = () => {
    if (currentStep === 0) {
      navigate("/request-categories");
    } else if (currentStep === 1 && detailsSubStep > 0) {
      // Handle sub-step navigation
      setDetailsSubStep((prev) => prev - 1);
    } else {
      setCurrentStep((prev) => prev - 1);
      setDetailsSubStep(0); // Reset sub-step when going back to previous main step
    }
  };

  // Modify the handleNext function to handle sub-steps
  const handleNext = async () => {
    if (currentStep === getSteps().length - 1) {
      handleSubmit();
    } else if (currentStep === 1) {
      const subSteps = getDetailsSubSteps();
      if (detailsSubStep < subSteps.length - 1) {
        // Validate required fields for sub-steps
        if (
          detailsSubStep === 0 &&
          (!formData.eventDetails.location ||
            (formData.eventDetails.dateFlexibility === "specific" &&
              !formData.eventDetails.startDate) ||
            (formData.eventDetails.dateFlexibility === "range" &&
              (!formData.eventDetails.startDate ||
                !formData.eventDetails.endDate)))
        ) {
          setError(
            "Please fill in all required fields: Location and Date information."
          );
          return;
        }
        setDetailsSubStep((prev) => prev + 1);
      } else {
        // Validate budget before moving to next main step
        if (!formData.eventDetails.priceRange) {
          setError("Please fill in the required field: Budget.");
          return;
        }
        // Move to next main steps
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
          setIsAuthModalOpen(true);
          return;
        }
        setError(null); // Clear error message
        setCurrentStep((prev) => prev + 1);
        setDetailsSubStep(0); // Reset sub-step
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    setCurrentStep((prev) => prev + 1);
  };

  // Add this helper function near the top of your component
  const getBudgetInsights = (priceRange, eventType) => {
    const insights = {
      wedding: {
        "0-1000": {
          quality: "Basic coverage with limited editing",
          experience: "Newer photographers building their portfolio",
          bids: "May receive fewer bids from experienced photographers",
          hours: "Typically 2-4 hours of coverage",
          warning: "This budget may limit your options significantly",
        },
        "1000-2000": {
          quality: "Standard coverage with professional editing",
          experience: "Mix of emerging and established photographers",
          bids: "Expect moderate number of bids",
          hours: "Usually 4-6 hours of coverage",
          warning: null,
        },
        "2000-3000": {
          quality: "High-quality coverage with detailed editing",
          experience: "Experienced photographers with strong portfolios",
          bids: "Should receive numerous quality bids",
          hours: "Generally 6-8 hours of coverage",
          warning: null,
        },
        "3000-4000": {
          quality: "Premium coverage with extensive editing",
          experience: "Very experienced professionals",
          bids: "Will attract top-tier photographers",
          hours: "Full day coverage (8-10 hours)",
          warning: null,
        },
        "4000-5000": {
          quality: "Luxury service with artistic direction",
          experience: "Top professionals with extensive experience",
          bids: "Will attract premium service providers",
          hours: "Full day coverage with additional services",
          warning: null,
        },
        "5000+": {
          quality: "Elite service with complete customization",
          experience: "Industry-leading photographers",
          bids: "Will attract the most exclusive photographers",
          hours: "Unlimited coverage with premium add-ons",
          warning: null,
        },
      },
      default: {
        "0-1000": {
          quality: "Basic professional coverage",
          experience: "Newer photographers building their portfolio",
          bids: "May receive fewer bids",
          hours: "1-2 hours of coverage",
          warning: null,
        },
        "1000-2000": {
          quality: "Standard professional coverage",
          experience: "Mix of emerging and established photographers",
          bids: "Expect moderate number of bids",
          hours: "2-3 hours of coverage",
          warning: null,
        },
        "2000-3000": {
          quality: "Premium coverage with detailed editing",
          experience: "Experienced photographers",
          bids: "Will attract experienced professionals",
          hours: "3-4 hours of coverage",
          warning: null,
        },
        "3000+": {
          quality: "Luxury service with full customization",
          experience: "Top professionals",
          bids: "Will attract premium service providers",
          hours: "Extended coverage with add-ons",
          warning: null,
        },
      },
    };

    const rangeData = insights[eventType?.toLowerCase()] || insights.default;
    const insight = rangeData[priceRange];

    if (!insight) {
      return (
        <div className="budget-insight-details">
          <div className="insight-warning">
            ⚠️ No insights available for the selected budget range or event
            type.
          </div>
        </div>
      );
    }

    return (
      <div className="budget-insight-details">
        <div className="insight-item">
          <span className="insight-icon">📸</span>
          <span className="insight-text">{insight.quality}</span>
        </div>
        <div className="insight-item">
          <span className="insight-icon">👤</span>
          <span className="insight-text">{insight.experience}</span>
        </div>
        <div className="insight-item">
          <span className="insight-icon">🕒</span>
          <span className="insight-text">{insight.hours}</span>
        </div>
        <div className="insight-item">
          <span className="insight-icon">📊</span>
          <span className="insight-text">{insight.bids}</span>
        </div>
        {insight.warning && (
          <div className="insight-warning">⚠️ {insight.warning}</div>
        )}
      </div>
    );
  };

  // Add this helper function near your other helper functions
  const getPriceQualityDescription = (preference) => {
    switch (preference) {
      case "1":
        return (
          <div className="preference-detail">
            <p>👉 Focus on finding photographers within your budget</p>
            <p>👉 May need to be flexible with style and experience</p>
            <p>👉 Good for those with strict budget constraints</p>
          </div>
        );
      case "2":
        return (
          <div className="preference-detail">
            <p>👉 Balance between quality and cost</p>
            <p>👉 Mix of experienced and emerging photographers</p>
            <p>👉 Best for most situations</p>
          </div>
        );
      case "3":
        return (
          <div className="preference-detail">
            <p>👉 Priority on portfolio quality and experience</p>
            <p>👉 Access to top-tier photographers</p>
            <p>👉 Ideal for those seeking premium results</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Add this helper function to analyze event details and suggest a base price
  const analyzeEventDetails = (eventDetails, eventType) => {
    let basePrice = 0;
    let factors = [];

    // Base price by event type
    if (eventType?.toLowerCase() === "wedding") {
      basePrice = 2000;
    } else {
      basePrice = 500;
    }

    // Duration factor
    if (!eventDetails.durationUnknown && eventDetails.duration) {
      const hours = parseInt(eventDetails.duration);
      if (hours > 4) {
        basePrice += (hours - 4) * 200;
        factors.push(`${hours} hours of coverage`);
      }
    }

    // Second photographer
    if (eventDetails.secondPhotographer === "yes") {
      basePrice += 500;
      factors.push("Second photographer");
    }

    // Deliverables analysis
    const deliverablesPricing = {
      weddingAlbum: { price: 500, label: "Wedding album" },
      prints: { price: 300, label: "Professional prints" },
      rawFiles: { price: 200, label: "RAW files" },
      engagement: { price: 400, label: "Engagement session" },
    };

    Object.entries(eventDetails.deliverables || {}).forEach(
      ([key, selected]) => {
        if (selected && deliverablesPricing[key]) {
          basePrice += deliverablesPricing[key].price;
          factors.push(deliverablesPricing[key].label);
        }
      }
    );

    // Wedding-specific factors
    if (eventType?.toLowerCase() === "wedding") {
      const weddingDetails = eventDetails.weddingDetails || {};
      let coveragePoints = 0;

      if (weddingDetails.preCeremony) coveragePoints++;
      if (weddingDetails.ceremony) coveragePoints++;
      if (weddingDetails.luncheon) coveragePoints++;
      if (weddingDetails.reception) coveragePoints++;

      if (coveragePoints > 2) {
        basePrice += (coveragePoints - 2) * 300;
        factors.push(`Coverage for ${coveragePoints} events`);
      }
    }

    // Group size factor
    if (!eventDetails.numPeopleUnknown && eventDetails.numPeople) {
      const people = parseInt(eventDetails.numPeople);
      if (people > 50) {
        basePrice += 200;
        factors.push("Large group (50+ people)");
      }
    }

    // Round to nearest price bracket
    const brackets = [1000, 2000, 3000, 4000, 5000];
    const suggestedRange = brackets.find((b) => basePrice <= b) || "5000+";

    return {
      suggestedRange:
        suggestedRange === 5000
          ? "5000+"
          : `${suggestedRange - 1000}-${suggestedRange}`,
      factors,
      basePrice,
    };
  };

  // Modify the getBudgetRecommendation function
  const getBudgetRecommendation = (preference, eventType, eventDetails) => {
    const analysis = analyzeEventDetails(eventDetails, eventType);
    const baseRecommendation = analysis.suggestedRange;

    // Adjust based on price-quality preference
    let adjustedRange = baseRecommendation;
    if (preference === "1") {
      // Try to suggest one bracket lower if possible
      const currentMin = parseInt(baseRecommendation.split("-")[0]);
      adjustedRange =
        currentMin <= 1000 ? "0-1000" : `${currentMin - 1000}-${currentMin}`;
    } else if (preference === "3") {
      // Suggest one bracket higher
      const currentMax = baseRecommendation.includes("+")
        ? 6000
        : parseInt(baseRecommendation.split("-")[1]);
      adjustedRange =
        currentMax >= 5000 ? "5000+" : `${currentMax}-${currentMax + 1000}`;
    }

    return {
      [preference]: {
        range: adjustedRange,
        message: `Recommended Budget Range: $${adjustedRange}`,
        analysis: {
          basePrice: analysis.basePrice,
          factors: analysis.factors,
        },
      },
    };
  };

  // Add this helper function to calculate the bid score
  const calculateBidScore = (formData) => {
    let points = 0;
    let maxPoints = 0;
    let breakdown = [];

    // Required core fields (worth more points)
    const coreFields = {
      "Event Type": formData.eventType,
      Location: formData.eventDetails.location,
      "Date Information":
        formData.eventDetails.dateFlexibility === "specific"
          ? formData.eventDetails.startDate
          : formData.eventDetails.dateFlexibility === "range"
          ? formData.eventDetails.startDate && formData.eventDetails.endDate
          : formData.eventDetails.dateTimeframe,
      "Budget Range": formData.eventDetails.priceRange,
    };

    // Give more weight to core fields
    Object.entries(coreFields).forEach(([field, value]) => {
      maxPoints += 20;
      if (value) {
        points += 20;
        breakdown.push(`✓ ${field}`);
      }
    });

    // Additional details (worth fewer points)
    const additionalFields = {
      "Indoor/Outdoor": formData.eventDetails.indoorOutdoor,
      "Time Information":
        !formData.eventDetails.startTimeUnknown &&
        formData.eventDetails.startTime,
      Duration:
        !formData.eventDetails.durationUnknown &&
        formData.eventDetails.duration,
      "Number of People":
        !formData.eventDetails.numPeopleUnknown &&
        formData.eventDetails.numPeople,
      "Second Photographer": formData.eventDetails.secondPhotographer,
      "Style Preferences": Object.values(
        formData.eventDetails.stylePreferences || {}
      ).some((v) => v),
      Deliverables: Object.values(
        formData.eventDetails.deliverables || {}
      ).some((v) => v),
    };

    Object.entries(additionalFields).forEach(([field, value]) => {
      maxPoints += 5;
      if (value) {
        points += 5;
        breakdown.push(`✓ ${field}`);
      }
    });

    // Bonus points
    if (formData.photos && formData.photos.length > 0) {
      points += 10;
      maxPoints += 10;
      breakdown.push("✓ Inspiration Photos");
    }

    if (formData.eventDetails.pinterestBoard) {
      points += 5;
      maxPoints += 5;
      breakdown.push("✓ Pinterest Board");
    }

    // Calculate final score
    const score = Math.round((points / maxPoints) * 100);
    console.log("Score calculation:", { points, maxPoints, score });

    return {
      score,
      breakdown,
      points,
      maxPoints,
    };
  };

  // Add this function to handle score updates
  const updateBidScore = () => {
    const { score } = calculateBidScore(formData);
    setBidScore(score);

    if (score === 100) {
      setScoreMessage("Perfect! All details added");
    } else if (score >= 80) {
      setScoreMessage("Great job!");
    } else if (score >= 60) {
      setScoreMessage("Add details for better matches");
    } else {
      setScoreMessage("More info = better bids");
    }
  };

  // Add this function to handle coupon generation
  const handleEarnedCoupon = async () => {
    try {
      // Generate a unique coupon code
      const couponCode = `QUALITY${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`;

      // Save the coupon to the database
      const { error } = await supabase.from("coupons").insert([
        {
          code: couponCode,
          discount_amount: 25,
          valid: true,
          expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          description: "Earned for detailed request completion",
        },
      ]);

      if (error) throw error;

      // Apply the coupon automatically
      setCouponCode(couponCode);
      handleApplyCoupon();
    } catch (err) {
      console.error("Error generating coupon:", err);
    }
  };

  // Update the BidScoreIndicator component to be more compact
  const BidScoreIndicator = ({ score, message }) => (
    <div className="bid-score-container">
      <div
        className="score-circle"
        style={{
          background: `conic-gradient(#A328F4 ${score}%, #f0f0f0 ${score}%)`,
        }}
      >
        <span>{score}%</span>
      </div>
      {message && <div className="score-message">{message}</div>}
    </div>
  );

  // Add useEffect to update score when component mounts
  useEffect(() => {
    updateBidScore();
  }, []); // Run once when component mounts

  return (
    <div className="request-form-overall-container">
      {isAuthModalOpen && (
        <AuthModal
          setIsModalOpen={setIsAuthModalOpen}
          onSuccess={handleAuthSuccess}
        />
      )}
      {isModalOpen && <SignInModal setIsModalOpen={setIsModalOpen} />}
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
        {/* Status bar container moved above title for desktop */}
        <div className="form-header-section">
          <h2 className="request-form-header">{getSteps()[currentStep]}</h2>
          <BidScoreIndicator score={bidScore} message={scoreMessage} />
        </div>
        {/* Display selected vendor information */}
        {selectedVendor && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <img
              src={vendorImage}
              alt={selectedVendor.business_name}
              className="vendor-profile-image"
              style={{ marginRight: "8px" }}
            />
            <h3 className="selected-vendor-info">
              {selectedVendor.business_name} will be notified
            </h3>
          </div>
        )}

        {/* Mobile status bar */}
        <div className="request-form-status-container mobile-only">
          <div className="request-form-box">
            <StatusBar steps={getSteps()} currentStep={currentStep} />
          </div>
        </div>

        <div className="form-scrollable-content">{getCurrentComponent()}</div>

        <div className="form-button-container">
          <button
            className="request-form-back-btn"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Back
          </button>
          <button
            className="request-form-back-and-foward-btn"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : currentStep === getSteps().length - 1 ? (
              "Submit"
            ) : (
              "Next"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhotographyRequest;
