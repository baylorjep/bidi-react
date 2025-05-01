import React, { useState } from 'react';
import '../../../styles/Requests.css';

function HairAndMakeupStepper({ formData, setFormData, currentStep, setCurrentStep, subStep, setSubStep }) {
  // Initialize eventDetails if it doesn't exist
  React.useEffect(() => {
    if (!formData.requests.HairAndMakeup) {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          HairAndMakeup: {
            location: '',
            dateFlexibility: '',
            startDate: '',
            endDate: '',
            dateTimeframe: '',
            startTime: '',
            endTime: '',
            startTimeUnknown: false,
            endTimeUnknown: false,
            numPeople: '',
            numPeopleUnknown: false,
            specificTimeNeeded: '',
            specificTime: '',
            hairstylePreferences: '',
            hairLengthType: '',
            extensionsNeeded: '',
            trialSessionHair: '',
            makeupStylePreferences: {},
            skinTypeConcerns: '',
            preferredProductsAllergies: '',
            lashesIncluded: '',
            trialSessionMakeup: '',
            groupDiscountInquiry: '',
            onSiteServiceNeeded: '',
            priceQualityPreference: '2',
            priceRange: '',
            additionalInfo: '',
            pinterestBoard: '',
            serviceLocation: '',
            serviceTime: '',
            serviceTimeUnknown: false,
            serviceType: 'both'
          }
        }
      }));
    }
  }, [formData.requests.HairAndMakeup, setFormData]);

  const getSubSteps = () => {
    const subSteps = ['Basic Information'];
    const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';

    if (serviceType === 'both' || serviceType === 'hair') {
      subSteps.push('Hair Services');
    }
    if (serviceType === 'both' || serviceType === 'makeup') {
      subSteps.push('Makeup Services');
    }
    subSteps.push('Inspiration');
    subSteps.push('Budget');
    return subSteps;
  };

  const renderSubStep = () => {
    const subSteps = getSubSteps();
    const hairAndMakeupData = formData.requests.HairAndMakeup || {};
    const commonDetails = formData.commonDetails || {};
    const currentServiceType = hairAndMakeupData.serviceType || 'both';

    // Calculate the actual step based on service type
    let actualStep = subStep;
    if (currentServiceType === 'hair') {
      if (subStep === 2) {
        actualStep = 3; // Show inspiration after hair services
      } else if (subStep === 3) {
        actualStep = 4; // Show budget after inspiration
      }
    } else if (currentServiceType === 'makeup') {
      if (subStep === 1) {
        actualStep = 2; // Show makeup services
      } else if (subStep === 2) {
        actualStep = 3; // Show inspiration after makeup services
      } else if (subStep === 3) {
        actualStep = 4; // Show budget after inspiration
      }
    }

    switch (actualStep) {
      case 0: // Basic Information
        return renderBasicInfoStep();
      case 1: // Hair Services
        return renderHairServicesStep();
      case 2: // Makeup Services
        return renderMakeupServicesStep();
      case 3: // Inspiration
        return renderInspirationStep();
      case 4: // Budget
        return renderBudgetStep();
      default:
        return null;
    }
  };

  const renderBasicInfoStep = () => {
    const hairAndMakeupData = formData.requests.HairAndMakeup || {};
    const currentServiceType = hairAndMakeupData.serviceType || 'both';
    return (
      <div className='form-grid'>
        <div className="custom-input-container">
          <select
            name="serviceType"
            value={currentServiceType}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  serviceType: e.target.value
                }
              }
            }))}
            className="custom-input"
          >
            <option value="both">Hair & Makeup</option>
            <option value="hair">Hair Only</option>
            <option value="makeup">Makeup Only</option>
          </select>
          <label htmlFor="serviceType" className="custom-label">
            Service Type
          </label>
        </div>

        <div className="custom-input-container">
          <input
            type="text"
            name="serviceLocation"
            value={hairAndMakeupData.serviceLocation || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  serviceLocation: e.target.value
                }
              }
            }))}
            placeholder='Where will hair and makeup services be performed? (e.g., home, hotel, salon)'
            className="custom-input"
          />
          <label htmlFor="serviceLocation" className="custom-label">
            Service Location
          </label>
        </div>

        <div className="custom-input-container">
          <div className="input-with-unknown">
            <input
              type="time"
              name="serviceTime"
              value={hairAndMakeupData.serviceTime || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                requests: {
                  ...prev.requests,
                  HairAndMakeup: {
                    ...prev.requests.HairAndMakeup,
                    serviceTime: e.target.value,
                    serviceTimeUnknown: false
                  }
                }
              }))}
              className="custom-input"
              disabled={hairAndMakeupData.serviceTimeUnknown}
            />
            <label className="unknown-checkbox-container">
              <input
                type="checkbox"
                checked={hairAndMakeupData.serviceTimeUnknown || false}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  requests: {
                    ...prev.requests,
                    HairAndMakeup: {
                      ...prev.requests.HairAndMakeup,
                      serviceTime: '',
                      serviceTimeUnknown: e.target.checked
                    }
                  }
                }))}
              />
              <span className="unknown-checkbox-label">Not sure</span>
            </label>
          </div>
          <label htmlFor="serviceTime" className="custom-label">
            Service Start Time
          </label>
        </div>

        <div className="custom-input-container">
          <div className="input-with-unknown">
            <input
              type="number"
              name="numPeople"
              value={hairAndMakeupData.numPeople || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                requests: {
                  ...prev.requests,
                  HairAndMakeup: {
                    ...prev.requests.HairAndMakeup,
                    numPeople: e.target.value,
                    numPeopleUnknown: false
                  }
                }
              }))}
              className="custom-input"
              disabled={hairAndMakeupData.numPeopleUnknown}
              placeholder="Number of people needing services"
            />
            <label className="unknown-checkbox-container">
              <input
                type="checkbox"
                checked={hairAndMakeupData.numPeopleUnknown || false}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  requests: {
                    ...prev.requests,
                    HairAndMakeup: {
                      ...prev.requests.HairAndMakeup,
                      numPeople: '',
                      numPeopleUnknown: e.target.checked
                    }
                  }
                }))}
              />
              <span className="unknown-checkbox-label">Not sure</span>
            </label>
          </div>
          <label htmlFor="numPeople" className="custom-label">
            Number of People Needing Services
          </label>
        </div>

        <div className="custom-input-container">
          <select
            name="onSiteServiceNeeded"
            value={hairAndMakeupData.onSiteServiceNeeded || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  onSiteServiceNeeded: e.target.value
                }
              }
            }))}
            className="custom-input"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <label htmlFor="onSiteServiceNeeded" className="custom-label">
            On-Site Service Needed?
          </label>
        </div>
      </div>
    );
  };

  const renderHairServicesStep = () => {
    const hairAndMakeupData = formData.requests.HairAndMakeup || {};
    return (
      <div className='form-grid'>
        <div className="custom-input-container">
          <input
            type="text"
            name="hairstylePreferences"
            value={hairAndMakeupData.hairstylePreferences || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  hairstylePreferences: e.target.value
                }
              }
            }))}
            placeholder="Describe your desired hairstyle"
            className="custom-input"
          />
          <label htmlFor="hairstylePreferences" className="custom-label">
            Hairstyle Preferences
          </label>
        </div>

        <div className="custom-input-container">
          <input
            type="text"
            name="hairLengthType"
            value={hairAndMakeupData.hairLengthType || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  hairLengthType: e.target.value
                }
              }
            }))}
            placeholder="Describe your hair length and type"
            className="custom-input"
          />
          <label htmlFor="hairLengthType" className="custom-label">
            Hair Length & Type
          </label>
        </div>

        <div className="custom-input-container">
          <select
            name="extensionsNeeded"
            value={hairAndMakeupData.extensionsNeeded || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  extensionsNeeded: e.target.value
                }
              }
            }))}
            className="custom-input"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <label htmlFor="extensionsNeeded" className="custom-label">
            Extensions Needed?
          </label>
        </div>

        <div className="custom-input-container">
          <select
            name="trialSessionHair"
            value={hairAndMakeupData.trialSessionHair || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  trialSessionHair: e.target.value
                }
              }
            }))}
            className="custom-input"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <label htmlFor="trialSessionHair" className="custom-label">
            Trial Session Requested?
          </label>
        </div>
      </div>
    );
  };

  const renderMakeupServicesStep = () => {
    const hairAndMakeupData = formData.requests.HairAndMakeup || {};
    return (
      <div className='form-grid'>
        <div className="custom-input-container">
          <input
            type="text"
            name="makeupStylePreferences"
            value={typeof hairAndMakeupData.makeupStylePreferences === 'string' 
              ? hairAndMakeupData.makeupStylePreferences 
              : ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  makeupStylePreferences: e.target.value
                }
              }
            }))}
            placeholder="Describe your desired makeup style (e.g., natural, glamorous, classic bridal)"
            className="custom-input"
          />
          <label htmlFor="makeupStylePreferences" className="custom-label">
            Makeup Style Preferences
          </label>
        </div>

        <div className="custom-input-container">
          <input
            type="text"
            name="skinTypeConcerns"
            value={hairAndMakeupData.skinTypeConcerns || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  skinTypeConcerns: e.target.value
                }
              }
            }))}
            placeholder="Describe your skin type and any concerns"
            className="custom-input"
          />
          <label htmlFor="skinTypeConcerns" className="custom-label">
            Skin Type & Concerns
          </label>
        </div>

        <div className="custom-input-container">
          <input
            type="text"
            name="preferredProductsAllergies"
            value={hairAndMakeupData.preferredProductsAllergies || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  preferredProductsAllergies: e.target.value
                }
              }
            }))}
            placeholder="List any preferred products or allergies"
            className="custom-input"
          />
          <label htmlFor="preferredProductsAllergies" className="custom-label">
            Preferred Products or Allergies
          </label>
        </div>

        <div className="custom-input-container">
          <select
            name="lashesIncluded"
            value={hairAndMakeupData.lashesIncluded || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  lashesIncluded: e.target.value
                }
              }
            }))}
            className="custom-input"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <label htmlFor="lashesIncluded" className="custom-label">
            Lashes Included?
          </label>
        </div>

        <div className="custom-input-container">
          <select
            name="trialSessionMakeup"
            value={hairAndMakeupData.trialSessionMakeup || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  trialSessionMakeup: e.target.value
                }
              }
            }))}
            className="custom-input"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <label htmlFor="trialSessionMakeup" className="custom-label">
            Trial Session Requested?
          </label>
        </div>
      </div>
    );
  };

  const renderInspirationStep = () => {
    const hairAndMakeupData = formData.requests.HairAndMakeup || {};
    return (
      <div className='form-grid'>
        <div className="photo-upload-section">
          <div className="photo-preview-container">
            {(!hairAndMakeupData.photos || hairAndMakeupData.photos.length === 0) ? (
              <div
                className="photo-upload-box"
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  type="file"
                  id="file-input"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="54" height="45" viewBox="0 0 54 45" fill="none">
                  <path d="M40.6939 15.6916C40.7126 15.6915 40.7313 15.6915 40.75 15.6915C46.9632 15.6915 52 20.2889 52 25.9601C52 31.2456 47.6249 35.5984 42 36.166M40.6939 15.6916C40.731 15.3158 40.75 14.9352 40.75 14.5505C40.75 7.61906 34.5939 2 27 2C19.8081 2 13.9058 7.03987 13.3011 13.4614M40.6939 15.6916C40.4383 18.2803 39.3216 20.6423 37.6071 22.5372M13.3011 13.4614C6.95995 14.0121 2 18.8869 2 24.8191C2 30.339 6.2944 34.9433 12 36.0004M13.3011 13.4614C13.6956 13.4271 14.0956 13.4096 14.5 13.4096C17.3146 13.4096 19.9119 14.2586 22.0012 15.6915" stroke="#141B34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M27 24.7783L27 43.0002M27 24.7783C25.2494 24.7783 21.9788 29.3208 20.75 30.4727M27 24.7783C28.7506 24.7783 32.0212 29.3208 33.25 30.4727" stroke="#141B34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="photo-upload-text">Drag & Drop to Upload or Click to Browse</div>
              </div>
            ) : (
              <>
                <div className="photo-grid">
                  {hairAndMakeupData.photos?.map((photo, index) => (
                    <div key={index} className="photo-grid-item">
                      <img 
                        src={photo.url} 
                        alt={`Uploaded ${index}`} 
                        className="photo-grid-image" 
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setIsPhotoModalOpen(true);
                        }} 
                      />
                      <button 
                        className="remove-photo-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(index);
                        }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button 
                    onClick={() => document.getElementById('file-input-more').click()}
                    className="add-more-photos-btn"
                  >
                    <input
                      type="file"
                      id="file-input-more"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <span className='add-more-text'>Add More Photos</span>
                  </button>
                </div>
              </>
            )}
          </div>
          {isPhotoModalOpen && (
            <div className="modal-overlay" onClick={() => setIsPhotoModalOpen(false)}>
              <div className="modal-content-photo" onClick={e => e.stopPropagation()}>
                <button 
                  className="remove-photo-button" 
                  style={{ position: 'absolute', right: '10px', top: '10px' }}
                  onClick={() => setIsPhotoModalOpen(false)}
                >
                  X
                </button>
                <img src={selectedPhoto?.url} alt="Full size" />
              </div>
            </div>
          )}
        </div>

        <div className="custom-input-container">
          <input
            type="url"
            name="pinterestBoard"
            value={hairAndMakeupData.pinterestBoard || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  pinterestBoard: e.target.value
                }
              }
            }))}
            placeholder="Paste your Pinterest board link here"
            className="custom-input"
          />
          <label htmlFor="pinterestBoard" className="custom-label">
            Pinterest Board Link
          </label>
        </div>

        <div className="custom-input-container">
          <textarea
            value={hairAndMakeupData.additionalInfo || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requests: {
                ...prev.requests,
                HairAndMakeup: {
                  ...prev.requests.HairAndMakeup,
                  additionalInfo: e.target.value
                }
              }
            }))}
            placeholder="Any special requests or additional information..."
            className="custom-input"
          />
          <label htmlFor="additionalInfo" className="custom-label">
            Additional Information
          </label>
        </div>
      </div>
    );
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      requests: {
        ...prev.requests,
        HairAndMakeup: {
          ...prev.requests.HairAndMakeup,
          [field]: value
        }
      }
    }));
  };

  const renderBudgetStep = () => {
    const hairAndMakeupData = formData.requests.HairAndMakeup || {};
    return (
      <div className='form-grid'>
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
            value={hairAndMakeupData.priceQualityPreference || "2"}
            onChange={(e) => handleInputChange("priceQualityPreference", e.target.value)}
            className="price-quality-slider"
          />
        </div>

        <div className="custom-input-container required">
          <select
            name="priceRange"
            value={hairAndMakeupData.priceRange || ""}
            onChange={(e) => handleInputChange("priceRange", e.target.value)}
            className="custom-input"
          >
            <option value="">Select Budget Range</option>
            <option value="0-300">$0 - $300</option>
            <option value="300-500">$300 - $500</option>
            <option value="500-750">$500 - $750</option>
            <option value="750-1000">$750 - $1,000</option>
            <option value="1000-1500">$1,000 - $1,500</option>
            <option value="1500-2000">$1,500 - $2,000</option>
            <option value="2000+">$2,000+</option>
          </select>
          <label htmlFor="priceRange" className="custom-label">
            Budget Range
          </label>
        </div>

        <div className="custom-input-container">
          <select
            name="groupDiscountInquiry"
            value={hairAndMakeupData.groupDiscountInquiry || ""}
            onChange={(e) => handleInputChange("groupDiscountInquiry", e.target.value)}
            className="custom-input"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <label htmlFor="groupDiscountInquiry" className="custom-label">
            Group Discount Inquiry?
          </label>
        </div>
      </div>
    );
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    // Validate file types
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const invalidFiles = files.filter(file => !validImageTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      console.error("Please only upload image files (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    try {
      const newPhotos = files.map(file => ({
        file: file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type
      }));
      
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          HairAndMakeup: {
            ...prev.requests.HairAndMakeup,
            photos: [...(prev.requests.HairAndMakeup.photos || []), ...newPhotos]
          }
        }
      }));
      
    } catch (err) {
      console.error("Error processing files:", err);
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      requests: {
        ...prev.requests,
        HairAndMakeup: {
          ...prev.requests.HairAndMakeup,
          photos: prev.requests.HairAndMakeup.photos.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  return (
    <div className="hair-and-makeup-stepper">
      <div className="hair-and-makeup-stepper-content">
        {renderSubStep()}
      </div>
    </div>
  );
}

export default HairAndMakeupStepper; 