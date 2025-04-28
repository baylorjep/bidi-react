import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

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

function VideographyStepper({ formData, setFormData, currentStep, setCurrentStep, subStep, setSubStep }) {
  const [selectedPhoto, setSelectedPhoto] = React.useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState(false);
  const totalSubSteps = 3;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      requests: {
        ...prev.requests,
        Videography: {
          ...prev.requests.Videography,
          [field]: value,
        },
      },
    }));
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const newPhotos = files.map((file) => ({
      file: file,
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
    }));

    setFormData((prev) => ({
      ...prev,
      requests: {
        ...prev.requests,
        Videography: {
          ...prev.requests.Videography,
          photos: [...(prev.requests.Videography?.photos || []), ...newPhotos],
        },
      },
    }));
  };

  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      requests: {
        ...prev.requests,
        Videography: {
          ...prev.requests.Videography,
          photos: prev.requests.Videography?.photos?.filter((_, i) => i !== index) || [],
        },
      },
    }));
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

  const calculateRecommendedBudget = () => {
    let basePrice = 0;
    const videographyData = formData.requests.Videography || {};

    // Base price based on duration
    if (videographyData.duration) {
      basePrice = videographyData.duration * 300; // $300 per hour base rate
    }

    // Add for second videographer
    if (videographyData.secondVideographer === 'yes') {
      basePrice *= 1.5; // 50% increase for second videographer
    }

    // Add for wedding specific coverage
    if (formData.commonDetails.eventType === 'Wedding') {
      const weddingDetails = videographyData.weddingDetails || {};
      const coveragePoints = Object.values(weddingDetails).filter(Boolean).length;
      basePrice += coveragePoints * 300; // $300 per coverage point
    }

    // Add for deliverables
    const deliverables = videographyData.deliverables || {};
    if (deliverables.highlightReel) basePrice += 800;
    if (deliverables.fullCeremony) basePrice += 500;
    if (deliverables.fullReception) basePrice += 500;
    if (deliverables.rawFootage) basePrice += 400;
    if (deliverables.droneFootage) basePrice += 600;
    if (deliverables.sameDayEdit) basePrice += 1000;

    return Math.round(basePrice);
  };

  const renderStep = () => {
    switch (subStep) {
      case 0:
        return (
          <div className="form-grid">
            {/* Coverage Details */}
            <div className="wedding-details-container">
              {formData.commonDetails.eventType === "Wedding" && (
                <div className="wedding-photo-options">
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
                          checked={formData.requests.Videography?.weddingDetails?.[key] || false}
                          onChange={(e) =>
                            handleInputChange("weddingDetails", {
                              ...formData.requests.Videography?.weddingDetails,
                              [key]: e.target.checked,
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
                    value={formData.requests.Videography?.duration || ""}
                    onChange={(e) =>
                      handleInputChange("duration", e.target.value)
                    }
                    className="custom-input"
                    min="1"
                  />
                  <label className="unknown-checkbox-container">
                    <input
                      type="checkbox"
                      checked={formData.requests.Videography?.durationUnknown || false}
                      onChange={(e) =>
                        handleInputChange("durationUnknown", e.target.checked)
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
                  name="secondVideographer"
                  value={formData.requests.Videography?.secondVideographer || ""}
                  onChange={(e) =>
                    handleInputChange("secondVideographer", e.target.value)
                  }
                  className="custom-input"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="undecided">Let videographer recommend</option>
                </select>
                <label htmlFor="secondVideographer" className="custom-label">
                  Second Videographer?
                </label>
              </div>

              {/* Additional Information */}
              <div className="custom-input-container">
                <ReactQuill
                  value={formData.requests.Videography?.additionalInfo || ""}
                  onChange={(content) =>
                    handleInputChange("additionalInfo", content)
                  }
                  modules={modules}
                  placeholder="Any special requests or additional information videographers should know..."
                />
                <label htmlFor="additionalInfo" className="custom-label">
                  Additional Information
                </label>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="form-grid">
            {/* Style Preferences */}
            <div className="wedding-details-container">
              <div className="wedding-photo-options">
                <div className="photo-options-header">
                  Preferred Videography Style
                </div>
                <div className="photo-options-grid">
                  {[
                    { key: "cinematic", label: "Cinematic" },
                    { key: "documentary", label: "Documentary" },
                    { key: "journalistic", label: "Journalistic" },
                    { key: "artistic", label: "Artistic" },
                    { key: "romantic", label: "Romantic" },
                    { key: "traditional", label: "Traditional" },
                  ].map(({ key, label }) => (
                    <div key={key} className="photo-option-item">
                      <input
                        type="checkbox"
                        id={key}
                        checked={formData.requests.Videography?.stylePreferences?.[key] || false}
                        onChange={(e) =>
                          handleInputChange("stylePreferences", {
                            ...formData.requests.Videography?.stylePreferences,
                            [key]: e.target.checked,
                          })
                        }
                      />
                      <label htmlFor={key}>{label}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              <div className="wedding-photo-options">
                <div className="photo-options-header">Desired Deliverables</div>
                <div className="photo-options-grid">
                  {[
                    { key: "highlightReel", label: "Highlight Reel" },
                    { key: "fullCeremony", label: "Full Ceremony" },
                    { key: "fullReception", label: "Full Reception" },
                    { key: "rawFootage", label: "Raw Footage" },
                    { key: "droneFootage", label: "Drone Footage" },
                    { key: "sameDayEdit", label: "Same Day Edit" },
                  ].map(({ key, label }) => (
                    <div key={key} className="photo-option-item">
                      <input
                        type="checkbox"
                        id={key}
                        checked={formData.requests.Videography?.deliverables?.[key] || false}
                        onChange={(e) =>
                          handleInputChange("deliverables", {
                            ...formData.requests.Videography?.deliverables,
                            [key]: e.target.checked,
                          })
                        }
                      />
                      <label htmlFor={key}>{label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-grid">
            {/* Photo Upload Section */}
            <div className="photo-upload-section">
              <div className="custom-input-container">
                <input
                  type="url"
                  name="pinterestBoard"
                  value={formData.requests.Videography?.pinterestBoard || ""}
                  onChange={(e) =>
                    handleInputChange("pinterestBoard", e.target.value)
                  }
                  placeholder="Paste your Pinterest board link here"
                  className="custom-input"
                />
                <label htmlFor="pinterestBoard" className="custom-label">
                  Inspo
                </label>
              </div>

              <div className="photo-upload-instructions">
                <p style={{ color: "gray", fontSize:'16px' }}>You can also upload photos to help us understand your vision. Click or drag and drop photos below.</p>
              </div>

              <div className="photo-preview-container">
                {(!formData.requests.Videography?.photos || formData.requests.Videography.photos.length === 0) ? (
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
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M27 24.7783L27 43.0002M27 24.7783C25.2494 24.7783 21.9788 29.3208 20.75 30.4727M27 24.7783C28.7506 24.7783 32.0212 29.3208 33.25 30.4727"
                        stroke="#141B34"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="photo-upload-text">
                      Drag & Drop to Upload or Click to Browse
                    </div>
                  </div>
                ) : (
                  <>
                    <PhotoGrid
                      photos={formData.requests.Videography.photos}
                      removePhoto={handleRemovePhoto}
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
            </div>
          </div>
        );

      case 3:
        const recommendedBudget = calculateRecommendedBudget();
        return (
          <div className="form-grid">
            <div className="budget-recommendation-container">
              <h3>Recommended Budget</h3>
              <p className="budget-amount">${recommendedBudget.toLocaleString()}</p>
              <p className="budget-explanation">
                This recommendation is based on:
                <ul>
                  {formData.requests.Videography?.duration && (
                    <li>{formData.requests.Videography.duration} hours of coverage</li>
                  )}
                  {formData.requests.Videography?.secondVideographer === 'yes' && (
                    <li>Second videographer</li>
                  )}
                  {formData.commonDetails.eventType === 'Wedding' && (
                    <li>Wedding coverage points</li>
                  )}
                  {formData.requests.Videography?.deliverables?.highlightReel && (
                    <li>Highlight reel</li>
                  )}
                  {formData.requests.Videography?.deliverables?.fullCeremony && (
                    <li>Full ceremony</li>
                  )}
                  {formData.requests.Videography?.deliverables?.fullReception && (
                    <li>Full reception</li>
                  )}
                  {formData.requests.Videography?.deliverables?.rawFootage && (
                    <li>Raw footage</li>
                  )}
                  {formData.requests.Videography?.deliverables?.droneFootage && (
                    <li>Drone footage</li>
                  )}
                  {formData.requests.Videography?.deliverables?.sameDayEdit && (
                    <li>Same day edit</li>
                  )}
                </ul>
              </p>
            </div>

            <div className="price-quality-slider-container">
              <div className="slider-header">What matters most to you?</div>
              <div className="slider-labels">
                <span>Budget Conscious</span>
                <span>Quality Focused</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={formData.requests.Videography?.priceQualityPreference || "2"}
                onChange={(e) =>
                  handleInputChange("priceQualityPreference", e.target.value)
                }
                className="price-quality-slider"
              />
            </div>

            <div className="custom-input-container required">
              <select
                name="priceRange"
                value={formData.requests.Videography?.priceRange || ""}
                onChange={(e) =>
                  handleInputChange("priceRange", e.target.value)
                }
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
        );

      default:
        return null;
    }
  };

  return renderStep();
}

export default VideographyStepper; 