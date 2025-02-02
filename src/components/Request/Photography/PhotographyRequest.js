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

function PhotographyRequest() {
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

    // Consolidated state
    const [formData, setFormData] = useState(() => {
        const saved = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        return {
            eventType: saved.eventType || '',
            eventDetails: saved.eventDetails || {
                eventTitle: '',
                location: '',
                dateType: 'specific',
                startDate: '',
                endDate: '',
                timeOfDay: '',
                numPeople: '',
                duration: '',
                indoorOutdoor: '',
                additionalComments: '',
                priceRange: ''
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
        'Photography Details',
        formData.eventType ? `${formData.eventType} Details` : 'Event Details',
        'Personal Details',
        'Add Photos',
        'Review'
    ];

    const handleEventSelect = (event) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                eventType: event
            };
            // Save to localStorage
            localStorage.setItem('photographyRequest', JSON.stringify(newData));
            return newData;
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            localStorage.setItem('photographyRequest', JSON.stringify(newData));
            return newData;
        });
    };

    // Event Selection Component
    const renderEventSelection = () => {
        const eventOptions = [
            'Wedding', 'Engagement', 'Couples Session', 'Family',
            'Individual / Headshots', 'Large Group / Event',
            'Product', 'Maternity', 'Newborn', 'Boudoir Session'
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

    // Event Details Component
    const renderEventDetails = () => {
        return (
            <form ref={formRef} style={{minWidth:'100%'}}>
                <div className='form-grid'>
                    <div className="custom-input-container">
                        <input
                            type="text"
                            name="eventTitle"
                            value={formData.eventDetails.eventTitle}
                            onChange={(e) => handleInputChange('eventDetails', {
                                ...formData.eventDetails,
                                eventTitle: e.target.value
                            })}
                            className="custom-input"
                            id="eventTitle"
                        />
                        <label htmlFor="eventTitle" className="custom-label">
                            Title
                        </label>
                    </div>

                    <div className="custom-input-container">
                        <input
                            type="text"
                            name="location"
                            value={formData.eventDetails.location}
                            onChange={(e) => handleInputChange('eventDetails', {
                                ...formData.eventDetails,
                                location: e.target.value
                            })}
                            className="custom-input"
                        />
                        <label htmlFor="location" className="custom-label">
                            Location
                        </label>
                    </div>

                    <div className="custom-input-container">
                        <select
                            name="dateType"
                            value={formData.eventDetails.dateType}
                            onChange={(e) => handleInputChange('eventDetails', {
                                ...formData.eventDetails,
                                dateType: e.target.value
                            })}
                            className="custom-input"
                            style={{height:'56px'}}
                        >
                            <option value="specific">Specific Date</option>
                            <option value="range">Date Range</option>
                        </select>
                        <label htmlFor="dateType" className="custom-label">
                            Date Type
                        </label>
                    </div>

                    {/* Start Date */}
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
                            {formData.eventDetails.dateType === 'range' ? 'Start Date' : 'Date'}
                        </label>
                    </div>

                    {/* End Date (conditional) */}
                    {formData.eventDetails.dateType === 'range' && (
                        <div className="custom-input-container">
                            <input
                                type="date"
                                name="endDate"
                                value={formData.eventDetails.endDate || ''}
                                onChange={(e) => handleInputChange('eventDetails', {
                                    ...formData.eventDetails,
                                    endDate: e.target.value
                                })}
                                className="custom-input"
                            />
                            <label htmlFor="endDate" className="custom-label">
                                End Date
                            </label>
                        </div>
                    )}

                    {/* Time of Day */}
                    <div className="custom-input-container">
                        <input
                            type="time"
                            name="timeOfDay"
                            value={formData.eventDetails.timeOfDay}
                            onChange={(e) => handleInputChange('eventDetails', {
                                ...formData.eventDetails,
                                timeOfDay: e.target.value
                            })}
                            className="custom-input"
                        />
                        <label htmlFor="timeOfDay" className="custom-label">
                            Time of Day
                        </label>
                    </div>

                    {/* Number of People */}
                    <div className="custom-input-container">
                        <input
                            type="number"
                            name="numPeople"
                            value={formData.eventDetails.numPeople}
                            onChange={(e) => handleInputChange('eventDetails', {
                                ...formData.eventDetails,
                                numPeople: e.target.value
                            })}
                            className="custom-input"
                        />
                        <label htmlFor="numPeople" className="custom-label">
                            Number of People
                        </label>
                    </div>

                    {/* Duration */}
                    <div className="custom-input-container">
                        <input
                            type="number"
                            name="duration"
                            value={formData.eventDetails.duration}
                            onChange={(e) => handleInputChange('eventDetails', {
                                ...formData.eventDetails,
                                duration: e.target.value
                            })}
                            className="custom-input"
                        />
                        <label htmlFor="duration" className="custom-label">
                            Duration (in hours)
                        </label>
                    </div>

                    {/* Indoor/Outdoor */}
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
                        </select>
                        <label htmlFor="indoorOutdoor" className="custom-label">
                            Indoor/Outdoor
                        </label>
                    </div>

                    {/* Budget Range */}
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
                            <option value="">Select a Budget Range</option>
                            <option value="0-$500">$0 - $500</option>
                            <option value="501-$1000">$501 - $1,000</option>
                            <option value="1001-$1500">$1,001 - $1,500</option>
                            <option value="1501-$2000">$1,501 - $2,000</option>
                            <option value="2001-$2500">$2,001 - $2,500</option>
                            <option value="2501-$3000">$2,501 - $3,000</option>
                            <option value="3001+">$3,001+</option>
                        </select>
                        <label htmlFor="priceRange" className="custom-label">
                            Budget
                        </label>
                    </div>
                </div>

                <div className="custom-input-container">
                    <ReactQuill 
                        theme="snow"
                        value={formData.eventDetails.additionalComments}
                        onChange={(content) => handleInputChange('eventDetails', {
                            ...formData.eventDetails,
                            additionalComments: content
                        })}
                        modules={modules}
                        style={{
                            height: '200px',
                            marginBottom: '50px'
                        }}
                    />
                    <label htmlFor="additionalComments" className="custom-label">
                        Additional Comments
                    </label>
                </div>
            </form>
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
                localStorage.setItem('photographyRequest', JSON.stringify(newData));
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
                localStorage.setItem('photographyRequest', JSON.stringify(newData));
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
            </div>
        );
    };

    // Summary Component
    const renderSummary = () => {
        return (
            <div className="event-summary-container">
                <div className="request-grid">
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Event Type</div>
                        <div className="request-info">{formData.eventType}</div>  
                    </div>  

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Title</div>
                        <div className="request-info">{formData.eventDetails.eventTitle}</div>  
                    </div>  
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">{formData.eventDetails.dateType === 'range' ? 'Start Date ' : 'Date '}</div>
                        <div className="request-info">{formData.eventDetails.startDate ? new Date(formData.eventDetails.startDate).toLocaleDateString() : ''}</div>
                    </div>

                    {formData.eventDetails.dateType === 'range' && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <div className="request-subtype">End Date</div>
                            <div className="request-info">{formData.eventDetails.endDate ? new Date(formData.eventDetails.endDate).toLocaleDateString() : ''}</div>
                        </div>
                    )}

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Location</div>
                        <div className="request-info">{formData.eventDetails.location}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Time of Day</div>
                        <div className="request-info">{formData.eventDetails.timeOfDay}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Number of People</div>
                        <div className="request-info">{formData.eventDetails.numPeople}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Duration (in hours)</div>
                        <div className="request-info">{formData.eventDetails.duration}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Indoor/Outdoor</div>
                        <div className="request-info">{formData.eventDetails.indoorOutdoor}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Budget</div>
                        <div className="request-info">{formData.eventDetails.priceRange}</div>
                    </div>
                </div>

                {formData.eventDetails.additionalComments && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column', 
                        gap: '8px', 
                        alignItems:'flex-start',
                        marginTop: '20px'
                    }}>
                        <div className="request-subtype">Additional Comments</div>
                        <div 
                            className="quill-content"
                            dangerouslySetInnerHTML={{ __html: formData.eventDetails.additionalComments }}
                        />
                    </div>
                )}

                {/* {formData.photos.length > 0 && (
                    <div className="photos-section" style={{overflowY:'auto', marginTop: '20px'}}>
                        <div className="photo-grid">
                            {formData.photos.map((photo, index) => (
                                <div key={index} className="photo-grid-item">
                                    <img
                                        src={photo.url}
                                        alt={`Inspiration ${index + 1}`}
                                        className="photo"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )} */}

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
                    .from('photography_requests')
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
    
            // Validate and convert integer fields
            const numPeople = formData.eventDetails.numPeople ? parseInt(formData.eventDetails.numPeople, 10) : null;
            const duration = formData.eventDetails.duration ? parseInt(formData.eventDetails.duration, 10) : null;
    
            // Create the request with coupon_code as foreign key
            const requestData = {
                profile_id: user.id,
                event_type: formData.eventType,
                event_title: formData.eventDetails.eventTitle,
                location: formData.eventDetails.location,
                start_date: formData.eventDetails.startDate,
                end_date: formData.eventDetails.endDate || null,
                time_of_day: formData.eventDetails.timeOfDay,
                num_people: numPeople,
                duration: duration,
                indoor_outdoor: formData.eventDetails.indoorOutdoor,
                price_range: formData.eventDetails.priceRange,
                additional_comments: formData.eventDetails.additionalComments,
                date_type: formData.eventDetails.dateType, // Add date_type field
                coupon_code: appliedCoupon ? appliedCoupon.code : null,  // Just store the code
                status: 'open'
            };
    
            const { data: request, error: requestError } = await supabase
                .from('photography_requests')
                .insert([requestData])
                .select()
                .single();
    
            if (requestError) throw requestError;
    
            // Upload photos if there are any
            if (formData.photos.length > 0) {
                const uploadPromises = formData.photos.map(async (photo) => {
                    const fileExt = photo.name.split('.').pop();
                    const fileName = `${uuidv4()}.${fileExt}`;
                    const filePath = `${user.id}/${request.id}/${fileName}`;
    
                    // Upload the file
                    const { error: uploadError } = await supabase.storage
                        .from('request-media')
                        .upload(filePath, photo.file);
    
                    if (uploadError) throw uploadError;
    
                    // Get the public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('request-media')
                        .getPublicUrl(filePath);
    
                    // Store the photo reference in the database
                    const { error: photoError } = await supabase
                        .from('event_photos')
                        .insert([{
                            request_id: request.id,
                            photo_url: publicUrl,
                            file_path: filePath,
                            user_id: user.id // Add user_id field
                        }]);
    
                    if (photoError) throw photoError;
    
                    return publicUrl;
                });
    
                await Promise.all(uploadPromises);
            }
    
            // Clear form data and navigate to success page
            localStorage.removeItem('photographyRequest');
            navigate('/success-request', { 
                state: { 
                    requestId: request.id,
                    message: 'Your photography request has been submitted successfully!'
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

    const handleNext = async () => {
        if (currentStep === getSteps().length - 1) {
            handleSubmit();
        } else if (currentStep === 1) { // After event details
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) {
                setIsAuthModalOpen(true);
                return;
            }
            setCurrentStep(prev => prev + 1);
        } else if (currentStep === 2) { // After personal details
            const success = await updateUserProfile();
            if (success) {
                setCurrentStep(prev => prev + 1);
            }
            // If not successful, the error will be shown via the error state
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep === 0) {
            navigate('/request-categories');
        } else {
            setCurrentStep(prev => prev - 1);
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
            <div className="request-form-status-container">
                <div className="request-form-box">
                    <StatusBar steps={getSteps()} currentStep={currentStep} />
                </div>
            </div>

            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <h2 className="request-form-header" style={{textAlign:'left',marginLeft:"20px"}}>
                    {getSteps()[currentStep]}
                </h2>
                <div className="form-scrollable-content">
                    {getCurrentComponent()}
                </div>

                <div className="form-button-container">
                    <button className="request-form-back-and-foward-btn" onClick={handleBack} disabled={isSubmitting}>
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

export default PhotographyRequest;
