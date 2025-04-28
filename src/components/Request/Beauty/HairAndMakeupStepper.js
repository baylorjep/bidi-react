import React from 'react';
import '../../../styles/Requests.css';

function HairAndMakeupStepper({ formData, setFormData, currentStep, setCurrentStep, subStep, setSubStep }) {
  // Initialize eventDetails if it doesn't exist
  React.useEffect(() => {
    if (!formData.eventDetails) {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
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
          pinterestBoard: ''
        }
      }));
    }
  }, [formData.eventDetails, setFormData]);

  const getSubSteps = () => {
    return [
      'Basic Information',
      'Hair Services',
      'Makeup Services',
      'Additional Details'
    ];
  };

  const renderSubStep = () => {
    const subSteps = getSubSteps();
    const eventDetails = formData.eventDetails || {};

    switch (subStep) {
      case 0: // Basic Information
        return (
          <div className='form-grid'>
            <div className="custom-input-container">
              <input
                type="text"
                name="location"
                value={eventDetails.location || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    location: e.target.value
                  }
                }))}
                placeholder='Where will services be performed? (e.g., home, hotel, venue)'
                className="custom-input"
              />
              <label htmlFor="location" className="custom-label">
                Service Location
              </label>
            </div>

            <div className="custom-input-container">
              <select
                name="dateFlexibility"
                value={eventDetails.dateFlexibility || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    dateFlexibility: e.target.value
                  }
                }))}
                className="custom-input"
              >
                <option value="">Select</option>
                <option value="specific">Specific Date</option>
                <option value="range">Date Range</option>
                <option value="flexible">I'm Flexible</option>
              </select>
              <label htmlFor="dateFlexibility" className="custom-label">
                Date Flexibility
              </label>
            </div>

            {eventDetails.dateFlexibility === 'specific' && (
              <div className="custom-input-container">
                <input
                  type="date"
                  name="startDate"
                  value={eventDetails.startDate || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      startDate: e.target.value
                    }
                  }))}
                  className="custom-input"
                />
                <label htmlFor="startDate" className="custom-label">
                  Event Date
                </label>
              </div>
            )}

            {eventDetails.dateFlexibility === 'range' && (
              <>
                <div className="custom-input-container">
                  <input
                    type="date"
                    name="startDate"
                    value={eventDetails.startDate || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventDetails: {
                        ...prev.eventDetails,
                        startDate: e.target.value
                      }
                    }))}
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
                    value={eventDetails.endDate || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventDetails: {
                        ...prev.eventDetails,
                        endDate: e.target.value
                      }
                    }))}
                    className="custom-input"
                  />
                  <label htmlFor="endDate" className="custom-label">
                    Latest Date
                  </label>
                </div>
              </>
            )}

            {eventDetails.dateFlexibility === 'flexible' && (
              <div className="custom-input-container">
                <select
                  name="dateTimeframe"
                  value={eventDetails.dateTimeframe || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      dateTimeframe: e.target.value
                    }
                  }))}
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

            <div className="custom-input-container">
              <div className="input-with-unknown">
                <input
                  type="number"
                  name="numPeople"
                  value={eventDetails.numPeople || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      numPeople: e.target.value,
                      numPeopleUnknown: false
                    }
                  }))}
                  className="custom-input"
                  disabled={eventDetails.numPeopleUnknown}
                  placeholder="Number of people needing services"
                />
                <label className="unknown-checkbox-container">
                  <input
                    type="checkbox"
                    checked={eventDetails.numPeopleUnknown || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventDetails: {
                        ...prev.eventDetails,
                        numPeople: '',
                        numPeopleUnknown: e.target.checked
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
                name="specificTimeNeeded"
                value={eventDetails.specificTimeNeeded || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    specificTimeNeeded: e.target.value
                  }
                }))}
                className="custom-input"
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <label htmlFor="specificTimeNeeded" className="custom-label">
                Specific Time Needed?
              </label>
            </div>

            {eventDetails.specificTimeNeeded === 'yes' && (
              <div className="custom-input-container">
                <input
                  type="time"
                  name="specificTime"
                  value={eventDetails.specificTime || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      specificTime: e.target.value
                    }
                  }))}
                  className="custom-input"
                />
                <label htmlFor="specificTime" className="custom-label">
                  Specific Time
                </label>
              </div>
            )}
          </div>
        );

      case 1: // Hair Services
        return (
          <div className='form-grid'>
            <div className="custom-input-container">
              <input
                type="text"
                name="hairstylePreferences"
                value={eventDetails.hairstylePreferences || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    hairstylePreferences: e.target.value
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
                value={eventDetails.hairLengthType || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    hairLengthType: e.target.value
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
                value={eventDetails.extensionsNeeded || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    extensionsNeeded: e.target.value
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
                value={eventDetails.trialSessionHair || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    trialSessionHair: e.target.value
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

      case 2: // Makeup Services
        return (
          <div className='form-grid'>
            <div className="custom-input-container">
              <div className="checkbox-group">
                {[
                  { id: 'traditional', label: 'Classic Bridal' },
                  { id: 'natural', label: 'Natural & Fresh' },
                  { id: 'glamorous', label: 'Glamorous' },
                  { id: 'bohemian', label: 'Boho Beauty' },
                  { id: 'elegant', label: 'Elegant' },
                  { id: 'fresh', label: 'Fresh & Dewy' }
                ].map(style => (
                  <div key={style.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={style.id}
                      checked={eventDetails.makeupStylePreferences?.[style.id] || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        eventDetails: {
                          ...prev.eventDetails,
                          makeupStylePreferences: {
                            ...prev.eventDetails.makeupStylePreferences,
                            [style.id]: e.target.checked
                          }
                        }
                      }))}
                    />
                    <label htmlFor={style.id}>{style.label}</label>
                  </div>
                ))}
              </div>
              <label className="custom-label">
                Makeup Style Preferences
              </label>
            </div>

            <div className="custom-input-container">
              <input
                type="text"
                name="skinTypeConcerns"
                value={eventDetails.skinTypeConcerns || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    skinTypeConcerns: e.target.value
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
                value={eventDetails.preferredProductsAllergies || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    preferredProductsAllergies: e.target.value
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
                value={eventDetails.lashesIncluded || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    lashesIncluded: e.target.value
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
                value={eventDetails.trialSessionMakeup || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    trialSessionMakeup: e.target.value
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

      case 3: // Additional Details
        return (
          <div className='form-grid' style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
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
                value={eventDetails.priceQualityPreference || "2"}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    priceQualityPreference: e.target.value
                  }
                }))}
                className="price-quality-slider"
              />
            </div>

            <div className="custom-input-container required">
              <select
                name="priceRange"
                value={eventDetails.priceRange || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    priceRange: e.target.value
                  }
                }))}
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
                value={eventDetails.groupDiscountInquiry || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    groupDiscountInquiry: e.target.value
                  }
                }))}
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

            <div className="custom-input-container">
              <select
                name="onSiteServiceNeeded"
                value={eventDetails.onSiteServiceNeeded || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    onSiteServiceNeeded: e.target.value
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
              <input
                type="url"
                name="pinterestBoard"
                value={eventDetails.pinterestBoard || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    pinterestBoard: e.target.value
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
                value={eventDetails.additionalInfo || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    additionalInfo: e.target.value
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

      default:
        return null;
    }
  };

  return (
    <div className="hair-and-makeup-stepper">
      <div className="sub-steps-indicator">
        {getSubSteps().map((step, index) => (
          <div
            key={index}
            className={`sub-step ${index === subStep ? 'active' : ''} 
                      ${index < subStep ? 'completed' : ''}`}
            onClick={() => setSubStep(index)}
          >
            {step}
          </div>
        ))}
      </div>
      <div className="hair-and-makeup-stepper-content">
        {renderSubStep()}
      </div>
    </div>
  );
}

export default HairAndMakeupStepper; 