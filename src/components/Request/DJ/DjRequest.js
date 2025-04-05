import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import { supabase } from '../../../supabaseClient';
import { Spinner } from 'react-bootstrap';
import SignInModal from '../Event/SignInModal';
import StatusBar from '../StatusBar';  // Add this import
import { v4 as uuidv4 } from 'uuid';
import 'react-quill/dist/quill.snow.css';
import '../../../styles/Photography.css';
import AuthModal from '../Authentication/AuthModal';

const PhotoGrid = ({ photos, removePhoto, openModal }) => {
    return (
        <div className="photo-grid">
            {photos.map((photo, index) => (
                <div key={index} className="photo-grid-item">
                    <img src={photo.url} alt={`Uploaded ${index}`} className="photo-grid-image" onClick={() => openModal(photo)} />
                    <button className="remove-photo-button" onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(index);
                    }}>X</button>
                </div>
            ))}
        </div>
    );
};

const PhotoModal = ({ photo, onClose }) => {
    if (!photo) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-photo" onClick={e => e.stopPropagation()}>
                <button 
                    className="remove-photo-button" 
                    style={{ position: 'absolute', right: '10px', top: '10px' }}
                    onClick={onClose}
                >
                    X
                </button>
                <img src={photo.url} alt="Full size" />
            </div>
        </div>
    );
};

const BidScoreIndicator = ({ score, message }) => (
    <div className="bid-score-container">
        <div className="score-circle" style={{
            background: `conic-gradient(#A328F4 ${score}%, #f0f0f0 ${score}%)`
        }}>
            <span>{score}%</span>
        </div>
        {message && <div className="score-message">{message}</div>}
    </div>
);

function DjRequest() {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const formRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingPhotoUrl, setDeletingPhotoUrl] = useState(null);
    const [uploadingFiles, setUploadingFiles] = useState(0);
    const [addMoreLoading, setAddMoreLoading] = useState(false);
    const [detailsSubStep, setDetailsSubStep] = useState(0);
    const [vendorId, setVendorId] = useState(location.state?.vendor?.id || null);
    const [selectedVendor, setSelectedVendor] = useState(location.state?.vendor || null);
    const [vendorImage, setVendorImage] = useState(location.state?.image || null);
    const [bidScore, setBidScore] = useState(0);
    const [scoreMessage, setScoreMessage] = useState('');
    const [earnedCoupon, setEarnedCoupon] = useState(false);

    // Consolidated state
    const [formData, setFormData] = useState(() => {
        const saved = JSON.parse(localStorage.getItem('djRequest') || '{}');
        const defaultWeddingDetails = {
            ceremony: false,    
            cocktailHour: false,
            reception: false,
            afterParty: false
        };

        return {
            eventType: saved.eventType || '',
            eventDetails: {
                eventTitle: saved.eventDetails?.eventTitle || '',
                location: saved.eventDetails?.location || '',
                dateType: saved.eventDetails?.dateType || 'specific',
                startDate: saved.eventDetails?.startDate || '',
                endDate: saved.eventDetails?.endDate || '',
                timeOfDay: saved.eventDetails?.timeOfDay || '',
                numPeople: saved.eventDetails?.numPeople || '',
                duration: saved.eventDetails?.duration || '',
                indoorOutdoor: saved.eventDetails?.indoorOutdoor || '',
                additionalComments: saved.eventDetails?.additionalComments || '',
                priceRange: saved.eventDetails?.priceRange || '',
                weddingDetails: saved.eventDetails?.weddingDetails || defaultWeddingDetails,
                startTime: saved.eventDetails?.startTime || '',
                endTime: saved.eventDetails?.endTime || '',
                stylePreferences: saved.eventDetails?.stylePreferences || {},
                musicPreferences: saved.eventDetails?.musicPreferences || {},
                equipment: saved.eventDetails?.equipment || {},
                specialSongs: saved.eventDetails?.specialSongs || '',
                additionalInfo: saved.eventDetails?.additionalInfo || '',
                dateFlexibility: saved.eventDetails?.dateFlexibility || 'specific', // 'specific', 'range', 'flexible'
                dateTimeframe: saved.eventDetails?.dateTimeframe || '', // '3months', '6months', '1year'
                startTimeUnknown: saved.eventDetails?.startTimeUnknown || false,
                endTimeUnknown: saved.eventDetails?.endTimeUnknown || false,
                durationUnknown: saved.eventDetails?.durationUnknown || false,
                numPeopleUnknown: saved.eventDetails?.numPeopleUnknown || false,
                pinterestBoard: saved.eventDetails?.pinterestBoard || '',
                priceQualityPreference: saved.eventDetails?.priceQualityPreference || "2"
            },
            personalDetails: saved.personalDetails || {
                firstName: '',
                lastName: '',
                phoneNumber: ''
            },
            photos: saved.photos || []
        };
    });

    const getSteps = () => [
        'DJ Details',
        formData.eventType ? `${formData.eventType} Details` : 'Event Details',
        'Personal Details',
        'Music Preferences',  // Changed from 'Music Preferences'
        'Review'
    ];

    const getDetailsSubSteps = () => {
        switch (formData.eventType) {
            case 'Wedding':
                return [
                    'Basic Details',
                    'Coverage',
                    'Equipment & Add-ons',
                    'Budget & Additional Info'
                ];

            default:
                return ['Basic Info', 'Coverage', 'Music & Equipment', 'Additional Details'];
        }
    };

    const handleEventSelect = (event) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                eventType: event
            };

            // Update budget recommendation when event type changes
            const preference = newData.eventDetails.priceQualityPreference || "2";
            const recommendation = getBudgetRecommendation(
                preference,
                event,
                newData.eventDetails
            )[preference].range;

            newData.eventDetails.priceRange = recommendation;
            
            localStorage.setItem('djRequest', JSON.stringify(newData));
            setTimeout(() => updateBidScore(), 0);
            return newData;
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            
            // List of fields that should trigger budget recalculation
            const budgetTriggerFields = [
                'duration',
                'numPeople',
                'equipment',
                'weddingDetails',
                'musicPreferences'
            ];

            // Only update budget recommendation if:
            // 1. It's an eventDetails update
            // 2. Contains relevant fields
            // 3. Not a manual budget selection
            if (field === 'eventDetails' && 
                Object.keys(value).some(key => budgetTriggerFields.includes(key)) &&
                !value.manualBudget) {
                const preference = newData.eventDetails.priceQualityPreference || "2";
                const recommendation = getBudgetRecommendation(
                    preference,
                    newData.eventType,
                    value
                )[preference].range;

                newData.eventDetails.priceRange = recommendation;
            }

            // Remove the manualBudget flag after using it
            if (field === 'eventDetails' && newData.eventDetails.manualBudget) {
                delete newData.eventDetails.manualBudget;
            }

            localStorage.setItem('djRequest', JSON.stringify(newData));
            setTimeout(() => updateBidScore(), 0);
            return newData;
        });
    };

    // Event Selection Component
    const renderEventSelection = () => {
        const eventOptions = [
            'Wedding', 'Corporate Event', 'Birthday', 'School Dance', 'Club Event', 'Quinceñera', 'Other'
        ];

        return (
            <div className="event-grid-container">
                {eventOptions.map((event, index) => (
                    <button
                        key={index}
                        className={`selector-buttons ${formData.eventType === event ? 'selected-event' : ''}`}
                        onClick={() => handleEventSelect(event)}
                    >
                        {event}
                    </button>
                ))}
            </div>
        );
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ]
    };

    const renderEventDetailsSubStep = () => {
        switch (detailsSubStep) {
            case 0: // Basic Wedding Details
                return (
                    <div className='form-grid'>
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="location"
                                value={formData.eventDetails.location}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    location: e.target.value
                                })}
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
                                value={formData.eventDetails.dateFlexibility}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    dateFlexibility: e.target.value
                                })}
                                className="custom-input"
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                                <option value="flexible">I'm Flexible</option>
                            </select>
                            <label htmlFor="dateFlexibility" className="custom-label">
                                Date Flexibility
                            </label>
                        </div>

                        {formData.eventDetails.dateFlexibility === 'specific' && (
                            <div className="custom-input-container">
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.eventDetails.startDate}
                                    onChange={(e) => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        startDate: e.target.value
                                    })}
                                    className="custom-input"
                                />
                                <label htmlFor="startDate" className="custom-label">
                                    Event Date
                                </label>
                            </div>
                        )}

                        {formData.eventDetails.dateFlexibility === 'range' && (
                            <>
                                <div className="custom-input-container">
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.eventDetails.startDate}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            startDate: e.target.value
                                        })}
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
                                        value={formData.eventDetails.endDate}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            endDate: e.target.value
                                        })}
                                        className="custom-input"
                                    />
                                    <label htmlFor="endDate" className="custom-label">
                                        Latest Date
                                    </label>
                                </div>
                            </>
                        )}

                        {formData.eventDetails.dateFlexibility === 'flexible' && (
                            <div className="custom-input-container">
                                <select
                                    name="dateTimeframe"
                                    value={formData.eventDetails.dateTimeframe}
                                    onChange={(e) => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        dateTimeframe: e.target.value
                                    })}
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

                        {/* Rest of the time inputs */}
                        <div style={{display:'flex', justifyContent:'space-between', gap:'8px'}}>
                        <div className="custom-input-container">
                            <div className="input-with-unknown">
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.eventDetails.startTime}
                                    onChange={(e) => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        startTime: e.target.value,
                                        startTimeUnknown: false
                                    })}
                                    className="custom-input"
                                    disabled={formData.eventDetails.startTimeUnknown}
                                />
                                <label className="unknown-checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={formData.eventDetails.startTimeUnknown}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            startTime: '',
                                            startTimeUnknown: e.target.checked
                                        })}
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
                                    value={formData.eventDetails.endTime}
                                    onChange={(e) => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        endTime: e.target.value,
                                        endTimeUnknown: false
                                    })}
                                    className="custom-input"
                                    disabled={formData.eventDetails.endTimeUnknown}
                                />
                                <label className="unknown-checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={formData.eventDetails.endTimeUnknown}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            endTime: '',
                                            endTimeUnknown: e.target.checked
                                        })}
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
                                value={formData.eventDetails.indoorOutdoor}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    indoorOutdoor: e.target.value
                                })}
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
                    </div>
                );

            case 1: // Coverage Preferences
                return (
                    <div className="wedding-details-container">
                        {formData.eventType === 'Wedding' && (
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
                                                checked={formData.eventDetails.weddingDetails?.[key] || false}
                                                onChange={(e) => handleInputChange('eventDetails', {
                                                    ...formData.eventDetails,
                                                    weddingDetails: {
                                                        ...formData.eventDetails.weddingDetails,
                                                        [key]: e.target.checked
                                                    }
                                                })}
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
                                    value={formData.eventDetails.duration}
                                    onChange={(e) => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        duration: e.target.value,
                                        durationUnknown: false
                                    })}
                                    className="custom-input"
                                    disabled={formData.eventDetails.durationUnknown}
                                    min="1"
                                />
                                <label className="unknown-checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={formData.eventDetails.durationUnknown}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            duration: '',
                                            durationUnknown: e.target.checked
                                        })}
                                    />
                                    <span className="unknown-checkbox-label">Not sure</span>
                                </label>
                            </div>
                            <label htmlFor="duration" className="custom-label">
                                Hours of Coverage Needed
                            </label>
                        </div>

                        <div className="custom-input-container">
                            <div className="input-with-unknown">
                                <input
                                    type="number"
                                    name="numPeople"
                                    value={formData.eventDetails.numPeople}
                                    onChange={(e) => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        numPeople: e.target.value,
                                        numPeopleUnknown: false
                                    })}
                                    className="custom-input"
                                    disabled={formData.eventDetails.numPeopleUnknown}
                                    min="1"
                                />
                                <label className="unknown-checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={formData.eventDetails.numPeopleUnknown}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            numPeople: '',
                                            numPeopleUnknown: e.target.checked
                                        })}
                                    />
                                    <span className="unknown-checkbox-label">Not sure</span>
                                </label>
                            </div>
                            <label htmlFor="numPeople" className="custom-label">
                                Expected Number of People
                            </label>
                        </div>
                    </div>
                );

            case 2: // Music & Equipment
                return (
                    <div className="wedding-details-container">
                        <div className="wedding-photo-options">
                            <div className='photo-options-header'>Equipment Requirements</div>
                            <div className="equipment-options">
                                <button
                                    className={`equipment-option-button ${formData.eventDetails.equipmentNeeded === 'venueProvided' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        equipmentNeeded: 'venueProvided'
                                    })}
                                >
                                    ✅ The venue provides sound and lighting equipment
                                </button>
                                <button
                                    className={`equipment-option-button ${formData.eventDetails.equipmentNeeded === 'djBringsAll' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        equipmentNeeded: 'djBringsAll'
                                    })}
                                >
                                    🎵 The DJ needs to bring all equipment
                                </button>
                                <button
                                    className={`equipment-option-button ${formData.eventDetails.equipmentNeeded === 'djBringsSome' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        equipmentNeeded: 'djBringsSome'
                                    })}
                                >
                                    🎛️ The DJ needs to bring some equipment
                                </button>
                                <button
                                    className={`equipment-option-button ${formData.eventDetails.equipmentNeeded === 'unknown' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        equipmentNeeded: 'unknown'
                                    })}
                                >
                                    ❓ I'm not sure about the equipment requirements
                                </button>
                            </div>

                            {formData.eventDetails.equipmentNeeded === 'djBringsSome' && (
                                <div className="custom-input-container" style={{ marginTop: '20px' }}>
                                    <ReactQuill
                                        value={formData.eventDetails.equipmentNotes || ''}
                                        onChange={(content) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            equipmentNotes: content
                                        })}
                                        modules={modules}
                                        placeholder="Please specify what equipment the DJ needs to bring..."
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
                                            checked={formData.eventDetails.additionalServices?.[key] || false}
                                            onChange={(e) => handleInputChange('eventDetails', {
                                                ...formData.eventDetails,
                                                additionalServices: {
                                                    ...formData.eventDetails.additionalServices,
                                                    [key]: e.target.checked
                                                }
                                            })}
                                        />
                                        <label htmlFor={key}>{label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 3: // Budget & Additional Info
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
                                value={formData.eventDetails.priceQualityPreference || "2"}
                                onChange={(e) => {
                                    const newPreference = e.target.value;
                                    const recommendation = getBudgetRecommendation(
                                        newPreference,
                                        formData.eventType,
                                        formData.eventDetails
                                    )[newPreference].range;

                                    handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        priceQualityPreference: newPreference,
                                        priceRange: recommendation
                                    });
                                }}
                                className="price-quality-slider"
                            />
                            <div className="preference-description">
                                <div className="preference-detail">
                                    {formData.eventDetails.priceQualityPreference === "1" && (
                                        <p>👉 Focus on finding budget-friendly DJ options while maintaining good quality</p>
                                    )}
                                    {formData.eventDetails.priceQualityPreference === "2" && (
                                        <p>Balanced approach to quality and budget</p>
                                    )}
                                    {formData.eventDetails.priceQualityPreference === "3" && (
                                        <>
                                            <p>👉 Priority on premium DJ services and equipment</p>
                                            <p>👉 Access to experienced DJs with top-tier setups</p>
                                            <p>👉 Ideal for those seeking the best entertainment experience</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        

                        {formData.eventType && (
                            <div className="budget-guidance-container">
                                <div className="budget-insights">
                                    <div className="budget-recommendation">
                                        {getBudgetRecommendation(
                                            formData.eventDetails.priceQualityPreference || "2",
                                            formData.eventType,
                                            formData.eventDetails
                                        )[formData.eventDetails.priceQualityPreference || "2"].message}
                                    </div>
                                    <div className="budget-insight-header">This recommendation is based on:</div>
                                    <div className="budget-insight-details">
                                        {getBudgetRecommendation(
                                            formData.eventDetails.priceQualityPreference || "2",
                                            formData.eventType,
                                            formData.eventDetails
                                        )[formData.eventDetails.priceQualityPreference || "2"].analysis.factors.map((factor, index) => (
                                            <div key={index} className="insight-item">
                                                <span className="insight-icon">•</span>
                                                <span className="insight-text">{factor}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {formData.eventDetails.priceQualityPreference === "1" && (
                                        <div className="insight-warning">
                                            <span>⚠️</span>
                                            <span>This is a budget-conscious estimate. Quality and services may be limited.</span>
                                        </div>
                                    )}
                                    {formData.eventDetails.priceQualityPreference === "3" && (
                                        <div className="insight-warning" style={{backgroundColor: '#e8f5e9', color: '#2e7d32'}}>
                                            <span>✨</span>
                                            <span>This premium estimate ensures access to top-tier DJs and equipment.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        
                        )}
                        </div>

                        <div className="custom-input-container required">
                            <select
                                name="priceRange"
                                value={formData.eventDetails.priceRange || ''}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    priceRange: e.target.value,
                                    manualBudget: true
                                })}
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
                            <ReactQuill
                                value={formData.eventDetails.additionalInfo || ''}
                                onChange={(content) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    additionalInfo: content
                                })}
                                modules={modules}
                                placeholder="Any special requests or additional information DJs should know..."
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

    const renderEventDetails = () => {
        const subSteps = getDetailsSubSteps();
        
        return (
            <div>
                {error && (
                    <div style={{ textAlign: 'center', color: 'red', padding: '10px' }}>
                        {error}
                    </div>
                )}
                <div className="sub-steps-indicator">
                    {subSteps.map((step, index) => (
                        <div
                            key={index}
                            className={`sub-step ${index === detailsSubStep ? 'active' : ''} 
                                      ${index < detailsSubStep ? 'completed' : ''}`}
                            onClick={() => setDetailsSubStep(index)}
                        >
                            {step}
                        </div>
                    ))}
                </div>
                
                {renderEventDetailsSubStep()}
            </div>
        );
    };

    // Personal Details Component
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (currentStep === 2) { // Personal Details step
                setLoading(true);
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: userData, error: userError } = await supabase
                            .from('individual_profiles')
                            .select('first_name, last_name, phone')
                            .eq('id', user.id)
                            .single();

                        if (userError) throw userError;

                        setFormData(prev => ({
                            ...prev,
                            personalDetails: {
                                firstName: userData.first_name || '',
                                lastName: userData.last_name || '',
                                phoneNumber: userData.phone || ''
                            }
                        }));
                    }
                } catch (err) {
                    setError('Error loading user information');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserInfo();
    }, [currentStep]);

    const renderPersonalDetails = () => {
        if (loading) {
            return (
                <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:"45vh"}}>
                    <Spinner />
                </div>
            );
        }

        if (error) {
            return (
                <div style={{textAlign: 'center', color: 'red', padding: '20px'}}>
                    {error}
                </div>
            );
        }

        return (
            <form style={{minWidth:'100%'}}>
                <div style={{justifyContent:'center',alignItems:'center',display:'flex', height:"45vh"}}>
                    <div>
                        <p className="Sign-Up-Page-Subheader" style={{textAlign:'center', marginBottom:'20px'}}>
                            Please confirm your details below
                        </p>
                        <div className='custom-input-container'>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.personalDetails.firstName}
                                onChange={(e) => handleInputChange('personalDetails', {
                                    ...formData.personalDetails,
                                    firstName: e.target.value
                                })}
                                className='custom-input'
                            />
                            <label htmlFor="firstName" className="custom-label">
                                First Name
                            </label>
                        </div>
                        <div className='custom-input-container'>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.personalDetails.lastName}
                                onChange={(e) => handleInputChange('personalDetails', {
                                    ...formData.personalDetails,
                                    lastName: e.target.value
                                })}
                                className='custom-input'
                            />
                            <label htmlFor="lastName" className="custom-label">
                                Last Name
                            </label>
                        </div>
                        <div className='custom-input-container'>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.personalDetails.phoneNumber}
                                onChange={(e) => handleInputChange('personalDetails', {
                                    ...formData.personalDetails,
                                    phoneNumber: e.target.value
                                })}
                                className='custom-input'
                            />
                            <label htmlFor="phoneNumber" className="custom-label">
                                Phone Number
                            </label>
                        </div>
                    </div>
                </div>
            </form>
        );
    };

    // Photo Upload Component
    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return setError("No file selected");
        
        // Validate file types
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        const invalidFiles = files.filter(file => !validImageTypes.includes(file.type));
        
        if (invalidFiles.length > 0) {
            setError("Please only upload image files (JPEG, PNG, GIF, WEBP)");
            return;
        }
        
        setLoading(true);
        setAddMoreLoading(true);
        
        try {
            const newPhotos = files.map(file => ({
                file: file,
                url: URL.createObjectURL(file),
                name: file.name,
                type: file.type
            }));
            
            // Update local state first
            setFormData(prev => {
                const updatedPhotos = [...prev.photos, ...newPhotos];
                const newData = { ...prev, photos: updatedPhotos };
                localStorage.setItem('djRequest', JSON.stringify(newData));
                return newData;
            });
            
        } catch (err) {
            console.error("Error processing files:", err);
            setError(err.message);
        } finally {
            setLoading(false);
            setAddMoreLoading(false);
        }
    };
    
    const handleRemovePhoto = async (photoUrl) => {
        try {
            setDeletingPhotoUrl(photoUrl);
            const filePathMatch = photoUrl.match(/request-media\/(.+)/);
            if (!filePathMatch) {
                console.error('Invalid file path:', photoUrl);
                return;
            }
    
            const filePath = filePathMatch[1];
    
            const { error: storageError } = await supabase
                .storage
                .from('request-media')
                .remove([filePath]);
    
            if (storageError) {
                console.error('Storage deletion error:', storageError);
                return;
            }
    
            const { error: dbError } = await supabase
                .from('event_photos')
                .delete()
                .match({ photo_url: photoUrl });
    
            if (dbError) {
                console.error('Database deletion error:', dbError);
                return;
            }
    
            setFormData(prev => {
                const updatedPhotos = prev.photos.filter(photo => photo.url !== photoUrl);
                const newData = { ...prev, photos: updatedPhotos };
                localStorage.setItem('djRequest', JSON.stringify(newData));
                return newData;
            });
        } catch (error) {
            console.error('Error in removal process:', error);
        } finally {
            setDeletingPhotoUrl(null);
        }
    };
    
    const renderRemoveButton = (photo) => {
        return (
            <div 
                className="remove-photo-overlay" 
                style={{color:'black'}}
                onClick={() => handleRemovePhoto(photo.url)}
            >
                {deletingPhotoUrl === photo.url ? (
                    <div>
                        <Spinner />
                    </div>
                ) : (
                    '×'
                )}
            </div>
        );
    };
    
    const renderPhotoUpload = () => {
        return (
            <div className="wedding-details-container">
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
                                    checked={formData.eventDetails.musicPreferences?.[key] || false}
                                    onChange={(e) => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        musicPreferences: {
                                            ...formData.eventDetails.musicPreferences,
                                            [key]: e.target.checked
                                        }
                                    })}
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
                        value={formData.eventDetails.playlist || ''}
                        onChange={(e) => handleInputChange('eventDetails', {
                            ...formData.eventDetails,
                            playlist: e.target.value
                        })}
                        placeholder="Paste your Spotify/Apple Music playlist link here"
                        className="custom-input"
                    />
                    <label htmlFor="playlist" className="custom-label">
                        Music Playlist Link
                    </label>
                </div>

                <div className="custom-input-container">
                    <ReactQuill
                        value={formData.eventDetails.specialSongs || ''}
                        onChange={(content) => handleInputChange('eventDetails', {
                            ...formData.eventDetails,
                            specialSongs: content
                        })}
                        modules={modules}
                        placeholder="List any must-play songs or specific tracks for key moments..."
                    />
                    <label htmlFor="specialSongs" className="custom-label">
                        Special Song Requests
                    </label>
                </div>
            </div>
        );
    };

    // Summary Component
    const renderSummary = () => {
        const { score } = calculateBidScore(formData);
        
                    return (
            <div className="event-summary-container" style={{padding:'0'}}>
                {score >= 80 && !earnedCoupon && (
                    <div className="coupon-earned-section">
                        <h3>🎉 You've Earned a Reward!</h3>
                        <p>For providing detailed information, you've earned a $25 coupon that will be automatically applied to your request.</p>
                        <button 
                            className="apply-coupon-btn" 
                            onClick={() => {
                                setEarnedCoupon(true);
                                handleEarnedCoupon();
                            }}
                        >
                            Apply Coupon
                        </button>
                            </div>
                )}
                
                {earnedCoupon && (
                    <div className="coupon-earned-section">
                        <h3>✅ Coupon Applied!</h3>
                        <p>Your $25 discount will be applied to your request.</p>
                        </div>
                )}

                <div className="request-summary-grid">
                    {/* Basic Event Information */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Event Type</div>
                        <div className="request-info">{formData.eventType}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Location</div>
                        <div className="request-info">{formData.eventDetails.location || 'Not specified'}</div>
                    </div>

                    {/* Timing Information */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Event Time</div>
                        <div className="request-info">
                            {formData.eventDetails.startTimeUnknown ? 'Start time TBD' : `From: ${formData.eventDetails.startTime || 'Not specified'}`}
                            <br />
                            {formData.eventDetails.endTimeUnknown ? 'End time TBD' : `To: ${formData.eventDetails.endTime || 'Not specified'}`}
                        </div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Duration</div>
                        <div className="request-info">
                            {formData.eventDetails.durationUnknown ? 
                                'To be determined' : 
                                formData.eventDetails.duration ? 
                                    `${formData.eventDetails.duration} hours` : 
                                    'Not specified'}
                        </div>
                    </div>

                    {/* Event Details */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Expected Guests</div>
                        <div className="request-info">
                            {formData.eventDetails.numPeopleUnknown ? 
                                'To be determined' : 
                                formData.eventDetails.numPeople ? 
                                    `${formData.eventDetails.numPeople} people` : 
                                    'Not specified'}
                        </div>
                    </div>

                    {/* Equipment Section */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Equipment Setup</div>
                        <div className="request-info">
                            {(() => {
                                switch (formData.eventDetails.equipmentNeeded) {
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

                    {formData.eventDetails.equipmentNeeded === 'djBringsSome' && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <div className="request-subtype">Equipment Details</div>
                            <div className="request-info" dangerouslySetInnerHTML={{ __html: formData.eventDetails.equipmentNotes }} />
                        </div>
                    )}

                    {/* Music Preferences */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Music Preferences</div>
                        <div className="request-info">
                            {Object.keys(formData.eventDetails.musicPreferences || {})
                                .filter(key => formData.eventDetails.musicPreferences[key])
                                .join(', ') || 'No preferences specified'}
                        </div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Playlist Link</div>
                        <div className="request-info">
                            {formData.eventDetails.playlist || 'Not provided'}
                        </div>
                    </div>

                    {/* Add-ons */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Selected Add-ons</div>
                        <div className="request-info">
                            {Object.entries(formData.eventDetails.additionalServices || {})
                                .filter(([_, value]) => value)
                                .map(([key, _]) => {
                                    const service = {
                                        mcServices: '🎤 MC Services',
                                        liveMixing: '🎶 Live Mixing',
                                        uplighting: '🏮 Uplighting',
                                        fogMachine: '🌫️ Fog Machine',
                                        specialFx: '🎇 Special FX',
                                        photoBooth: '📸 Photo Booth',
                                        eventRecording: '🎥 Event Recording',
                                        karaoke: '🎵 Karaoke'
                                    }[key];
                                    return service;
                                })
                                .join(', ') || 'No add-ons selected'}
                        </div>
                    </div>

                    {/* Budget */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Budget Range</div>
                        <div className="request-info">{formData.eventDetails.priceRange || 'Not specified'}</div>
                    </div>

                    {/* Wedding-specific details if applicable */}
                    {formData.eventType === 'Wedding' && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <div className="request-subtype">Wedding Coverage</div>
                            <div className="request-info">
                                {Object.entries(formData.eventDetails.weddingDetails || {})
                                    .filter(([_, value]) => value)
                                    .map(([key, _]) => key.charAt(0).toUpperCase() + key.slice(1))
                                    .join(', ') || 'No specific coverage selected'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Information */}
                {formData.eventDetails.specialSongs && (
                    <div style={{marginTop: '20px'}}>
                        <div className="request-subtype">Special Song Requests</div>
                        <div className="request-info" dangerouslySetInnerHTML={{ __html: formData.eventDetails.specialSongs }} />
                    </div>
                )}

                {formData.eventDetails.additionalInfo && (
                    <div style={{marginTop: '20px'}}>
                        <div className="request-subtype">Additional Information</div>
                        <div className="request-info" dangerouslySetInnerHTML={{ __html: formData.eventDetails.additionalInfo }} />
                    </div>
                )}

                {/* Coupon Section */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px'}}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent:'center' }}>
                        <div className='custom-input-container' style={{marginBottom:'0'}}>
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Enter coupon code"
                                className='custom-input'
                                style={{
                                    backgroundColor: appliedCoupon ? '#f0fff0' : 'white'
                                }}
                            />
                            <label htmlFor="coupon" className="custom-label">
                                Coupon
                            </label>
                        </div>
                        <button
                            onClick={handleApplyCoupon}
                            className="request-form-back-and-foward-btn"
                            style={{ padding: '8px 12px', fontSize: '16px' }}
                            disabled={couponLoading}
                        >
                            {couponLoading ? <Spinner size="sm" /> : 'Verify'}
                        </button>
                    </div>
                    {couponMessage && (
                        <div className={`coupon-message ${appliedCoupon ? 'success' : 'error'}`}>
                            {couponMessage}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode.toUpperCase())
                .eq('valid', true)
                .single();

            if (error) throw error;

            if (data) {
                const expirationDate = new Date(data.expiration_date);
                const now = new Date();

                if (now > expirationDate) {
                    setCouponMessage('This coupon has expired');
                    setAppliedCoupon(null);
                    return;
                }

                setAppliedCoupon(data);
                setCouponMessage(`Coupon applied: $${data.discount_amount} off`);
            } else {
                setCouponMessage('Invalid coupon code');
                setAppliedCoupon(null);
            }
        } catch (err) {
            console.error('Error applying coupon:', err);
            setCouponMessage('Invalid coupon code');
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsModalOpen(true);
                return;
            }

            // Check if the coupon code is already used
            if (appliedCoupon) {
                const { data: existingRequest, error: checkError } = await supabase
                    .from('dj_requests')
                    .select('id')
                    .eq('coupon_code', appliedCoupon.code)
                    .single();

                if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
                    throw checkError;
                }

                if (existingRequest) {
                    setError('This coupon code has already been used.');
                    setIsSubmitting(false);
                    return;
                }
            }

            // Get user's first name for the title
            const { data: userData, error: userError } = await supabase
                .from('individual_profiles')
                .select('first_name')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            // Create title
            const eventTitle = `${userData.first_name}'s ${formData.eventType} DJ Request`;

            // Convert additional_services object to array
            const additionalServicesArray = Object.entries(formData.eventDetails.additionalServices || {})
                .filter(([_, value]) => value)
                .map(([key, _]) => key);

            // Format data according to the table schema
            const requestData = {
                user_id: user.id,
                title: eventTitle,
                event_type: formData.eventType,
                date_flexibility: formData.eventDetails.dateFlexibility,
                start_date: formData.eventDetails.dateFlexibility !== 'flexible' ? formData.eventDetails.startDate : null,
                end_date: formData.eventDetails.dateFlexibility === 'range' ? formData.eventDetails.endDate : null,
                date_timeframe: formData.eventDetails.dateFlexibility === 'flexible' ? formData.eventDetails.dateTimeframe : null,
                event_duration: formData.eventDetails.durationUnknown ? null : 
                              formData.eventDetails.duration ? parseInt(formData.eventDetails.duration) : null,
                estimated_guests: formData.eventDetails.numPeopleUnknown ? null : 
                                formData.eventDetails.numPeople ? parseInt(formData.eventDetails.numPeople) : null,
                location: formData.eventDetails.location,
                music_preferences: formData.eventDetails.musicPreferences || {},
                special_songs: {
                    playlist: formData.eventDetails.playlist || null,
                    requests: formData.eventDetails.specialSongs || null
                },
                budget_range: formData.eventDetails.priceRange,
                equipment_needed: (() => {
                    switch (formData.eventDetails.equipmentNeeded) {
                        case 'venueProvided':
                            return 'The venue provides sound and lighting equipment';
                        case 'djBringsAll':
                            return 'The DJ needs to bring all equipment';
                        case 'djBringsSome':
                            return formData.eventDetails.equipmentNotes || 'The DJ needs to bring some equipment';
                        case 'unknown':
                            return 'Equipment requirements to be discussed';
                        default:
                            return null;
                    }
                })(),
                additional_services: additionalServicesArray, // Now it's an array
                special_requests: formData.eventDetails.additionalInfo,
                status: 'pending',
                coupon_code: appliedCoupon ? appliedCoupon.code : null,  // Add coupon code
                indoor_outdoor: formData.eventDetails.indoorOutdoor, // Ensure indoor_outdoor is included
                vendor_id: vendorId, // Add vendor_id to the request data
            };

            // Insert the request
            const { data: request, error: requestError } = await supabase
                .from('dj_requests')
                .insert([requestData])
                .select()
                .single();

            if (requestError) throw requestError;

            // Clear form data and navigate to success page
            localStorage.removeItem('djRequest');
            navigate('/success-request', { 
                state: { 
                    requestId: request.id,
                    category: 'dj',
                    message: 'Your DJ request has been submitted successfully!'
                } 
            });
        } catch (err) {
            setError('Failed to submit request. Please try again.');
            console.error('Error submitting request:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkAuthentication = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    };

    const updateUserProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { error: updateError } = await supabase
                .from('individual_profiles')
                .update({
                    first_name: formData.personalDetails.firstName,
                    last_name: formData.personalDetails.lastName,
                    phone: formData.personalDetails.phoneNumber
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            return true;
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile information');
            return false;
        }
    };

    const getCurrentComponent = () => {
        const currentSteps = getSteps(); // Get fresh steps array
        switch (currentStep) {
            case 0:
                return renderEventSelection();
            case 1:
                return renderEventDetails();
            case 2:
                return renderPersonalDetails();
            case 3:
                return renderPhotoUpload();
            case 4:
                return renderSummary();
            default:
                return null;
        }
    };

    // Modify the handleBack function to handle sub-steps
    const handleBack = () => {
        if (currentStep === 0) {
            navigate('/request-categories');
        } else if (currentStep === 1 && detailsSubStep > 0) {
            // Handle sub-step navigation
            setDetailsSubStep(prev => prev - 1);
        } else {
            setCurrentStep(prev => prev - 1);
            setDetailsSubStep(0); // Reset sub-step when going back to previous main step
        }
    };

    // Modify the handleNext function to handle sub-steps
    const handleNext = async () => {
        if (currentStep === getSteps().length - 1) {
            handleSubmit();
        } else if (currentStep === 1) {
            const subSteps = getDetailsSubSteps();
            if (detailsSubStep < subSteps.length - 1) {
                // Validate required fields for sub-steps
                if (detailsSubStep === 0 && 
                    (!formData.eventDetails.location || 
                    (formData.eventDetails.dateFlexibility === 'specific' && !formData.eventDetails.startDate) ||
                    (formData.eventDetails.dateFlexibility === 'range' && (!formData.eventDetails.startDate || !formData.eventDetails.endDate)))) {
                    setError('Please fill in all required fields: Location and Date information.');
                    return;
                }
                setDetailsSubStep(prev => prev + 1);
            } else {
                // Validate budget before moving to next main step
                if (!formData.eventDetails.priceRange) {
                    setError('Please fill in the required field: Budget.');
                    return;
                }
                // Move to next main step
                const isAuthenticated = await checkAuthentication();
                if (!isAuthenticated) {
                    setIsAuthModalOpen(true);
                    return;
                }
                setError(null); // Clear error message
                setCurrentStep(prev => prev + 1);
                setDetailsSubStep(0); // Reset sub-step
            }
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleAuthSuccess = () => {
        setIsAuthModalOpen(false);
        setCurrentStep(prev => prev + 1);
    };

    const calculateBidScore = (formData) => {
        let points = 0;
        let maxPoints = 0;
        let breakdown = [];

        // Required core fields (worth more points)
        const coreFields = {
            'Event Type': formData.eventType,
            'Location': formData.eventDetails.location,
            'Date Information': formData.eventDetails.dateFlexibility === 'specific' ? formData.eventDetails.startDate : 
                formData.eventDetails.dateFlexibility === 'range' ? (formData.eventDetails.startDate && formData.eventDetails.endDate) :
                formData.eventDetails.dateTimeframe,
            'Guest Count': formData.eventDetails.numPeople,
            'Budget Range': formData.eventDetails.priceRange
        };

        Object.entries(coreFields).forEach(([field, value]) => {
            maxPoints += 20;
            if (value) {
                points += 20;
                breakdown.push(`✓ ${field}`);
            }
        });

        // Additional details (worth fewer points)
        const additionalFields = {
            'Music Preferences': Object.values(formData.eventDetails.musicPreferences || {}).some(v => v),
            'Equipment Needs': Object.values(formData.eventDetails.equipment || {}).some(v => v),
            'Special Songs': formData.eventDetails.specialSongs,
            'Additional Info': formData.eventDetails.additionalInfo
        };

        Object.entries(additionalFields).forEach(([field, value]) => {
            maxPoints += 5;
            if (value) {
                points += 5;
                breakdown.push(`✓ ${field}`);
            }
        });

        const score = Math.round((points / maxPoints) * 100);
        return { score, breakdown, points, maxPoints };
    };

    const updateBidScore = () => {
        const { score } = calculateBidScore(formData);
        setBidScore(score);
        
        if (score === 100) {
            setScoreMessage('Perfect! All details added');
        } else if (score >= 80) {
            setScoreMessage('Great job!');
        } else if (score >= 60) {
            setScoreMessage('Add details for better matches');
        } else {
            setScoreMessage('More info = better bids');
        }
    };

    const analyzeEventDetails = (eventDetails, eventType) => {
        let basePrice = 500;
        let factors = [];

        // Event type factor with more detail
        if (eventType === 'Wedding') {
            basePrice = 800;
            factors.push('Wedding DJ base package (includes professional MC services)');
        } else {
            factors.push('Standard DJ base package (includes basic MC services)');
        }

        // Duration factor with more detail
        const duration = parseInt(eventDetails.duration) || 4;
        if (duration > 4) {
            basePrice += (duration - 4) * 100;
            factors.push(`Extended duration: ${duration} hours ($100/hour after 4 hours)`);
        } else {
            factors.push(`Standard ${duration}-hour service`);
        }

        // Guest count factor with more detail
        const guestCount = parseInt(eventDetails.numPeople) || 100;
        if (guestCount > 200) {
            basePrice += 200;
            factors.push(`Large event setup (${guestCount}+ guests) - Additional sound coverage needed`);
        } else {
            factors.push(`Standard setup for ${guestCount} guests`);
        }

        // Equipment needs with specific details
        const equipment = eventDetails.equipment || {};
        if (Object.values(equipment).some(v => v)) {
            basePrice += 300;
            const equipmentList = Object.entries(equipment)
                .filter(([_, value]) => value)
                .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
                .join(', ');
            factors.push(`Additional equipment needed: ${equipmentList} (+$300)`);
        }

        // Wedding-specific services with detailed breakdown
        const weddingDetails = eventDetails.weddingDetails || {};
        let serviceCount = Object.values(weddingDetails).filter(v => v).length;
        if (serviceCount > 0) {
            basePrice += serviceCount * 150;
            const services = Object.entries(weddingDetails)
                .filter(([_, value]) => value)
                .map(([key]) => {
                    switch(key) {
                        case 'ceremony': return 'Ceremony music';
                        case 'cocktailHour': return 'Cocktail hour';
                        case 'reception': return 'Reception';
                        case 'afterParty': return 'After party';
                        default: return key;
                    }
                });
            factors.push(`Multiple service periods: ${services.join(', ')} (+$150 each)`);
        }

        // Round to nearest price bracket
        const brackets = [500, 1000, 1500, 2000, 2500, 3000];
        const suggestedRange = brackets.find(b => basePrice <= b) || '3000+';
        
        return {
            suggestedRange: suggestedRange === 3000 ? '3000+' : `${suggestedRange-500}-${suggestedRange}`,
            factors,
            basePrice
        };
    };

    const getBudgetRecommendation = (preference, eventType, eventDetails) => {
        const analysis = analyzeEventDetails(eventDetails, eventType);
        const baseRecommendation = analysis.suggestedRange;

        let adjustedRange = baseRecommendation;
        if (preference === "1") { // Budget-conscious
            const currentMin = parseInt(baseRecommendation.split('-')[0]);
            adjustedRange = currentMin <= 500 ? '0-500' : `${currentMin-500}-${currentMin}`;
        } else if (preference === "3") { // Quality-focused
            const currentMax = baseRecommendation.includes('+') ? 3000 : parseInt(baseRecommendation.split('-')[1]);
            adjustedRange = currentMax >= 3000 ? '3000+' : `${currentMax}-${currentMax+500}`;
        }

        return {
            [preference]: {
                range: adjustedRange,
                message: `Recommended Budget Range: $${adjustedRange}`,
                analysis: {
                    basePrice: analysis.basePrice,
                    factors: analysis.factors
                }
            }
        };
    };

    const handleEarnedCoupon = async () => {
        try {
            const couponCode = `QUALITY${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            
            const { error } = await supabase
                .from('coupons')
                .insert([{
                    code: couponCode,
                    discount_amount: 25,
                    valid: true,
                    expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    description: 'Earned for detailed request completion'
                }]);

            if (error) throw error;

            setCouponCode(couponCode);
            setAppliedCoupon({
                code: couponCode,
                discount_amount: 25
            });
        } catch (err) {
            console.error('Error generating coupon:', err);
        }
    };

    return (
        <div className='request-form-overall-container'>
            {isAuthModalOpen && <AuthModal setIsModalOpen={setIsAuthModalOpen} onSuccess={handleAuthSuccess} />}
            {isModalOpen && <SignInModal setIsModalOpen={setIsModalOpen} />}
            <div className="request-form-status-container desktop-only" style={{ height: '75vh', padding:'40px' }}>
                <div className="request-form-box">
                    <StatusBar steps={getSteps()} currentStep={currentStep} />
                </div>
            </div>  
            {/* Mobile status bar */}
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <div className="request-form-status-container mobile-only">
                    <div className="request-form-box">
                        <StatusBar steps={getSteps()} currentStep={currentStep} />
                    </div>
                </div>
                {/* Status bar container moved above title for desktop */}
                <div className="form-header-section">
                    <h2 className="request-form-header">
                    {getSteps()[currentStep]}
                </h2>
                    <BidScoreIndicator score={bidScore} message={scoreMessage} />
                </div>
                            {/* Display selected vendor information */}
            {selectedVendor && (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
                    <img src={vendorImage} alt={selectedVendor.business_name} className="vendor-profile-image" />
                    <h3 className="selected-vendor-info">{selectedVendor.business_name} will be notified</h3>
                </div>
            )}
                <div className="form-scrollable-content">
                    {getCurrentComponent()}
                </div>

                <div className="form-button-container">
                    <button className="request-form-back-btn" onClick={handleBack} disabled={isSubmitting}>
                        Back
                    </button>
                    <button className="request-form-back-and-foward-btn" onClick={handleNext} disabled={isSubmitting}>
                        {isSubmitting ? <Spinner size="sm" /> : (currentStep === getSteps().length - 1 ? 'Submit' : 'Next')}
                    </button>
                </div>
            </div>


        </div>
    );
}

export default DjRequest;
