import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactQuill from "react-quill";
import { supabase } from "../../../supabaseClient";
import { Spinner } from "react-bootstrap";
import SignInModal from "../Event/SignInModal";
import { v4 as uuidv4 } from "uuid";
import "react-quill/dist/quill.snow.css";
import "../../../styles/Photography.css";
import AuthModal from "../Authentication/AuthModal";
import ReviewSummary from "./ReviewSummary";

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

function VideographyRequest() {
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
  const [selectedVendor, setSelectedVendor] = useState(
    location.state?.vendor || null
  ); // Get vendor from location state
  const [vendorImage, setVendorImage] = useState(location.state?.image || null);
  const [bidScore, setBidScore] = useState(0);
  const [scoreMessage, setScoreMessage] = useState("");
  const [earnedCoupon, setEarnedCoupon] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  // Consolidated state
  const [formData, setFormData] = useState(() => {
    const saved = JSON.parse(
      localStorage.getItem("videographyRequest") || "{}"
    );
    const quizPrefs = JSON.parse(
      localStorage.getItem("quizPreferences") || "{}"
    );

    const stylePreferences =
      quizPrefs.category === "videography"
        ? {
            cinematic: quizPrefs.tags?.includes("cinematic"),
            documentary: quizPrefs.tags?.includes("documentary"),
            journalistic: quizPrefs.tags?.includes("journalistic"),
            artistic: quizPrefs.tags?.includes("experimental"),
            romantic: quizPrefs.tags?.includes("romantic"),
            traditional: quizPrefs.tags?.includes("traditional"),
            luxury: quizPrefs.tags?.includes("luxury"),
          }
        : saved.eventDetails?.stylePreferences || {};

    const defaultWeddingDetails = {
      ceremony: false,
      reception: false,
      luncheon: false,
      preCeremony: false,
    };

    return {
      eventType: saved.eventType || "",
      eventDetails: {
        eventTitle: saved.eventDetails?.eventTitle || "",
        location: saved.eventDetails?.location || "",
        dateType: saved.eventDetails?.dateType || "specific",
        startDate: saved.eventDetails?.startDate || "",
        endDate: saved.eventDetails?.endDate || "",
        timeOfDay: saved.eventDetails?.timeOfDay || "",
        numPeople: saved.eventDetails?.numPeople || "",
        duration: saved.eventDetails?.duration || "",
        indoorOutdoor: saved.eventDetails?.indoorOutdoor || "",
        additionalComments: saved.eventDetails?.additionalComments || "",
        priceRange: saved.eventDetails?.priceRange || "",
        weddingDetails:
          saved.eventDetails?.weddingDetails || defaultWeddingDetails,
        startTime: saved.eventDetails?.startTime || "",
        endTime: saved.eventDetails?.endTime || "",
        secondPhotographer: saved.eventDetails?.secondPhotographer || "",
        stylePreferences,
        deliverables: saved.eventDetails?.deliverables || {},
        additionalInfo: saved.eventDetails?.additionalInfo || "",
        dateFlexibility: saved.eventDetails?.dateFlexibility || "specific", // 'specific', 'range', 'flexible'
        dateTimeframe: saved.eventDetails?.dateTimeframe || "", // '3months', '6months', '1year'
        startTimeUnknown: saved.eventDetails?.startTimeUnknown || false,
        endTimeUnknown: saved.eventDetails?.endTimeUnknown || false,
        secondPhotographerUnknown:
          saved.eventDetails?.secondPhotographerUnknown || false,
        durationUnknown: saved.eventDetails?.durationUnknown || false,
        numPeopleUnknown: saved.eventDetails?.numPeopleUnknown || false,
        pinterestBoard: saved.eventDetails?.pinterestBoard || "",
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

  const getDetailsSubSteps = () => {
    switch (formData.eventType) {
      case "Wedding":
        return [
          "Coverage",
          "Style & Deliverables",
          "Additional Info",
          "Review",
        ];

      default:
        return [
          "Coverage",
          "Style & Deliverables",
          "Additional Details",
          "Review",
        ];
    }
  };

  const handleEventSelect = (event) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        eventType: event,
      };
      localStorage.setItem("videographyRequest", JSON.stringify(newData));
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

      localStorage.setItem("videographyRequest", JSON.stringify(newData));
      setTimeout(() => updateBidScore(), 0);
      return newData;
    });
  };

  // Event Selection Component
  const renderEventSelection = () => {
    const eventOptions = [
      "Wedding",
      "Engagement",
      "Birthday",
      "Religious Ceremony",
      "Event",
      "Other",
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
      case 0: // Coverage Preferences
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

      case 1: // Style & Deliverables
        return (
          <div className="wedding-details-container">
            {/* Render Style Preferences */}
            <div className="photo-options-header">
              Videography Style Preferences
            </div>
            {renderStylePreferences()}

            {/* Desired Deliverables */}
            <div className="wedding-photo-options">
              <div className="photo-options-header">Desired Deliverables</div>
              <div className="photo-options-grid">
                {[
                  { key: "digitalFiles", label: "Digital Files" },
                  { key: "printRelease", label: "Print Release" },
                  { key: "weddingAlbum", label: "Wedding Album" },
                  { key: "prints", label: "Professional Prints" },
                  { key: "rawFiles", label: "RAW Footage" },
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

      case 2: // Additional Info
        return (
          <div className="custom-input-container optional">
            <ReactQuill
              value={formData.eventDetails.additionalInfo || ""}
              onChange={(content) =>
                handleInputChange("eventDetails", {
                  ...formData.eventDetails,
                  additionalInfo: content,
                })
              }
              modules={modules}
              placeholder="Any special requests or additional information videographers should know..."
            />
            <label htmlFor="additionalInfo" className="custom-label">
              Additional Information
            </label>
          </div>
        );

      case 3: // Review
        return (
          <div>
            <ReviewSummary
              formData={formData}
              calculateBidScore={calculateBidScore}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              couponMessage={couponMessage}
              appliedCoupon={appliedCoupon}
              couponLoading={couponLoading}
              handleApplyCoupon={handleApplyCoupon}
              earnedCoupon={earnedCoupon}
              handleEarnedCoupon={handleEarnedCoupon}
            />
            {missingFields.length > 0 && (
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
        );

      default:
        return null;
    }
  };

  const renderEventDetails = () => {
    const subSteps = getDetailsSubSteps();

    return (
      <div>
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

        {detailsSubStep === 3 && missingFields.length === 0 && (
          <div className="form-button-container">
            <button
              className="request-form-back-and-foward-btn form-submit-button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : "Submit"}
            </button>
          </div>
        )}
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
        localStorage.setItem("videographyRequest", JSON.stringify(newData));
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
        localStorage.setItem("videographyRequest", JSON.stringify(newData));
        return newData;
      });
    } catch (error) {
      console.error("Error in removal process:", error);
    } finally {
      setDeletingPhotoUrl(null);
    }
  };

  const validateRequiredFields = () => {
    const requiredFields = [];
    const { eventDetails } = formData;

    // Validate Coverage tab
    if (!eventDetails.duration && !eventDetails.durationUnknown) {
      requiredFields.push("Hours of Coverage Needed");
    }
    if (!eventDetails.secondPhotographer) {
      requiredFields.push("Second Photographer");
    }

    // Validate Style & Deliverables tab
    if (
      !Object.values(eventDetails.stylePreferences || {}).some((v) => v) &&
      detailsSubStep === 1
    ) {
      requiredFields.push("Preferred Videography Style");
    }
    if (
      !Object.values(eventDetails.deliverables || {}).some((v) => v) &&
      detailsSubStep === 1
    ) {
      requiredFields.push("Desired Deliverables");
    }

    // Validate Additional Info tab
    if (!eventDetails.additionalInfo && detailsSubStep === 2) {
      requiredFields.push("Additional Information");
    }

    setMissingFields(requiredFields);
    return requiredFields.length === 0;
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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("valid", true)
        .single();

      if (error) throw error;

      if (data) {
        const expirationDate = new Date(data.expiration_date);
        const now = new Date();

        if (now > expirationDate) {
          setCouponMessage("This coupon has expired");
          setAppliedCoupon(null);
          return;
        }

        setAppliedCoupon(data);
        setCouponMessage(`Coupon applied: $${data.discount_amount} off`);
      } else {
        setCouponMessage("Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch (err) {
      console.error("Error applying coupon:", err);
      setCouponMessage("Invalid coupon code");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmitOld = async () => {
    setIsSubmitting(true);
    setError(null);

    // Existing validation
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

      // Get the user's profile data to ensure we have the most up-to-date first name
      const { data: userData, error: userError } = await supabase
        .from("individual_profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      // Generate event title using first name from database
      const firstName = userData.first_name || "Unknown";
      const generatedEventTitle = `${firstName}'s ${formData.eventType} Video`;

      // Create coverage object from wedding details
      const coverage = {
        ...(formData.eventType === "Wedding"
          ? formData.eventDetails.weddingDetails
          : {}),
        duration: formData.eventDetails.durationUnknown
          ? null
          : formData.eventDetails.duration
          ? parseInt(formData.eventDetails.duration)
          : null,
        numPeople: formData.eventDetails.numPeopleUnknown
          ? null
          : formData.eventDetails.numPeople
          ? parseInt(formData.eventDetails.numPeople)
          : null,
      };

      // Create request data matching the table schema
      const requestData = {
        user_id: user.id,
        event_type: formData.eventType,
        event_title: generatedEventTitle, // Use the generated title
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
        start_time: formData.eventDetails.startTimeUnknown
          ? null
          : formData.eventDetails.startTime,
        end_time: formData.eventDetails.endTimeUnknown
          ? null
          : formData.eventDetails.endTime,
        num_people: formData.eventDetails.numPeopleUnknown
          ? null
          : formData.eventDetails.numPeople
          ? parseInt(formData.eventDetails.numPeople)
          : null,
        duration: formData.eventDetails.durationUnknown
          ? null
          : formData.eventDetails.duration
          ? parseInt(formData.eventDetails.duration)
          : null,
        indoor_outdoor: formData.eventDetails.indoorOutdoor,
        price_range: formData.eventDetails.priceRange,
        additional_comments: formData.eventDetails.additionalInfo || null,
        style_preferences: formData.eventDetails.stylePreferences || {},
        second_photographer: formData.eventDetails.secondPhotographer === "yes",
        deliverables: formData.eventDetails.deliverables || {},
        pinterest_link: formData.eventDetails.pinterestBoard || null,
        coverage: coverage, // Add the coverage object
        status: "pending",
        vendor_id: selectedVendor?.id, // Add vendor_id to the request data
      };

      const { data: request, error: requestError } = await supabase
        .from("videography_requests")
        .insert([requestData])
        .select()
        .single();

      if (requestError) throw requestError;

      // Handle photo uploads if any
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

          // Store photo information in videography_photos table
          return supabase.from("videography_photos").insert([
            {
              request_id: request.id,
              user_id: user.id,
              photo_url: publicUrl,
              file_path: filePath,
            },
          ]);
        });

        await Promise.all(uploadPromises);
      }

      // Clear form data and navigate to success page
      localStorage.removeItem("videographyRequest");
      navigate("/success-request", {
        state: {
          requestId: request.id,
          category: "videography",
          message: "Your videography request has been submitted successfully!",
        },
      });
    } catch (err) {
      setError("Failed to submit request. Please try again.");
      console.error("Error submitting request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateRequiredFields()) {
      setDetailsSubStep(3); // Navigate to the Review tab
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit logic here
      console.log("Submitting form data:", formData);
    } catch (error) {
      console.error("Error submitting form:", error);
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

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    setCurrentStep((prev) => prev + 1);
  };

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

    const score = Math.round((points / maxPoints) * 100);

    return {
      score,
      breakdown,
      points,
      maxPoints,
    };
  };

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

  const handleEarnedCoupon = async () => {
    try {
      const couponCode = `QUALITY${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`;

      const { error } = await supabase.from("coupons").insert([
        {
          code: couponCode,
          discount_amount: 25,
          valid: true,
          expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          description: "Earned for detailed request completion",
        },
      ]);

      if (error) throw error;

      setCouponCode(couponCode);
      handleApplyCoupon();
    } catch (err) {
      console.error("Error generating coupon:", err);
    }
  };

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
  }, []);

  const renderStylePreferences = () => {
    return (
      <div className="custom-input-container">
        <div className="checkbox-group">
          {[
            { id: "cinematic", label: "Cinematic Film Style" },
            { id: "documentary", label: "Documentary Style" },
            { id: "journalistic", label: "Journalistic" },
            { id: "artistic", label: "Artistic & Experimental" },
            { id: "romantic", label: "Romantic" },
            { id: "traditional", label: "Traditional" },
            { id: "luxury", label: "Luxury Production" },
          ].map((style) => (
            <div key={style.id} className="checkbox-item">
              <input
                type="checkbox"
                id={style.id}
                checked={
                  formData.eventDetails.stylePreferences[style.id] || false
                }
                onChange={(e) =>
                  handleStylePreferenceChange(style.id, e.target.checked)
                }
              />
              <label htmlFor={style.id}>{style.label}</label>
            </div>
          ))}
        </div>
        <small className="text-muted">
          Select all styles that interest you. This helps videographers
          understand your vision.
        </small>
      </div>
    );
  };

  const handleStylePreferenceChange = (style, checked) => {
    setFormData({
      ...formData,
      eventDetails: {
        ...formData.eventDetails,
        stylePreferences: {
          ...formData.eventDetails.stylePreferences,
          [style]: checked,
        },
      },
    });
  };

  return (
    <div className="request-form-overall-container">
      {isAuthModalOpen && (
        <AuthModal
          setIsModalOpen={setIsAuthModalOpen}
          onSuccess={handleAuthSuccess}
        />
      )}
      {isModalOpen && <SignInModal setIsModalOpen={setIsModalOpen} />}
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

      <div className="form-scrollable-content">{renderEventDetails()}</div>
    </div>
  );
}

export default VideographyRequest;
