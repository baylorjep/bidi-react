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

function HairAndMakeUpRequest() {
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

    // Consolidated state
    const [formData, setFormData] = useState(() => {
        const saved = JSON.parse(localStorage.getItem('hairAndMakeupRequest') || '{}');
        const defaultWeddingDetails = {
            ceremony: false,    
            reception: false,
            luncheon: false,
            preCeremony: false
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

                additionalComments: saved.eventDetails?.additionalComments || '',
                priceRange: saved.eventDetails?.priceRange || '',
                weddingDetails: saved.eventDetails?.weddingDetails || defaultWeddingDetails,
                startTime: saved.eventDetails?.startTime || '',
                endTime: saved.eventDetails?.endTime || '',
                secondPhotographer: saved.eventDetails?.secondPhotographer || '',
                additionalInfo: saved.eventDetails?.additionalInfo || '',
                dateFlexibility: saved.eventDetails?.dateFlexibility || 'specific', // 'specific', 'range', 'flexible'
                dateTimeframe: saved.eventDetails?.dateTimeframe || '', // '3months', '6months', '1year'
                startTimeUnknown: saved.eventDetails?.startTimeUnknown || false,
                endTimeUnknown: saved.eventDetails?.endTimeUnknown || false,
                secondPhotographerUnknown: saved.eventDetails?.secondPhotographerUnknown || false,
                numPeopleUnknown: saved.eventDetails?.numPeopleUnknown || false,
                pinterestBoard: saved.eventDetails?.pinterestBoard || '',
                eventDateTime: saved.eventDetails?.eventDateTime || '',
                hairstylePreferences: saved.eventDetails?.hairstylePreferences || '',
                hairLengthType: saved.eventDetails?.hairLengthType || '',
                extensionsNeeded: saved.eventDetails?.extensionsNeeded || '',
                trialSessionHair: saved.eventDetails?.trialSessionHair || '',
                makeupStylePreferences: saved.eventDetails?.makeupStylePreferences || '',
                skinTypeConcerns: saved.eventDetails?.skinTypeConcerns || '',
                preferredProductsAllergies: saved.eventDetails?.preferredProductsAllergies || '',
                lashesIncluded: saved.eventDetails?.lashesIncluded || '',
                trialSessionMakeup: saved.eventDetails?.trialSessionMakeup || '',
                groupDiscountInquiry: saved.eventDetails?.groupDiscountInquiry || '',
                onSiteServiceNeeded: saved.eventDetails?.onSiteServiceNeeded || '',
                specificTimeNeeded: saved.eventDetails?.specificTimeNeeded || '',
                specificTime: saved.eventDetails?.specificTime || ''
            },
            personalDetails: saved.personalDetails || {
                firstName: '',
                lastName: '',
                phoneNumber: ''
            },
            photos: saved.photos || [],
            serviceType: saved.serviceType || 'both'
        };
    });

    const [serviceType, setServiceType] = useState(formData.serviceType);

    const getSteps = () => [
        'Beauty Services',  // Changed from 'Videography Details'
        formData.eventType ? `${formData.eventType} Details` : 'Event Details',
        'Personal Details',
        'Inspiration',
        'Review'
    ];

    const getDetailsSubSteps = () => {
        const subSteps = ['Basic Information'];

        if (serviceType === 'both' || serviceType === 'hair') {
            subSteps.push('Hair Services');
        }

        if (serviceType === 'both' || serviceType === 'makeup') {
            subSteps.push('Makeup Services');
        }

        subSteps.push('Additional Details');
        return subSteps;
    };

    const handleEventSelect = (event) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                eventType: event
            };
            // Save to localStorage
            localStorage.setItem('hairAndMakeupRequest', JSON.stringify(newData));
            return newData;
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            localStorage.setItem('hairAndMakeupRequest', JSON.stringify(newData));
            return newData;
        });
    };

    const handleServiceTypeChange = (e) => {
        setServiceType(e.target.value);
        setFormData(prev => {
            const newData = { ...prev, serviceType: e.target.value };
            localStorage.setItem('hairAndMakeupRequest', JSON.stringify(newData));
            return newData;
        });
    };

    // Event Selection Component
    const renderEventSelection = () => {
        const eventOptions = [
            'Wedding', 'Prom', 'Birthday', 'Photo Shoot', 'Event', 'Other'  // Modified event types
        ];

        return (
            <div>
                <div className="custom-input-container">
                    <select
                        name="serviceType"
                        value={serviceType}
                        onChange={handleServiceTypeChange}
                        className="custom-input"
                    >
                        <option value="both">Both Hair and Makeup</option>
                        <option value="hair">Hair Only</option>
                        <option value="makeup">Makeup Only</option>
                    </select>
                    <label htmlFor="serviceType" className="custom-label">
                        Service Type
                    </label>
                </div>
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
        const subSteps = getDetailsSubSteps();
        const actualSubStep = subSteps[detailsSubStep];

        switch (actualSubStep) {
            case 'Basic Information':
                return (
                    <div className='form-grid'>
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="eventType"
                                value={formData.eventType}
                                onChange={(e) => handleInputChange('eventType', e.target.value)}
                                placeholder='Event Type (e.g., wedding, prom, photoshoot, party)'
                                className="custom-input"
                            />
                            <label htmlFor="eventType" className="custom-label">
                                Event Type
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

                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="location"
                                value={formData.eventDetails.location}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    location: e.target.value
                                })}
                                placeholder='Location (City, County, Venue, or Address)'
                                className="custom-input"
                            />
                            <label htmlFor="location" className="custom-label">
                                Location
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
                                placeholder='Number of People Needing Services'
                                className="custom-input"
                            />
                            <label htmlFor="numPeople" className="custom-label">
                                Number of People Needing Services
                            </label>
                        </div>
                        <div className="custom-input-container">
                            <select
                                name="specificTimeNeeded"
                                value={formData.eventDetails.specificTimeNeeded}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    specificTimeNeeded: e.target.value
                                })}
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

                        {formData.eventDetails.specificTimeNeeded === 'yes' && (
                            <div className="custom-input-container">
                                <input
                                    type="time"
                                    name="specificTime"
                                    value={formData.eventDetails.specificTime}
                                    onChange={(e) => handleInputChange('eventDetails', {
                                        ...formData.eventDetails,
                                        specificTime: e.target.value
                                    })}
                                    className="custom-input"
                                />
                                <label htmlFor="specificTime" className="custom-label">
                                    Specific Time
                                </label>
                            </div>
                        )}
                    </div>
                );

            case 'Hair Services':
                if (serviceType === 'makeup') return null;
                return (
                    <div className="form-grid">
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="hairstylePreferences"
                                value={formData.eventDetails.hairstylePreferences}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    hairstylePreferences: e.target.value
                                })}
                                placeholder='Hairstyle Preferences'
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
                                value={formData.eventDetails.hairLengthType}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    hairLengthType: e.target.value
                                })}
                                placeholder='Hair Length & Type'
                                className="custom-input"
                            />
                            <label htmlFor="hairLengthType" className="custom-label">
                                Hair Length & Type
                            </label>
                        </div>
                        <div className="custom-input-container">
                            <select
                                name="extensionsNeeded"
                                value={formData.eventDetails.extensionsNeeded}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    extensionsNeeded: e.target.value
                                })}
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
                                value={formData.eventDetails.trialSessionHair}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    trialSessionHair: e.target.value
                                })}
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

            case 'Makeup Services':
                if (serviceType === 'hair') return null;
                return (
                    <div className="form-grid">
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="makeupStylePreferences"
                                value={formData.eventDetails.makeupStylePreferences}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    makeupStylePreferences: e.target.value
                                })}
                                placeholder='Makeup Style Preferences'
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
                                value={formData.eventDetails.skinTypeConcerns}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    skinTypeConcerns: e.target.value
                                })}
                                placeholder='Skin Type & Concerns'
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
                                value={formData.eventDetails.preferredProductsAllergies}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    preferredProductsAllergies: e.target.value
                                })}
                                placeholder='Preferred Products or Allergies'
                                className="custom-input"
                            />
                            <label htmlFor="preferredProductsAllergies" className="custom-label">
                                Preferred Products or Allergies
                            </label>
                        </div>
                        <div className="custom-input-container">
                            <select
                                name="lashesIncluded"
                                value={formData.eventDetails.lashesIncluded}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    lashesIncluded: e.target.value
                                })}
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
                                value={formData.eventDetails.trialSessionMakeup}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    trialSessionMakeup: e.target.value
                                })}
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

            case 'Additional Details':
                return (
                    <div className="form-grid">
                        <div className="custom-input-container">
                            <select
                                name="groupDiscountInquiry"
                                value={formData.eventDetails.groupDiscountInquiry}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    groupDiscountInquiry: e.target.value
                                })}
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
                                value={formData.eventDetails.onSiteServiceNeeded}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    onSiteServiceNeeded: e.target.value
                                })}
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
                            <select
                                name="priceRange"
                                value={formData.eventDetails.priceRange}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    priceRange: e.target.value
                                })}
                                className="custom-input"
                            >
                                <option value="">Select Budget Range</option>
                                <option value="0-500">$0 - $500</option>
                                <option value="500-1000">$500 - $1,000</option>
                                <option value="1000-2000">$1,000 - $2,000</option>
                                <option value="2000-3000">$2,000 - $3,000</option>
                                <option value="3000-4000">$3,000 - $4,000</option>
                                <option value="4000-5000">$4,000 - $5,000</option>
                                <option value="5000+">$5,000+</option>
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
                                placeholder="Other Special Requests or Notes"
                            />
                            <label htmlFor="additionalInfo" className="custom-label">
                                Other Special Requests or Notes
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
                localStorage.setItem('hairAndMakeupRequest', JSON.stringify(newData));
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
                localStorage.setItem('hairAndMakeupRequest', JSON.stringify(newData));
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
            <div className="photo-upload-section">
                <div className="photo-preview-container">
                    {formData.photos.length === 0 ? (
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
                                <path d="M40.6939 15.6916C40.7126 15.6915 40.7313 15.6915 40.75 15.6915C46.9632 15.6915 52 20.2889 52 25.9601C52 31.2456 47.6249 35.5984 42 36.166M40.6939 15.6916C40.731 15.3158 40.75 14.9352 40.75 14.5505C40.75 7.61906 34.5939 2 27 2C19.8081 2 13.9058 7.03987 13.3011 13.4614M40.6939 15.6916C40.4383 18.2803 39.3216 20.6423 37.6071 22.5372M13.3011 13.4614C6.95995 14.0121 2 18.8869 2 24.8191C2 30.339 6.2944 34.9433 12 36.0004M13.3011 13.4614C13.6956 13.4271 14.0956 13.4096 14.5 13.4096C17.3146 13.4096 19.9119 14.2586 22.0012 15.6915" stroke="#141B34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M27 24.7783L27 43.0002M27 24.7783C25.2494 24.7783 21.9788 29.3208 20.75 30.4727M27 24.7783C28.7506 24.7783 32.0212 29.3208 33.25 30.4727" stroke="#141B34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div className="photo-upload-text">Drag & Drop to Upload or Click to Browse</div>
                        </div>
                    ) : (
                        <>
                            <PhotoGrid 
                                photos={formData.photos}
                                removePhoto={(index) => {
                                    const newPhotos = formData.photos.filter((_, i) => i !== index);
                                    handleInputChange('photos', newPhotos);
                                }}
                                openModal={(photo) => {
                                    setSelectedPhoto(photo);
                                    setIsPhotoModalOpen(true);
                                }}
                            />
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
                    <PhotoModal 
                        photo={selectedPhoto} 
                        onClose={() => {
                            setSelectedPhoto(null);
                            setIsPhotoModalOpen(false);
                        }} 
                    />
                )}
                <div className="custom-input-container" style={{ marginTop: '20px' }}>
                    <input
                        type="url"
                        name="pinterestBoard"
                        value={formData.eventDetails.pinterestBoard || ''}
                        onChange={(e) => handleInputChange('eventDetails', {
                            ...formData.eventDetails,
                            pinterestBoard: e.target.value
                        })}
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

    // Summary Component
    const renderSummary = () => {
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
                <div className="request-summary-grid">
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Event Type</div>
                        <div className="request-info">{formData.eventType}</div>  
                    </div>  

                    {renderDateInfo()}

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Location</div>
                        <div className="request-info">{formData.eventDetails.location}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Number of People Needing Services</div>
                        <div className="request-info">{formData.eventDetails.numPeople}</div>
                    </div>

                    {serviceType !== 'makeup' && (
                        <>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                <div className="request-subtype">Hairstyle Preferences</div>
                                <div className="request-info">{formData.eventDetails.hairstylePreferences}</div>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                <div className="request-subtype">Hair Length & Type</div>
                                <div className="request-info">{formData.eventDetails.hairLengthType}</div>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                <div className="request-subtype">Extensions Needed?</div>
                                <div className="request-info">{formData.eventDetails.extensionsNeeded}</div>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                <div className="request-subtype">Trial Session for Hair?</div>
                                <div className="request-info">{formData.eventDetails.trialSessionHair}</div>
                            </div>
                        </>
                    )}

                    {serviceType !== 'hair' && (
                        <>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                <div className="request-subtype">Makeup Style Preferences</div>
                                <div className="request-info">{formData.eventDetails.makeupStylePreferences}</div>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                <div className="request-subtype">Skin Type & Concerns</div>
                                <div className="request-info">{formData.eventDetails.skinTypeConcerns}</div>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                <div className="request-subtype">Preferred Products or Allergies</div>
                                <div className="request-info">{formData.eventDetails.preferredProductsAllergies}</div>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                <div className="request-subtype">Lashes Included?</div>
                                <div className="request-info">{formData.eventDetails.lashesIncluded}</div>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                <div className="request-subtype">Trial Session for Makeup?</div>
                                <div className="request-info">{formData.eventDetails.trialSessionMakeup}</div>
                            </div>
                        </>
                    )}

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Group Discount Inquiry?</div>
                        <div className="request-info">{formData.eventDetails.groupDiscountInquiry}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">On-Site Service Needed?</div>
                        <div className="request-info">{formData.eventDetails.onSiteServiceNeeded}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Budget Range</div>
                        <div className="request-info">{formData.eventDetails.priceRange}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Pinterest Board Link</div>
                        <div className="request-info">{formData.eventDetails.pinterestBoard}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Specific Time Needed?</div>
                        <div className="request-info">{formData.eventDetails.specificTimeNeeded}</div>
                    </div>

                    {formData.eventDetails.specificTimeNeeded === 'yes' && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <div className="request-subtype">Specific Time</div>
                            <div className="request-info">{formData.eventDetails.specificTime}</div>
                        </div>
                    )}
                </div>

                {formData.eventDetails.additionalInfo && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column', 
                        gap: '8px', 
                        alignItems:'flex-start',
                    }}>
                        <div className="request-subtype">Other Special Requests or Notes</div>
                        <div 
                            className="quill-content"
                            dangerouslySetInnerHTML={{ __html: formData.eventDetails.additionalInfo }}
                        />
                    </div>
                )}

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

        // Debug logs for validation
        console.log('Location:', formData.eventDetails.location);
        console.log('Date Flexibility:', formData.eventDetails.dateFlexibility);
        console.log('Start Date:', formData.eventDetails.startDate);
        console.log('End Date:', formData.eventDetails.endDate);
        console.log('Date Timeframe:', formData.eventDetails.dateTimeframe);
        console.log('Price Range:', formData.eventDetails.priceRange);

        // Existing validation
        if (!formData.eventDetails.location || 
            (formData.eventDetails.dateFlexibility === 'specific' && !formData.eventDetails.startDate) ||
            (formData.eventDetails.dateFlexibility === 'range' && (!formData.eventDetails.startDate || !formData.eventDetails.endDate)) ||
            (formData.eventDetails.dateFlexibility === 'flexible' && !formData.eventDetails.dateTimeframe) ||
            !formData.eventDetails.priceRange) {
            setError('Please fill in all required fields.');
            setIsSubmitting(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsModalOpen(true);
                return;
            }

            // Get the user's profile data to ensure we have the most up-to-date first name
            const { data: userData, error: userError } = await supabase
                .from('individual_profiles')
                .select('first_name')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            // Generate event title using first name from database
            const firstName = userData.first_name || 'Unknown';
            const generatedEventTitle = `${firstName}'s ${formData.eventType} Beauty Request`;

            // Create coverage object from wedding details
            const coverage = {
                ...(formData.eventType === 'Wedding' ? formData.eventDetails.weddingDetails : {}),
                numPeople: formData.eventDetails.numPeopleUnknown ? null : 
                          formData.eventDetails.numPeople ? parseInt(formData.eventDetails.numPeople) : null,
            };

            // Create request data matching the table schema
            const requestData = {
                user_id: user.id,
                event_type: formData.eventType,
                event_title: generatedEventTitle, // Use the generated title
                location: formData.eventDetails.location,
                start_date: formData.eventDetails.dateFlexibility !== 'flexible' ? formData.eventDetails.startDate : null,
                end_date: formData.eventDetails.dateFlexibility === 'range' ? formData.eventDetails.endDate : null,
                date_flexibility: formData.eventDetails.dateFlexibility,
                date_timeframe: formData.eventDetails.dateFlexibility === 'flexible' ? formData.eventDetails.dateTimeframe : null,
                specific_time_needed: formData.eventDetails.specificTimeNeeded === 'yes',
                specific_time: formData.eventDetails.specificTimeNeeded === 'yes' ? formData.eventDetails.specificTime : null,
                num_people: formData.eventDetails.numPeopleUnknown ? null : 
                            formData.eventDetails.numPeople ? parseInt(formData.eventDetails.numPeople) : null,

                price_range: formData.eventDetails.priceRange,
                additional_comments: formData.eventDetails.additionalInfo || null,
                pinterest_link: formData.eventDetails.pinterestBoard || null,   
                status: 'pending',
                coupon_code: appliedCoupon ? appliedCoupon.code : null,
                service_type: serviceType, // Add service type
                hairstyle_preferences: formData.eventDetails.hairstylePreferences || '',
                hair_length_type: formData.eventDetails.hairLengthType || '',
                extensions_needed: formData.eventDetails.extensionsNeeded || '',
                trial_session_hair: formData.eventDetails.trialSessionHair || '',
                makeup_style_preferences: formData.eventDetails.makeupStylePreferences || '',
                skin_type_concerns: formData.eventDetails.skinTypeConcerns || '',
                preferred_products_allergies: formData.eventDetails.preferredProductsAllergies || '',
                lashes_included: formData.eventDetails.lashesIncluded || '',
                trial_session_makeup: formData.eventDetails.trialSessionMakeup || '',
                group_discount_inquiry: formData.eventDetails.groupDiscountInquiry || '',
                on_site_service_needed: formData.eventDetails.onSiteServiceNeeded || ''
            };

            const { data: request, error: requestError } = await supabase
                .from('beauty_requests')          // Changed from videography_requests
                .insert([requestData])
                .select()
                .single();

            if (requestError) throw requestError;

            // Handle photo uploads if any
            if (formData.photos.length > 0) {
                const uploadPromises = formData.photos.map(async (photo) => {
                    const fileExt = photo.name.split('.').pop();
                    const fileName = `${uuidv4()}.${fileExt}`;
                    const filePath = `${user.id}/${request.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('request-media')
                        .upload(filePath, photo.file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('request-media')
                        .getPublicUrl(filePath);

                    // Store photo information in beauty_photos table
                    return supabase
                        .from('beauty_photos')               // Changed from videography_photos
                        .insert([{
                            request_id: request.id,
                            user_id: user.id,
                            photo_url: publicUrl,
                            file_path: filePath
                        }]);
                });

                await Promise.all(uploadPromises);
            }

            // Clear form data and navigate to success page
            localStorage.removeItem('hairAndMakeupRequest');
            navigate('/success-request', { 
                state: { 
                    requestId: request.id,
                    message: 'Your hair and makeup request has been submitted successfully!'
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
                // Fix the validation check here
                if (detailsSubStep === 0 && 
                    (!formData.eventDetails.location || 
                    (formData.eventDetails.dateFlexibility === 'specific' && !formData.eventDetails.startDate) ||
                    (formData.eventDetails.dateFlexibility === 'range' && (!formData.eventDetails.startDate || !formData.eventDetails.endDate)) ||
                    (formData.eventDetails.dateFlexibility === 'flexible' && !formData.eventDetails.dateTimeframe))) {
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
                {/* Status bar container moved above title for desktop */}


                <h2 className="request-form-header" style={{textAlign:'left', marginLeft:"20px"}}>
                    {getSteps()[currentStep]}
                </h2>
                
                {/* Mobile status bar */}
                <div className="request-form-status-container mobile-only">
                    <div className="request-form-box">
                        <StatusBar steps={getSteps()} currentStep={currentStep} />
                    </div>
                </div>

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

export default HairAndMakeUpRequest;
