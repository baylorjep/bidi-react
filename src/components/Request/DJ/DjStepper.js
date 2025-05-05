import React from 'react';
import '../../../styles/Requests.css';
import BudgetForm from '../BudgetForm';

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
          indoorOutdoor: '',
          weddingDetails: {
            ceremony: false,
            cocktailHour: false,
            reception: false,
            afterParty: false
          }
        },
        requests: {
          ...prev.requests,
          DJ: {
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
        }
      }));
    }
  }, [formData.eventDetails, setFormData]);

  // Initialize commonDetails if it doesn't exist
  React.useEffect(() => {
    if (!formData.commonDetails) {
      setFormData(prev => ({
        ...prev,
        commonDetails: {
          duration: '',
          durationUnknown: false,
          eventType: '',
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
          indoorOutdoor: ''
        }
      }));
    }
  }, [formData.commonDetails, setFormData]);

  // Helper function to update both eventDetails and requests.DJ
  const updateDjData = (updates) => {
    setFormData(prev => ({
      ...prev,
      eventDetails: {
        ...prev.eventDetails,
        ...updates
      },
      commonDetails: {
        ...prev.commonDetails,
        ...(updates.indoorOutdoor ? { indoorOutdoor: updates.indoorOutdoor } : {})
      },
      requests: {
        ...prev.requests,
        DJ: {
          ...prev.requests?.DJ,
          ...updates
        }
      }
    }));
  };

  // Update the onChange handlers to use updateDjData
  const handleEquipmentChange = (equipmentType) => {
    updateDjData({
      equipmentNeeded: equipmentType
    });
  };

  const handleMusicPreferencesChange = (key, checked) => {
    updateDjData({
      musicPreferences: {
        ...(formData.eventDetails?.musicPreferences || {}),
        [key]: checked
      }
    });
  };

  const handleAdditionalServicesChange = (key, checked) => {
    updateDjData({
      additionalServices: {
        ...(formData.eventDetails?.additionalServices || {}),
        [key]: checked
      }
    });
  };

  const handleBudgetChange = (value) => {
    updateDjData({
      priceRange: value,
      manualBudget: true
    });
  };

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
    const commonDetails = formData.commonDetails || {};

    switch (subStep) {
      case 0: // Coverage
        return (
          <div className="wedding-details-container" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '20px' }}>
            {/* Duration Input */}
            <div className="custom-input-container">
              <div className="input-with-unknown">
                <input
                  type="number"
                  name="duration"
                  value={commonDetails.duration || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    commonDetails: {
                      ...prev.commonDetails,
                      duration: e.target.value,
                      durationUnknown: false
                    }
                  }))}
                  className="custom-input"
                  disabled={commonDetails.durationUnknown}
                  min="1"
                />
                <label className="unknown-checkbox-container">
                  <input
                    type="checkbox"
                    checked={commonDetails.durationUnknown}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      commonDetails: {
                        ...prev.commonDetails,
                        duration: '',
                        durationUnknown: e.target.checked
                      }
                    }))}
                  />
                  <span className="unknown-checkbox-label">Not sure</span>
                </label>
              </div>
              <label htmlFor="duration" className="custom-label">
                Hours of Coverage Needed
              </label>
            </div>

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
                      onChange={(e) => handleMusicPreferencesChange(key, e.target.checked)}
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

      case 1: // Equipment & Add-ons
        return (
          <div className="wedding-details-container" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
            <div className="wedding-photo-options">
              <div className='photo-options-header'>Equipment Requirements</div>
              <div className="equipment-options">
                <button
                  className={`equipment-option-button ${eventDetails.equipmentNeeded === 'venueProvided' ? 'selected' : ''}`}
                  onClick={() => handleEquipmentChange('venueProvided')}
                >
                  ✅ The venue provides sound and lighting equipment
                </button>
                <button
                  className={`equipment-option-button ${eventDetails.equipmentNeeded === 'djBringsAll' ? 'selected' : ''}`}
                  onClick={() => handleEquipmentChange('djBringsAll')}
                >
                  🎵 The DJ needs to bring all equipment
                </button>
                <button
                  className={`equipment-option-button ${eventDetails.equipmentNeeded === 'djBringsSome' ? 'selected' : ''}`}
                  onClick={() => handleEquipmentChange('djBringsSome')}
                >
                  🎛️ The DJ needs to bring some equipment
                </button>
                <button
                  className={`equipment-option-button ${eventDetails.equipmentNeeded === 'unknown' ? 'selected' : ''}`}
                  onClick={() => handleEquipmentChange('unknown')}
                >
                  ❓ I'm not sure about the equipment requirements
                </button>
              </div>

              {eventDetails.equipmentNeeded === 'djBringsSome' && (
                <div className="custom-input-container" style={{ marginTop: '20px' }}>
                  <textarea
                    value={eventDetails.equipmentNotes || ''}
                    onChange={(e) => updateDjData({
                      equipmentNotes: e.target.value
                    })}
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
                      onChange={(e) => handleAdditionalServicesChange(key, e.target.checked)}
                    />
                    <label htmlFor={key}>{label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Budget & Additional Info
        return (
          <div className='form-grid'>
            <BudgetForm 
              formData={formData}
              setFormData={setFormData}
              category="dj"
            />

            <div className="custom-input-container">
              <label className="custom-label">Manual Budget Range Override</label>
              <select
                className="custom-input"
                value={eventDetails.priceRange || ''}
                onChange={(e) => handleBudgetChange(e.target.value)}
              >
                <option value="">Use recommended budget</option>
                <option value="0-500">$0 - $500</option>
                <option value="500-1000">$500 - $1,000</option>
                <option value="1000-1500">$1,000 - $1,500</option>
                <option value="1500-2000">$1,500 - $2,000</option>
                <option value="2000-2500">$2,000 - $2,500</option>
                <option value="2500-3000">$2,500 - $3,000</option>
                <option value="3000+">$3,000+</option>
              </select>
            </div>

            <div className="custom-input-container">
              <textarea
                value={eventDetails.additionalInfo || ''}
                onChange={(e) => updateDjData({
                  additionalInfo: e.target.value
                })}
                placeholder="Any special requests or additional information DJs should know..."
                className="custom-input"
              />
              <label htmlFor="additionalInfo" className="custom-label">
                Additional Information
              </label>
            </div>

            {/* Summary Section */}
            <div className="request-summary-grid" style={{ marginTop: '20px' }}>
              {/* Performance Duration */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Performance Duration</div>
                <div className="request-info">
                  {formData.commonDetails?.durationUnknown ? 
                    'To be determined' : 
                    formData.commonDetails?.duration ? 
                      `${formData.commonDetails.duration} hours` : 
                      'Not specified'}
                </div>
              </div>

              {/* Equipment Needed */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Equipment Setup</div>
                <div className="request-info">
                  {(() => {
                    switch (formData.eventDetails?.equipmentNeeded) {
                      case 'venueProvided':
                        return 'The venue provides sound and lighting equipment';
                      case 'djBringsAll':
                        return 'The DJ needs to bring all equipment';
                      case 'djBringsSome':
                        return formData.eventDetails.equipmentNotes || 'The DJ needs to bring some equipment';
                      case 'unknown':
                        return 'Equipment requirements to be discussed';
                      default:
                        return 'Not specified';
                    }
                  })()}
                </div>
              </div>

              {/* Indoor/Outdoor */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Venue Type</div>
                <div className="request-info">
                  {formData.eventDetails?.indoorOutdoor || 'Not specified'}
                </div>
              </div>

              {/* Music Style Preferences */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Music Preferences</div>
                <div className="request-info">
                  {(() => {
                    const musicPreferences = formData.eventDetails?.musicPreferences || {};
                    const selectedStyles = Object.keys(musicPreferences)
                      .filter(key => musicPreferences[key])
                      .map(key => {
                        const labels = {
                          top40: 'Top 40',
                          hiphop: 'Hip Hop',
                          house: 'House',
                          latin: 'Latin',
                          rock: 'Rock',
                          classics: 'Classics',
                          country: 'Country',
                          jazz: 'Jazz',
                          rb: 'R&B',
                          edm: 'EDM',
                          pop: 'Pop',
                          international: 'International'
                        };
                        return labels[key];
                      });
                    return selectedStyles.length > 0 ? selectedStyles.join(', ') : 'No preferences specified';
                  })()}
                </div>
              </div>

              {/* Budget Range */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Budget Range</div>
                <div className="request-info">
                  {(() => {
                    const priceRange = formData.eventDetails?.priceRange;
                    const ranges = {
                      '0-500': '$0 - $500',
                      '500-1000': '$500 - $1,000',
                      '1000-1500': '$1,000 - $1,500',
                      '1500-2000': '$1,500 - $2,000',
                      '2000-2500': '$2,000 - $2,500',
                      '2500-3000': '$2,500 - $3,000',
                      '3000+': '$3,000+'
                    };
                    return priceRange ? ranges[priceRange] : 'Not specified';
                  })()}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dj-stepper">
      <div className="dj-stepper-content">
        {renderSubStep()}
      </div>
    </div>
  );
}

export default DjStepper; 