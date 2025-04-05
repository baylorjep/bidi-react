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

function CateringRequest() {  // Changed function name
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
    const [selectedVendor, setSelectedVendor] = useState(location.state?.vendor || null); // Get vendor from location state
    const [vendorImage, setVendorImage] = useState(location.state?.image || null);
    const [bidScore, setBidScore] = useState(0);
    const [scoreMessage, setScoreMessage] = useState('');
    const [earnedCoupon, setEarnedCoupon] = useState(false);

    // Consolidated state
    const [formData, setFormData] = useState(() => {
        const saved = JSON.parse(localStorage.getItem('cateringRequest') || '{}');  // Changed key
        const defaultEventDetails = {
            appetizers: false,    
            mainCourse: false,
            desserts: false,
            drinks: false
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
                eventDetails: saved.eventDetails?.eventDetails || defaultEventDetails,
                startTime: saved.eventDetails?.startTime || '',
                endTime: saved.eventDetails?.endTime || '',
                stylePreferences: saved.eventDetails?.stylePreferences || {},
                foodPreferences: saved.eventDetails?.foodPreferences || {},  // Changed to foodPreferences
                equipment: saved.eventDetails?.equipment || {},
                specialRequests: saved.eventDetails?.specialRequests || '',  // Changed to specialRequests
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
        'Catering Details',
        formData.eventType ? `${formData.eventType} Details` : 'Event Details',
        'Personal Details',
        'Food Preferences',  // Changed from 'Music Preferences'
        'Review'
    ];

    const getDetailsSubSteps = () => {
        switch (formData.eventType) {
            case 'Wedding':
                return [
                    'Basic Details',
                    'Logistics & Extra',
                    'Budget & Additional Info'
                ];

            default:
                return ['Basic Info', 'Coverage', 'Food & Equipment', 'Additional Details'];  // Changed to Food & Equipment
        }
    };

    const handleEventSelect = (event) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                eventType: event
            };
            localStorage.setItem('cateringRequest', JSON.stringify(newData));
            setTimeout(() => updateBidScore(), 0);
            return newData;
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            localStorage.setItem('cateringRequest', JSON.stringify(newData));
            setTimeout(() => updateBidScore(), 0);
            return newData;
        });
    };

    // Event Selection Component
    const renderEventSelection = () => {
        const eventOptions = [
            'Wedding', 'Corporate Event', 'Birthday', 'School Event', 'Private Party', 'Other'  // Changed options
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
            case 0: // Basic Event Details
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

                        <div className="custom-input-container">
                            <input
                                type="number"
                                name="numPeople"
                                value={formData.eventDetails.numPeople}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    numPeople: e.target.value
                                })}
                                placeholder='Number of guests'
                                className="custom-input"
                            />
                            <label htmlFor="numPeople" className="custom-label">
                                Number of Guests
                            </label>
                        </div>
                    </div>
                );

      case 1: // Logistics & Extra
                return (
                    <div className="event-details-container" style={{display:'flex', flexDirection:'column', gap:'20px'}}>
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
                                            checked={formData.eventDetails.setupCleanup === key}
                                            onChange={() => handleInputChange('eventDetails', {
                                                ...formData.eventDetails,
                                                setupCleanup: key
                                            })}
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
                                            checked={formData.eventDetails.servingStaff === key}
                                            onChange={() => handleInputChange('eventDetails', {
                                                ...formData.eventDetails,
                                                servingStaff: key
                                            })}
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
                                            checked={formData.eventDetails.diningItems === key}
                                            onChange={() => handleInputChange('eventDetails', {
                                                ...formData.eventDetails,
                                                diningItems: key
                                            })}
                                        />
                                        <label htmlFor={`items_${key}`}>{label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {formData.eventDetails.diningItems === 'partial' && (
                            <div className="custom-input-container">
                                <ReactQuill
                                    value={formData.eventDetails.diningItemsNotes || ''}
                                    onChange={(content) => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        diningItemsNotes: content
                                    })}
                                    modules={modules}
                                    placeholder="Please specify which items you need the caterer to provide..."
                                />
                                <label htmlFor="diningItemsNotes" className="custom-label">
                                    Dining Items Details
                                </label>
                            </div>
                        )}

                        {/* Add this new equipment section before the food service type */}
                        <div className="event-photo-options">
                            <div className='photo-options-header'>Kitchen Equipment Requirements</div>
                            <div className="equipment-options">
                                <button
                                    className={`equipment-option-button ${formData.eventDetails.equipmentNeeded === 'venueProvided' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('eventDetails', {
                                        ...formData.eventDetails, 
                                        equipmentNeeded: 'venueProvided'
                                    })}
                                >
                                    ✅ The venue provides kitchen equipment
                                </button>
                                <button
                                    className={`equipment-option-button ${formData.eventDetails.equipmentNeeded === 'catererBringsAll' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        equipmentNeeded: 'catererBringsAll'
                                    })}
                                >
                                    🍳 The caterer needs to bring all equipment
                                </button>
                                <button
                                    className={`equipment-option-button ${formData.eventDetails.equipmentNeeded === 'catererBringsSome' ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        equipmentNeeded: 'catererBringsSome'
                                    })}
                                >
                                    🔪 The caterer needs to bring some equipment
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

                            {formData.eventDetails.equipmentNeeded === 'catererBringsSome' && (
                                <div className="custom-input-container" style={{ marginTop: '20px' }}>
                                    <ReactQuill
                                        value={formData.eventDetails.equipmentNotes || ''}
                                        onChange={(content) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            equipmentNotes: content
                                        })}
                                        modules={modules}
                                        placeholder="Please specify what equipment the caterer needs to bring..."
                                    />
                                    <label htmlFor="equipmentNotes" className="custom-label">
                                        Equipment Details
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Existing food service type section */}
                        <div className="event-photo-options">
                            <div className='photo-options-header'>Food Service Type</div>
                            <div className="photo-options-grid">
                                {[
                                    { key: 'onSite', label: 'Cooking On-Site' },
                                    { key: 'delivered', label: 'Delivered Ready-to-Serve' },
                                    { key: 'both', label: 'Combination' },
                                    { key: 'flexible', label: 'Flexible' }
                                ].map(({ key, label }) => (
                                    <div key={key} className="photo-option-item">
                                        <input
                                            type="radio"
                                            id={`service_${key}`}
                                            name="foodService"
                                            checked={formData.eventDetails.foodService === key}
                                            onChange={() => handleInputChange('eventDetails', {
                                                ...formData.eventDetails,
                                                foodService: key
                                            })}
                                        />
                                        <label htmlFor={`service_${key}`}>{label}</label>
                                    </div>
                                ))}
                            </div>
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
                                value={formData.eventDetails.priceQualityPreference || "2"}
                                onChange={(e) => {
                                    const newPreference = e.target.value;
                                    const recommendation = getBudgetRecommendation(
                                        newPreference,
                                        formData.eventType,
                                        formData.eventDetails
                                    )[newPreference].range;

                                    // Update both the preference and the price range
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
                                        <p>👉 Focus on finding budget-friendly catering options while maintaining good quality</p>
                                    )}
                                    {formData.eventDetails.priceQualityPreference === "2" && (
                                        <p>Balanced</p>
                                    )}
                                    {formData.eventDetails.priceQualityPreference === "3" && (
                                        <>
                                            <p>👉 Priority on culinary excellence and presentation</p>
                                            <p>👉 Access to premium catering services</p>
                                            <p>👉 Ideal for those seeking exceptional dining experiences</p>
                                        </>
                                    )}
                                </div>
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
                                </div>
                            </div>
                        )}

                        <div className="custom-input-container required">
                            <select
                                name="priceRange"
                                value={formData.eventDetails.priceRange}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    priceRange: e.target.value
                                })}
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
                            <ReactQuill
                                value={formData.eventDetails.additionalInfo || ''}
                                onChange={(content) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    additionalInfo: content
                                })}
                                modules={modules}
                                placeholder="Any special requests or additional information caterers should know..."
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
                localStorage.setItem('cateringRequest', JSON.stringify(newData));
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
                localStorage.setItem('cateringRequest', JSON.stringify(newData));
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
            <div className="event-details-container">
                <div className="event-photo-options">
                    <div className='photo-options-header'>Food Style Preferences</div>
                    <div className="photo-options-grid">
                        {[
                            { key: 'american', label: 'American' },
                            { key: 'mexican', label: 'Mexican' },
                            { key: 'italian', label: 'Italian' },
                            { key: 'chinese', label: 'Chinese' },
                            { key: 'japanese', label: 'Japanese' },
                            { key: 'thai', label: 'Thai' },
                            { key: 'korean', label: 'Korean' },
                            { key: 'vietnamese', label: 'Vietnamese' },
                            { key: 'indian', label: 'Indian' },
                            { key: 'mediterranean', label: 'Mediterranean' },
                            { key: 'greek', label: 'Greek' },
                            { key: 'french', label: 'French' },
                            { key: 'spanish', label: 'Spanish' },
                            { key: 'caribbean', label: 'Caribbean' },
                            { key: 'cajunCreole', label: 'Cajun/Creole' },
                            { key: 'hawaiian', label: 'Hawaiian' },
                            { key: 'middleEastern', label: 'Middle Eastern' },
                            { key: 'turkish', label: 'Turkish' },
                            { key: 'persian', label: 'Persian' },
                            { key: 'african', label: 'African' },
                            { key: 'brazilian', label: 'Brazilian' },
                            { key: 'argentinian', label: 'Argentinian' },
                            { key: 'peruvian', label: 'Peruvian' },
                            { key: 'filipino', label: 'Filipino' },
                            { key: 'german', label: 'German' },
                            { key: 'russian', label: 'Russian' },
                            { key: 'easternEuropean', label: 'Eastern European' },
                            { key: 'veganPlantBased', label: 'Vegan/Plant-Based' },
                            { key: 'bbqSmoked', label: 'BBQ/Smoked Meats' },
                            { key: 'fusion', label: 'Fusion' },
                            { key: 'other', label: 'Other' }
                        ].map(({ key, label }) => (
                            <div key={key} className="photo-option-item">
                                <input
                                    type="checkbox"
                                    id={key}
                                    checked={formData.eventDetails.foodPreferences?.[key] || false}
                                    onChange={(e) => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        foodPreferences: {
                                            ...formData.eventDetails.foodPreferences,
                                            [key]: e.target.checked
                                        }
                                    })}
                                />
                                <label htmlFor={key}>{label}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="custom-input-container">
                    <ReactQuill
                        value={formData.eventDetails.specialRequests || ''}
                        onChange={(content) => handleInputChange('eventDetails', {
                            ...formData.eventDetails,
                            specialRequests: content
                        })}
                        modules={modules}
                        placeholder="List any special dietary requirements or specific requests..."
                    />
                    <label htmlFor="specialRequests" className="custom-label">
                        Special Requests
                    </label>
                </div>
            </div>
        );
    };

    // Summary Component
    const renderSummary = () => {
        const { score } = calculateBidScore(formData);

        const renderDateInfo = () => {
            switch (formData.eventDetails.dateFlexibility) {
                case 'specific':
                    return (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <div className="request-subtype">Event Date</div>
                            <div className="request-info">
                                {formData.eventDetails.startDate ? new Date(formData.eventDetails.startDate).toLocaleDateString() : 'Not specified'}
                            </div>
                        </div>
                    );
                case 'range':
                    return (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <div className="request-subtype">Date Range</div>
                            <div className="request-info">
                                {`${formData.eventDetails.startDate ? new Date(formData.eventDetails.startDate).toLocaleDateString() : 'Not specified'} - ${formData.eventDetails.endDate ? new Date(formData.eventDetails.endDate).toLocaleDateString() : 'Not specified'}`}
                            </div>
                        </div>
                    );
                case 'flexible':
                    return (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <div className="request-subtype">Preferred Timeframe</div>
                            <div className="request-info">
                                {formData.eventDetails.dateTimeframe === '3months' && 'Within 3 months'}
                                {formData.eventDetails.dateTimeframe === '6months' && 'Within 6 months'}
                                {formData.eventDetails.dateTimeframe === '1year' && 'Within 1 year'}
                                {formData.eventDetails.dateTimeframe === 'more' && 'More than 1 year'}
                                {!formData.eventDetails.dateTimeframe && 'Not specified'}
                            </div>
                        </div>
                    );
                default:
                    return null;
            }
        };

        return (
            <div className="event-summary-container" style={{padding:'0'}}>
                {/* Coupon reward section */}
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

                {/* Basic Details */}
                <div className="request-summary-grid">
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Event Type</div>
                        <div className="request-info">{formData.eventType || 'Not specified'}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Location</div>
                        <div className="request-info">{formData.eventDetails.location || 'Not specified'}</div>
                    </div>

                    {renderDateInfo()}

                    {/* Service Type */}
                    <div className="summary-item">
                        <div className="request-subtype">Service Type</div>
                        <div className="request-info">
                            {(() => {
                                switch(formData.eventDetails.foodService) {
                                    case 'onSite': return 'Cooking On-Site';
                                    case 'delivered': return 'Delivered Ready-to-Serve';
                                    case 'both': return 'Combination';
                                    case 'flexible': return 'Flexible';
                                    default: return 'Not specified';
                                }
                            })()}
                        </div>
                    </div>

                    {/* Timing Information */}
                    <div className="summary-item">
                        <div className="request-subtype">Event Time</div>
                        <div className="request-info">
                            {formData.eventDetails.startTimeUnknown ? 'Start time TBD' : `From: ${formData.eventDetails.startTime || 'Not specified'}`}
                            <br />
                            {formData.eventDetails.endTimeUnknown ? 'End time TBD' : `To: ${formData.eventDetails.endTime || 'Not specified'}`}
                        </div>
                    </div>

                    {/* Guest Count */}
                    <div className="summary-item">
                        <div className="request-subtype">Expected Guests</div>
                        <div className="request-info">
                            {formData.eventDetails.numPeopleUnknown ? 
                                'To be determined' : 
                                formData.eventDetails.numPeople ? 
                                    `${formData.eventDetails.numPeople} people` : 
                                    'Not specified'}
                        </div>
                    </div>

                    {/* Food Preferences */}
                    <div className="summary-item">
                        <div className="request-subtype">Food Preferences</div>
                        <div className="request-info">
                            {Object.entries(formData.eventDetails.foodPreferences || {})
                                .filter(([_, value]) => value)
                                .map(([key, _]) => {
                                    return key
                                        .replace(/([A-Z])/g, ' $1')
                                        .replace(/^./, str => str.toUpperCase())
                                })
                                .join(', ') || 'No preferences specified'}
                        </div>
                    </div>

                    {/* Equipment Needs */}
                    {Object.values(formData.eventDetails.equipment || {}).some(v => v) && (
                        <div className="summary-item">
                            <div className="request-subtype">Equipment Needs</div>
                            <div className="request-info">
                                {Object.entries(formData.eventDetails.equipment)
                                    .filter(([_, value]) => value)
                                    .map(([key, _]) => key
                                        .replace(/([A-Z])/g, ' $1')
                                        .replace(/^./, str => str.toUpperCase())
                                    )
                                    .join(', ')}
                            </div>
                        </div>
                    )}

                    {/* Budget */}
                    <div className="summary-item">
                        <div className="request-subtype">Budget Range</div>
                        <div className="request-info">{formData.eventDetails.priceRange || 'Not specified'}</div>
                    </div>
                </div>

                {/* Special Requests Section */}
                {formData.eventDetails.specialRequests && (
                    <div className="summary-section" style={{marginTop: '20px'}}>
                        <div className="request-subtype">Special Requests</div>
                        <div className="request-info" dangerouslySetInnerHTML={{ __html: formData.eventDetails.specialRequests }} />
                    </div>
                )}

                {/* Additional Information Section */}
                {formData.eventDetails.additionalInfo && (
                    <div className="summary-section" style={{marginTop: '20px'}}>
                        <div className="request-subtype">Additional Information</div>
                        <div className="request-info" dangerouslySetInnerHTML={{ __html: formData.eventDetails.additionalInfo }} />
                    </div>
                )}

                {/* Manual Coupon Section */}
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
                    .from('catering_requests')
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
            const eventTitle = `${userData.first_name}'s ${formData.eventType} Catering Request`;

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
                date_timeframe: formData.eventDetails.dateFlexibility === 'flexible' ? formData.eventDetails.dateTimeframe : null,
                start_date: formData.eventDetails.dateFlexibility !== 'flexible' ? formData.eventDetails.startDate : null,
                end_date: formData.eventDetails.dateFlexibility === 'range' ? formData.eventDetails.endDate : null,
                event_duration: formData.eventDetails.durationUnknown ? null : 
                              formData.eventDetails.duration ? parseInt(formData.eventDetails.duration) : null,
                estimated_guests: formData.eventDetails.numPeopleUnknown ? null : 
                                formData.eventDetails.numPeople ? parseInt(formData.eventDetails.numPeople) : null,
                location: formData.eventDetails.location,
                food_preferences: formData.eventDetails.foodPreferences || {},
                setup_cleanup: formData.eventDetails.setupCleanup || null,
                food_service_type: formData.eventDetails.foodService || null,
                serving_staff: formData.eventDetails.servingStaff || null,
                dining_items: formData.eventDetails.diningItems || null,
                dining_items_notes: formData.eventDetails.diningItemsNotes || null,
                special_requests: formData.eventDetails.specialRequests || null,
                additional_info: formData.eventDetails.additionalInfo || null,
                budget_range: formData.eventDetails.priceRange,
                equipment_needed: formData.eventDetails.equipmentNeeded ? (() => {
                    switch (formData.eventDetails.equipmentNeeded) {
                        case 'venueProvided':
                            return 'The venue provides kitchen equipment';
                        case 'catererBringsAll':
                            return 'The caterer needs to bring all equipment';
                        case 'catererBringsSome':
                            return formData.eventDetails.equipmentNotes || 'The caterer needs to bring some equipment';
                        case 'unknown':
                            return 'Equipment requirements to be discussed';
                        default:
                            return null;
                    }
                })() : null,
                status: 'pending',
                coupon_code: appliedCoupon ? appliedCoupon.code : null,
                vendor_id: selectedVendor?.id, // Add vendor_id to the request data
            };

            // Insert the request
            const { data: request, error: requestError } = await supabase
                .from('catering_requests')
                .insert([requestData])
                .select()
                .single();

            if (requestError) throw requestError;

            // Clear form data and navigate to success page
            localStorage.removeItem('cateringRequest');
            navigate('/success-request', { 
                state: { 
                    requestId: request.id,
                    category: 'catering',
                    message: 'Your catering request has been submitted successfully!'
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

    // Add this useEffect to test the connection
    useEffect(() => {
        const testConnection = async () => {
            try {
                const { data, error } = await supabase
                    .from('catering_requests')
                    .select('id')
                    .limit(1);
                
                if (error) throw error;
                console.log('Supabase connection successful', data);
            } catch (err) {
                console.error('Supabase connection error:', err);
            }
        };

        testConnection();
    }, []);

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
            'Food Preferences': Object.values(formData.eventDetails.foodPreferences || {}).some(v => v),
            'Equipment Needs': Object.values(formData.eventDetails.equipment || {}).some(v => v),
            'Special Requests': formData.eventDetails.specialRequests,
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
        let basePrice = 25; // Base price per person
        let factors = [];

        // Event type factor
        if (eventType === 'Wedding') {
            basePrice = 40; // Higher base price for weddings
            factors.push('Wedding catering base package');
        } else {
            factors.push('Standard catering base package');
        }

        // Guest count factor
        const guestCount = parseInt(eventDetails.numPeople) || 50; // Default to 50 if not specified
        const totalBasePrice = basePrice * guestCount;
        factors.push(`Estimated for ${guestCount} guests`);

        // Food service types
        const foodServices = eventDetails.foodPreferences || {};
        let serviceTypes = [];
        
        if (foodServices.appetizers) {
            totalBasePrice += 8 * guestCount;
            serviceTypes.push('Appetizers');
        }
        if (foodServices.mainCourse) {
            totalBasePrice += 15 * guestCount;
            serviceTypes.push('Main Course');
        }
        if (foodServices.desserts) {
            totalBasePrice += 7 * guestCount;
            serviceTypes.push('Desserts');
        }
        if (foodServices.drinks) {
            totalBasePrice += 5 * guestCount;
            serviceTypes.push('Drinks');
        }

        if (serviceTypes.length > 0) {
            factors.push(`Selected services: ${serviceTypes.join(', ')}`);
        }

        // Equipment needs
        const equipment = eventDetails.equipment || {};
        if (Object.values(equipment).some(v => v)) {
            totalBasePrice += 500; // Base equipment cost
            factors.push('Equipment needs included');
        }

        // Round to nearest price bracket
        const brackets = [1000, 2000, 3000, 4000, 5000, 6000, 8000, 10000];
        const suggestedRange = brackets.find(b => totalBasePrice <= b) || '10000+';
        
        return {
            suggestedRange: suggestedRange === 10000 ? '10000+' : `${suggestedRange-1000}-${suggestedRange}`,
            factors,
            basePrice: totalBasePrice
        };
    };

    const getBudgetRecommendation = (preference, eventType, eventDetails) => {
        const analysis = analyzeEventDetails(eventDetails, eventType);
        const baseRecommendation = analysis.suggestedRange;

        let adjustedRange = baseRecommendation;
        if (preference === "1") { // Budget-conscious
            const currentMin = parseInt(baseRecommendation.split('-')[0]);
            adjustedRange = currentMin <= 1000 ? '0-1000' : `${currentMin-1000}-${currentMin}`;
        } else if (preference === "3") { // Quality-focused
            const currentMax = baseRecommendation.includes('+') ? 10000 : parseInt(baseRecommendation.split('-')[1]);
            adjustedRange = currentMax >= 10000 ? '10000+' : `${currentMax}-${currentMax+1000}`;
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
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <div className="request-form-status-container mobile-only">
                    <div className="request-form-box">
                        <StatusBar steps={getSteps()} currentStep={currentStep} />
                    </div>
                </div>  
                
                <div className="form-header-section">
                    <h2 className="request-form-header">
                        {getSteps()[currentStep]}
                    </h2>
                    <BidScoreIndicator score={bidScore} message={scoreMessage} />
                </div>
                            {/* Display selected vendor information */}
            {selectedVendor && (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
                    <img src={vendorImage} alt={selectedVendor.business_name} className="vendor-profile-image" style={{marginRight:'8px'}} />
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

export default CateringRequest;
