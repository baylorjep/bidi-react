import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import { supabase } from '../../../supabaseClient';
import { Spinner } from 'react-bootstrap';
import SignInModal from '../Event/SignInModal';
import StatusBar from '../StatusBar';
import { v4 as uuidv4 } from 'uuid';
import 'react-quill/dist/quill.snow.css';
import '../../../styles/Photography.css';
import AuthModal from '../Authentication/AuthModal';
import Roses from '../../../assets/images/flowers/roses.jpg';
import Peonies from '../../../assets/images/flowers/peonies.jpg';
import Hydrangeas from '../../../assets/images/flowers/hydrangeas.jpg';
import Lilies from '../../../assets/images/flowers/lilies.jpg';
import Tulips from '../../../assets/images/flowers/tulips.jpg';
import Orchids from '../../../assets/images/flowers/orchids.jpg';
import Daisies from '../../../assets/images/flowers/daises.jpg';
import Ranunculus from '../../../assets/images/flowers/ranunculus.jpg';
import Anemones from '../../../assets/images/flowers/anemones.jpg';
import Scabiosa from '../../../assets/images/flowers/scabiosa.jpg';
import Eucalyptus from '../../../assets/images/flowers/eucalyptus.jpg';
import Sunflowers from '../../../assets/images/flowers/sunflowers.jpg';
import BabysBreath from '../../../assets/images/flowers/babysBreath.jpg';
import Lavender from '../../../assets/images/flowers/lavender.jpg';
import Dahlia from '../../../assets/images/flowers/dahlia.jpg';
import Zinnias from '../../../assets/images/flowers/zinnias.jpg';
import Protea from '../../../assets/images/flowers/protea.jpg';
import Amaranthus from '../../../assets/images/flowers/amaranthus.jpg';
import Chrysanthemums from '../../../assets/images/flowers/chrysanthemums.jpg';
import Ruscus from '../../../assets/images/flowers/ruscus.jpg';
import Ivy from '../../../assets/images/flowers/ivy.jpg';
import Ferns from '../../../assets/images/flowers/ferns.jpg';

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

const FlowerModal = ({ photo, onClose }) => {
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
                <img src={photo.imgSrc} alt={photo.label} />
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

function FloristRequest() {
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
    const [selectedFlower, setSelectedFlower] = useState(null);
    const [isFlowerModalOpen, setIsFlowerModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(location.state?.vendor || null);
    const [vendorImage, setVendorImage] = useState(location.state?.image || null);
    const [bidScore, setBidScore] = useState(0);
    const [scoreMessage, setScoreMessage] = useState('');
    const [earnedCoupon, setEarnedCoupon] = useState(false);

    // Consolidated state
    const [formData, setFormData] = useState(() => {
        const saved = JSON.parse(localStorage.getItem('floristRequest') || '{}');
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
                duration: saved.eventDetails?.duration || '',
                additionalComments: saved.eventDetails?.additionalComments || '',
                priceRange: saved.eventDetails?.priceRange || '',
                weddingDetails: saved.eventDetails?.weddingDetails || defaultWeddingDetails,
                startTime: saved.eventDetails?.startTime || '',
                endTime: saved.eventDetails?.endTime || '',
                additionalInfo: saved.eventDetails?.additionalInfo || '',
                dateFlexibility: saved.eventDetails?.dateFlexibility || 'specific', // 'specific', 'range', 'flexible'
                dateTimeframe: saved.eventDetails?.dateTimeframe || '', // '3months', '6months', '1year'
                startTimeUnknown: saved.eventDetails?.startTimeUnknown || false,
                endTimeUnknown: saved.eventDetails?.endTimeUnknown || false,
                durationUnknown: saved.eventDetails?.durationUnknown || false,
                numPeopleUnknown: saved.eventDetails?.numPeopleUnknown || false,
                pinterestBoard: saved.eventDetails?.pinterestBoard || '',
                eventDateTime: saved.eventDetails?.eventDateTime || '',
                flowerPreferences: saved.eventDetails?.flowerPreferences || '',
                groupDiscountInquiry: saved.eventDetails?.groupDiscountInquiry || '',
                specificTimeNeeded: saved.eventDetails?.specificTimeNeeded || '',
                specificTime: saved.eventDetails?.specificTime || '',
                priceQualityPreference: saved.eventDetails?.priceQualityPreference || "2"
            },
            personalDetails: saved.personalDetails || {
                firstName: '',
                lastName: '',
                phoneNumber: ''
            },
            photos: saved.photos || [],
        };
    });

    const getSteps = () => [
        'Florist Services',
        formData.eventType ? `${formData.eventType} Details` : 'Event Details',
        'Personal Details',
        'Inspiration',
        'Review'
    ];

    const getDetailsSubSteps = () => [
        'Event Details',
        'Floral Arrangements Needed',
        'Color Preferences',
        'Flower Preferences & Greenery',
        'Additional Services & Budget'
    ];

    const handleEventSelect = (event) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                eventType: event
            };
            localStorage.setItem('floristRequest', JSON.stringify(newData));
            setTimeout(() => updateBidScore(), 0);
            return newData;
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            let newData;
            if (field === 'eventDetails') {
                newData = {
                    ...prev,
                    eventDetails: {
                        ...prev.eventDetails,
                        ...value
                    }
                };
            } else {
                newData = { ...prev, [field]: value };
            }
            
            localStorage.setItem('floristRequest', JSON.stringify(newData));
            setTimeout(() => updateBidScore(), 0);
            return newData;
        });
    };

    // Event Selection Component
    const renderEventSelection = () => {
        const eventOptions = [
            'Wedding', 'Prom', 'Birthday', 'Photo Shoot', 'Event', 'Other'
        ];

        return (
            <div>
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
            case 'Event Details':
                return (
                    <div className='form-grid'>
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="eventType"
                                value={formData.eventType}
                                onChange={(e) => handleInputChange('eventType', e.target.value)}
                                placeholder='Event Type (e.g., wedding, birthday, corporate event, funeral)'
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

                        <div className="custom-input-container required">
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

            case 'Floral Arrangements Needed':
                const handleCheckboxChange = (id, checked) => {
                    handleInputChange('eventDetails', {
                        ...formData.eventDetails,
                        floralArrangements: {
                            ...formData.eventDetails.floralArrangements,
                            [id]: checked
                        }
                    });
                };

                const handleQuantityChange = (id, value) => {
                    handleInputChange('eventDetails', {
                        ...formData.eventDetails,
                        floralArrangements: {
                            ...formData.eventDetails.floralArrangements,
                            [`${id}Quantity`]: value
                        }
                    });
                };

                return (
                    <div className="form-grid">
                        <div className="custom-input-container">
                            <label className="photo-options-header">Floral Arrangements Needed</label>
                            <div className="photo-options-grid">
                                {[
                                    { id: 'bridalBouquet', label: 'Bridal bouquet' },
                                    { id: 'bridesmaidBouquets', label: 'Bridesmaid bouquets' },
                                    { id: 'boutonnieres', label: 'Boutonnieres' },
                                    { id: 'corsages', label: 'Corsages' },
                                    { id: 'centerpieces', label: 'Centerpieces' },
                                    { id: 'ceremonyArchFlowers', label: 'Ceremony arch flowers' },
                                    { id: 'aisleDecorations', label: 'Aisle decorations' },
                                    { id: 'floralInstallations', label: 'Floral installations (hanging, wall, etc.)' },
                                    { id: 'cakeFlowers', label: 'Cake flowers' },
                                    { id: 'loosePetals', label: 'Loose petals' },
                                    { id: 'otherFloralArrangements', label: 'Other (please specify)' }
                                ].map((item) => (
                                    <div key={item.id} className="photo-option-item">
                                        <input
                                            type="checkbox"
                                            id={item.id}
                                            checked={formData.eventDetails.floralArrangements?.[item.id] || false}
                                            onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                                        />
                                        <label htmlFor={item.id}>{item.label}</label>
                                        {item.id !== 'loosePetals' && formData.eventDetails.floralArrangements?.[item.id] && (
                                            <div className="custom-input-container">
                                                <input
                                                    type="number"
                                                    name={`${item.id}Quantity`}
                                                    value={formData.eventDetails.floralArrangements?.[`${item.id}Quantity`] || ''}
                                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                    placeholder={`Quantity`}
                                                    className="custom-input"
                                                />
                                                <label htmlFor={`${item.id}Quantity`} className="custom-label">
                                                    Quantity
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {formData.eventDetails.floralArrangements?.otherFloralArrangements && (
                                    <div className="custom-input-container">
                                        <input
                                            type="text"
                                            name="otherFloralArrangementsDetails"
                                            value={formData.eventDetails.floralArrangements?.otherFloralArrangementsDetails || ''}
                                            onChange={(e) => handleInputChange('eventDetails', {
                                                ...formData.eventDetails,
                                                floralArrangements: {
                                                    ...formData.eventDetails.floralArrangements,
                                                    otherFloralArrangementsDetails: e.target.value
                                                }
                                            })}
                                            placeholder='Please specify other floral arrangements'
                                            className="custom-input"
                                        />
                                        <label htmlFor="otherFloralArrangementsDetails" className="custom-label">
                                            Details
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'Color Preferences':
                const colorOptions = [
                    'Red', 'Pink', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'White', 'Black', 'Gray', 'Brown'
                ];

                return (
                    <div className="form-grid">
                        <div className="custom-input-container">
                            <label className="photo-options-header">Color Preferences</label>
                            <div className="photo-options-grid">
                                {colorOptions.map((color, index) => (
                                    <div key={index} className="photo-option-item">
                                        <input
                                            type="checkbox"
                                            id={color}
                                            checked={formData.eventDetails.colorPreferences?.includes(color) || false}
                                            onChange={(e) => {
                                                const newColorPreferences = e.target.checked
                                                    ? [...(formData.eventDetails.colorPreferences || []), color]
                                                    : (formData.eventDetails.colorPreferences || []).filter(c => c !== color);
                                                handleInputChange('eventDetails', {
                                                    ...formData.eventDetails,
                                                    colorPreferences: newColorPreferences
                                                });
                                            }}
                                        />
                                        <label htmlFor={color}>{color}</label>
                                    </div>
                                ))}
                                <div className="custom-input-container">
                                    <input
                                        type="text"
                                        name="otherColorPreferences"
                                        value={formData.eventDetails.otherColorPreferences || ''}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            otherColorPreferences: e.target.value
                                        })}
                                        placeholder='Other (please specify)'
                                        className="custom-input"
                                    />
                                    <label htmlFor="otherColorPreferences" className="custom-label">
                                        Other Color Preferences
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'Flower Preferences & Greenery':
                const flowerOptions = [
                    // Luxury Tier
                    { id: 'peonies', label: 'Peonies', imgSrc: Peonies, tier: 'luxury' },
                    { id: 'orchids', label: 'Orchids', imgSrc: Orchids, tier: 'luxury' },
                    { id: 'protea', label: 'Protea', imgSrc: Protea, tier: 'luxury' },
                    
                    // Premium Tier
                    { id: 'ranunculus', label: 'Ranunculus', imgSrc: Ranunculus, tier: 'premium' },
                    { id: 'anemones', label: 'Anemones', imgSrc: Anemones, tier: 'premium' },
                    { id: 'dahlia', label: 'Dahlia', imgSrc: Dahlia, tier: 'premium' },
                    
                    // Moderate Tier
                    { id: 'roses', label: 'Roses', imgSrc: Roses, tier: 'moderate' },
                    { id: 'lilies', label: 'Lilies', imgSrc: Lilies, tier: 'moderate' },
                    { id: 'hydrangeas', label: 'Hydrangeas', imgSrc: Hydrangeas, tier: 'moderate' },
                    
                    // Standard Tier
                    { id: 'tulips', label: 'Tulips', imgSrc: Tulips, tier: 'standard' },
                    { id: 'daisies', label: 'Daisies', imgSrc: Daisies, tier: 'standard' },
                    { id: 'sunflowers', label: 'Sunflowers', imgSrc: Sunflowers, tier: 'standard' },
                    { id: 'babysBreath', label: "Baby's Breath", imgSrc: BabysBreath, tier: 'standard' },
                    { id: 'lavender', label: 'Lavender', imgSrc: Lavender, tier: 'standard' },
                    { id: 'zinnias', label: 'Zinnias', imgSrc: Zinnias, tier: 'standard' },
                    { id: 'amaranthus', label: 'Amaranthus', imgSrc: Amaranthus, tier: 'standard' },
                    { id: 'chrysanthemums', label: 'Chrysanthemums', imgSrc: Chrysanthemums, tier: 'standard' },
                    
                    // Greenery
                    { id: 'eucalyptus', label: 'Eucalyptus', imgSrc: Eucalyptus, tier: 'greenery' },
                    { id: 'ruscus', label: 'Ruscus', imgSrc: Ruscus, tier: 'greenery' },
                    { id: 'ivy', label: 'Ivy', imgSrc: Ivy, tier: 'greenery' },
                    { id: 'ferns', label: 'Ferns', imgSrc: Ferns, tier: 'greenery' }
                ];

                // Group flowers by tier for display
                const groupedFlowers = flowerOptions.reduce((acc, flower) => {
                    if (!acc[flower.tier]) {
                        acc[flower.tier] = [];
                    }
                    acc[flower.tier].push(flower);
                    return acc;
                }, {});

                return (
                    <div className="form-grid">
                        <div className="custom-input-container">
                            <label className="photo-options-header">Flower Preferences & Greenery</label>
                            <div className="flower-options-container">
                                {Object.entries(groupedFlowers).map(([tier, flowers]) => (
                                    <div key={tier} className="flower-tier-section">
                                        <h3 className="flower-tier-header">
                                            {tier === 'luxury' && '✨ Luxury Flowers'}
                                            {tier === 'premium' && '💫 Premium Flowers'}
                                            {tier === 'moderate' && '🌟 Moderate-Priced Flowers'}
                                            {tier === 'standard' && '🌸 Standard Flowers'}
                                            {tier === 'greenery' && '🌿 Greenery'}
                                        </h3>
                                        <div className="photo-options-grid">
                                            {flowers.map((flower) => (
                                                <div
                                                    key={flower.id}
                                                    className={`flower-option ${formData.eventDetails.flowerPreferences?.[flower.id] ? 'selected' : ''}`}
                                                >
                                                    <img
                                                        src={flower.imgSrc}
                                                        alt={flower.label}
                                                        className="flower-image"
                                                        onClick={() => {
                                                            setSelectedFlower(flower);
                                                            setIsFlowerModalOpen(true);
                                                        }}
                                                    />
                                                    <div className="flower-label">
                                                        {flower.label}
                                                        {flower.tier === 'luxury' && ' ✨'}
                                                        {flower.tier === 'premium' && ' 💫'}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        id={flower.id}
                                                        checked={formData.eventDetails.flowerPreferences?.[flower.id] || false}
                                                        onChange={(e) => {
                                                            handleInputChange('eventDetails', {
                                                                ...formData.eventDetails,
                                                                flowerPreferences: {
                                                                    ...formData.eventDetails.flowerPreferences,
                                                                    [flower.id]: e.target.checked
                                                                }
                                                            });
                                                        }}
                                                    />
                                                    <label htmlFor={flower.id}>Select</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'Additional Services & Budget':
                return (
                    <div className='form-grid'>
                        <div className="custom-input-container">
                            <h3 className="section-subtitle">Additional Services</h3>
                            <div className="checkbox-grid">
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={formData.eventDetails.additionalServices?.setup || false}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            additionalServices: {
                                                ...formData.eventDetails.additionalServices,
                                                setup: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="checkbox-text">Setup & Installation</span>
                                </label>
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={formData.eventDetails.additionalServices?.delivery || false}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            additionalServices: {
                                                ...formData.eventDetails.additionalServices,
                                                delivery: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="checkbox-text">Delivery</span>
                                </label>
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={formData.eventDetails.additionalServices?.cleanup || false}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            additionalServices: {
                                                ...formData.eventDetails.additionalServices,
                                                cleanup: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="checkbox-text">Cleanup & Removal</span>
                                </label>
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={formData.eventDetails.additionalServices?.consultation || false}
                                        onChange={(e) => handleInputChange('eventDetails', {
                                            ...formData.eventDetails,
                                            additionalServices: {
                                                ...formData.eventDetails.additionalServices,
                                                consultation: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="checkbox-text">In-person Consultation</span>
                                </label>
                            </div>
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
                                value={formData.eventDetails.priceQualityPreference || "2"}
                                onChange={(e) => {
                                    const newPreference = e.target.value;
                                    const recommendation = getBudgetRecommendation(
                                        newPreference,
                                        formData.eventType,
                                        formData.eventDetails
                                    )[newPreference].range;

                                    // Update both the preference and the price range in one call
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
                                        <p>👉 Focus on finding budget-friendly options while maintaining good quality</p>
                                    )}
                                    {formData.eventDetails.priceQualityPreference === "2" && (
                                        <p>Balanced</p>
                                    )}
                                    {formData.eventDetails.priceQualityPreference === "3" && (
                                        <>
                                            <p>👉 Priority on portfolio quality and experience</p>
                                            <p>👉 Access to top-tier florists</p>
                                            <p>👉 Ideal for those seeking premium results</p>
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
                                </div>
                            </div>
                        )}
                        </div>


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
                                <option value="0-500">$0-500</option>
                                <option value="500-1000">$500-1,000</option>
                                <option value="1000-1500">$1,000-1,500</option>
                                <option value="1500-2000">$1,500-2,000</option>
                                <option value="2000-2500">$2,000-2,500</option>
                                <option value="2500-3000">$2,500-3,000</option>
                                <option value="3000-3500">$3,000-3,500</option>
                                <option value="3500-4000">$3,500-4,000</option>
                                <option value="4000+">$4,000+</option>
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
                                placeholder="Any special requests or additional information florists should know..."
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
                localStorage.setItem('floristRequest', JSON.stringify(newData));
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
                localStorage.setItem('floristRequest', JSON.stringify(newData));
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

        const renderFloralArrangements = () => {
            const arrangements = formData.eventDetails.floralArrangements || {};
            return Object.keys(arrangements)
                .filter(key => arrangements[key] && !key.endsWith('Quantity'))
                .map(key => (
                    <div key={key} style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</div>
                        <div className="request-info">
                            Yes {arrangements[`${key}Quantity`] ? `(${arrangements[`${key}Quantity`]})` : ''}
                        </div>
                    </div>
                ));
        };

        const renderFlowerPreferences = () => {
            const preferences = formData.eventDetails.flowerPreferences || {};
            return Object.entries(preferences)
                .filter(([_, value]) => value)
                .map(([key]) => (
                    <div key={key} style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</div>
                        <div className="request-info">Yes</div>
                    </div>
                ));
        };

        const renderAdditionalServices = () => {
            const services = formData.eventDetails.additionalServices || {};
            return Object.entries(services)
                .filter(([_, value]) => value)
                .map(([key]) => (
                    <div key={key} style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</div>
                        <div className="request-info">Yes</div>
                    </div>
                ));
        };

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

                    {renderFloralArrangements()}

                    {renderFlowerPreferences()}

                    {renderAdditionalServices()}

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Other Color Preferences</div>
                        <div className="request-info">{formData.eventDetails.otherColorPreferences}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Other Flower Preferences</div>
                        <div className="request-info">{formData.eventDetails.otherFlowerPreferences}</div>
                    </div>
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
            const generatedEventTitle = `${firstName}'s ${formData.eventType} Florist Request`;

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
                price_range: formData.eventDetails.priceRange,
                additional_comments: formData.eventDetails.additionalInfo || null,
                pinterest_link: formData.eventDetails.pinterestBoard || null,
                status: 'pending',
                coupon_code: appliedCoupon ? appliedCoupon.code : null,
                flower_preferences: formData.eventDetails.flowerPreferences || {},
                floral_arrangements: formData.eventDetails.floralArrangements || {},
                colors: formData.eventDetails.colorPreferences || [],
                additional_services: formData.eventDetails.additionalServices || {}, // Add additional services
                vendor_id: selectedVendor?.id, // Add vendor_id to the request data
            };

            const { data: request, error: requestError } = await supabase
                .from('florist_requests')
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

                    // Store photo information in florist_photos table
                    return supabase
                        .from('florist_photos')
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
            localStorage.removeItem('floristRequest');
            navigate('/success-request', { 
                state: { 
                    requestId: request.id,
                    category: 'florist',
                    message: 'Your florist request has been submitted successfully!'
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
                if (detailsSubStep === 0) {
                    if (!formData.eventDetails.location || 
                        (formData.eventDetails.dateFlexibility === 'specific' && !formData.eventDetails.startDate) ||
                        (formData.eventDetails.dateFlexibility === 'range' && (!formData.eventDetails.startDate || !formData.eventDetails.endDate)) ||
                        (formData.eventDetails.dateFlexibility === 'flexible' && !formData.eventDetails.dateTimeframe)) {
                        setError('Please fill in all required fields: Location and Date information.');
                        return;
                    }
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
            'Color Preferences': Object.values(formData.eventDetails.colorPreferences || {}).some(v => v),
            'Flower Preferences': Object.values(formData.eventDetails.flowerPreferences || {}).some(v => v),
            'Floral Arrangements': Object.values(formData.eventDetails.floralArrangements || {}).some(v => v),
            'Additional Services': Object.values(formData.eventDetails.additionalServices || {}).some(v => v)
        };

        Object.entries(additionalFields).forEach(([field, value]) => {
            maxPoints += 5;
            if (value) {
                points += 5;
                breakdown.push(`✓ ${field}`);
            }
        });

        // Bonus points
        if (formData.photos && formData.photos.length > 0) {
            points += 10;
            maxPoints += 10;
            breakdown.push('✓ Inspiration Photos');
        }

        if (formData.eventDetails.pinterestBoard) {
            points += 5;
            maxPoints += 5;
            breakdown.push('✓ Pinterest Board');
        }

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

    const analyzeEventDetails = (eventDetails, eventType) => {
        let basePrice = 500;
        let factors = [];

        // Event type factor
        if (eventType === 'Wedding') {
            basePrice = 1000;
            factors.push('Wedding floral base package');
        } else {
            factors.push('Standard floral base package');
        }

        // Floral arrangements factor with quantities
        const arrangements = eventDetails.floralArrangements || {};
        let totalArrangements = 0;
        let arrangementTypes = [];

        Object.keys(arrangements).forEach(key => {
            if (arrangements[key] && !key.includes('Quantity')) {
                const quantity = parseInt(arrangements[`${key}Quantity`]) || 1;
                totalArrangements += quantity;
                arrangementTypes.push(key);

                // Add cost based on arrangement type and quantity
                switch(key) {
                    case 'bridal':
                        basePrice += 250 * quantity;
                        break;
                    case 'centerpiece':
                        basePrice += 150 * quantity;
                        break;
                    case 'archway':
                        basePrice += 500 * quantity;
                        break;
                    case 'bouquet':
                        basePrice += 200 * quantity;
                        break;
                    case 'corsage':
                        basePrice += 50 * quantity;
                        break;
                    default:
                        basePrice += 100 * quantity;
                }
            }
        });

        if (totalArrangements > 0) {
            factors.push(`${totalArrangements} total arrangements (${arrangementTypes.length} types)`);
        }

        // Flower preferences factor with price tiers
        const flowerPreferences = eventDetails.flowerPreferences || {};
        
        const premiumFlowers = {
            luxury: {
                flowers: ['peonies', 'orchids', 'protea'],
                pricePerType: 300,
                label: 'Luxury flowers'
            },
            premium: {
                flowers: ['ranunculus', 'anemones', 'dahlia'],
                pricePerType: 200,
                label: 'Premium flowers'
            },
            moderate: {
                flowers: ['roses', 'lilies', 'hydrangeas'],
                pricePerType: 100,
                label: 'Moderate-priced flowers'
            }
        };

        // Count selected flowers in each tier
        Object.entries(premiumFlowers).forEach(([tier, { flowers, pricePerType, label }]) => {
            const selectedCount = flowers.filter(flower => flowerPreferences[flower]).length;
            if (selectedCount > 0) {
                basePrice += selectedCount * pricePerType;
                factors.push(`${selectedCount} ${label} selected (${flowers.filter(flower => flowerPreferences[flower]).join(', ')})`);
            }
        });

        // Additional services factor
        const services = eventDetails.additionalServices || {};
        let serviceCount = Object.keys(services).filter(key => services[key]).length;
        if (serviceCount > 0) {
            basePrice += serviceCount * 150;
            factors.push(`${serviceCount} additional services`);
        }

        // Round to nearest price bracket
        const brackets = [500, 1000, 2000, 3000, 4000];
        const suggestedRange = brackets.find(b => basePrice <= b) || '4000+';
        
        return {
            suggestedRange: suggestedRange === 4000 ? '4000+' : `${suggestedRange-500}-${suggestedRange}`,
            factors,
            basePrice
        };
    };

    const getBudgetRecommendation = (preference, eventType, eventDetails) => {
        const analysis = analyzeEventDetails(eventDetails, eventType);
        const baseRecommendation = analysis.suggestedRange;

        let adjustedRange = baseRecommendation;
        if (preference === "1") {
            const currentMin = parseInt(baseRecommendation.split('-')[0]);
            adjustedRange = currentMin <= 500 ? '0-500' : `${currentMin-500}-${currentMin}`;
        } else if (preference === "3") {
            const currentMax = baseRecommendation.includes('+') ? 4500 : parseInt(baseRecommendation.split('-')[1]);
            adjustedRange = currentMax >= 4000 ? '4000+' : `${currentMax}-${currentMax+500}`;
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

    return (
        <div className='request-form-overall-container'>
            {isAuthModalOpen && <AuthModal setIsModalOpen={setIsAuthModalOpen} onSuccess={handleAuthSuccess} />}
            {isModalOpen && <SignInModal setIsModalOpen={setIsModalOpen} />}
            {isFlowerModalOpen && <FlowerModal photo={selectedFlower} onClose={() => setIsFlowerModalOpen(false)} />}
            <div className="request-form-status-container desktop-only" style={{ height: '75vh', padding:'40px' }}>
                <div className="request-form-box">
                    <StatusBar steps={getSteps()} currentStep={currentStep} />
                </div>
            </div>
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <div className="form-header-section">
                    <h2 className="request-form-header">
                    {getSteps()[currentStep]}
                </h2>
                    <BidScoreIndicator score={bidScore} message={scoreMessage} />
                </div>
                {/* Mobile status bar */}
                <div className="request-form-status-container mobile-only">
                    <div className="request-form-box">
                        <StatusBar steps={getSteps()} currentStep={currentStep} />
                    </div>
                </div>
                            {/* Display selected vendor information */}
            {selectedVendor && (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
                    <img src={vendorImage} alt={selectedVendor.business_name} className="vendor-profile-image" style={{marginRight:'8px'}}/>
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

export default FloristRequest;
