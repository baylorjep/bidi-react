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

function PhotographyStepper({ formData, setFormData, currentStep, setCurrentStep, subStep, setSubStep }) {
  const [selectedPhoto, setSelectedPhoto] = React.useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState(false);
  const totalSubSteps = 4;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      requests: {
        ...prev.requests,
        Photography: {
          ...prev.requests.Photography,
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
        Photography: {
          ...prev.requests.Photography,
          photos: [...(prev.requests.Photography?.photos || []), ...newPhotos],
        },
      },
    }));
  };

  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      requests: {
        ...prev.requests,
        Photography: {
          ...prev.requests.Photography,
          photos: prev.requests.Photography?.photos?.filter((_, i) => i !== index) || [],
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

  const handleNextSubStep = () => {
    if (subStep < totalSubSteps - 1) {
      setSubStep(subStep + 1);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBackSubStep = () => {
    if (subStep > 0) {
      setSubStep(subStep - 1);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateRecommendedBudget = () => {
    let basePrice = 0;
    const photographyData = formData.requests.Photography || {};

    // Base price based on duration
    if (photographyData.duration) {
      basePrice = photographyData.duration * 200; // $200 per hour base rate
    }

    // Add for second photographer
    if (photographyData.secondPhotographer === 'yes') {
      basePrice *= 1.5; // 50% increase for second photographer
    }

    // Add for wedding specific coverage
    if (formData.commonDetails.eventType === 'Wedding') {
      const weddingDetails = photographyData.weddingDetails || {};
      const coveragePoints = Object.values(weddingDetails).filter(Boolean).length;
      basePrice += coveragePoints * 200; // $200 per coverage point
    }

    // Add for deliverables
    const deliverables = photographyData.deliverables || {};
    if (deliverables.weddingAlbum) basePrice += 500;
    if (deliverables.rawFiles) basePrice += 300;
    if (deliverables.engagement) basePrice += 500;

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
                          checked={formData.requests.Photography?.weddingDetails?.[key] || false}
                          onChange={(e) =>
                            handleInputChange("weddingDetails", {
                              ...formData.requests.Photography?.weddingDetails,
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
                    value={formData.requests.Photography?.duration || ""}
                    onChange={(e) =>
                      handleInputChange("duration", e.target.value)
                    }
                    className="custom-input"
                    min="1"
                  />
                  <label className="unknown-checkbox-container">
                    <input
                      type="checkbox"
                      checked={formData.requests.Photography?.durationUnknown || false}
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
                  name="secondPhotographer"
                  value={formData.requests.Photography?.secondPhotographer || ""}
                  onChange={(e) =>
                    handleInputChange("secondPhotographer", e.target.value)
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

              {/* Additional Information */}
              <div className="custom-input-container">
                <ReactQuill
                  value={formData.requests.Photography?.additionalInfo || ""}
                  onChange={(content) =>
                    handleInputChange("additionalInfo", content)
                  }
                  modules={modules}
                  placeholder="Any special requests or additional information photographers should know..."
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
                        checked={formData.requests.Photography?.stylePreferences?.[key] || false}
                        onChange={(e) =>
                          handleInputChange("stylePreferences", {
                            ...formData.requests.Photography?.stylePreferences,
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
                        checked={formData.requests.Photography?.deliverables?.[key] || false}
                        onChange={(e) =>
                          handleInputChange("deliverables", {
                            ...formData.requests.Photography?.deliverables,
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
                  value={formData.requests.Photography?.pinterestBoard || ""}
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
                {(!formData.requests.Photography?.photos || formData.requests.Photography.photos.length === 0) ? (
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
                      photos={formData.requests.Photography.photos}
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
                  {formData.requests.Photography?.duration && (
                    <li>{formData.requests.Photography.duration} hours of coverage</li>
                  )}
                  {formData.requests.Photography?.secondPhotographer === 'yes' && (
                    <li>Second photographer</li>
                  )}
                  {formData.commonDetails.eventType === 'Wedding' && (
                    <li>Wedding coverage points</li>
                  )}
                  {formData.requests.Photography?.deliverables?.weddingAlbum && (
                    <li>Wedding album</li>
                  )}
                  {formData.requests.Photography?.deliverables?.rawFiles && (
                    <li>RAW files</li>
                  )}
                  {formData.requests.Photography?.deliverables?.engagement && (
                    <li>Engagement session</li>
                  )}
                </ul>
              </p>
            </div>

            <div className="custom-input-container required">
              <select
                name="priceRange"
                value={formData.requests.Photography?.priceRange || ""}
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

export default PhotographyStepper; 