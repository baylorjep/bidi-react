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

function WeddingPlanningStepper({ formData, setFormData, currentStep, setCurrentStep, subStep, setSubStep }) {
  const [selectedPhoto, setSelectedPhoto] = React.useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState(false);
  const totalSubSteps = 4;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      requests: {
        ...prev.requests,
        WeddingPlanning: {
          ...prev.requests.WeddingPlanning,
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
        WeddingPlanning: {
          ...prev.requests.WeddingPlanning,
          photos: [...(prev.requests.WeddingPlanning?.photos || []), ...newPhotos],
        },
      },
    }));
  };

  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      requests: {
        ...prev.requests,
        WeddingPlanning: {
          ...prev.requests.WeddingPlanning,
          photos: prev.requests.WeddingPlanning?.photos?.filter((_, i) => i !== index) || [],
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

  const renderStep = () => {
    switch (subStep) {
      case 0:
        return (
          <div className="form-grid">
            <div className="wedding-details-container">
              <div className="custom-input-container">
                <select
                  name="planningLevel"
                  value={formData.requests.WeddingPlanning?.planningLevel || ""}
                  onChange={(e) =>
                    handleInputChange("planningLevel", e.target.value)
                  }
                  className="custom-input"
                >
                  <option value="">Select Planning Level</option>
                  <option value="full">Full Service (We handle everything)</option>
                  <option value="partial">Partial Service (We help with specific aspects)</option>
                  <option value="elopement">Elopement (10 people or fewer)</option>
                  <option value="micro">Micro Wedding (50 people or fewer)</option>
                  <option value="monthOf">Month-of Coordination</option>
                  <option value="dayOf">Day-of Coordination</option>
                </select>
                <label htmlFor="planningLevel" className="custom-label">
                  Planning Level Needed
                </label>
              </div>

              <div className="custom-input-container">
                <select
                  name="weddingType"
                  value={formData.requests.WeddingPlanning?.weddingType || ""}
                  onChange={(e) =>
                    handleInputChange("weddingType", e.target.value)
                  }
                  className="custom-input"
                >
                  <option value="">Select Wedding Type</option>
                  <option value="backyard">Backyard Wedding</option>
                  <option value="church">Church Wedding</option>
                  <option value="eventCenter">Event Center</option>
                  <option value="venue">Venue</option>
                  <option value="other">Other</option>
                </select>
                <label htmlFor="weddingType" className="custom-label">
                  Wedding Type
                </label>
              </div>

              <div className="custom-input-container">
                <ReactQuill
                  value={formData.requests.WeddingPlanning?.theme || ""}
                  onChange={(content) =>
                    handleInputChange("theme", content)
                  }
                  modules={modules}
                  placeholder="Describe your wedding theme (e.g., Rustic, Western, Simple Pearl Whites, Whimsical Wildflower)"
                />
                <label htmlFor="theme" className="custom-label">
                  Wedding Theme
                </label>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="form-grid">
            <div className="wedding-details-container">
              <div className="wedding-photo-options">
                <div className="photo-options-header">
                  Additional Events to Plan
                </div>
                <div className="photo-options-grid">
                  {[
                    { key: "rehearsalDinner", label: "Rehearsal Dinner" },
                    { key: "dayAfterBrunch", label: "Day After Brunch" },
                    { key: "bachelorParty", label: "Bachelor Party" },
                    { key: "bridalParty", label: "Bridal Party" },
                  ].map(({ key, label }) => (
                    <div key={key} className="photo-option-item">
                      <input
                        type="checkbox"
                        id={key}
                        checked={formData.requests.WeddingPlanning?.additionalEvents?.[key] || false}
                        onChange={(e) =>
                          handleInputChange("additionalEvents", {
                            ...formData.requests.WeddingPlanning?.additionalEvents,
                            [key]: e.target.checked,
                          })
                        }
                      />
                      <label htmlFor={key}>{label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="custom-input-container">
                <select
                  name="vendorPreference"
                  value={formData.requests.WeddingPlanning?.vendorPreference || ""}
                  onChange={(e) =>
                    handleInputChange("vendorPreference", e.target.value)
                  }
                  className="custom-input"
                >
                  <option value="">Select Vendor Preference</option>
                  <option value="existing">Use existing vendors</option>
                  <option value="new">Open to new vendors</option>
                  <option value="mix">Mix of existing and new vendors</option>
                </select>
                <label htmlFor="vendorPreference" className="custom-label">
                  Vendor Preference
                </label>
              </div>

              <div className="custom-input-container">
                <ReactQuill
                  value={formData.requests.WeddingPlanning?.existingVendors || ""}
                  onChange={(content) =>
                    handleInputChange("existingVendors", content)
                  }
                  modules={modules}
                  placeholder="List any vendors you already have in mind or are working with..."
                />
                <label htmlFor="existingVendors" className="custom-label">
                  Existing Vendors
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-grid">
            <div className="wedding-details-container">
              <div className="custom-input-container">
                <input
                  type="url"
                  name="pinterestBoard"
                  value={formData.requests.WeddingPlanning?.pinterestBoard || ""}
                  onChange={(e) =>
                    handleInputChange("pinterestBoard", e.target.value)
                  }
                  placeholder="Paste your Pinterest board link here"
                  className="custom-input"
                />
                <label htmlFor="pinterestBoard" className="custom-label">
                  Pinterest Board Link
                </label>
              </div>

              <div className="photo-upload-section">
                <div className="photo-upload-instructions">
                  <p style={{ color: "gray", fontSize:'16px' }}>Upload photos to help us understand your vision. Click or drag and drop photos below.</p>
                </div>

                <div className="photo-preview-container">
                  {(!formData.requests.WeddingPlanning?.photos || formData.requests.WeddingPlanning.photos.length === 0) ? (
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
                        photos={formData.requests.WeddingPlanning.photos}
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
          </div>
        );

      case 3:
        return (
          <div className="form-grid">
            <div className="wedding-details-container">
              <div className="custom-input-container">
                <select
                  name="budgetRange"
                  value={formData.requests.WeddingPlanning?.budgetRange || ""}
                  onChange={(e) =>
                    handleInputChange("budgetRange", e.target.value)
                  }
                  className="custom-input"
                >
                  <option value="">Select Overall Wedding Budget</option>
                  <option value="0-10000">$0 - $10,000</option>
                  <option value="10000-25000">$10,000 - $25,000</option>
                  <option value="25000-50000">$25,000 - $50,000</option>
                  <option value="50000-100000">$50,000 - $100,000</option>
                  <option value="100000+">$100,000+</option>
                </select>
                <label htmlFor="budgetRange" className="custom-label">
                  Overall Wedding Budget
                </label>
              </div>

              <div className="custom-input-container">
                <select
                  name="plannerBudget"
                  value={formData.requests.WeddingPlanning?.plannerBudget || ""}
                  onChange={(e) =>
                    handleInputChange("plannerBudget", e.target.value)
                  }
                  className="custom-input"
                >
                  <option value="">Select Wedding Planner Budget</option>
                  <option value="0-2000">$0 - $2,000</option>
                  <option value="2000-5000">$2,000 - $5,000</option>
                  <option value="5000-10000">$5,000 - $10,000</option>
                  <option value="10000+">$10,000+</option>
                </select>
                <label htmlFor="plannerBudget" className="custom-label">
                  Wedding Planner Budget
                </label>
              </div>

              <div className="custom-input-container">
                <select
                  name="experienceLevel"
                  value={formData.requests.WeddingPlanning?.experienceLevel || ""}
                  onChange={(e) =>
                    handleInputChange("experienceLevel", e.target.value)
                  }
                  className="custom-input"
                >
                  <option value="">Select Experience Level</option>
                  <option value="beginner">Beginner (0-2 years)</option>
                  <option value="intermediate">Intermediate (2-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
                <label htmlFor="experienceLevel" className="custom-label">
                  Preferred Planner Experience Level
                </label>
              </div>

              <div className="custom-input-container">
                <select
                  name="communicationStyle"
                  value={formData.requests.WeddingPlanning?.communicationStyle || ""}
                  onChange={(e) =>
                    handleInputChange("communicationStyle", e.target.value)
                  }
                  className="custom-input"
                >
                  <option value="">Select Communication Style</option>
                  <option value="frequent">Frequent Updates</option>
                  <option value="moderate">Moderate Updates</option>
                  <option value="minimal">Minimal Updates</option>
                </select>
                <label htmlFor="communicationStyle" className="custom-label">
                  Preferred Communication Style
                </label>
              </div>

              <div className="custom-input-container">
                <ReactQuill
                  value={formData.requests.WeddingPlanning?.additionalInfo || ""}
                  onChange={(content) =>
                    handleInputChange("additionalInfo", content)
                  }
                  modules={modules}
                  placeholder="Any additional information or preferences for your wedding planner..."
                />
                <label htmlFor="additionalInfo" className="custom-label">
                  Additional Information
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderStep();
}

export default WeddingPlanningStepper; 