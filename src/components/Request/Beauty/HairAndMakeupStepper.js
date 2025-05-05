import React, { useState, useEffect } from 'react';
import '../../../styles/Requests.css';
import BudgetForm from '../BudgetForm';

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

  const [recommendedBudget, setRecommendedBudget] = useState({ min: 0, max: 0 });
  const [priceQualityPreference, setPriceQualityPreference] = useState(50);

  const calculateRecommendedBudget = () => {
    const requestData = formData.requests.HairAndMakeup || {};
    const serviceType = requestData.serviceType;
    const numPeople = parseInt(requestData.numPeople) || 0;

    if (!serviceType || numPeople <= 0) {
      return { min: 0, max: 0 };
    }

    // Base rates
    const baseRates = {
      'both': 200,    // $200 per person for both services
      'hair': 150,    // $150 per person for hair only
      'makeup': 100   // $100 per person for makeup only
    };

    // Calculate base cost
    const baseCost = baseRates[serviceType] * numPeople;

    // Add costs for additional services
    let additionalCosts = 0;
    if (requestData.extensionsNeeded === 'yes') {
      additionalCosts += 100 * numPeople; // $100 per person for extensions
    }
    if (requestData.trialSessionHair === 'yes') {
      additionalCosts += 150 * numPeople; // $150 per person for hair trial
    }
    if (requestData.lashesIncluded === 'yes') {
      additionalCosts += 50 * numPeople; // $50 per person for lashes
    }
    if (requestData.trialSessionMakeup === 'yes') {
      additionalCosts += 150 * numPeople; // $150 per person for makeup trial
    }

    const totalCost = baseCost + additionalCosts;

    // Calculate range based on price quality preference
    const qualityMultiplier = 1 + (priceQualityPreference / 100);
    const minPrice = Math.round(totalCost * (qualityMultiplier - 0.2));
    const maxPrice = Math.round(totalCost * (qualityMultiplier + 0.2));

    return { min: minPrice, max: maxPrice };
  };

  useEffect(() => {
    const budget = calculateRecommendedBudget();
    setRecommendedBudget(budget);
  }, [formData.requests.HairAndMakeup, priceQualityPreference]);

  const handlePriceQualityChange = (e) => {
    const value = parseInt(e.target.value);
    setPriceQualityPreference(value);
    setFormData(prev => ({
      ...prev,
      requests: {
        ...prev.requests,
        HairAndMakeup: {
          ...prev.requests.HairAndMakeup,
          priceQualityPreference: value.toString()
        }
      }
    }));
  };

  const getPriceQualityDescription = (value) => {
    if (value < 25) return 'Budget-friendly';
    if (value < 50) return 'Balanced';
    if (value < 75) return 'Premium';
    return 'Luxury';
  };

  const getSubSteps = () => {
    const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
    const subSteps = ['Basic Information'];

    // For hair only
    if (serviceType === 'hair') {
      subSteps.push('Hair Services');
      subSteps.push('Inspiration');
      subSteps.push('Budget');
    }
    // For makeup only
    else if (serviceType === 'makeup') {
      subSteps.push('Makeup Services');
      subSteps.push('Inspiration');
      subSteps.push('Budget');
    }
    // For both services
    else {
      subSteps.push('Hair Services');
      subSteps.push('Makeup Services');
      subSteps.push('Inspiration');
      subSteps.push('Budget');
    }

    return subSteps;
  };

  const renderSubStep = () => {
    const subSteps = getSubSteps();
    const currentStepName = subSteps[subStep];
    
    // Debug log to check step progression
    console.log('Available Steps:', subSteps);
    console.log('Current Step:', currentStepName);
    console.log('Service Type:', formData.requests.HairAndMakeup?.serviceType);
    console.log('SubStep Index:', subStep);

    // For makeup-only service type
    if (formData.requests.HairAndMakeup?.serviceType === 'makeup') {
      switch (subStep) {
        case 0:
          return renderBasicInfoStep();
        case 1:
          return renderMakeupServicesStep();
        case 2:
          return renderInspirationStep();
        case 3:
          return renderBudgetStep();
        default:
          return null;
      }
    }
    // For hair-only service type
    else if (formData.requests.HairAndMakeup?.serviceType === 'hair') {
      switch (subStep) {
        case 0:
          return renderBasicInfoStep();
        case 1:
          return renderHairServicesStep();
        case 2:
          return renderInspirationStep();
        case 3:
          return renderBudgetStep();
        default:
          return null;
      }
    }
    // For both services
    else {
      switch (currentStepName) {
        case 'Basic Information':
          return renderBasicInfoStep();
        case 'Hair Services':
          return renderHairServicesStep();
        case 'Makeup Services':
          return renderMakeupServicesStep();
        case 'Inspiration':
          return renderInspirationStep();
        case 'Budget':
          return renderBudgetStep();
        default:
          return null;
      }
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
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                requests: {
                  ...prev.requests,
                  HairAndMakeup: {
                    ...prev.requests.HairAndMakeup,
                    serviceType: e.target.value
                  }
                }
              }));
              setSubStep(0); // Reset to first step when service type changes
            }}
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
    return (
      <div className="form-scrollable-content">
        <BudgetForm 
          formData={formData}
          setFormData={setFormData}
          category="HairAndMakeup"
        />
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