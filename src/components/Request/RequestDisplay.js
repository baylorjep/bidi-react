import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../App.css';
import { supabase } from '../../supabaseClient';
import './RequestDisplayModern.css';

// Helper function to check if a value has meaningful data
const hasValue = (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
};

// Helper function to format and check if a value should be displayed
const formatAndCheckValue = (value, formatter = null) => {
    if (!hasValue(value)) return null;
    
    if (formatter) {
        const formatted = formatter(value);
        return hasValue(formatted) && formatted !== 'Not specified' && formatted !== 'None selected' ? formatted : null;
    }
    
    return value;
};

// Helper function to check if there are photos to display
const hasPhotos = (photos) => {
    return photos && photos.length > 0;
};

// Collapsible Section Component
const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="rdm-collapsible">
            <button
                className="rdm-collapsible-header"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{title}</span>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}
                >
                    <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
            <div
                className="rdm-collapsible-content"
                style={{
                    maxHeight: isOpen ? '1000px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease',
                }}
            >
                <div>{children}</div>
            </div>
        </div>
    );
};

// Helper Components
const InfoField = ({ label, value, gridColumn = 'auto' }) => {
    if (!hasValue(value)) return null;
    return (
        <div className="rdm-info-row" style={{ gridColumn }}>
            <span className="rdm-info-label">{label}</span>
            <span className="rdm-info-value">{value}</span>
        </div>
    );
};

const PhotoGrid = ({ photos, onPhotoClick, getPublicUrl }) => {
    if (!photos || photos.length === 0) return null;
    return (
        <div className="rdm-photo-grid">
            {photos.map((photo, index) => {
                const publicUrl = getPublicUrl(photo.file_path);
                return (
                    <div className="rdm-photo-item" key={index} onClick={() => onPhotoClick(photo)}>
                        <img
                            src={publicUrl || photo.photo_url}
                            alt={`Photo ${index + 1}`}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/150?text=Image+Failed';
                            }}
                            loading="lazy"
                        />
                    </div>
                );
            })}
        </div>
    );
};

const PhotoModal = ({ photo, onClose, getPublicUrl }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content-photo" onClick={e => e.stopPropagation()}>
            <button 
                className="remove-photo-button"
                style={{ position: 'absolute', right: '10px', top: '10px' }}
                onClick={onClose}
            >
                X
            </button>
            <img 
                src={getPublicUrl(photo.file_path) || photo.photo_url} 
                alt="Full size" 
                style={{ maxWidth: '100%', maxHeight: '90vh' }}
            />
        </div>
    </div>
);

// Request Type Specific Components
const WeddingPlanningRequest = ({ request, filteredPhotos, onPhotoClick, getPublicUrl }) => {
    const formatPlanningLevel = (level) => {
        const levels = {
            'full': 'Full Planning',
            'partial': 'Partial Planning',
            'elopement': 'Elopement',
            'micro': 'Micro Wedding',
            'month-of': 'Month-of Coordination',
            'day-of': 'Day-of Coordination'
        };
        return levels[level] || level;
    };

    const formatWeddingStyle = (style) => {
        const styles = {
            'backyard': 'Backyard',
            'church': 'Church',
            'event_center': 'Event Center',
            'venue': 'Venue',
            'other': 'Other'
        };
        return styles[style] || style;
    };

    const formatVenueStatus = (status) => {
        const statuses = {
            'booked': 'Venue Booked',
            'shortlist': 'Shortlist Selected',
            'searching': 'Still Searching'
        };
        return statuses[status] || status;
    };

    const formatVendorPreferences = (prefs) => {
        if (!prefs) return null;
        
        const preferences = typeof prefs === 'string' ? JSON.parse(prefs) : prefs;
        const preferenceTypes = {
            'existing': 'Use Existing Vendors',
            'new': 'Find New Vendors',
            'mix': 'Mix of Existing and New Vendors'
        };
        
        let displayText = preferenceTypes[preferences.preference];
        if (preferences.existing_vendors) {
            displayText += `\nExisting Vendors: ${preferences.existing_vendors}`;
        }
        
        return displayText;
    };

    const formatAdditionalEvents = (events) => {
        if (!events) return null;
        
        const eventList = typeof events === 'string' ? JSON.parse(events) : events;
        const eventTypes = {
            'rehearsalDinner': 'Rehearsal Dinner',
            'dayAfterBrunch': 'Day After Brunch',
            'bachelorParty': 'Bachelor Party',
            'bridalParty': 'Bridal Party'
        };
        
        const selectedEvents = Object.entries(eventList)
            .filter(([_, value]) => value)
            .map(([key]) => eventTypes[key] || key.replace(/([A-Z])/g, ' $1').trim());
            
        return selectedEvents.length > 0 ? selectedEvents.join(', ') : null;
    };

    const formatExperienceLevel = (level) => {
        const levels = {
            'beginner': 'Beginner',
            'intermediate': 'Intermediate',
            'expert': 'Expert'
        };
        return levels[level] || level;
    };

    const formatCommunicationStyle = (style) => {
        const styles = {
            'email': 'Email',
            'phone': 'Phone',
            'text': 'Text',
            'video': 'Video Call'
        };
        return styles[style] || style;
    };

    const formatDateInfo = () => {
        const formatDateWithTimezone = (dateString) => {
            if (!dateString) return null;
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
        };

        if (request.date_flexibility === 'specific' && request.start_date) {
            return formatDateWithTimezone(request.start_date);
        } else if (request.date_flexibility === 'range' && request.start_date && request.end_date) {
            return `${formatDateWithTimezone(request.start_date)} - ${formatDateWithTimezone(request.end_date)}`;
        } else if (request.date_flexibility === 'flexible' && request.date_timeframe) {
            const timeframes = {
                '3months': 'Within 3 months',
                '6months': 'Within 6 months',
                '1year': 'Within 1 year',
                'more': 'More than 1 year'
            };
            return timeframes[request.date_timeframe];
        }
        return null;
    };

    const formatTimeInfo = () => {
        const startTime = request.start_time || (request.start_time_unknown ? null : 'TBD');
        const endTime = request.end_time || (request.end_time_unknown ? null : 'TBD');
        
        if (startTime || endTime) {
            return `${startTime ? `Start: ${startTime}` : 'Start time TBD'}
                   ${endTime ? `\nEnd: ${endTime}` : '\nEnd time TBD'}`;
        }
        return null;
    };

    // Check if there are any additional details to show in collapsible sections
    const hasVenueDetails = hasValue(request.indoor_outdoor) || hasValue(formatVenueStatus(request.venue_status));
    const hasBudgetDetails = hasValue(request.budget_range) || hasValue(request.planner_budget);
    const hasStyleDetails = hasValue(request.color_scheme) || hasValue(request.theme_preferences);
    const hasVendorDetails = hasValue(formatVendorPreferences(request.vendor_preferences));
    const hasEventDetails = hasValue(formatAdditionalEvents(request.additional_events));
    const hasExperienceDetails = hasValue(formatExperienceLevel(request.experience_level)) || hasValue(formatCommunicationStyle(request.communication_style));
    const hasAdditionalInfo = hasValue(request.additional_comments) || hasValue(request.coupon_code);

    return (
        <div className="rdm-request-summary-grid">
            {/* Main Details - Always Visible */}
            <InfoField label="Event Title" value={request.event_title} gridColumn="1 / -1" />
            <InfoField label="Event Type" value={request.event_type} />
            <InfoField label="Location" value={request.location} />
            <InfoField label="Planning Level" value={formatAndCheckValue(request.planning_level, formatPlanningLevel)} />
            <InfoField label="Wedding Style" value={formatAndCheckValue(request.wedding_style, formatWeddingStyle)} />
            <InfoField label="Event Date" value={formatDateInfo()} />
            <InfoField label="Event Time" value={formatTimeInfo()} />
            <InfoField label="Expected Guests" value={request.guest_count} />

            {/* Pinterest Board - Always Visible */}
            {request.pinterest_link && (
                <InfoField 
                    label="Pinterest Board" 
                    value={
                        <a 
                            href={request.pinterest_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#f6eafe',
                                color: '#9633eb',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                textDecoration: 'none',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                border: '1px solid #f0e6ff'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#f0e6ff';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#f6eafe';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            View Board
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ transition: 'transform 0.2s ease' }}
                            >
                                <path 
                                    d="M7 17L17 7M17 7H8M17 7V16" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </a>
                    } 
                />
            )}

            {/* Collapsible Sections */}
            {hasVenueDetails && (
                <CollapsibleSection title="Venue Details">
                    <div className="rdm-request-summary-grid">
                        <InfoField label="Venue Type" value={request.indoor_outdoor} />
                        <InfoField label="Venue Status" value={formatAndCheckValue(request.venue_status, formatVenueStatus)} />
                    </div>
                </CollapsibleSection>
            )}

            {hasBudgetDetails && (
                <CollapsibleSection title="Budget Information">
                    <div className="rdm-request-summary-grid">
                        <InfoField label="Budget Range" value={request.budget_range ? `$${request.budget_range}` : null} />
                        <InfoField label="Planner Budget" value={request.planner_budget ? `$${request.planner_budget}` : null} />
                    </div>
                </CollapsibleSection>
            )}

            {hasStyleDetails && (
                <CollapsibleSection title="Style & Theme">
                    <div className="rdm-request-summary-grid">
                        <InfoField label="Color Scheme" value={request.color_scheme} />
                        <InfoField label="Theme Preferences" value={request.theme_preferences} />
                    </div>
                </CollapsibleSection>
            )}

            {hasVendorDetails && (
                <CollapsibleSection title="Vendor Preferences">
                    <div className="rdm-request-summary-grid">
                        <InfoField label="Vendor Preferences" value={formatAndCheckValue(request.vendor_preferences, formatVendorPreferences)} gridColumn="1 / -1" />
                    </div>
                </CollapsibleSection>
            )}

            {hasEventDetails && (
                <CollapsibleSection title="Additional Events">
                    <div className="rdm-request-summary-grid">
                        <InfoField label="Additional Events" value={formatAndCheckValue(request.additional_events, formatAdditionalEvents)} gridColumn="1 / -1" />
                    </div>
                </CollapsibleSection>
            )}

            {hasExperienceDetails && (
                <CollapsibleSection title="Experience & Communication">
                    <div className="rdm-request-summary-grid">
                        <InfoField label="Experience Level" value={formatAndCheckValue(request.experience_level, formatExperienceLevel)} />
                        <InfoField label="Communication Style" value={formatAndCheckValue(request.communication_style, formatCommunicationStyle)} />
                    </div>
                </CollapsibleSection>
            )}

            {hasAdditionalInfo && (
                <CollapsibleSection title="Additional Information">
                    <div className="rdm-request-summary-grid">
                        {request.additional_comments && (
                            <InfoField 
                                label="Additional Comments" 
                                value={<div dangerouslySetInnerHTML={{ __html: request.additional_comments }} />} 
                                gridColumn="1 / -1" 
                            />
                        )}
                        {request.coupon_code && (
                            <InfoField label="Coupon Code" value={request.coupon_code} />
                        )}
                    </div>
                </CollapsibleSection>
            )}

            {hasPhotos(filteredPhotos) && (
                <CollapsibleSection title="Inspiration Photos"><PhotoGrid 
                    photos={filteredPhotos} 
                    onPhotoClick={onPhotoClick} 
                    getPublicUrl={getPublicUrl} 
                /></CollapsibleSection>
            )}
        </div>
    );
};

// Main Component
function RequestDisplay({ request, servicePhotos, hideBidButton, requestType, loading = false }) {
    const navigate = useNavigate();
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [filteredPhotos, setFilteredPhotos] = useState([]);
    const [bidStats, setBidStats] = useState({ min: null, max: null, avg: null });

    useEffect(() => {
        if (!request) return;
        // If servicePhotos are provided, use them. Otherwise, fetch from the correct table.
        if (servicePhotos && servicePhotos.length > 0) {
            setFilteredPhotos(servicePhotos);
            return;
        }
        const fetchPhotos = async () => {
            try {
                let photoTable;
                // Only 'requests' (general/regular) use service_photos, others use their own tables
                switch (getRequestType()) {
                    case 'photography_requests':
                        photoTable = 'event_photos';
                        break;
                    case 'dj_requests':
                        photoTable = 'dj_photos';
                        break;
                    case 'catering_requests':
                        photoTable = 'catering_photos';
                        break;
                    case 'beauty_requests':
                        photoTable = 'beauty_photos';
                        break;
                    case 'videography_requests':
                        photoTable = 'videography_photos';
                        break;
                    case 'florist_requests':
                        photoTable = 'florist_photos';
                        break;
                    case 'wedding_planning_requests':
                        photoTable = 'wedding_planning_photos';
                        break;
                    default:
                        photoTable = 'service_photos'; // For 'requests' (general/regular)
                }
                const { data: photos, error } = await supabase
                    .from(photoTable)
                    .select('*')
                    .eq('request_id', request.id)
                    .order('created_at', { ascending: false });
                if (error) {
                    console.error('Error fetching photos:', error);
                    setFilteredPhotos([]);
                } else {
                    setFilteredPhotos(photos);
                }
            } catch (err) {
                console.error('Error in fetchPhotos:', err);
                setFilteredPhotos([]);
            }
        };
        fetchPhotos();
    }, [request, servicePhotos]);

    // Fetch bid statistics
    useEffect(() => {
        if (!request) return;
        const fetchBidStats = async () => {
            try {
                const { data: bids, error } = await supabase
                    .from('bids')
                    .select('bid_amount')
                    .eq('request_id', request.id);

                if (error) throw error;

                if (bids && bids.length > 0) {
                    const amounts = bids.map(bid => parseFloat(bid.bid_amount));
                    setBidStats({
                        min: Math.min(...amounts),
                        max: Math.max(...amounts),
                        avg: amounts.reduce((a, b) => a + b, 0) / amounts.length
                    });
                }
            } catch (error) {
                console.error('Error fetching bid statistics:', error);
            }
        };
        fetchBidStats();
    }, [request]);

    useEffect(() => {
        if (!request) return;
        const timer = setInterval(() => {
            const promotion = checkPromotion(request.created_at);
            if (promotion && promotion.endTime) {
                const now = new Date();
                const timeRemaining = promotion.endTime.getTime() - now.getTime();
                
                if (timeRemaining > 0) {
                    const totalSeconds = Math.floor(timeRemaining / 1000);
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                } else {
                    setTimeLeft('');
                }
            } else {
                setTimeLeft('');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [request?.created_at]);

    if (loading) {
        return (
            <div className="request-display text-center mb-4">
                <div className="request-content p-3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <div
                        className="spinner-border"
                        role="status"
                        style={{
                            width: 48,
                            height: 48,
                            marginBottom: 16,
                            color: '#8000ff',
                            borderColor: '#8000ff',
                            borderRightColor: 'transparent'
                        }}
                        >
                        <span className="visually-hidden">Loading...</span>
                        </div>
                    <div style={{ fontSize: 18, color: '#555' }}>Loading...</div>
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="request-display text-center mb-4">
                <div className="request-content p-3">
                    <h2 className="request-title">Oops! We couldn't find that request.</h2>
                    <p>Please check your open requests in your dashboard.</p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, width: '100%' }}>
                        <button className="submit-bid-button" onClick={() => navigate('/business-dashboard')}>
                            Go to Requests
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isNew = (createdAt) => {
        if (!createdAt) return false;
        const now = new Date();
        const created = new Date(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return diffInDays < 7;
    };

    const getRequestType = () => {
        if (requestType === 'wedding_planning_requests') return 'wedding_planning_requests';
        if (requestType === 'florist_requests') return 'florist_requests';
        if (requestType) return requestType;
        if (request.table_name) return request.table_name;
        
        if (request.service_type && ['both', 'hair', 'makeup'].includes(request.service_type)) {
            return 'beauty_requests';
        }
        
        if (request.hasOwnProperty('event_title') && !request.hasOwnProperty('floral_arrangements')) {
            return 'photography_requests';
        }
        
        if (request.hasOwnProperty('floral_arrangements') || 
            request.hasOwnProperty('flower_preferences') || 
            request.colors || 
            request.additional_services?.setupAndTakedown) {
            return 'florist_requests';
        }
        
        if (request.hasOwnProperty('videographer_needed') || 
            request.hasOwnProperty('style_preferences') || 
            request.table_name === 'videography_requests') {
            return 'videography_requests';
        }
        
        return 'regular';
    };

    const getTitle = () => {
        const type = getRequestType();
        switch (type) {
            case 'dj_requests':
                return request.title || `${request.event_type} DJ Request`;
            case 'catering_requests':
                return request.title || request.event_title || `${request.event_type} Catering Request`;
            case 'photography_requests':
                return request.event_title;
            case 'beauty_requests':
                return request.event_title || `${request.event_type} Beauty Request`;
            case 'videography_requests':
                return request.event_title || `${request.event_type} Video Request`;
            case 'florist_requests':
                return request.event_title || `${request.event_type} Florist Request`;
            default:
                return request.service_title;
        }
    };

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
    };

    const handleCloseModal = () => {
        setSelectedPhoto(null);
    };

    const getPublicUrl = (filePath) => {
        try {
            const { data } = supabase.storage
                .from('request-media')
                .getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error getting public URL:', error);
            return null;
        }
    };

    const checkPromotion = (createdAt) => {
        if (!createdAt) return null;

        const createdParts = createdAt.split(/[^0-9]/);
        const year = parseInt(createdParts[0]);
        const month = parseInt(createdParts[1]) - 1;
        const day = parseInt(createdParts[2]);
        const hour = parseInt(createdParts[3]);
        const minute = parseInt(createdParts[4]);
        const second = parseInt(createdParts[5]);
        const millisecond = parseInt(createdParts[6].substr(0, 3));

        const created = Date.UTC(year, month, day, hour, minute, second, millisecond);
        const now = Date.now();

        const localCreated = new Date(createdAt);
        const createdDate = localCreated.toLocaleDateString('en-CA');
        const specialDates = ['2025-01-11', '2025-01-25'];

        if (!specialDates.includes(createdDate)) {
            return null;
        }

        const msSinceCreation = now - created;
        const minutesSinceCreation = msSinceCreation / (1000 * 60);

        if (minutesSinceCreation < 30) {
            return {
                message: "⚡ Save 2% (Now 6% vs. 8%)",
                endTime: new Date(created + (30 * 60 * 1000))
            };
        }
        if (minutesSinceCreation < 60) {
            return {
                message: "⏳ Save 1% (Now 7% vs. 8%)",
                endTime: new Date(created + (60 * 60 * 1000))
            };
        }

        return null;
    };



    const renderRequestDetails = () => {
        const type = getRequestType();
        
        switch (type) {
            case 'wedding_planning_requests':
                return (
                    <WeddingPlanningRequest 
                        request={request}
                        filteredPhotos={filteredPhotos}
                        onPhotoClick={handlePhotoClick}
                        getPublicUrl={getPublicUrl}
                    />
                );
            case 'beauty_requests':
                // Check if there are service-specific details to show in collapsible sections
                const hasHairDetails = (request.service_type === 'both' || request.service_type === 'hair') && 
                    (hasValue(request.hairstyle_preferences) || hasValue(request.hair_length_type) || 
                     hasValue(request.extensions_needed) || hasValue(request.trial_session_hair));
                
                const hasMakeupDetails = (request.service_type === 'both' || request.service_type === 'makeup') && 
                    (hasValue(request.makeup_style_preferences) || hasValue(request.skin_type_concerns) || 
                     hasValue(request.preferred_products_allergies) || hasValue(request.lashes_included) || 
                     hasValue(request.trial_session_makeup));
                
                const hasServiceDetails = hasValue(request.group_discount_inquiry) || hasValue(request.on_site_service_needed);
                const hasAdditionalInfo = hasValue(request.additional_info);

                return (
                    <div className="rdm-request-summary-grid">
                        {/* Main Details - Always Visible */}
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Location" value={request.location} />
                        <InfoField 
                            label="Event Date" 
                            value={request.start_date ? new Date(request.start_date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : null} 
                        />
                        <InfoField label="Service Type" value={request.service_type} />
                        <InfoField label="Number of People" value={request.num_people} />
                        <InfoField label="Budget Range" value={request.price_range ? `$${request.price_range}` : null} />

                        {/* Pinterest Board - Always Visible */}
                        {request.pinterest_link && (
                            <InfoField 
                                label="Pinterest Board" 
                                value={
                                    <a 
                                        href={request.pinterest_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: '#f6eafe',
                                            color: '#9633eb',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            textDecoration: 'none',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease',
                                            border: '1px solid #f0e6ff'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = '#f0e6ff';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = '#f6eafe';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        View Board
                                        <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            xmlns="http://www.w3.org/2000/svg"
                                            style={{ transition: 'transform 0.2s ease' }}
                                        >
                                            <path 
                                                d="M7 17L17 7M17 7H8M17 7V16" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </a>
                                } 
                            />
                        )}

                        {/* Collapsible Sections */}
                        {hasHairDetails && (
                            <CollapsibleSection title="Hair Services">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Hairstyle Preferences" value={request.hairstyle_preferences} />
                                    <InfoField label="Hair Length & Type" value={request.hair_length_type} />
                                    <InfoField label="Extensions Needed" value={request.extensions_needed} />
                                    <InfoField label="Trial Session for Hair" value={request.trial_session_hair} />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasMakeupDetails && (
                            <CollapsibleSection title="Makeup Services">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Makeup Style Preferences" value={request.makeup_style_preferences} />
                                    <InfoField label="Skin Type & Concerns" value={request.skin_type_concerns} />
                                    <InfoField label="Preferred Products or Allergies" value={request.preferred_products_allergies} />
                                    <InfoField label="Lashes Included" value={request.lashes_included} />
                                    <InfoField label="Trial Session for Makeup" value={request.trial_session_makeup} />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasServiceDetails && (
                            <CollapsibleSection title="Service Details">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Group Discount Inquiry" value={request.group_discount_inquiry} />
                                    <InfoField label="On-Site Service Needed" value={request.on_site_service_needed} />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasAdditionalInfo && (
                            <CollapsibleSection title="Additional Information">
                                <div className="rdm-request-summary-grid">
                                    <InfoField 
                                        label="Additional Information" 
                                        value={<div dangerouslySetInnerHTML={{ __html: request.additional_info }} />} 
                                        gridColumn="1 / -1" 
                                    />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasPhotos(filteredPhotos) && (
                            <CollapsibleSection title="Inspiration Photos"><PhotoGrid 
                                photos={filteredPhotos} 
                                onPhotoClick={handlePhotoClick} 
                                getPublicUrl={getPublicUrl} 
                            /></CollapsibleSection>
                        )}
                    </div>
                );
            case 'photography_requests':
                const formatPhotographyDate = () => {
                    const formatDateWithTimezone = (dateString) => {
                        if (!dateString) return null;
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
                    };

                    if (request.date_flexibility === 'specific' && request.start_date) {
                        return formatDateWithTimezone(request.start_date);
                    } else if (request.date_flexibility === 'range' && request.start_date && request.end_date) {
                        return `${formatDateWithTimezone(request.start_date)} - ${formatDateWithTimezone(request.end_date)}`;
                    } else if (request.date_flexibility === 'flexible' && request.date_timeframe) {
                        const timeframes = {
                            '3months': 'Within 3 months',
                            '6months': 'Within 6 months',
                            '1year': 'Within 1 year',
                            'more': 'More than 1 year'
                        };
                        return timeframes[request.date_timeframe];
                    }
                    return null;
                };

                const formatPhotographyTime = () => {
                    const startTime = request.start_time_unknown ? null : request.start_time;
                    const endTime = request.end_time_unknown ? null : request.end_time;
                    
                    if (startTime || endTime) {
                        return `${startTime ? `Start: ${startTime}` : 'Start time TBD'} - ${endTime ? `End: ${endTime}` : 'End time TBD'}`;
                    }
                    return null;
                };

                const formatPhotographyPeople = () => {
                    return request.num_people_unknown ? null : request.num_people;
                };

                const formatPhotographyDuration = () => {
                    return request.duration_unknown ? null : request.duration;
                };

                const formatPhotographySecondPhotographer = () => {
                    return request.second_photographer_unknown ? null : request.second_photographer;
                };

                const formatPhotographyCoverage = () => {
                    if (!request.wedding_details) return null;
                    
                    try {
                        const details = typeof request.wedding_details === 'string'
                            ? JSON.parse(request.wedding_details)
                            : request.wedding_details;

                        const coverageLabels = {
                            preCeremony: 'Pre-Ceremony',
                            ceremony: 'Ceremony',
                            luncheon: 'Luncheon',
                            reception: 'Reception'
                        };

                        const selectedCoverage = Object.entries(details)
                            .filter(([_, value]) => value === true || value === 1 || value === 'true')
                            .map(([key]) => coverageLabels[key] || key);

                        return selectedCoverage.length > 0 ? selectedCoverage.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing wedding details:', e);
                        return null;
                    }
                };

                const formatPhotographyStyle = () => {
                    if (!request.style_preferences) return null;
                    
                    try {
                        const preferences = typeof request.style_preferences === 'string' 
                            ? JSON.parse(request.style_preferences)
                            : request.style_preferences;
                            
                        const styleLabels = {
                            cinematic: 'Cinematic Film Style',
                            documentary: 'Documentary Style',
                            journalistic: 'Journalistic',
                            artistic: 'Artistic & Experimental',
                            romantic: 'Romantic',
                            traditional: 'Traditional',
                            luxury: 'Luxury Production'
                        };

                        const selectedStyles = Object.entries(preferences)
                            .filter(([_, value]) => value === true)
                            .map(([key]) => styleLabels[key] || key);

                        return selectedStyles.length > 0 ? selectedStyles.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing style preferences:', e);
                        return null;
                    }
                };

                const formatPhotographyDeliverables = () => {
                    if (!request.deliverables) return null;
                    
                    try {
                        const delivs = typeof request.deliverables === 'string'
                            ? JSON.parse(request.deliverables)
                            : request.deliverables;

                        const deliverableLabels = {
                            digitalFiles: 'Digital Files',
                            printRelease: 'Print Release',
                            weddingAlbum: 'Wedding Album',
                            prints: 'Professional Prints',
                            rawFiles: 'RAW Footage',
                            engagement: 'Engagement Session'
                        };

                        const selectedDeliverables = Object.entries(delivs)
                            .filter(([_, value]) => value === true)
                            .map(([key]) => deliverableLabels[key] || key);

                        return selectedDeliverables.length > 0 ? selectedDeliverables.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing deliverables:', e);
                        return null;
                    }
                };

                const formatPhotographyCoverageDetails = () => {
                    if (!request.coverage) return null;
                    
                    try {
                        const coverage = typeof request.coverage === 'string'
                            ? JSON.parse(request.coverage)
                            : request.coverage;

                        const coverageLabels = {
                            preparation: 'Preparation',
                            ceremony: 'Ceremony',
                            reception: 'Reception',
                            firstLook: 'First Look',
                            bridalParty: 'Bridal Party',
                            familyPhotos: 'Family Photos',
                            speeches: 'Speeches',
                            dancing: 'Dancing',
                            sendOff: 'Send Off'
                        };

                        const selectedCoverage = Object.entries(coverage)
                            .filter(([_, value]) => value === true || value === 1 || value === 'true')
                            .map(([key]) => coverageLabels[key] || key);

                        return selectedCoverage.length > 0 ? selectedCoverage.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing coverage:', e);
                        return null;
                    }
                };

                // Check if there are service-specific details to show in collapsible sections
                const hasPhotographyCoverageDetails = hasValue(formatPhotographyCoverage()) || hasValue(formatPhotographyCoverageDetails());
                const hasPhotographyStyleDetails = hasValue(formatPhotographyStyle()) || hasValue(formatPhotographyDeliverables());
                const hasPhotographyServiceDetails = hasValue(formatPhotographySecondPhotographer()) || hasValue(formatPhotographyDuration());
                const hasPhotographyAdditionalInfo = hasValue(request.additional_info) || hasValue(request.additional_comments);

                return (
                    <div className="rdm-request-summary-grid">
                        {/* Main Details - Always Visible */}
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Location" value={request.location} />
                        <InfoField label="Date" value={formatPhotographyDate()} />
                        <InfoField label="Time" value={formatPhotographyTime()} />
                        <InfoField label="Number of People" value={formatPhotographyPeople()} />
                        <InfoField label="Indoor/Outdoor" value={request.indoor_outdoor} />
                        <InfoField label="Budget" value={request.price_range} />

                        {/* Pinterest Board - Always Visible */}
                        {request.pinterest_board && (
                            <InfoField 
                                label="Pinterest Board Link" 
                                value={
                                    <a href={request.pinterest_board} target="_blank" rel="noopener noreferrer">
                                        View Board
                                    </a>
                                } 
                            />
                        )}

                        {/* Collapsible Sections */}
                        {hasPhotographyCoverageDetails && (
                            <CollapsibleSection title="Coverage Details">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Wedding Coverage" value={formatPhotographyCoverage()} gridColumn="1 / -1" />
                                    <InfoField label="Coverage Details" value={formatPhotographyCoverageDetails()} gridColumn="1 / -1" />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasPhotographyStyleDetails && (
                            <CollapsibleSection title="Style & Deliverables">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Style Preferences" value={formatPhotographyStyle()} gridColumn="1 / -1" />
                                    <InfoField label="Deliverables" value={formatPhotographyDeliverables()} gridColumn="1 / -1" />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasPhotographyServiceDetails && (
                            <CollapsibleSection title="Service Options">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Second Photographer" value={formatPhotographySecondPhotographer()} />
                                    <InfoField label="Duration (in hours)" value={formatPhotographyDuration()} />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasPhotographyAdditionalInfo && (
                            <CollapsibleSection title="Additional Information">
                                <div className="rdm-request-summary-grid">
                                    {request.additional_info && (
                                        <InfoField 
                                            label="Additional Information" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.additional_info }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                    {request.additional_comments && (
                                        <InfoField 
                                            label="Additional Comments" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.additional_comments }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasPhotos(filteredPhotos) && (
                            <CollapsibleSection title="Inspiration Photos"><PhotoGrid 
                                photos={filteredPhotos} 
                                onPhotoClick={handlePhotoClick} 
                                getPublicUrl={getPublicUrl} 
                            /></CollapsibleSection>
                        )}
                    </div>
                );
            case 'dj_requests':
                const formatDjDate = () => {
                    const formatDateWithTimezone = (dateString) => {
                        if (!dateString) return null;
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
                    };

                    if (request.date_flexibility === 'specific' && request.start_date) {
                        return formatDateWithTimezone(request.start_date);
                    } else if (request.date_flexibility === 'range' && request.start_date && request.end_date) {
                        return `${formatDateWithTimezone(request.start_date)} - ${formatDateWithTimezone(request.end_date)}`;
                    } else if (request.date_flexibility === 'flexible' && request.date_timeframe) {
                        const timeframes = {
                            '3months': 'Within 3 months',
                            '6months': 'Within 6 months',
                            '1year': 'Within 1 year',
                            'more': 'More than 1 year'
                        };
                        return timeframes[request.date_timeframe];
                    }
                    return null;
                };

                const formatDjCoverage = () => {
                    if (!request.wedding_details || request.event_type !== 'Wedding') return null;
                    
                    try {
                        const details = typeof request.wedding_details === 'string'
                            ? JSON.parse(request.wedding_details)
                            : request.wedding_details;

                        const selectedCoverage = Object.entries(details)
                            .filter(([_, value]) => value)
                            .map(([key]) => key.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + key.slice(1));

                        return selectedCoverage.length > 0 ? selectedCoverage.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing wedding details:', e);
                        return null;
                    }
                };

                const formatDjMusicPreferences = () => {
                    if (!request.music_preferences) return null;
                    
                    try {
                        const musicLabels = {
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
                        
                        const musicPreferences = typeof request.music_preferences === 'string' 
                            ? JSON.parse(request.music_preferences)
                            : request.music_preferences;

                        const selectedMusic = Object.entries(musicPreferences)
                            .filter(([_, value]) => value)
                            .map(([key]) => musicLabels[key] || key.charAt(0).toUpperCase() + key.slice(1));

                        return selectedMusic.length > 0 ? selectedMusic.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing music preferences:', e);
                        return null;
                    }
                };

                const formatDjAdditionalServices = () => {
                    if (!request.additional_services || request.additional_services.length === 0) return null;
                    
                    const serviceNames = {
                        mcServices: '🎤 MC Services',
                        liveMixing: '🎶 Live Mixing',
                        uplighting: '🏮 Uplighting',
                        fogMachine: '🌫️ Fog Machine',
                        specialFx: '🎇 Special FX',
                        photoBooth: '📸 Photo Booth',
                        eventRecording: '🎥 Event Recording',
                        karaoke: '🎵 Karaoke'
                    };
                    
                    return request.additional_services.map(service => serviceNames[service] || service).join(', ');
                };

                // Check if there are service-specific details to show in collapsible sections
                const hasDjCoverageDetails = hasValue(formatDjCoverage()) || hasValue(request.event_duration) || hasValue(request.estimated_guests);
                const hasDjEquipmentDetails = hasValue(request.equipment_needed) || hasValue(request.equipment_notes);
                const hasDjMusicDetails = hasValue(formatDjMusicPreferences()) || hasValue(formatDjAdditionalServices()) || 
                                        hasValue(request.special_songs?.playlist) || hasValue(request.special_songs?.requests);
                const hasDjAdditionalInfo = hasValue(request.additional_info) || hasValue(request.additional_comments);

                return (
                    <div className="rdm-request-summary-grid">
                        {/* Main Details - Always Visible */}
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Location" value={request.location} />
                        <InfoField label="Event Date" value={formatDjDate()} />
                        <InfoField label="Venue Type" value={request.indoor_outdoor} />
                        <InfoField label="Budget Range" value={request.budget_range ? `$${request.budget_range}` : null} />

                        {/* Collapsible Sections */}
                        {hasDjCoverageDetails && (
                            <CollapsibleSection title="Event Coverage">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Event Coverage" value={formatDjCoverage()} gridColumn="1 / -1" />
                                    <InfoField label="Duration" value={request.event_duration ? `${request.event_duration} hours` : null} />
                                    <InfoField label="Expected Guests" value={request.estimated_guests} />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasDjEquipmentDetails && (
                            <CollapsibleSection title="Equipment & Setup">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Equipment Setup" value={request.equipment_needed} />
                                    {request.equipment_notes && (
                                        <InfoField 
                                            label="Equipment Notes" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.equipment_notes }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasDjMusicDetails && (
                            <CollapsibleSection title="Music & Services">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Music Preferences" value={formatDjMusicPreferences()} gridColumn="1 / -1" />
                                    <InfoField label="Additional Services" value={formatDjAdditionalServices()} gridColumn="1 / -1" />
                                    
                                    {request.special_songs?.playlist && (
                                        <InfoField 
                                            label="Music Playlist" 
                                            value={
                                                <a href={request.special_songs.playlist} target="_blank" rel="noopener noreferrer">
                                                    View Playlist
                                                </a>
                                            } 
                                        />
                                    )}

                                    {request.special_songs?.requests && (
                                        <InfoField 
                                            label="Special Song Requests" 
                                            value={<ReactQuill value={request.special_songs.requests} readOnly={true} theme="bubble" />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasDjAdditionalInfo && (
                            <CollapsibleSection title="Additional Information">
                                <div className="rdm-request-summary-grid">
                                    {request.additional_info && (
                                        <InfoField 
                                            label="Additional Information" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.additional_info }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                    {request.additional_comments && (
                                        <InfoField 
                                            label="Additional Comments" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.additional_comments }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasPhotos(filteredPhotos) && (
                            <CollapsibleSection title="Inspiration Photos"><PhotoGrid 
                                photos={filteredPhotos} 
                                onPhotoClick={handlePhotoClick} 
                                getPublicUrl={getPublicUrl} 
                            /></CollapsibleSection>
                        )}
                    </div>
                );
            case 'florist_requests':
                const formatFloristDate = () => {
                    const formatDateWithTimezone = (dateString) => {
                        if (!dateString) return null;
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
                    };

                    if (request.date_flexibility === 'specific' && request.start_date) {
                        return formatDateWithTimezone(request.start_date);
                    } else if (request.date_flexibility === 'range' && request.start_date && request.end_date) {
                        return `${formatDateWithTimezone(request.start_date)} - ${formatDateWithTimezone(request.end_date)}`;
                    } else if (request.date_flexibility === 'flexible' && request.date_timeframe) {
                        const timeframes = {
                            '3months': 'Within 3 months',
                            '6months': 'Within 6 months',
                            '1year': 'Within 1 year',
                            'more': 'More than 1 year'
                        };
                        return timeframes[request.date_timeframe];
                    }
                    return null;
                };

                const formatFloristTime = () => {
                    const startTime = request.start_time_unknown ? null : request.start_time;
                    const endTime = request.end_time_unknown ? null : request.end_time;
                    
                    if (startTime || endTime) {
                        return `${startTime ? `Start: ${startTime}` : 'Start time TBD'} - ${endTime ? `End: ${endTime}` : 'End time TBD'}`;
                    }
                    return null;
                };

                const formatFloristPeople = () => {
                    return request.num_people_unknown ? null : request.num_people;
                };

                const formatFloristDuration = () => {
                    return request.duration_unknown ? null : request.duration;
                };

                const formatFloristAdditionalServices = () => {
                    if (!request.additional_services) return null;
                    
                    try {
                        const services = typeof request.additional_services === 'string'
                            ? JSON.parse(request.additional_services)
                            : request.additional_services;

                        const serviceLabels = {
                            setupAndTakedown: 'Setup & Takedown',
                            delivery: 'Delivery',
                            installation: 'Installation',
                            consultation: 'Consultation',
                            customDesign: 'Custom Design',
                            preservation: 'Preservation'
                        };

                        const selectedServices = Object.entries(services)
                            .filter(([_, value]) => value === true)
                            .map(([key]) => serviceLabels[key] || key);

                        return selectedServices.length > 0 ? selectedServices.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing additional services:', e);
                        return null;
                    }
                };

                const formatFloristColors = () => {
                    if (!request.colors) return null;
                    
                    try {
                        const colors = typeof request.colors === 'string'
                            ? JSON.parse(request.colors)
                            : request.colors;

                        return Array.isArray(colors) ? colors.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing colors:', e);
                        return null;
                    }
                };

                const formatFloristArrangements = () => {
                    if (!request.floral_arrangements) return null;
                    
                    try {
                        const arrangements = typeof request.floral_arrangements === 'string'
                            ? JSON.parse(request.floral_arrangements)
                            : request.floral_arrangements;

                        const arrangementLabels = {
                            bridalBouquet: 'Bridal Bouquet',
                            bridesmaidBouquets: 'Bridesmaid Bouquets',
                            boutonnieres: 'Boutonnieres',
                            corsages: 'Corsages',
                            centerpieces: 'Centerpieces',
                            ceremonyArch: 'Ceremony Arch',
                            aisleMarkers: 'Aisle Markers',
                            altarArrangements: 'Altar Arrangements',
                            welcomeSign: 'Welcome Sign',
                            cakeFlowers: 'Cake Flowers',
                            tossBouquet: 'Toss Bouquet',
                            flowerCrown: 'Flower Crown',
                            flowerGirlBasket: 'Flower Girl Basket',
                            petalConfetti: 'Petal Confetti'
                        };

                        const selectedArrangements = Object.entries(arrangements)
                            .filter(([key, value]) => value === true && !key.endsWith('Quantity'))
                            .map(([key]) => {
                                const quantity = arrangements[`${key}Quantity`];
                                const label = arrangementLabels[key] || key;
                                return quantity ? `${label} (${quantity})` : label;
                            });

                        return selectedArrangements.length > 0 ? selectedArrangements.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing floral arrangements:', e);
                        return null;
                    }
                };

                const formatFloristPreferences = () => {
                    if (!request.flower_preferences) return null;
                    
                    try {
                        const preferences = typeof request.flower_preferences === 'string'
                            ? JSON.parse(request.flower_preferences)
                            : request.flower_preferences;

                        const preferenceLabels = {
                            roses: 'Roses',
                            peonies: 'Peonies',
                            hydrangeas: 'Hydrangeas',
                            lilies: 'Lilies',
                            orchids: 'Orchids',
                            tulips: 'Tulips',
                            sunflowers: 'Sunflowers',
                            daisies: 'Daisies',
                            wildflowers: 'Wildflowers',
                            succulents: 'Succulents',
                            greenery: 'Greenery',
                            seasonal: 'Seasonal Flowers'
                        };

                        const selectedPreferences = Object.entries(preferences)
                            .filter(([_, value]) => value === true)
                            .map(([key]) => preferenceLabels[key] || key);

                        return selectedPreferences.length > 0 ? selectedPreferences.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing flower preferences:', e);
                        return null;
                    }
                };

                // Check if there are service-specific details to show in collapsible sections
                const hasFloristServiceDetails = hasValue(formatFloristAdditionalServices()) || hasValue(formatFloristDuration());
                const hasFloristDesignDetails = hasValue(formatFloristColors()) || hasValue(formatFloristArrangements()) || hasValue(formatFloristPreferences());
                const hasFloristAdditionalInfo = hasValue(request.additional_comments);

                return (
                    <div className="rdm-request-summary-grid">
                        {/* Main Details - Always Visible */}
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Event Title" value={request.event_title} />
                        <InfoField label="Location" value={request.location} />
                        <InfoField label="Event Date" value={formatFloristDate()} />
                        <InfoField label="Event Time" value={formatFloristTime()} />
                        <InfoField label="Number of People" value={formatFloristPeople()} />
                        <InfoField label="Indoor/Outdoor" value={request.indoor_outdoor} />
                        <InfoField label="Budget Range" value={request.price_range ? `$${request.price_range}` : null} />

                        {/* Pinterest Board - Always Visible */}
                        {request.pinterest_link && (
                            <InfoField 
                                label="Pinterest Board" 
                                value={
                                    <a 
                                        href={request.pinterest_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: '#f6eafe',
                                            color: '#9633eb',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            textDecoration: 'none',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease',
                                            border: '1px solid #f0e6ff'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = '#f0e6ff';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = '#f6eafe';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        View Board
                                        <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            xmlns="http://www.w3.org/2000/svg"
                                            style={{ transition: 'transform 0.2s ease' }}
                                        >
                                            <path 
                                                d="M7 17L17 7M17 7H8M17 7V16" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </a>
                                } 
                            />
                        )}

                        {/* Collapsible Sections */}
                        {hasFloristServiceDetails && (
                            <CollapsibleSection title="Service Details">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Additional Services" value={formatFloristAdditionalServices()} gridColumn="1 / -1" />
                                    <InfoField label="Duration (hours)" value={formatFloristDuration()} />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasFloristDesignDetails && (
                            <CollapsibleSection title="Design & Preferences">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Color Preferences" value={formatFloristColors()} gridColumn="1 / -1" />
                                    <InfoField label="Floral Arrangements" value={formatFloristArrangements()} gridColumn="1 / -1" />
                                    <InfoField label="Flower Preferences" value={formatFloristPreferences()} gridColumn="1 / -1" />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasFloristAdditionalInfo && (
                            <CollapsibleSection title="Additional Information">
                                <div className="rdm-request-summary-grid">
                                    <InfoField 
                                        label="Additional Comments" 
                                        value={<div dangerouslySetInnerHTML={{ __html: request.additional_comments }} />} 
                                        gridColumn="1 / -1" 
                                    />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasPhotos(filteredPhotos) && (
                            <CollapsibleSection title="Inspiration Photos"><PhotoGrid 
                                photos={filteredPhotos} 
                                onPhotoClick={handlePhotoClick} 
                                getPublicUrl={getPublicUrl} 
                            /></CollapsibleSection>
                        )}
                    </div>
                );
            case 'catering_requests':
                const formatCateringDate = () => {
                    const formatDateWithTimezone = (dateString) => {
                        if (!dateString) return null;
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
                    };

                    if (request.date_flexibility === 'specific' && request.start_date) {
                        return formatDateWithTimezone(request.start_date);
                    } else if (request.date_flexibility === 'range' && request.start_date && request.end_date) {
                        return `${formatDateWithTimezone(request.start_date)} - ${formatDateWithTimezone(request.end_date)}`;
                    } else if (request.date_flexibility === 'flexible' && request.date_timeframe) {
                        const timeframes = {
                            '3months': 'Within 3 months',
                            '6months': 'Within 6 months',
                            '1year': 'Within 1 year',
                            'more': 'More than 1 year'
                        };
                        return timeframes[request.date_timeframe];
                    }
                    return null;
                };

                const formatCateringTime = () => {
                    const startTime = request.start_time;
                    const endTime = request.end_time;
                    
                    if (startTime || endTime) {
                        return `${startTime ? `Start: ${startTime}` : 'Start time TBD'}
                               ${endTime ? `\nEnd: ${endTime}` : '\nEnd time TBD'}`;
                    }
                    return null;
                };

                const formatCateringFoodPreferences = () => {
                    if (!request.food_preferences) return null;
                    
                    if (typeof request.food_preferences === 'object') {
                        const selectedPreferences = Object.entries(request.food_preferences)
                            .filter(([_, value]) => value)
                            .map(([key]) => key
                                .replace(/([A-Z])/g, ' $1')
                                .toLowerCase()
                                .replace(/^./, str => str.toUpperCase()));
                        
                        return selectedPreferences.length > 0 ? selectedPreferences.join(', ') : null;
                    }
                    
                    return request.food_preferences;
                };

                const formatCateringServiceType = () => {
                    if (!request.food_service_type) return null;
                    
                    const serviceTypes = {
                        'onSite': 'Cooking On-Site',
                        'delivered': 'Delivered Ready-to-Serve',
                        'both': 'Combination',
                        'flexible': 'Flexible'
                    };
                    
                    return serviceTypes[request.food_service_type] || request.food_service_type;
                };

                const formatCateringServingStaff = () => {
                    if (!request.serving_staff) return null;
                    
                    const staffTypes = {
                        'fullService': 'Full Service Staff',
                        'partialService': 'Partial Service',
                        'noService': 'No Staff Needed',
                        'unsure': 'Not Sure'
                    };
                    
                    return staffTypes[request.serving_staff] || request.serving_staff;
                };

                const formatCateringSetupCleanup = () => {
                    if (!request.setup_cleanup) return null;
                    
                    const setupTypes = {
                        'setupOnly': 'Setup Only',
                        'cleanupOnly': 'Cleanup Only',
                        'both': 'Both Setup & Cleanup',
                        'neither': 'Neither'
                    };
                    
                    return setupTypes[request.setup_cleanup] || request.setup_cleanup;
                };

                const formatCateringDiningItems = () => {
                    if (!request.dining_items) return null;
                    
                    const diningTypes = {
                        'provided': 'Provided by Caterer',
                        'notProvided': 'Not Needed',
                        'partial': 'Partial (See Details Below)'
                    };
                    
                    return diningTypes[request.dining_items] || request.dining_items;
                };

                const formatCateringBudget = () => {
                    if (!request.budget_range) return null;
                    
                    const budgetRanges = {
                        'under1000': 'Under $1,000',
                        '1000-2000': '$1,000 - $2,000',
                        '2000-3000': '$2,000 - $3,000',
                        '3000-4000': '$3,000 - $4,000',
                        '4000-5000': '$4,000 - $5,000',
                        '5000+': '$5,000+'
                    };
                    
                    return budgetRanges[request.budget_range] || `$${request.budget_range}`;
                };

                // Check if there are service-specific details to show in collapsible sections
                const hasCateringServiceDetails = hasValue(formatCateringServiceType()) || hasValue(request.equipment_needed) || 
                                                hasValue(formatCateringServingStaff()) || hasValue(formatCateringSetupCleanup());
                const hasCateringFoodDetails = hasValue(formatCateringFoodPreferences()) || hasValue(formatCateringDiningItems()) || 
                                             hasValue(request.dining_items_notes);
                const hasCateringAdditionalInfo = hasValue(request.special_requests) || hasValue(request.additional_info) || 
                                                hasValue(request.additional_comments);

                return (
                    <div className="rdm-request-summary-grid">
                        {/* Main Details - Always Visible */}
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Location" value={request.location} />
                        <InfoField label="Event Date" value={formatCateringDate()} />
                        <InfoField label="Event Time" value={formatCateringTime()} />
                        <InfoField label="Expected Guests" value={request.estimated_guests} />
                        <InfoField label="Budget Range" value={formatCateringBudget()} />

                        {/* Collapsible Sections */}
                        {hasCateringServiceDetails && (
                            <CollapsibleSection title="Service Details">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Food Service Type" value={formatCateringServiceType()} />
                                    <InfoField label="Kitchen Equipment" value={request.equipment_needed} />
                                    <InfoField label="Serving Staff" value={formatCateringServingStaff()} />
                                    <InfoField label="Setup & Cleanup" value={formatCateringSetupCleanup()} />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasCateringFoodDetails && (
                            <CollapsibleSection title="Food & Dining">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Food Style Preferences" value={formatCateringFoodPreferences()} gridColumn="1 / -1" />
                                    <InfoField label="Dining Items" value={formatCateringDiningItems()} />
                                    {request.dining_items_notes && (
                                        <InfoField 
                                            label="Dining Items Details" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.dining_items_notes }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasCateringAdditionalInfo && (
                            <CollapsibleSection title="Additional Information">
                                <div className="rdm-request-summary-grid">
                                    {request.special_requests && (
                                        <InfoField 
                                            label="Special Requests" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.special_requests }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                    {request.additional_info && (
                                        <InfoField 
                                            label="Additional Information" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.additional_info }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                    {request.additional_comments && (
                                        <InfoField 
                                            label="Additional Comments" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.additional_comments }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasPhotos(filteredPhotos) && (
                            <CollapsibleSection title="Inspiration Photos"><PhotoGrid 
                                photos={filteredPhotos} 
                                onPhotoClick={handlePhotoClick} 
                                getPublicUrl={getPublicUrl} 
                            /></CollapsibleSection>
                        )}
                    </div>
                );
            case 'videography_requests':
                const formatVideographyDate = () => {
                    const formatDateWithTimezone = (dateString) => {
                        if (!dateString) return null;
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
                    };

                    if (request.date_flexibility === 'specific' && request.start_date) {
                        return formatDateWithTimezone(request.start_date);
                    } else if (request.date_flexibility === 'range' && request.start_date && request.end_date) {
                        return `${formatDateWithTimezone(request.start_date)} - ${formatDateWithTimezone(request.end_date)}`;
                    } else if (request.date_flexibility === 'flexible' && request.date_timeframe) {
                        const timeframes = {
                            '3months': 'Within 3 months',
                            '6months': 'Within 6 months',
                            '1year': 'Within 1 year',
                            'more': 'More than 1 year'
                        };
                        return timeframes[request.date_timeframe];
                    }
                    return null;
                };

                const formatVideographyTime = () => {
                    const startTime = request.start_time_unknown ? null : request.start_time;
                    const endTime = request.end_time_unknown ? null : request.end_time;
                    
                    if (startTime || endTime) {
                        return `${startTime ? `Start: ${startTime}` : 'Start time TBD'} - ${endTime ? `End: ${endTime}` : 'End time TBD'}`;
                    }
                    return null;
                };

                const formatVideographyPeople = () => {
                    return request.num_people_unknown ? null : request.num_people;
                };

                const formatVideographyDuration = () => {
                    return request.duration_unknown ? null : request.duration;
                };

                const formatVideographySecondVideographer = () => {
                    return request.second_photographer;
                };

                const formatVideographyStyle = () => {
                    if (!request.style_preferences) return null;
                    
                    try {
                        const preferences = typeof request.style_preferences === 'string' 
                            ? JSON.parse(request.style_preferences)
                            : request.style_preferences;
                            
                        const styleLabels = {
                            cinematic: 'Cinematic Film Style',
                            documentary: 'Documentary Style',
                            journalistic: 'Journalistic',
                            artistic: 'Artistic & Experimental',
                            romantic: 'Romantic',
                            traditional: 'Traditional',
                            luxury: 'Luxury Production'
                        };

                        const selectedStyles = Object.entries(preferences)
                            .filter(([_, value]) => value === true)
                            .map(([key]) => styleLabels[key] || key);

                        return selectedStyles.length > 0 ? selectedStyles.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing style preferences:', e);
                        return null;
                    }
                };

                const formatVideographyDeliverables = () => {
                    if (!request.deliverables) return null;
                    
                    try {
                        const delivs = typeof request.deliverables === 'string'
                            ? JSON.parse(request.deliverables)
                            : request.deliverables;

                        const deliverableLabels = {
                            digitalFiles: 'Digital Files',
                            printRelease: 'Print Release',
                            weddingAlbum: 'Wedding Album',
                            prints: 'Professional Prints',
                            rawFiles: 'RAW Footage',
                            engagement: 'Engagement Session'
                        };

                        const selectedDeliverables = Object.entries(delivs)
                            .filter(([_, value]) => value === true)
                            .map(([key]) => deliverableLabels[key] || key);

                        return selectedDeliverables.length > 0 ? selectedDeliverables.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing deliverables:', e);
                        return null;
                    }
                };

                const formatVideographyCoverage = () => {
                    if (!request.coverage) return null;
                    
                    try {
                        const coverage = typeof request.coverage === 'string'
                            ? JSON.parse(request.coverage)
                            : request.coverage;

                        const coverageLabels = {
                            preparation: 'Preparation',
                            ceremony: 'Ceremony',
                            reception: 'Reception',
                            firstLook: 'First Look',
                            bridalParty: 'Bridal Party',
                            familyPhotos: 'Family Photos',
                            speeches: 'Speeches',
                            dancing: 'Dancing',
                            sendOff: 'Send Off'
                        };

                        const selectedCoverage = Object.entries(coverage)
                            .filter(([_, value]) => value === true || value === 1 || value === 'true')
                            .map(([key]) => coverageLabels[key] || key);

                        return selectedCoverage.length > 0 ? selectedCoverage.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing coverage:', e);
                        return null;
                    }
                };

                const formatVideographyWeddingDetails = () => {
                    if (!request.wedding_details) return null;
                    
                    try {
                        const details = typeof request.wedding_details === 'string'
                            ? JSON.parse(request.wedding_details)
                            : request.wedding_details;

                        const selectedDetails = Object.entries(details)
                            .filter(([_, value]) => value === true || value === 1 || value === 'true')
                            .map(([key]) => key
                                .replace(/([A-Z])/g, ' $1')
                                .toLowerCase()
                                .replace(/^./, str => str.toUpperCase()));

                        return selectedDetails.length > 0 ? selectedDetails.join(', ') : null;
                    } catch (e) {
                        console.error('Error parsing wedding details:', e);
                        return null;
                    }
                };

                // Check if there are service-specific details to show in collapsible sections
                const hasVideographyServiceDetails = hasValue(formatVideographyDuration()) || hasValue(formatVideographySecondVideographer());
                const hasVideographyStyleDetails = hasValue(formatVideographyStyle()) || hasValue(formatVideographyDeliverables());
                const hasVideographyCoverageDetails = hasValue(formatVideographyCoverage()) || hasValue(formatVideographyWeddingDetails());
                const hasVideographyAdditionalInfo = hasValue(request.additional_info) || hasValue(request.additional_comments);

                return (
                    <div className="rdm-request-summary-grid">
                        {/* Main Details - Always Visible */}
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Event Title" value={request.event_title} />
                        <InfoField label="Location" value={request.location} />
                        <InfoField label="Event Date" value={formatVideographyDate()} />
                        <InfoField label="Time of Day" value={request.time_of_day} />
                        <InfoField label="Event Time" value={formatVideographyTime()} />
                        <InfoField label="Number of People" value={formatVideographyPeople()} />
                        <InfoField label="Indoor/Outdoor" value={request.indoor_outdoor} />
                        <InfoField label="Budget Range" value={request.price_range} />

                        {/* Pinterest Board - Always Visible */}
                        {request.pinterest_link && (
                            <InfoField 
                                label="Pinterest Board" 
                                value={
                                    <a 
                                        href={request.pinterest_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: '#f6eafe',
                                            color: '#9633eb',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            textDecoration: 'none',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease',
                                            border: '1px solid #f0e6ff'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = '#f0e6ff';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = '#f6eafe';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        View Board
                                        <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            xmlns="http://www.w3.org/2000/svg"
                                            style={{ transition: 'transform 0.2s ease' }}
                                        >
                                            <path 
                                                d="M7 17L17 7M17 7H8M17 7V16" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </a>
                                } 
                            />
                        )}

                        {/* Collapsible Sections */}
                        {hasVideographyServiceDetails && (
                            <CollapsibleSection title="Service Options">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Duration (hours)" value={formatVideographyDuration()} />
                                    <InfoField label="Second Videographer" value={formatVideographySecondVideographer()} />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasVideographyStyleDetails && (
                            <CollapsibleSection title="Style & Deliverables">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Style Preferences" value={formatVideographyStyle()} gridColumn="1 / -1" />
                                    <InfoField label="Deliverables" value={formatVideographyDeliverables()} gridColumn="1 / -1" />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasVideographyCoverageDetails && (
                            <CollapsibleSection title="Coverage Details">
                                <div className="rdm-request-summary-grid">
                                    <InfoField label="Coverage Details" value={formatVideographyCoverage()} gridColumn="1 / -1" />
                                    <InfoField label="Wedding Details" value={formatVideographyWeddingDetails()} gridColumn="1 / -1" />
                                </div>
                            </CollapsibleSection>
                        )}

                        {hasVideographyAdditionalInfo && (
                            <CollapsibleSection title="Additional Information">
                                <div className="rdm-request-summary-grid">
                                    {request.additional_info && (
                                        <InfoField 
                                            label="Additional Information" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.additional_info }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                    {request.additional_comments && (
                                        <InfoField 
                                            label="Additional Comments" 
                                            value={<div dangerouslySetInnerHTML={{ __html: request.additional_comments }} />} 
                                            gridColumn="1 / -1" 
                                        />
                                    )}
                                </div>
                            </CollapsibleSection>
                        )}

                        <CollapsibleSection title="Inspiration Photos"><PhotoGrid 
                            photos={filteredPhotos} 
                            onPhotoClick={handlePhotoClick} 
                            getPublicUrl={getPublicUrl} 
                        /></CollapsibleSection>
                    </div>
                );
            default:
                const formatDefaultDate = () => {
                    const formatDateWithTimezone = (dateString) => {
                        if (!dateString) return null;
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
                    };

                    if (request.service_date) {
                        return formatDateWithTimezone(request.service_date);
                    } else if (request.start_date) {
                        return formatDateWithTimezone(request.start_date);
                    }
                    return null;
                };

                const formatDefaultEndDate = () => {
                    const formatDateWithTimezone = (dateString) => {
                        if (!dateString) return null;
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
                    };
                    
                    return request.end_date ? formatDateWithTimezone(request.end_date) : null;
                };

                const formatDefaultBudget = () => {
                    if (request.price_range) {
                        return `$${request.price_range}`;
                    } else if (request.budget_range) {
                        return `$${request.budget_range}`;
                    }
                    return null;
                };

                return (
                    <div className="rdm-request-summary-grid">
                        <InfoField label="Service Title" value={request.service_title} />
                        <InfoField label="Service Category" value={request.service_category} />
                        <InfoField label="Event Title" value={request.event_title || request.title} />
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Date" value={formatDefaultDate()} />
                        <InfoField label="End Date" value={formatDefaultEndDate()} />
                        <InfoField label="Time of Day" value={request.time_of_day} />
                        <InfoField label="Location" value={request.location} />
                        <InfoField label="Budget" value={formatDefaultBudget()} />
                        <InfoField label="Coupon Code" value={request.coupon_code} />
                        
                        {request.pinterest_link && (
                            <InfoField 
                                label="Pinterest Board" 
                                value={<a href={request.pinterest_link} target="_blank" rel="noopener noreferrer">View Board</a>} 
                            />
                        )}
                        
                        {request.media_url && (
                            <InfoField 
                                label="Media URL" 
                                value={<a href={request.media_url} target="_blank" rel="noopener noreferrer">View Media</a>} 
                            />
                        )}
                        
                        {request.service_description && (
                            <InfoField 
                                label="Service Description" 
                                value={<div dangerouslySetInnerHTML={{ __html: request.service_description }} />} 
                                gridColumn="1 / -1" 
                            />
                        )}
                        
                        {request.additional_info && (
                            <InfoField 
                                label="Additional Information" 
                                value={<div dangerouslySetInnerHTML={{ __html: request.additional_info }} />} 
                                gridColumn="1 / -1" 
                            />
                        )}

                        {request.additional_comments && (
                            <InfoField 
                                label="Additional Comments" 
                                value={<div dangerouslySetInnerHTML={{ __html: request.additional_comments }} />} 
                                gridColumn="1 / -1" 
                            />
                        )}
                        
                        {hasPhotos(servicePhotos && servicePhotos.length > 0 ? servicePhotos : filteredPhotos) && (
                            <CollapsibleSection title="Inspiration Photos"><PhotoGrid
                                photos={servicePhotos && servicePhotos.length > 0 ? servicePhotos : filteredPhotos}
                                onPhotoClick={handlePhotoClick}
                                getPublicUrl={getPublicUrl}
                            /></CollapsibleSection>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="rdm-root">
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div className="rdm-title">{getTitle()}</div>
                <div className="rdm-status-row">
                    {isNew(request.created_at) && (
                        <div className="rdm-status-pill">New</div>
                    )}
                    {checkPromotion(request.created_at) && (
                        <div className="rdm-promo-pill">
                            {checkPromotion(request.created_at).message}
                            {timeLeft && <span> ({timeLeft})</span>}
                        </div>
                    )}
                </div>
                
                {/* Bid Statistics */}
                {bidStats.min !== null && (
                    <div className="rdm-bid-stats">
                        <div className="rdm-bid-stats-title">Current Bid Statistics</div>
                        <div className="rdm-bid-stats-grid">
                            <div className="rdm-bid-stat">
                                <div className="rdm-bid-stat-label">Lowest Bid</div>
                                <div className="rdm-bid-stat-value">${bidStats.min?.toFixed(2)}</div>
                            </div>
                            <div className="rdm-bid-stat">
                                <div className="rdm-bid-stat-label">Average Bid</div>
                                <div className="rdm-bid-stat-value">${bidStats.avg?.toFixed(2)}</div>
                            </div>
                            <div className="rdm-bid-stat">
                                <div className="rdm-bid-stat-label">Highest Bid</div>
                                <div className="rdm-bid-stat-value">${bidStats.max?.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="rdm-section">
                    {renderRequestDetails()}
                </div>
            </div>
            {selectedPhoto && (
                <PhotoModal 
                    photo={selectedPhoto}
                    onClose={handleCloseModal}
                    getPublicUrl={getPublicUrl}
                />
            )}
        </div>
    );
}

export default RequestDisplay;

