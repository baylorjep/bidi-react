import React from 'react';
import '../../../styles/Requests.css';

function DjStepper({ formData, setFormData, currentStep, setCurrentStep, subStep, setSubStep }) {
  // Initialize eventDetails if it doesn't exist
  React.useEffect(() => {
    if (!formData.eventDetails) {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          equipmentNeeded: '',
          equipmentNotes: '',
          additionalServices: {},
          musicPreferences: {},
          playlist: '',
          specialSongs: '',
          priceQualityPreference: '2',
          priceRange: '',
          additionalInfo: '',
          weddingDetails: {
            ceremony: false,
            cocktailHour: false,
            reception: false,
            afterParty: false
          }
        }
      }));
    }
  }, [formData.eventDetails, setFormData]);

  const getSubSteps = () => {
    switch (formData.commonDetails?.eventType) {
      case 'Wedding':
        return [
          'Coverage',
          'Equipment & Add-ons',
          'Budget & Additional Info'
        ];
      default:
        return ['Coverage', 'Music & Equipment', 'Additional Details'];
    }
  };

  const renderSubStep = () => {
    const subSteps = getSubSteps();
    const eventDetails = formData.eventDetails || {};

    switch (subStep) {
      case 0: // Coverage
        return (
          <div className="wedding-details-container">
            {formData.commonDetails?.eventType === 'Wedding' && (
              <div className="wedding-photo-options" style={{paddingTop:'0', paddingBottom:'0'}}>
                <div className='photo-options-header'>What parts of the event need DJ coverage?</div>
                <div className="photo-options-grid">
                  {[
                    { key: 'ceremony', label: 'Ceremony' },
                    { key: 'cocktailHour', label: 'Cocktail Hour' },
                    { key: 'reception', label: 'Reception' },
                    { key: 'afterParty', label: 'After Party' }
                  ].map(({ key, label }) => (
                    <div key={key} className="photo-option-item">
                      <input
                        type="checkbox"
                        id={key}
                        checked={eventDetails.weddingDetails?.[key] || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          eventDetails: {
                            ...prev.eventDetails,
                            weddingDetails: {
                              ...prev.eventDetails.weddingDetails,
                              [key]: e.target.checked
                            }
                          }
                        }))}
                      />
                      <label htmlFor={key}>{label}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 1: // Equipment & Add-ons/Music & Equipment
        return (
          <div className="wedding-details-container" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '20px' }}>
            <div className="wedding-photo-options">
              <div className='photo-options-header'>Equipment Requirements</div>
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
                  ✅ The venue provides sound and lighting equipment
                </button>
                <button
                  className={`equipment-option-button ${eventDetails.equipmentNeeded === 'djBringsAll' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      equipmentNeeded: 'djBringsAll'
                    }
                  }))}
                >
                  🎵 The DJ needs to bring all equipment
                </button>
                <button
                  className={`equipment-option-button ${eventDetails.equipmentNeeded === 'djBringsSome' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    eventDetails: {
                      ...prev.eventDetails,
                      equipmentNeeded: 'djBringsSome'
                    }
                  }))}
                >
                  🎛️ The DJ needs to bring some equipment
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

              {eventDetails.equipmentNeeded === 'djBringsSome' && (
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
                    placeholder="Please specify what equipment the DJ needs to bring..."
                    className="custom-input"
                  />
                  <label htmlFor="equipmentNotes" className="custom-label">
                    Equipment Details
                  </label>
                </div>
              )}
            </div>

            <div className="wedding-photo-options">
              <div className='photo-options-header'>Add-ons</div>
              <span className='photo-options-header' style={{color:'gray', fontSize:'12px'}}>(optional)</span>
              <div className="photo-options-grid">
                {[
                  { key: 'mcServices', label: '🎤 MC Services' },
                  { key: 'liveMixing', label: '🎶 Live Mixing / Scratching' },
                  { key: 'uplighting', label: '🏮 Uplighting Package' },
                  { key: 'fogMachine', label: '🌫️ Fog Machine' },
                  { key: 'specialFx', label: '🎇 Cold Sparks / Special FX' },
                  { key: 'photoBooth', label: '📸 Photo Booth Service' },
                  { key: 'eventRecording', label: '🎥 Event Recording' },
                  { key: 'karaoke', label: '🎵 Karaoke Setup' },
                ].map(({ key, label }) => (
                  <div key={key} className="photo-option-item">
                    <input
                      type="checkbox"
                      id={key}
                      checked={eventDetails.additionalServices?.[key] || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        eventDetails: {
                          ...prev.eventDetails,
                          additionalServices: {
                            ...prev.eventDetails.additionalServices,
                            [key]: e.target.checked
                          }
                        }
                      }))}
                    />
                    <label htmlFor={key}>{label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="wedding-photo-options">
              <div className='photo-options-header'>Music Style Preferences</div>
              <div className="photo-options-grid">
                {[
                  { key: 'top40', label: 'Top 40' },
                  { key: 'hiphop', label: 'Hip Hop' },
                  { key: 'house', label: 'House' },
                  { key: 'latin', label: 'Latin' },
                  { key: 'rock', label: 'Rock' },
                  { key: 'classics', label: 'Classics' },
                  { key: 'country', label: 'Country' },
                  { key: 'jazz', label: 'Jazz' },
                  { key: 'rb', label: 'R&B' },
                  { key: 'edm', label: 'EDM' },
                  { key: 'pop', label: 'Pop' },
                  { key: 'international', label: 'International' },
                ].map(({ key, label }) => (
                  <div key={key} className="photo-option-item">
                    <input
                      type="checkbox"
                      id={key}
                      checked={eventDetails.musicPreferences?.[key] || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        eventDetails: {
                          ...prev.eventDetails,
                          musicPreferences: {
                            ...prev.eventDetails.musicPreferences,
                            [key]: e.target.checked
                          }
                        }
                      }))}
                    />
                    <label htmlFor={key}>{label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="custom-input-container" style={{ marginTop: '20px' }}>
              <input
                type="url"
                name="playlist"
                value={eventDetails.playlist || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    playlist: e.target.value
                  }
                }))}
                placeholder="Paste your Spotify/Apple Music playlist link here"
                className="custom-input"
              />
              <label htmlFor="playlist" className="custom-label">
                Music Playlist Link
              </label>
            </div>

            <div className="custom-input-container">
              <textarea
                value={eventDetails.specialSongs || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  eventDetails: {
                    ...prev.eventDetails,
                    specialSongs: e.target.value
                  }
                }))}
                placeholder="List any must-play songs or specific tracks for key moments..."
                className="custom-input"
              />
              <label htmlFor="specialSongs" className="custom-label">
                Special Song Requests
              </label>
            </div>
          </div>
        );

      case 2: // Budget & Additional Info
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
                <option value="">Select Budget Range</option>
                <option value="0-500">$0 - $500</option>
                <option value="500-1000">$500 - $1,000</option>
                <option value="1000-1500">$1,000 - $1,500</option>
                <option value="1500-2000">$1,500 - $2,000</option>
                <option value="2000-2500">$2,000 - $2,500</option>
                <option value="2500-3000">$2,500 - $3,000</option>
                <option value="3000+">$3,000+</option>
              </select>
              <label htmlFor="priceRange" className="custom-label">
                Budget Range
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
                placeholder="Any special requests or additional information DJs should know..."
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
    <div className="dj-stepper">
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
      <div className="dj-stepper-content">
        {renderSubStep()}
      </div>
    </div>
  );
}

export default DjStepper; 