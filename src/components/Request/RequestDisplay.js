import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../App.css';
import { supabase } from '../../supabaseClient';



// Helper Components
const InfoField = ({ label, value, gridColumn = 'auto' }) => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn}}>
        <div className="request-subtype">{label}</div>
        <div className="request-info">{value || 'Not specified'}</div>
    </div>
);

const PhotoGrid = ({ photos, onPhotoClick, getPublicUrl }) => (
    <>
        <div className="request-subtype" style={{gridColumn: '1 / -1'}}>
            Inspiration Photos
        </div>
        <div className="photo-grid scroll-container" style={{gridColumn: '1 / -1'}}>
            {photos.map((photo, index) => {
                const publicUrl = getPublicUrl(photo.file_path);
                return (
                    <div className="photo-grid-item" key={index} onClick={() => onPhotoClick(photo)}>
                        <img
                            src={publicUrl || photo.photo_url}
                            className="photo"
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
    </>
);

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
        return levels[level] || level || 'Not specified';
    };

    const formatWeddingStyle = (style) => {
        const styles = {
            'backyard': 'Backyard',
            'church': 'Church',
            'event_center': 'Event Center',
            'venue': 'Venue',
            'other': 'Other'
        };
        return styles[style] || style || 'Not specified';
    };

    const formatVenueStatus = (status) => {
        const statuses = {
            'booked': 'Venue Booked',
            'shortlist': 'Shortlist Selected',
            'searching': 'Still Searching'
        };
        return statuses[status] || status || 'Not specified';
    };

    const formatVendorPreferences = (prefs) => {
        if (!prefs) return 'Not specified';
        
        const preferences = typeof prefs === 'string' ? JSON.parse(prefs) : prefs;
        const preferenceTypes = {
            'existing': 'Use Existing Vendors',
            'new': 'Find New Vendors',
            'mix': 'Mix of Existing and New Vendors'
        };
        
        let displayText = preferenceTypes[preferences.preference] || 'Not specified';
        if (preferences.existing_vendors) {
            displayText += `\nExisting Vendors: ${preferences.existing_vendors}`;
        }
        
        return displayText;
    };

    const formatAdditionalEvents = (events) => {
        if (!events) return 'None selected';
        
        const eventList = typeof events === 'string' ? JSON.parse(events) : events;
        const eventTypes = {
            'rehearsalDinner': 'Rehearsal Dinner',
            'dayAfterBrunch': 'Day After Brunch',
            'bachelorParty': 'Bachelor Party',
            'bridalParty': 'Bridal Party'
        };
        
        return Object.entries(eventList)
            .filter(([_, value]) => value)
            .map(([key]) => eventTypes[key] || key.replace(/([A-Z])/g, ' $1').trim())
            .join(', ') || 'None selected';
    };

    const formatExperienceLevel = (level) => {
        const levels = {
            'beginner': 'Beginner',
            'intermediate': 'Intermediate',
            'expert': 'Expert'
        };
        return levels[level] || level || 'Not specified';
    };

    const formatCommunicationStyle = (style) => {
        const styles = {
            'email': 'Email',
            'phone': 'Phone',
            'text': 'Text',
            'video': 'Video Call'
        };
        return styles[style] || style || 'Not specified';
    };

    

    return (
        <div className="request-summary-grid">
            <InfoField label="Event Title" value={request.event_title} gridColumn="1 / -1" />
            <InfoField label="Event Type" value={request.event_type} />
            <InfoField label="Location" value={request.location} />
            <InfoField label="Planning Level" value={formatPlanningLevel(request.planning_level)} />
            <InfoField label="Wedding Style" value={formatWeddingStyle(request.wedding_style)} />
            
            {/* Date Information */}
            {request.date_flexibility === 'specific' ? (
                <InfoField 
                    label="Event Date" 
                    value={request.start_date ? new Date(request.start_date).toLocaleDateString() : null} 
                />
            ) : request.date_flexibility === 'range' ? (
                <InfoField 
                    label="Date Range" 
                    value={request.start_date && request.end_date 
                        ? `${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`
                        : null} 
                />
            ) : (
                <InfoField 
                    label="Date Preference" 
                    value={request.date_timeframe === '3months' ? 'Within 3 months' :
                           request.date_timeframe === '6months' ? 'Within 6 months' :
                           request.date_timeframe === '1year' ? 'Within 1 year' :
                           request.date_timeframe === 'more' ? 'More than 1 year' : null} 
                />
            )}

            {/* Time Information */}
            <InfoField 
                label="Event Time" 
                value={request.start_time || request.end_time 
                    ? `${request.start_time ? `Start: ${request.start_time}` : 'Start time TBD'}
                       ${request.end_time ? `\nEnd: ${request.end_time}` : '\nEnd time TBD'}`
                    : null} 
            />

            <InfoField label="Venue Type" value={request.indoor_outdoor} />
            <InfoField label="Venue Status" value={formatVenueStatus(request.venue_status)} />
            <InfoField label="Expected Guests" value={request.guest_count} />
            <InfoField label="Budget Range" value={request.budget_range ? `$${request.budget_range}` : null} />
            <InfoField label="Planner Budget" value={request.planner_budget ? `$${request.planner_budget}` : null} />
            <InfoField label="Color Scheme" value={request.color_scheme} />
            <InfoField label="Theme Preferences" value={request.theme_preferences} />
            
            <InfoField 
                label="Vendor Preferences" 
                value={formatVendorPreferences(request.vendor_preferences)} 
                gridColumn="1 / -1" 
            />
            
            <InfoField 
                label="Additional Events" 
                value={formatAdditionalEvents(request.additional_events)} 
                gridColumn="1 / -1" 
            />
            
            <InfoField 
                label="Experience Level" 
                value={formatExperienceLevel(request.experience_level)} 
            />
            
            <InfoField 
                label="Communication Style" 
                value={formatCommunicationStyle(request.communication_style)} 
            />

            {request.pinterest_link && (
                <InfoField 
                    label="Pinterest Board" 
                    value={
                        <a href={request.pinterest_link} target="_blank" rel="noopener noreferrer">
                            View Board
                        </a>
                    } 
                />
            )}

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

            {filteredPhotos && filteredPhotos.length > 0 && (
                <PhotoGrid 
                    photos={filteredPhotos} 
                    onPhotoClick={onPhotoClick} 
                    getPublicUrl={getPublicUrl} 
                />
            )}
        </div>
    );
};

// Main Component
function RequestDisplay({ request, servicePhotos, hideBidButton, requestType }) {
    const navigate = useNavigate();
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [filteredPhotos, setFilteredPhotos] = useState([]);

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                let photoTable;
                switch (getRequestType()) {
                    case 'photography_requests':
                        photoTable = 'photography_photos';
                        break;
                    case 'videography_requests':
                        photoTable = 'videography_photos';
                        break;
                    case 'beauty_requests':
                        photoTable = 'beauty_photos';
                        break;
                    case 'florist_requests':
                        photoTable = 'florist_photos';
                        break;
                    case 'wedding_planning_requests':
                        photoTable = 'wedding_planning_photos';
                        break;
                    default:
                        console.log('No specific photo table for request type:', getRequestType());
                        return;
                }

                const { data: photos, error } = await supabase
                    .from(photoTable)
                    .select('*')
                    .eq('request_id', request.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching photos:', error);
                    return;
                }

                setFilteredPhotos(photos);
            } catch (err) {
                console.error('Error in fetchPhotos:', err);
            }
        };

        fetchPhotos();
    }, [request]);

    useEffect(() => {
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
    }, [request.created_at]);

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
                return (
                    <div className="request-summary-grid">
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Location" value={request.location} />
                        <InfoField 
                            label="Event Date" 
                            value={request.start_date ? new Date(request.start_date).toLocaleDateString() : null} 
                        />
                        <InfoField label="Service Type" value={request.service_type} />
                        <InfoField label="Number of People" value={request.num_people} />

                        {(request.service_type === 'both' || request.service_type === 'hair') && (
                            <>
                                <InfoField label="Hairstyle Preferences" value={request.hairstyle_preferences} />
                                <InfoField label="Hair Length & Type" value={request.hair_length_type} />
                                <InfoField label="Extensions Needed" value={request.extensions_needed} />
                                <InfoField label="Trial Session for Hair" value={request.trial_session_hair} />
                            </>
                        )}

                        {(request.service_type === 'both' || request.service_type === 'makeup') && (
                            <>
                                <InfoField label="Makeup Style Preferences" value={request.makeup_style_preferences} />
                                <InfoField label="Skin Type & Concerns" value={request.skin_type_concerns} />
                                <InfoField label="Preferred Products or Allergies" value={request.preferred_products_allergies} />
                                <InfoField label="Lashes Included" value={request.lashes_included} />
                                <InfoField label="Trial Session for Makeup" value={request.trial_session_makeup} />
                            </>
                        )}

                        <InfoField label="Group Discount Inquiry" value={request.group_discount_inquiry} />
                        <InfoField label="On-Site Service Needed" value={request.on_site_service_needed} />
                        <InfoField label="Budget Range" value={request.price_range ? `$${request.price_range}` : null} />

                        {request.pinterest_link && (
                            <InfoField 
                                label="Pinterest Board" 
                                value={
                                    <a href={request.pinterest_link} target="_blank" rel="noopener noreferrer">
                                        View Board
                                    </a>
                                } 
                            />
                        )}

                        {request.additional_info && (
                            <InfoField 
                                label="Additional Information" 
                                value={<div dangerouslySetInnerHTML={{ __html: request.additional_info }} />} 
                                gridColumn="1 / -1" 
                            />
                        )}

                        {filteredPhotos && filteredPhotos.length > 0 && (
                            <PhotoGrid 
                                photos={filteredPhotos} 
                                onPhotoClick={handlePhotoClick} 
                                getPublicUrl={getPublicUrl} 
                            />
                        )}
                    </div>
                );
            case 'photography_requests':
                return (
                    <div className="request-summary-grid">
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Location" value={request.location} />
                        
                        {request.date_flexibility === 'specific' ? (
                            <InfoField 
                                label="Date" 
                                value={request.start_date ? new Date(request.start_date).toLocaleDateString() : null} 
                            />
                        ) : request.date_flexibility === 'range' ? (
                            <InfoField 
                                label="Date Range" 
                                value={request.start_date && request.end_date 
                                    ? `${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`
                                    : null} 
                            />
                        ) : (
                            <InfoField 
                                label="Date Preference" 
                                value={request.date_timeframe === '3months' ? 'Within 3 months' :
                                       request.date_timeframe === '6months' ? 'Within 6 months' :
                                       request.date_timeframe === '1year' ? 'Within 1 year' :
                                       request.date_timeframe === 'more' ? 'More than 1 year' : null} 
                            />
                        )}

                        <InfoField 
                            label="Time" 
                            value={`${request.start_time_unknown ? 'Start time TBD' : request.start_time} - ${request.end_time_unknown ? 'End time TBD' : request.end_time}`} 
                        />

                        <InfoField 
                            label="Number of People" 
                            value={request.num_people_unknown ? 'TBD' : request.num_people} 
                        />

                        <InfoField 
                            label="Duration (in hours)" 
                            value={request.duration_unknown ? 'TBD' : request.duration} 
                        />

                        <InfoField label="Indoor/Outdoor" value={request.indoor_outdoor} />
                        <InfoField label="Budget" value={request.price_range} />

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

                        <InfoField 
                            label="Second Photographer" 
                            value={request.second_photographer_unknown ? 'TBD' : request.second_photographer} 
                        />

                        {request.wedding_details && (
                            <InfoField 
                                label="Wedding Coverage" 
                                value={(() => {
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

                                        return Object.entries(details)
                                            .filter(([_, value]) => value === true || value === 1 || value === 'true')
                                            .map(([key]) => coverageLabels[key] || key)
                                            .join(', ') || 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing wedding details:', e);
                                        return 'Not specified';
                                    }
                                })()} 
                                gridColumn="1 / -1"
                            />
                        )}

                        {request.style_preferences && (
                            <InfoField 
                                label="Style Preferences" 
                                value={(() => {
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

                                        return selectedStyles.length > 0 
                                            ? selectedStyles.join(', ') 
                                            : 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing style preferences:', e);
                                        return 'Not specified';
                                    }
                                })()} 
                                gridColumn="1 / -1"
                            />
                        )}

                        {request.deliverables && (
                            <InfoField 
                                label="Deliverables" 
                                value={(() => {
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

                                        return selectedDeliverables.length > 0 
                                            ? selectedDeliverables.join(', ') 
                                            : 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing deliverables:', e);
                                        return 'Not specified';
                                    }
                                })()} 
                                gridColumn="1 / -1"
                            />
                        )}

                        {request.coverage && (
                            <InfoField 
                                label="Coverage Details" 
                                value={(() => {
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

                                        return Object.entries(coverage)
                                            .filter(([_, value]) => value === true || value === 1 || value === 'true')
                                            .map(([key]) => coverageLabels[key] || key)
                                            .join(', ') || 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing coverage:', e);
                                        return 'Not specified';
                                    }
                                })()} 
                                gridColumn="1 / -1"
                            />
                        )}

                        {request.wedding_details && (
                            <InfoField 
                                label="Wedding Details" 
                                value={(() => {
                                    try {
                                        const details = typeof request.wedding_details === 'string'
                                            ? JSON.parse(request.wedding_details)
                                            : request.wedding_details;

                                        return Object.entries(details)
                                            .filter(([_, value]) => value === true || value === 1 || value === 'true')
                                            .map(([key]) => key
                                                .replace(/([A-Z])/g, ' $1')
                                                .toLowerCase()
                                                .replace(/^./, str => str.toUpperCase()))
                                            .join(', ') || 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing wedding details:', e);
                                        return 'Not specified';
                                    }
                                })()} 
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

                        {filteredPhotos && filteredPhotos.length > 0 && (
                            <PhotoGrid 
                                photos={filteredPhotos} 
                                onPhotoClick={handlePhotoClick} 
                                getPublicUrl={getPublicUrl} 
                            />
                        )}
                    </div>
                );
            case 'dj_requests':
                return (
                    <div className="request-summary-grid">
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Location" value={request.location} />
                        
                        {request.date_flexibility === 'specific' ? (
                            <InfoField 
                                label="Event Date" 
                                value={request.start_date ? new Date(request.start_date).toLocaleDateString() : null} 
                            />
                        ) : request.date_flexibility === 'range' ? (
                            <InfoField 
                                label="Date Range" 
                                value={request.start_date && request.end_date 
                                    ? `${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`
                                    : null} 
                            />
                        ) : (
                            <InfoField 
                                label="Date Preference" 
                                value={request.date_timeframe === '3months' ? 'Within 3 months' :
                                       request.date_timeframe === '6months' ? 'Within 6 months' :
                                       request.date_timeframe === '1year' ? 'Within 1 year' :
                                       request.date_timeframe === 'more' ? 'More than 1 year' : null} 
                            />
                        )}

                        <InfoField label="Venue Type" value={request.indoor_outdoor} />

                        {request.event_type === 'Wedding' && request.wedding_details && (
                            <InfoField 
                                label="Event Coverage" 
                                value={Object.entries(request.wedding_details)
                                    .filter(([_, value]) => value)
                                    .map(([key]) => key.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + key.slice(1))
                                    .join(', ')} 
                                gridColumn="1 / -1"
                            />
                        )}

                        <InfoField 
                            label="Duration" 
                            value={request.event_duration ? `${request.event_duration} hours` : null} 
                        />

                        <InfoField label="Expected Guests" value={request.estimated_guests} />
                        <InfoField label="Equipment Setup" value={request.equipment_needed} />

                        {request.equipment_notes && (
                            <InfoField 
                                label="Equipment Notes" 
                                value={<div dangerouslySetInnerHTML={{ __html: request.equipment_notes }} />} 
                                gridColumn="1 / -1" 
                            />
                        )}

                        <InfoField 
                            label="Music Preferences" 
                            value={request.music_preferences 
                                ? Object.entries(request.music_preferences)
                                    .filter(([_, value]) => value)
                                    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                                    .join(', ')
                                : null} 
                            gridColumn="1 / -1"
                        />

                        <InfoField 
                            label="Additional Services" 
                            value={request.additional_services && request.additional_services.length > 0
                                ? request.additional_services.map(service => {
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
                                    return serviceNames[service] || service;
                                }).join(', ')
                                : 'None selected'} 
                            gridColumn="1 / -1"
                        />

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

                        <InfoField label="Budget Range" value={request.budget_range ? `$${request.budget_range}` : null} />

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
                );
            case 'florist_requests':
                return (
                    <div className="request-summary-grid">
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Event Title" value={request.event_title} />
                        <InfoField label="Location" value={request.location} />
                        
                        {request.date_flexibility === 'specific' ? (
                            <InfoField 
                                label="Event Date" 
                                value={request.start_date ? new Date(request.start_date).toLocaleDateString() : null} 
                            />
                        ) : request.date_flexibility === 'range' ? (
                            <InfoField 
                                label="Date Range" 
                                value={request.start_date && request.end_date 
                                    ? `${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`
                                    : null} 
                            />
                        ) : (
                            <InfoField 
                                label="Date Preference" 
                                value={request.date_timeframe === '3months' ? 'Within 3 months' :
                                       request.date_timeframe === '6months' ? 'Within 6 months' :
                                       request.date_timeframe === '1year' ? 'Within 1 year' :
                                       request.date_timeframe === 'more' ? 'More than 1 year' : null} 
                            />
                        )}

                        <InfoField 
                            label="Event Time" 
                            value={request.start_time_unknown ? 'Start time TBD' : request.start_time} 
                        />
                        <InfoField 
                            label="End Time" 
                            value={request.end_time_unknown ? 'End time TBD' : request.end_time} 
                        />

                        <InfoField 
                            label="Number of People" 
                            value={request.num_people_unknown ? 'TBD' : request.num_people} 
                        />
                        
                        <InfoField 
                            label="Duration (hours)" 
                            value={request.duration_unknown ? 'TBD' : request.duration} 
                        />
                        
                        <InfoField label="Indoor/Outdoor" value={request.indoor_outdoor} />
                        <InfoField label="Budget Range" value={request.price_range ? `$${request.price_range}` : null} />

                        {request.pinterest_link && (
                            <InfoField 
                                label="Pinterest Board" 
                                value={
                                    <a href={request.pinterest_link} target="_blank" rel="noopener noreferrer">
                                        View Board
                                    </a>
                                } 
                            />
                        )}

                        {request.additional_services && (
                            <InfoField 
                                label="Additional Services" 
                                value={(() => {
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

                                        return selectedServices.length > 0 
                                            ? selectedServices.join(', ') 
                                            : 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing additional services:', e);
                                        return 'Not specified';
                                    }
                                })()} 
                                gridColumn="1 / -1"
                            />
                        )}

                        {request.colors && (
                            <InfoField 
                                label="Color Preferences" 
                                value={(() => {
                                    try {
                                        const colors = typeof request.colors === 'string'
                                            ? JSON.parse(request.colors)
                                            : request.colors;

                                        return Array.isArray(colors) 
                                            ? colors.join(', ') 
                                            : 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing colors:', e);
                                        return 'Not specified';
                                    }
                                })()} 
                                gridColumn="1 / -1"
                            />
                        )}

                        {request.floral_arrangements && (
                            <InfoField 
                                label="Floral Arrangements" 
                                value={(() => {
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

                                        return selectedArrangements.length > 0 
                                            ? selectedArrangements.join(', ') 
                                            : 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing floral arrangements:', e);
                                        return 'Not specified';
                                    }
                                })()} 
                                gridColumn="1 / -1"
                            />
                        )}

                        {request.flower_preferences && (
                            <InfoField 
                                label="Flower Preferences" 
                                value={(() => {
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

                                        return selectedPreferences.length > 0 
                                            ? selectedPreferences.join(', ') 
                                            : 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing flower preferences:', e);
                                        return 'Not specified';
                                    }
                                })()} 
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

                        {filteredPhotos && filteredPhotos.length > 0 && (
                            <PhotoGrid 
                                photos={filteredPhotos} 
                                onPhotoClick={handlePhotoClick} 
                                getPublicUrl={getPublicUrl} 
                            />
                        )}
                    </div>
                );
            case 'catering_requests':
                return (
                    <div className="request-summary-grid">
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Location" value={request.location} />
                        
                        {request.date_flexibility === 'specific' ? (
                            <InfoField 
                                label="Event Date" 
                                value={request.start_date ? new Date(request.start_date).toLocaleDateString() : null} 
                            />
                        ) : request.date_flexibility === 'range' ? (
                            <InfoField 
                                label="Date Range" 
                                value={request.start_date && request.end_date 
                                    ? `${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`
                                    : null} 
                            />
                        ) : (
                            <InfoField 
                                label="Date Preference" 
                                value={request.date_timeframe === '3months' ? 'Within 3 months' :
                                       request.date_timeframe === '6months' ? 'Within 6 months' :
                                       request.date_timeframe === '1year' ? 'Within 1 year' :
                                       request.date_timeframe === 'more' ? 'More than 1 year' : null} 
                            />
                        )}

                        <InfoField 
                            label="Event Time" 
                            value={`${request.start_time ? `Start: ${request.start_time}` : 'Start time TBD'}
                                   ${request.end_time ? `\nEnd: ${request.end_time}` : '\nEnd time TBD'}`} 
                        />

                        <InfoField label="Expected Guests" value={request.estimated_guests} />

                        <InfoField 
                            label="Food Style Preferences" 
                            value={typeof request.food_preferences === 'object' 
                                ? Object.entries(request.food_preferences)
                                    .filter(([_, value]) => value)
                                    .map(([key]) => key
                                        .replace(/([A-Z])/g, ' $1')
                                        .toLowerCase()
                                        .replace(/^./, str => str.toUpperCase()))
                                    .join(', ') 
                                : request.food_preferences} 
                            gridColumn="1 / -1"
                        />

                        <InfoField 
                            label="Food Service Type" 
                            value={(() => {
                                switch (request.food_service_type) {
                                    case 'onSite': return 'Cooking On-Site';
                                    case 'delivered': return 'Delivered Ready-to-Serve';
                                    case 'both': return 'Combination';
                                    case 'flexible': return 'Flexible';
                                    default: return request.food_service_type;
                                }
                            })()} 
                        />

                        <InfoField label="Kitchen Equipment" value={request.equipment_needed} />

                        <InfoField 
                            label="Serving Staff" 
                            value={(() => {
                                switch (request.serving_staff) {
                                    case 'fullService': return 'Full Service Staff';
                                    case 'partialService': return 'Partial Service';
                                    case 'noService': return 'No Staff Needed';
                                    case 'unsure': return 'Not Sure';
                                    default: return request.serving_staff;
                                }
                            })()} 
                        />

                        <InfoField 
                            label="Setup & Cleanup" 
                            value={(() => {
                                switch (request.setup_cleanup) {
                                    case 'setupOnly': return 'Setup Only';
                                    case 'cleanupOnly': return 'Cleanup Only';
                                    case 'both': return 'Both Setup & Cleanup';
                                    case 'neither': return 'Neither';
                                    default: return request.setup_cleanup;
                                }
                            })()} 
                        />

                        <InfoField 
                            label="Dining Items" 
                            value={(() => {
                                switch (request.dining_items) {
                                    case 'provided': return 'Provided by Caterer';
                                    case 'notProvided': return 'Not Needed';
                                    case 'partial': return 'Partial (See Details Below)';
                                    default: return request.dining_items;
                                }
                            })()} 
                        />

                        {request.dining_items_notes && (
                            <InfoField 
                                label="Dining Items Details" 
                                value={<div dangerouslySetInnerHTML={{ __html: request.dining_items_notes }} />} 
                                gridColumn="1 / -1" 
                            />
                        )}

                        <InfoField 
                            label="Budget Range" 
                            value={(() => {
                                switch (request.budget_range) {
                                    case 'under1000': return 'Under $1,000';
                                    case '1000-2000': return '$1,000 - $2,000';
                                    case '2000-3000': return '$2,000 - $3,000';
                                    case '3000-4000': return '$3,000 - $4,000';
                                    case '4000-5000': return '$4,000 - $5,000';
                                    case '5000+': return '$5,000+';
                                    default: return request.budget_range ? `$${request.budget_range}` : null;
                                }
                            })()} 
                        />

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

                        {filteredPhotos && filteredPhotos.length > 0 && (
                            <PhotoGrid 
                                photos={filteredPhotos} 
                                onPhotoClick={handlePhotoClick} 
                                getPublicUrl={getPublicUrl} 
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
                );
            case 'videography_requests':
                console.log('Videography Request Data:', request);
                console.log('Style Preferences:', request.style_preferences);
                console.log('Deliverables:', request.deliverables);
                return (
                    <div className="request-summary-grid">
                        <InfoField label="Event Type" value={request.event_type} />
                        <InfoField label="Event Title" value={request.event_title} />
                        <InfoField label="Location" value={request.location} />
                        
                        {request.date_flexibility === 'specific' ? (
                            <InfoField 
                                label="Event Date" 
                                value={request.start_date ? new Date(request.start_date).toLocaleDateString() : null} 
                            />
                        ) : request.date_flexibility === 'range' ? (
                            <InfoField 
                                label="Date Range" 
                                value={request.start_date && request.end_date 
                                    ? `${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`
                                    : null} 
                            />
                        ) : (
                            <InfoField 
                                label="Date Preference" 
                                value={request.date_timeframe === '3months' ? 'Within 3 months' :
                                       request.date_timeframe === '6months' ? 'Within 6 months' :
                                       request.date_timeframe === '1year' ? 'Within 1 year' :
                                       request.date_timeframe === 'more' ? 'More than 1 year' : null} 
                            />
                        )}

                        <InfoField label="Time of Day" value={request.time_of_day} />

                        <InfoField 
                            label="Event Time" 
                            value={request.start_time_unknown ? 'Start time TBD' : request.start_time} 
                        />
                        <InfoField 
                            label="End Time" 
                            value={request.end_time_unknown ? 'End time TBD' : request.end_time} 
                        />

                        <InfoField 
                            label="Number of People" 
                            value={request.num_people_unknown ? 'TBD' : request.num_people} 
                        />
                        
                        <InfoField 
                            label="Duration (hours)" 
                            value={request.duration_unknown ? 'TBD' : request.duration} 
                        />
                        
                        <InfoField label="Indoor/Outdoor" value={request.indoor_outdoor} />
                        <InfoField label="Second Videographer" value={request.second_photographer} />
                        <InfoField label="Budget Range" value={request.price_range} />

                        {request.pinterest_link && (
                            <InfoField 
                                label="Pinterest Board" 
                                value={
                                    <a href={request.pinterest_link} target="_blank" rel="noopener noreferrer">
                                        View Board
                                    </a>
                                } 
                            />
                        )}

                        {request.style_preferences && (
                            <InfoField 
                                label="Style Preferences" 
                                value={(() => {
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

                                        return selectedStyles.length > 0 
                                            ? selectedStyles.join(', ') 
                                            : 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing style preferences:', e);
                                        return 'Not specified';
                                    }
                                })()} 
                                gridColumn="1 / -1"
                            />
                        )}

                        {request.deliverables && (
                            <InfoField 
                                label="Deliverables" 
                                value={(() => {
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

                                        return selectedDeliverables.length > 0 
                                            ? selectedDeliverables.join(', ') 
                                            : 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing deliverables:', e);
                                        return 'Not specified';
                                    }
                                })()} 
                                gridColumn="1 / -1"
                            />
                        )}

                        {request.coverage && (
                            <InfoField 
                                label="Coverage Details" 
                                value={(() => {
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

                                        return Object.entries(coverage)
                                            .filter(([_, value]) => value === true || value === 1 || value === 'true')
                                            .map(([key]) => coverageLabels[key] || key)
                                            .join(', ') || 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing coverage:', e);
                                        return 'Not specified';
                                    }
                                })()} 
                                gridColumn="1 / -1"
                            />
                        )}

                        {request.wedding_details && (
                            <InfoField 
                                label="Wedding Details" 
                                value={(() => {
                                    try {
                                        const details = typeof request.wedding_details === 'string'
                                            ? JSON.parse(request.wedding_details)
                                            : request.wedding_details;

                                        return Object.entries(details)
                                            .filter(([_, value]) => value === true || value === 1 || value === 'true')
                                            .map(([key]) => key
                                                .replace(/([A-Z])/g, ' $1')
                                                .toLowerCase()
                                                .replace(/^./, str => str.toUpperCase()))
                                            .join(', ') || 'Not specified';
                                    } catch (e) {
                                        console.error('Error parsing wedding details:', e);
                                        return 'Not specified';
                                    }
                                })()} 
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

                        {filteredPhotos && filteredPhotos.length > 0 && (
                            <PhotoGrid 
                                photos={filteredPhotos} 
                                onPhotoClick={handlePhotoClick} 
                                getPublicUrl={getPublicUrl} 
                            />
                        )}
                    </div>
                );
            default:
                return <div>Unsupported request type</div>;
        }
    };

    return (
        <div className="request-display text-center mb-4">
            <div className="request-content p-3">
                <h2 className="request-title">{getTitle()}</h2>
                
                <div className='status-request-container' style={{marginBottom:'16px', display: isNew(request.created_at) ? 'flex' : 'none'}}>
                    <div className="request-status">
                        {isNew(request.created_at) && 'New'}
                    </div>
                    {checkPromotion(request.created_at) && (
                        <div className="promotion-status">
                            {checkPromotion(request.created_at).message}
                            {timeLeft && <span> ({timeLeft})</span>}
                        </div>
                    )}
                </div>

                <div className="event-summary-container" style={{padding: '0'}}>
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

