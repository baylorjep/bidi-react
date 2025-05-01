import React from 'react';
import '../../../styles/Requests.css';

function CateringStepper({ formData, setFormData, currentStep, setCurrentStep, subStep, setSubStep }) {
  // Initialize eventDetails if it doesn't exist
  React.useEffect(() => {
    if (!formData.eventDetails) {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
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
          otherDietaryDetails: '',
          equipmentNeeded: 'unknown',
          equipmentNotes: ''
        }
      }));
    }
  }, [formData.eventDetails, setFormData]);

  const getSubSteps = () => {
    switch (formData.commonDetails?.eventType) {
      case 'Wedding':
        return [
          'Logistics & Extra',
          'Budget & Additional Info'
        ];
      default:
        return ['Coverage', 'Food & Equipment', 'Additional Details'];
    }
  };

  const calculateRecommendedBudget = () => {
    let basePrice = 0;
    const eventDetails = formData.eventDetails || {};
    const commonDetails = formData.commonDetails || {};
    const priceQualityPreference = formData.requests.Catering?.priceQualityPreference || "2";

    // Base price based on number of guests
    const numGuests = parseInt(commonDetails.numGuests) || 0;
    if (numGuests > 0) {
      basePrice = numGuests * 50; // $50 per person base rate
    }

    // Add for food style
    if (eventDetails.foodStyle === 'plated') {
      basePrice *= 1.2; // 20% increase for plated service
    } else if (eventDetails.foodStyle === 'stations') {
      basePrice *= 1.3; // 30% increase for food stations
    }

    // Add for dietary restrictions
    const dietaryRestrictions = eventDetails.dietaryRestrictions || [];
    if (dietaryRestrictions.length > 0) {
      basePrice *= 1.1; // 10% increase for dietary restrictions
    }

    // Add for setup and cleanup
    if (eventDetails.setupCleanup === 'both') {
      basePrice += 500; // $500 for full setup and cleanup
    } else if (eventDetails.setupCleanup === 'setupOnly' || eventDetails.setupCleanup === 'cleanupOnly') {
      basePrice += 250; // $250 for partial service
    }

    // Add for serving staff
    if (eventDetails.servingStaff === 'fullService') {
      basePrice += numGuests * 10; // $10 per person for full service staff
    } else if (eventDetails.servingStaff === 'partialService') {
      basePrice += numGuests * 5; // $5 per person for partial service
    }

    // Add for dining items
    if (eventDetails.diningItems === 'provided') {
      basePrice += numGuests * 15; // $15 per person for full dining items
    } else if (eventDetails.diningItems === 'partial') {
      basePrice += numGuests * 8; // $8 per person for partial items
    }

    // Adjust based on price quality preference
    if (priceQualityPreference === "1") {
      basePrice *= 0.8; // 20% reduction for budget-conscious
    } else if (priceQualityPreference === "3") {
      basePrice *= 1.3; // 30% increase for quality-focused
    }

    return Math.round(basePrice);
  };

  const renderSubStep = () => {
    const subSteps = getSubSteps();
    const eventDetails = formData.eventDetails || {};

    switch (subStep) {
      case 0: // Logistics & Extra/Coverage
        return (
          <div className="event-details-container" style={{display:'flex', flexDirection:'column', gap:'20px'}}>
            <div className="event-photo-options">
              <div className='photo-options-header'>Kitchen Equipment Requirements</div>
              <div className="equipment-options">
                <button
                  className={`equipment-option-button ${eventDetails.equipmentNeeded === 'venueProvided' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      equipmentNeeded: 'venueProvided'
                    }
                  }))}
                >
                  ✅ The venue provides kitchen equipment
                </button>
                <button
                  className={`equipment-option-button ${eventDetails.equipmentNeeded === 'catererBringsAll' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      equipmentNeeded: 'catererBringsAll'
                    }
                  }))}
                >
                  🍳 The caterer needs to bring all equipment
                </button>
                <button
                  className={`equipment-option-button ${eventDetails.equipmentNeeded === 'catererBringsSome' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      equipmentNeeded: 'catererBringsSome'
                    }
                  }))}
                >
                  🔪 The caterer needs to bring some equipment
                </button>
                <button
                  className={`equipment-option-button ${eventDetails.equipmentNeeded === 'unknown' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      equipmentNeeded: 'unknown'
                    }
                  }))}
                >
                  ❓ I'm not sure about the equipment requirements
                </button>
              </div>

              {eventDetails.equipmentNeeded === 'catererBringsSome' && (
                <div className="custom-input-container" style={{ marginTop: '20px' }}>
                  <textarea
                    value={eventDetails.equipmentNotes || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventDetails: {
                        ...prev.eventDetails,
                        equipmentNotes: e.target.value
                      }
                    }))}
                    placeholder="Please specify what equipment the caterer needs to bring..."
                    className="custom-input"
                  />
                  <label htmlFor="equipmentNotes" className="custom-label">
                    Equipment Details
                  </label>
                </div>
              )}
            </div>

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

      case 1: // Budget & Additional Info
        const recommendedBudget = calculateRecommendedBudget();
        return (
          <div className='form-grid'>
            <div className="budget-recommendation-container">
              <h3>Recommended Budget</h3>
              <p className="budget-amount">${recommendedBudget.toLocaleString()}</p>
              <p className="budget-explanation">
                This recommendation is based on:
                <ul>
                  {formData.commonDetails?.numGuests && (
                    <li>{formData.commonDetails.numGuests} guests</li>
                  )}
                  {eventDetails.foodStyle && (
                    <li>{eventDetails.foodStyle} service style</li>
                  )}
                  {eventDetails.dietaryRestrictions?.length > 0 && (
                    <li>Dietary restrictions</li>
                  )}
                  {eventDetails.setupCleanup && eventDetails.setupCleanup !== 'neither' && (
                    <li>{eventDetails.setupCleanup} service</li>
                  )}
                  {eventDetails.servingStaff && eventDetails.servingStaff !== 'noService' && (
                    <li>{eventDetails.servingStaff} staff</li>
                  )}
                  {eventDetails.diningItems && eventDetails.diningItems !== 'notProvided' && (
                    <li>{eventDetails.diningItems} dining items</li>
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
                value={formData.requests.Catering?.priceQualityPreference || "2"}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  requests: {
                    ...prev.requests,
                    Catering: {
                      ...prev.requests.Catering,
                      priceQualityPreference: e.target.value
                    }
                  }
                }))}
                className="price-quality-slider"
              />
              <div className="preference-description">
                <div className="preference-detail">
                  {formData.requests.Catering?.priceQualityPreference === "1" && (
                    <p>👉 Focus on finding budget-friendly catering options while maintaining good quality</p>
                  )}
                  {formData.requests.Catering?.priceQualityPreference === "2" && (
                    <p>Balanced</p>
                  )}
                  {formData.requests.Catering?.priceQualityPreference === "3" && (
                    <>
                      <p>👉 Priority on culinary excellence and presentation</p>
                      <p>👉 Access to premium catering services</p>
                      <p>👉 Ideal for those seeking exceptional dining experiences</p>
                    </>
                  )}
                </div>
              </div>
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