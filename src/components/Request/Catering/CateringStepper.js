import React from 'react';
import '../../../styles/Requests.css';

function CateringStepper({ formData, setFormData, currentStep, setCurrentStep, subStep, setSubStep }) {
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
          indoorOutdoor: '',
          numPeople: '',
          setupCleanup: '',
          servingStaff: '',
          diningItems: '',
          diningItemsNotes: '',
          priceQualityPreference: '2',
          priceRange: '',
          additionalInfo: '',
          foodStyle: '',
          cuisineTypes: [],
          customCuisineDetails: '',
          dietaryRestrictions: [],
          otherDietaryDetails: ''
        }
      }));
    }
  }, [formData.eventDetails, setFormData]);

  const getSubSteps = () => {
    switch (formData.commonDetails?.eventType) {
      case 'Wedding':
        return [
          'Basic Details',
          'Logistics & Extra',
          'Budget & Additional Info'
        ];
      default:
        return ['Basic Info', 'Coverage', 'Food & Equipment', 'Additional Details'];
    }
  };

  const renderSubStep = () => {
    const subSteps = getSubSteps();
    const eventDetails = formData.eventDetails || {};

    switch (subStep) {
      case 0: // Basic Details/Basic Info
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
                placeholder='Can be a city, county, address, or venue name'
                className="custom-input"
              />
              <label htmlFor="location" className="custom-label">
                Location
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

            <div style={{display:'flex', justifyContent:'space-between', gap:'8px'}}>
              <div className="custom-input-container">
                <div className="input-with-unknown">
                  <input
                    type="time"
                    name="startTime"
                    value={eventDetails.startTime || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventDetails: {
                        ...prev.eventDetails,
                        startTime: e.target.value,
                        startTimeUnknown: false
                      }
                    }))}
                    className="custom-input"
                    disabled={eventDetails.startTimeUnknown}
                  />
                  <label className="unknown-checkbox-container">
                    <input
                      type="checkbox"
                      checked={eventDetails.startTimeUnknown || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        eventDetails: {
                          ...prev.eventDetails,
                          startTime: '',
                          startTimeUnknown: e.target.checked
                        }
                      }))}
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
                    value={eventDetails.endTime || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventDetails: {
                        ...prev.eventDetails,
                        endTime: e.target.value,
                        endTimeUnknown: false
                      }
                    }))}
                    className="custom-input"
                    disabled={eventDetails.endTimeUnknown}
                  />
                  <label className="unknown-checkbox-container">
                    <input
                      type="checkbox"
                      checked={eventDetails.endTimeUnknown || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        eventDetails: {
                          ...prev.eventDetails,
                          endTime: '',
                          endTimeUnknown: e.target.checked
                        }
                      }))}
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
                value={eventDetails.indoorOutdoor || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    indoorOutdoor: e.target.value
                  }
                }))}
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

            <div className="custom-input-container">
              <input
                type="number"
                name="numPeople"
                value={eventDetails.numPeople || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    numPeople: e.target.value
                  }
                }))}
                placeholder='Number of guests'
                className="custom-input"
              />
              <label htmlFor="numPeople" className="custom-label">
                Number of Guests
              </label>
            </div>
          </div>
        );

      case 1: // Logistics & Extra/Coverage
        return (
          <div className="event-details-container" style={{display:'flex', flexDirection:'column', gap:'20px'}}>
            <div className="event-photo-options">
              <div className='photo-options-header'>Food Type & Style</div>
              <div className="photo-options-grid">
                {[
                  { key: 'buffet', label: 'Buffet Style' },
                  { key: 'plated', label: 'Plated Service' },
                  { key: 'family', label: 'Family Style' },
                  { key: 'stations', label: 'Food Stations' },
                  { key: 'cocktail', label: 'Cocktail Reception' },
                  { key: 'foodTrucks', label: 'Food Trucks' }
                ].map(({ key, label }) => (
                  <div key={key} className="photo-option-item">
                    <input
                      type="radio"
                      id={`food_${key}`}
                      name="foodStyle"
                      checked={eventDetails.foodStyle === key}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        eventDetails: {
                          ...prev.eventDetails,
                          foodStyle: key
                        }
                      }))}
                    />
                    <label htmlFor={`food_${key}`}>{label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="event-photo-options">
              <div className='photo-options-header'>Cuisine Type</div>
              <div className="photo-options-grid">
                {[
                  { key: 'american', label: 'American' },
                  { key: 'italian', label: 'Italian' },
                  { key: 'mexican', label: 'Mexican' },
                  { key: 'asian', label: 'Asian' },
                  { key: 'mediterranean', label: 'Mediterranean' },
                  { key: 'bbq', label: 'BBQ' },
                  { key: 'vegetarian', label: 'Vegetarian' },
                  { key: 'vegan', label: 'Vegan' },
                  { key: 'custom', label: 'Custom Mix' }
                ].map(({ key, label }) => (
                  <div key={key} className="photo-option-item">
                    <input
                      type="checkbox"
                      id={`cuisine_${key}`}
                      name="cuisineTypes"
                      checked={eventDetails.cuisineTypes?.includes(key) || false}
                      onChange={(e) => {
                        const currentTypes = eventDetails.cuisineTypes || [];
                        const newTypes = e.target.checked
                          ? [...currentTypes, key]
                          : currentTypes.filter(type => type !== key);
                        setFormData(prev => ({
                          ...prev,
                          eventDetails: {
                            ...prev.eventDetails,
                            cuisineTypes: newTypes
                          }
                        }));
                      }}
                    />
                    <label htmlFor={`cuisine_${key}`}>{label}</label>
                  </div>
                ))}
              </div>
            </div>

            {eventDetails.cuisineTypes?.includes('custom') && (
              <div className="custom-input-container">
                <textarea
                  value={eventDetails.customCuisineDetails || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      customCuisineDetails: e.target.value
                    }
                  }))}
                  placeholder="Please describe your custom cuisine preferences..."
                  className="custom-input"
                />
                <label htmlFor="customCuisineDetails" className="custom-label">
                  Custom Cuisine Details
                </label>
              </div>
            )}

            <div className="event-photo-options">
              <div className='photo-options-header'>Dietary Restrictions</div>
              <div className="photo-options-grid">
                {[
                  { key: 'vegetarian', label: 'Vegetarian' },
                  { key: 'vegan', label: 'Vegan' },
                  { key: 'glutenFree', label: 'Gluten-Free' },
                  { key: 'dairyFree', label: 'Dairy-Free' },
                  { key: 'nutFree', label: 'Nut-Free' },
                  { key: 'kosher', label: 'Kosher' },
                  { key: 'halal', label: 'Halal' },
                  { key: 'other', label: 'Other' }
                ].map(({ key, label }) => (
                  <div key={key} className="photo-option-item">
                    <input
                      type="checkbox"
                      id={`diet_${key}`}
                      name="dietaryRestrictions"
                      checked={eventDetails.dietaryRestrictions?.includes(key) || false}
                      onChange={(e) => {
                        const currentRestrictions = eventDetails.dietaryRestrictions || [];
                        const newRestrictions = e.target.checked
                          ? [...currentRestrictions, key]
                          : currentRestrictions.filter(restriction => restriction !== key);
                        setFormData(prev => ({
                          ...prev,
                          eventDetails: {
                            ...prev.eventDetails,
                            dietaryRestrictions: newRestrictions
                          }
                        }));
                      }}
                    />
                    <label htmlFor={`diet_${key}`}>{label}</label>
                  </div>
                ))}
              </div>
            </div>

            {eventDetails.dietaryRestrictions?.includes('other') && (
              <div className="custom-input-container">
                <textarea
                  value={eventDetails.otherDietaryDetails || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      otherDietaryDetails: e.target.value
                    }
                  }))}
                  placeholder="Please specify any other dietary restrictions..."
                  className="custom-input"
                />
                <label htmlFor="otherDietaryDetails" className="custom-label">
                  Other Dietary Details
                </label>
              </div>
            )}

            <div className="event-photo-options">
              <div className='photo-options-header'>Setup & Cleanup Required?</div>
              <div className="photo-options-grid">
                {[
                  { key: 'setupOnly', label: 'Setup Only' },
                  { key: 'cleanupOnly', label: 'Cleanup Only' },
                  { key: 'both', label: 'Both Setup & Cleanup' },
                  { key: 'neither', label: 'Neither' }
                ].map(({ key, label }) => (
                  <div key={key} className="photo-option-item">
                    <input
                      type="radio"
                      id={`setup_${key}`}
                      name="setupCleanup"
                      checked={eventDetails.setupCleanup === key}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        eventDetails: {
                          ...prev.eventDetails,
                          setupCleanup: key
                        }
                      }))}
                    />
                    <label htmlFor={`setup_${key}`}>{label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="event-photo-options">
              <div className='photo-options-header'>Serving Staff Needed?</div>
              <div className="photo-options-grid">
                {[
                  { key: 'fullService', label: 'Full Service Staff' },
                  { key: 'partialService', label: 'Partial Service' },
                  { key: 'noService', label: 'No Staff Needed' },
                  { key: 'unsure', label: 'Not Sure' }
                ].map(({ key, label }) => (
                  <div key={key} className="photo-option-item">
                    <input
                      type="radio"
                      id={`staff_${key}`}
                      name="servingStaff"
                      checked={eventDetails.servingStaff === key}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        eventDetails: {
                          ...prev.eventDetails,
                          servingStaff: key
                        }
                      }))}
                    />
                    <label htmlFor={`staff_${key}`}>{label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="event-photo-options">
              <div className='photo-options-header'>Dinnerware, Utensils, and Linens</div>
              <div className="photo-options-grid">
                {[
                  { key: 'provided', label: 'Provided by Caterer' },
                  { key: 'notProvided', label: 'Not Needed' },
                  { key: 'partial', label: 'Partial (Specify Below)' }
                ].map(({ key, label }) => (
                  <div key={key} className="photo-option-item">
                    <input
                      type="radio"
                      id={`items_${key}`}
                      name="diningItems"
                      checked={eventDetails.diningItems === key}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        eventDetails: {
                          ...prev.eventDetails,
                          diningItems: key
                        }
                      }))}
                    />
                    <label htmlFor={`items_${key}`}>{label}</label>
                  </div>
                ))}
              </div>
            </div>

            {eventDetails.diningItems === 'partial' && (
              <div className="custom-input-container">
                <textarea
                  value={eventDetails.diningItemsNotes || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      diningItemsNotes: e.target.value
                    }
                  }))}
                  placeholder="Please specify which items you need the caterer to provide..."
                  className="custom-input"
                />
                <label htmlFor="diningItemsNotes" className="custom-label">
                  Dining Items Details
                </label>
              </div>
            )}
          </div>
        );

      case 2: // Budget & Additional Info/Food & Equipment
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
                <option value="">Select a range</option>
                <option value="0-1000">$0-1,000</option>
                <option value="1000-2000">$1,000-2,000</option>
                <option value="2000-3000">$2,000-3,000</option>
                <option value="3000-4000">$3,000-4,000</option>
                <option value="4000-5000">$4,000-5,000</option>
                <option value="5000-6000">$5,000-6,000</option>
                <option value="6000-8000">$6,000-8,000</option>
                <option value="8000-10000">$8,000-10,000</option>
                <option value="10000+">$10,000+</option>
              </select>
              <label htmlFor="priceRange" className="custom-label">
                Budget Range
              </label>
            </div>

            <div className="custom-input-container optional">
              <textarea
                value={eventDetails.additionalInfo || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    additionalInfo: e.target.value
                  }
                }))}
                placeholder="Any special requests or additional information caterers should know..."
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
    <div className="catering-stepper">
      <div className="catering-stepper-content">
        {renderSubStep()}
      </div>
    </div>
  );
}

export default CateringStepper; 