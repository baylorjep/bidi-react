import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../App.css';
import { supabase } from '../../supabaseClient';

function RequestDisplay({ request, servicePhotos, hideBidButton, requestType }) {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [filteredPhotos, setFilteredPhotos] = useState([]);
    
    const getRequestType = () => {
        // Add debug logging
        console.log('Request:', request);
        console.log('Passed requestType:', requestType);
        console.log('Table name:', request.table_name);

        // First, check if a specific type was passed as a prop
        if (requestType === 'florist_requests') {
            console.log('Using passed requestType: florist_requests');
            return 'florist_requests';
        }

        // Then check standard requestType prop
        if (requestType) {
            console.log('Using passed requestType:', requestType);
            return requestType;
        }

        // Then check if the request has a table_name property
        if (request.table_name === 'florist_requests') {
            console.log('Using table_name: florist_requests');
            return 'florist_requests';
        }

        if (request.table_name) {
            console.log('Using table_name:', request.table_name);
            return request.table_name;
        }

        // Check for beauty-specific properties
        if (request.service_type && 
            (request.service_type === 'both' || 
             request.service_type === 'hair' || 
             request.service_type === 'makeup')) {
            console.log('Detected beauty request');
            return 'beauty_requests';
        }

        // Check for photography-specific properties
        if (request.hasOwnProperty('event_title') && !request.hasOwnProperty('floral_arrangements')) {
            return 'photography_requests';
        }

        // Check for florist-specific properties - modify this section
        if (request.hasOwnProperty('floral_arrangements') || 
            request.hasOwnProperty('flower_preferences') || 
            request.colors || 
            request.additional_services?.setupAndTakedown) {
            console.log('Detected florist request with:', {
                floral_arrangements: request.floral_arrangements,
                flower_preferences: request.flower_preferences,
                colors: request.colors
            });
            return 'florist_requests';
        }

        // Add videography check
        if (request.hasOwnProperty('videographer_needed') || 
            request.hasOwnProperty('style_preferences') || 
            request.table_name === 'videography_requests') {
            console.log('Detected videography request');
            return 'videography_requests';
        }

        // Default case
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

    const getDate = () => {
        // Add debug logging
        console.log('getDate - Request:', request);
        console.log('getDate - Date fields:', {
            service_date: request.service_date,
            date: request.date,
            event_date: request.event_date,
            start_date: request.start_date
        });

        const type = getRequestType();
        console.log('getDate - Request type:', type);

        // For beauty requests, prioritize start_date
        if (type === 'beauty_requests') {
            return request.start_date ? new Date(request.start_date).toLocaleDateString() : 'Date not specified';
        }

        // For other requests, keep existing logic
        const startDate = ['photography_requests', 'dj_requests', 'catering_requests'].includes(type) 
            ? request.start_date 
            : request.service_date || request.date || request.event_date || request.start_date;
        
        if (request.end_date) {
            return `${new Date(startDate).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`;
        }
        return startDate ? new Date(startDate).toLocaleDateString() : 'Date not specified';
    };

    const renderBeautyRequest = () => (
        <div className="request-summary-grid">

            {/* Basic Event Information */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Event Type</div>
                <div className="request-info">{request.event_type || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Location</div>
                <div className="request-info">{request.location}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Event Date</div>
                <div className="request-info">{request.start_date ? new Date(request.start_date).toLocaleDateString() : 'Date not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Service Type</div>
                <div className="request-info">{request.service_type}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Number of People</div>
                <div className="request-info">{request.num_people || 'Not specified'}</div>
            </div>

            {/* Hair Services */}
            {(request.service_type === 'both' || request.service_type === 'hair') && (
                <>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Hairstyle Preferences</div>
                        <div className="request-info">{request.hairstyle_preferences || 'Not specified'}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Hair Length & Type</div>
                        <div className="request-info">{request.hair_length_type || 'Not specified'}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Extensions Needed?</div>
                        <div className="request-info">{request.extensions_needed || 'Not specified'}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Trial Session for Hair?</div>
                        <div className="request-info">{request.trial_session_hair || 'Not specified'}</div>
                    </div>
                </>
            )}

            {/* Makeup Services */}
            {(request.service_type === 'both' || request.service_type === 'makeup') && (
                <>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Makeup Style Preferences</div>
                        <div className="request-info">{request.makeup_style_preferences || 'Not specified'}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Skin Type & Concerns</div>
                        <div className="request-info">{request.skin_type_concerns || 'Not specified'}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Preferred Products or Allergies</div>
                        <div className="request-info">{request.preferred_products_allergies || 'Not specified'}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Lashes Included?</div>
                        <div className="request-info">{request.lashes_included || 'Not specified'}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Trial Session for Makeup?</div>
                        <div className="request-info">{request.trial_session_makeup || 'Not specified'}</div>
                    </div>
                </>
            )}

            {/* Additional Details */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Group Discount Inquiry?</div>
                <div className="request-info">{request.group_discount_inquiry || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">On-Site Service Needed?</div>
                <div className="request-info">{request.on_site_service_needed || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Budget Range</div>
                <div className="request-info">${request.price_range}</div>
            </div>

            {request.pinterest_link && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Pinterest Board</div>
                    <div className="request-info">
                        <a href={request.pinterest_link} target="_blank" rel="noopener noreferrer">
                            View Board
                        </a>
                    </div>
                </div>
            )}

            {/* Additional Information */}
            {request.additional_info && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Information</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_info }} />
                </div>
            )}

            {/* Inspiration Photos */}
            {filteredPhotos && filteredPhotos.length > 0 && (
                <>
                    <div className="request-subtype" style={{gridColumn: '1 / -1'}}>
                        Inspiration Photos
                    </div>
                    <div className="photo-grid scroll-container" style={{gridColumn: '1 / -1'}}>
                        {filteredPhotos.map((photo, index) => {
                            const publicUrl = getPublicUrl(photo.file_path);
                            return (
                                <div className="photo-grid-item" key={index} onClick={() => handlePhotoClick(photo)}>
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
            )}

            {request.additional_comments && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Comments</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_comments }} />
                </div>
            )}
        </div>
    );

    const renderPhotographyRequest = () => (
        <div className="request-summary-grid">
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Event Type</div>
                <div className="request-info">{request.event_type}</div>  
            </div>  

            {/* Date Information based on flexibility */}
            {request.date_flexibility === 'specific' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date</div>
                    <div className="request-info">
                        {new Date(request.start_date).toLocaleDateString()}
                    </div>
                </div>
            ) : request.date_flexibility === 'range' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date Range</div>
                    <div className="request-info">
                        {`${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`}
                    </div>
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date Preference</div>
                    <div className="request-info">
                        {request.date_timeframe === '3months' ? 'Within 3 months' :
                         request.date_timeframe === '6months' ? 'Within 6 months' :
                         request.date_timeframe === '1year' ? 'Within 1 year' :
                         request.date_timeframe === 'more' ? 'More than 1 year' :
                         'Not specified'}
                    </div>
                </div>
            )}

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Location</div>
                <div className="request-info">{request.location}</div>
            </div>

            {/* Time Information */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Time</div>
                <div className="request-info">
                    {request.start_time_unknown ? 'Start time TBD' : request.start_time}
                    {' - '}
                    {request.end_time_unknown ? 'End time TBD' : request.end_time}
                </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Number of People</div>
                <div className="request-info">
                    {request.num_people_unknown ? 'TBD' : request.num_people || 'Not specified'}
                </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Duration (in hours)</div>
                <div className="request-info">
                    {request.duration_unknown ? 'TBD' : request.duration || 'Not specified'}
                </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Indoor/Outdoor</div>
                <div className="request-info">{request.indoor_outdoor}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Budget</div>
                <div className="request-info">{request.price_range}</div>
            </div>

            {request.pinterest_board && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Pinterest Board Link</div>
                    <div className="request-info">
                        <a href={request.pinterest_board} target="_blank" rel="noopener noreferrer">
                            View Board
                        </a>
                    </div>
                </div>
            )}

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Second Photographer</div>
                <div className="request-info">
                    {request.second_photographer_unknown ? 'TBD' : 
                     request.second_photographer || 'Not specified'}
                </div>
            </div>

            {/* Wedding Details if applicable */}
            {request.wedding_details && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Wedding Coverage</div>
                    <div className="request-info">
                        {typeof request.wedding_details === 'string' 
                            ? Object.entries(JSON.parse(request.wedding_details))
                                .filter(([_, value]) => value)
                                .map(([key]) => key
                                    .replace(/([A-Z])/g, ' $1')
                                    .toLowerCase()
                                    .replace(/^./, str => str.toUpperCase()))
                                .join(', ')
                            : Object.entries(request.wedding_details)
                                .filter(([_, value]) => value)
                                .map(([key]) => key
                                    .replace(/([A-Z])/g, ' $1')
                                    .toLowerCase()
                                    .replace(/^./, str => str.toUpperCase()))
                                .join(', ')}
                    </div>
                </div>
            )}

            {/* Style Preferences */}
            {request.style_preferences && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Style Preferences</div>
                    <div className="request-info">
                        {typeof request.style_preferences === 'string'
                            ? Object.entries(JSON.parse(request.style_preferences))
                                .filter(([_, value]) => value)
                                .map(([key]) => key
                                    .replace(/([A-Z])/g, ' $1')
                                    .toLowerCase()
                                    .replace(/^./, str => str.toUpperCase()))
                                .join(', ')
                            : Object.entries(request.style_preferences)
                                .filter(([_, value]) => value)
                                .map(([key]) => key
                                    .replace(/([A-Z])/g, ' $1')
                                    .toLowerCase()
                                    .replace(/^./, str => str.toUpperCase()))
                                .join(', ')}
                    </div>
                </div>
            )}

            {/* Deliverables */}
            {request.deliverables && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Deliverables</div>
                    <div className="request-info">
                        {typeof request.deliverables === 'string'
                            ? Object.entries(JSON.parse(request.deliverables))
                                .filter(([_, value]) => value)
                                .map(([key]) => key
                                    .replace(/([A-Z])/g, ' $1')
                                    .toLowerCase()
                                    .replace(/^./, str => str.toUpperCase()))
                                .join(', ')
                            : Object.entries(request.deliverables)
                                .filter(([_, value]) => value)
                                .map(([key]) => key
                                    .replace(/([A-Z])/g, ' $1')
                                    .toLowerCase()
                                    .replace(/^./, str => str.toUpperCase()))
                                .join(', ')}
                    </div>
                </div>
            )}

            {request.additional_info && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Information</div>
                    <div 
                        className="request-info"
                        dangerouslySetInnerHTML={{ __html: request.additional_info }}
                    />
                </div>
            )}

            {/* Inspiration Photos */}
            {filteredPhotos && filteredPhotos.length > 0 && (
                <>
                    <div className="request-subtype" style={{gridColumn: '1 / -1'}}>
                        Inspiration Photos
                    </div>
                    <div className="photo-grid scroll-container" style={{gridColumn: '1 / -1'}}>
                        {filteredPhotos.map((photo, index) => {
                            const publicUrl = getPublicUrl(photo.file_path);
                            return (
                                <div className="photo-grid-item" key={index} onClick={() => handlePhotoClick(photo)}>
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
            )}

            {request.additional_comments && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Comments</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_comments }} />
                </div>
            )}
        </div>
    );

    const renderDJRequest = () => (
        <div className="request-summary-grid">
            {/* Basic Event Information */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Event Type</div>
                <div className="request-info">{request.event_type || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Location</div>
                <div className="request-info">{request.location}</div>
            </div>

            {/* Date Information */}
            {request.date_flexibility === 'specific' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Event Date</div>
                    <div className="request-info">
                        {new Date(request.start_date).toLocaleDateString()}
                    </div>
                </div>
            ) : request.date_flexibility === 'range' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date Range</div>
                    <div className="request-info">
                        {`${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`}
                    </div>
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date Preference</div>
                    <div className="request-info">
                        {request.date_timeframe === '3months' ? 'Within 3 months' :
                         request.date_timeframe === '6months' ? 'Within 6 months' :
                         request.date_timeframe === '1year' ? 'Within 1 year' :
                         request.date_timeframe === 'more' ? 'More than 1 year' :
                         'Not specified'}
                    </div>
                </div>
            )}

            {/* Indoor/Outdoor */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Venue Type</div>
                <div className="request-info">{request.indoor_outdoor || 'Not specified'}</div>
            </div>

            {/* Event Coverage */}
            {request.event_type === 'Wedding' && request.wedding_details && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Event Coverage</div>
                    <div className="request-info">
                        {Object.entries(request.wedding_details)
                            .filter(([_, value]) => value)
                            .map(([key]) => key.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + key.slice(1))
                            .join(', ') || 'Not specified'}
                    </div>
                </div>
            )}

            {/* Event Details */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Duration</div>
                <div className="request-info">
                    {request.event_duration ? `${request.event_duration} hours` : 'Not specified'}
                </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Expected Guests</div>
                <div className="request-info">
                    {request.estimated_guests || 'Not specified'}
                </div>
            </div>

            {/* Equipment Section */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Equipment Setup</div>
                <div className="request-info">{request.equipment_needed || 'Not specified'}</div>
            </div>

            {request.equipment_notes && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Equipment Notes</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.equipment_notes }} />
                </div>
            )}

            {/* Music Preferences */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Music Preferences</div>
                <div className="request-info">
                    {request.music_preferences ? 
                        Object.entries(request.music_preferences)
                            .filter(([_, value]) => value)
                            .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                            .join(', ') 
                        : 'Not specified'}
                </div>
            </div>

            {/* Add-ons */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Additional Services</div>
                <div className="request-info">
                    {request.additional_services && request.additional_services.length > 0
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
                </div>
            </div>

            {/* Playlist Link */}
            {request.special_songs?.playlist && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Music Playlist</div>
                    <div className="request-info">
                        <a href={request.special_songs.playlist} target="_blank" rel="noopener noreferrer">
                            View Playlist
                        </a>
                    </div>
                </div>
            )}

            {/* Special Songs */}
            {request.special_songs?.requests && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Special Song Requests</div>
                    <div className="request-info">
                        <ReactQuill value={request.special_songs.requests} readOnly={true} theme="bubble" />
                    </div>
                </div>
            )}

            {/* Budget */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Budget Range</div>
                <div className="request-info">${request.budget_range}</div>
            </div>

            {/* Additional Information */}
            {request.additional_info && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Information</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_info }} />
                </div>
            )}

            {request.additional_comments && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Comments</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_comments }} />
                </div>
            )}
        </div>
    );

    const renderCateringRequest = () => (
        <div className="request-summary-grid">
            {/* Basic Event Information */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Event Type</div>
                <div className="request-info">{request.event_type || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Location</div>
                <div className="request-info">{request.location}</div>
            </div>

            {/* Date Information */}
            {request.date_flexibility === 'specific' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Event Date</div>
                    <div className="request-info">
                        {new Date(request.start_date).toLocaleDateString()}
                    </div>
                </div>
            ) : request.date_flexibility === 'range' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date Range</div>
                    <div className="request-info">
                        {`${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`}
                    </div>
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date Preference</div>
                    <div className="request-info">
                        {request.date_timeframe === '3months' ? 'Within 3 months' :
                         request.date_timeframe === '6months' ? 'Within 6 months' :
                         request.date_timeframe === '1year' ? 'Within 1 year' :
                         request.date_timeframe === 'more' ? 'More than 1 year' :
                         'Not specified'}
                    </div>
                </div>
            )}

            {/* Time Information */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Event Time</div>
                <div className="request-info">
                    {request.start_time ? `Start: ${request.start_time}` : 'Start time TBD'}
                    <br />
                    {request.end_time ? `End: ${request.end_time}` : 'End time TBD'}
                </div>
            </div>

            {/* Guest Count */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Expected Guests</div>
                <div className="request-info">{request.estimated_guests || 'Not specified'}</div>
            </div>

            {/* Food Style Preferences */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                <div className="request-subtype">Food Style Preferences</div>
                <div className="request-info">
                    {typeof request.food_preferences === 'object' 
                        ? Object.entries(request.food_preferences)
                            .filter(([_, value]) => value)
                            .map(([key]) => key
                                .replace(/([A-Z])/g, ' $1')
                                .toLowerCase()
                                .replace(/^./, str => str.toUpperCase()))
                                .join(', ') 
                        : request.food_preferences || 'Not specified'}
                </div>
            </div>

            {/* Service Type */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Food Service Type</div>
                <div className="request-info">
                    {(() => {
                        switch (request.food_service_type) {
                            case 'onSite': return 'Cooking On-Site';
                            case 'delivered': return 'Delivered Ready-to-Serve';
                            case 'both': return 'Combination';
                            case 'flexible': return 'Flexible';
                            default: return request.food_service_type || 'Not specified';
                        }
                    })()}
                </div>
            </div>

            {/* Equipment Setup */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Kitchen Equipment</div>
                <div className="request-info">{request.equipment_needed || 'Not specified'}</div>
            </div>

            {/* Serving Staff */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Serving Staff</div>
                <div className="request-info">
                    {(() => {
                        switch (request.serving_staff) {
                            case 'fullService': return 'Full Service Staff';
                            case 'partialService': return 'Partial Service';
                            case 'noService': return 'No Staff Needed';
                            case 'unsure': return 'Not Sure';
                            default: return request.serving_staff || 'Not specified';
                        }
                    })()}
                </div>
            </div>

            {/* Setup & Cleanup */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Setup & Cleanup</div>
                <div className="request-info">
                    {(() => {
                        switch (request.setup_cleanup) {
                            case 'setupOnly': return 'Setup Only';
                            case 'cleanupOnly': return 'Cleanup Only';
                            case 'both': return 'Both Setup & Cleanup';
                            case 'neither': return 'Neither';
                            default: return request.setup_cleanup || 'Not specified';
                        }
                    })()}
                </div>
            </div>

            {/* Dining Items */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Dining Items</div>
                <div className="request-info">
                    {(() => {
                        switch (request.dining_items) {
                            case 'provided': return 'Provided by Caterer';
                            case 'notProvided': return 'Not Needed';
                            case 'partial': return 'Partial (See Details Below)';
                            default: return request.dining_items || 'Not specified';
                        }
                    })()}
                </div>
            </div>

            {/* Dining Items Notes */}
            {request.dining_items_notes && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Dining Items Details</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.dining_items_notes }} />
                </div>
            )}

            {/* Budget */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Budget Range</div>
                <div className="request-info">
                    {(() => {
                        switch (request.budget_range) {
                            case 'under1000': return 'Under $1,000';
                            case '1000-2000': return '$1,000 - $2,000';
                            case '2000-3000': return '$2,000 - $3,000';
                            case '3000-4000': return '$3,000 - $4,000';
                            case '4000-5000': return '$4,000 - $5,000';
                            case '5000+': return '$5,000+';
                            default: return `$${request.budget_range}` || 'Not specified';
                        }
                    })()}
                </div>
            </div>

            {/* Special Requests */}
            {request.special_requests && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Special Requests</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.special_requests }} />
                </div>
            )}

            {/* Additional Information */}
            {request.additional_info && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Information</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_info }} />
                </div>
            )}

            {/* Inspiration Photos */}
            {filteredPhotos && filteredPhotos.length > 0 && (
                <>
                    <div className="request-subtype" style={{gridColumn: '1 / -1'}}>
                        Inspiration Photos
                    </div>
                    <div className="photo-grid scroll-container" style={{gridColumn: '1 / -1'}}>
                        {filteredPhotos.map((photo, index) => {
                            const publicUrl = getPublicUrl(photo.file_path);
                            return (
                                <div className="photo-grid-item" key={index} onClick={() => handlePhotoClick(photo)}>
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
            )}

            {request.additional_comments && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Comments</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_comments }} />
                </div>
            )}
        </div>
    );

    const renderFloristRequest = () => (
        <div className="request-summary-grid">
            {/* Basic Event Information */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Event Type</div>
                <div class="request-info">{request.event_type || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Location</div>
                <div className="request-info">{request.location}</div>
            </div>

            {/* Date Information */}
            {request.date_flexibility === 'specific' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Event Date</div>
                    <div className="request-info">
                        {new Date(request.start_date).toLocaleDateString()}
                    </div>
                </div>
            ) : request.date_flexibility === 'range' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date Range</div>
                    <div className="request-info">
                        {`${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`}
                    </div>
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date Preference</div>
                    <div className="request-info">
                        {request.date_timeframe === '3months' ? 'Within 3 months' :
                         request.date_timeframe === '6months' ? 'Within 6 months' :
                         request.date_timeframe === '1year' ? 'Within 1 year' :
                         request.date_timeframe === 'more' ? 'More than 1 year' :
                         'Not specified'}
                    </div>
                </div>
            )}

            {/* Budget */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Budget Range</div>
                <div className="request-info">${request.price_range}</div>
            </div>

            {/* Pinterest Link */}
            {request.pinterest_link && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Pinterest Board</div>
                    <div className="request-info">
                        <a href={request.pinterest_link} target="_blank" rel="noopener noreferrer">
                            View Board
                        </a>
                    </div>
                </div>
            )}

            {/* Additional Services */}
            {request.additional_services && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Additional Services</div>
                    <div className="request-info">
                        {typeof request.additional_services === 'string'
                            ? Object.entries(JSON.parse(request.additional_services))
                                .filter(([_, value]) => value === true)
                                .map(([key]) => key
                                    .replace(/([A-Z])/g, ' $1')
                                    .toLowerCase()
                                    .replace(/^./, str => str.toUpperCase()))
                                .join(', ')
                            : Object.entries(request.additional_services)
                                .filter(([_, value]) => value === true)
                                .map(([key]) => key
                                    .replace(/([A-Z])/g, ' $1')
                                    .toLowerCase()
                                    .replace(/^./, str => str.toUpperCase()))
                                .join(', ') || 'Not specified'}
                    </div>
                </div>
            )}
            {/* Update Colors Display */}
            {request.colors && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Color Preferences</div>
                    <div className="request-info">
                        {typeof request.colors === 'string' 
                            ? JSON.parse(request.colors).join(', ')
                            : Array.isArray(request.colors) 
                                ? request.colors.join(', ')
                                : 'Not specified'}
                    </div>
                </div>
            )}

            {/* Update Floral Arrangements Display */}
            {request.floral_arrangements && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Floral Arrangements</div>
                    <div className="request-info">
                        {typeof request.floral_arrangements === 'string'
                            ? Object.entries(JSON.parse(request.floral_arrangements))
                                .filter(([key, value]) => value === true && !key.endsWith('Quantity'))
                                .map(([key]) => {
                                    const arrangements = JSON.parse(request.floral_arrangements);
                                    const quantity = arrangements[`${key}Quantity`];
                                    const label = key
                                        .replace(/([A-Z])/g, ' $1')
                                        .toLowerCase()
                                        .replace(/^./, str => str.toUpperCase());
                                    return quantity ? `${label} (${quantity})` : label;
                                })
                                .join(', ')
                            : Object.entries(request.floral_arrangements)
                                .filter(([key, value]) => value === true && !key.endsWith('Quantity'))
                                .map(([key]) => {
                                    const quantity = request.floral_arrangements[`${key}Quantity`];
                                    const label = key
                                        .replace(/([A-Z])/g, ' $1')
                                        .toLowerCase()
                                        .replace(/^./, str => str.toUpperCase());
                                    return quantity ? `${label} (${quantity})` : label;
                                })
                                .join(', ') || 'Not specified'}
                    </div>
                </div>
            )}

            {/* Update Flower Preferences Display */}
            {request.flower_preferences && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Flower Preferences</div>
                    <div className="request-info">
                        {typeof request.flower_preferences === 'string'
                            ? Object.entries(JSON.parse(request.flower_preferences))
                                .filter(([_, value]) => value === true)
                                .map(([key]) => key
                                    .replace(/([A-Z])/g, ' $1')
                                    .toLowerCase()
                                    .replace(/^./, str => str.toUpperCase()))
                                    .join(', ')
                            : Object.entries(request.flower_preferences)
                                .filter(([_, value]) => value === true)
                                .map(([key]) => key
                                    .replace(/([A-Z])/g, ' $1')
                                    .toLowerCase()
                                    .replace(/^./, str => str.toUpperCase()))
                                    .join(', ') || 'Not specified'}
                    </div>
                </div>
            )}

            {/* Additional Comments */}
            {request.additional_comments && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Comments</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_comments }} />
                </div>
            )}
        </div>
    );

    const renderVideographyRequest = () => (
        <div className="request-summary-grid">
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Event Type</div>
                <div className="request-info">{request.event_type || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Location</div>
                <div className="request-info">{request.location}</div>
            </div>

            {/* Date Information */}
            {request.date_flexibility === 'specific' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Event Date</div>
                    <div className="request-info">
                        {new Date(request.start_date).toLocaleDateString()}
                    </div>
                </div>
            ) : request.date_flexibility === 'range' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date Range</div>
                    <div className="request-info">
                        {`${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`}
                    </div>
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Date Preference</div>
                    <div className="request-info">
                        {request.date_timeframe === '3months' ? 'Within 3 months' :
                         request.date_timeframe === '6months' ? 'Within 6 months' :
                         request.date_timeframe === '1year' ? 'Within 1 year' :
                         request.date_timeframe === 'more' ? 'More than 1 year' :
                         'Not specified'}
                    </div>
                </div>
            )}

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Event Time</div>
                <div className="request-info">
                    {request.start_time ? `Start: ${request.start_time}` : 'Start time TBD'}
                    <br />
                    {request.end_time ? `End: ${request.end_time}` : 'End time TBD'}
                </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Number of People</div>
                <div className="request-info">{request.num_people || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Duration (hours)</div>
                <div className="request-info">{request.duration || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Indoor/Outdoor</div>
                <div className="request-info">{request.indoor_outdoor || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Second Videographer</div>
                <div className="request-info">{request.second_photographer ? 'Yes' : 'No'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Budget Range</div>
                <div className="request-info">${request.price_range}</div>
            </div>

            {request.pinterest_link && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Pinterest Board</div>
                    <div className="request-info">
                        <a href={request.pinterest_link} target="_blank" rel="noopener noreferrer">
                            View Board
                        </a>
                    </div>
                </div>
            )}

            {/* Style Preferences */}
            {request.style_preferences && Object.keys(request.style_preferences).length > 0 && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Style Preferences</div>
                    <div className="request-info">
                        {Object.entries(request.style_preferences)
                            .filter(([_, value]) => value)
                            .map(([key]) => key.replace(/([A-Z])/g, ' $1')
                                .toLowerCase()
                                .replace(/^./, str => str.toUpperCase()))
                            .join(', ') || 'Not specified'}
                    </div>
                </div>
            )}

            {/* Deliverables */}
            {request.deliverables && Object.keys(request.deliverables).length > 0 && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Deliverables</div>
                    <div className="request-info">
                        {Object.entries(request.deliverables)
                            .filter(([_, value]) => value)
                            .map(([key]) => key.replace(/([A-Z])/g, ' $1')
                                .toLowerCase()
                                .replace(/^./, str => str.toUpperCase()))
                            .join(', ') || 'Not specified'}
                    </div>
                </div>
            )}

            {request.additional_info && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Information</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_info }} />
                </div>
            )}

            {/* Inspiration Photos */}
            {filteredPhotos && filteredPhotos.length > 0 && (
                <>
                    <div className="request-subtype" style={{gridColumn: '1 / -1'}}>
                        Inspiration Photos
                    </div>
                    <div className="photo-grid scroll-container" style={{gridColumn: '1 / -1'}}>
                        {filteredPhotos.map((photo, index) => {
                            const publicUrl = getPublicUrl(photo.file_path);
                            return (
                                <div className="photo-grid-item" key={index} onClick={() => handlePhotoClick(photo)}>
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
            )}

            {request.additional_comments && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Comments</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_comments }} />
                </div>
            )}
        </div>
    );

    const renderDefaultRequest = () => (
        <div className="request-summary-grid">
            {/* Basic Info */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Event Type</div>
                <div className="request-info">{request.event_type || request.service_type || 'Not specified'}</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Location</div>
                <div className="request-info">{request.location || 'Not specified'}</div>
            </div>

            {/* Service Details */}
            {request.service_title && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Service Title</div>
                    <div className="request-info">{request.service_title}</div>
                </div>
            )}

            {request.service_description && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Service Description</div>
                    <div className="request-info">{request.service_description}</div>
                </div>
            )}

            {request.service_category && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Service Category</div>
                    <div className="request-info">{request.service_category}</div>
                </div>
            )}

            {/* Date and Time */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Date of Service</div>
                <div className="request-info">{getDate()}</div>
            </div>

            {request.time_of_day && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Time of Day</div>
                    <div className="request-info">{request.time_of_day}</div>
                </div>
            )}

            {request.end_date && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">End Date</div>
                    <div className="request-info">{new Date(request.end_date).toLocaleDateString()}</div>
                </div>
            )}

            {/* Additional Details */}
            {request.additional_details && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Details</div>
                    <div className="request-info">{request.additional_details}</div>
                </div>
            )}

            {/* Budget */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div className="request-subtype">Budget Range</div>
                <div className="request-info">${request.price_range || request.budget_range || 'Not specified'}</div>
            </div>

            {/* Customer Info */}
            {request.customer_location && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Customer Location</div>
                    <div className="request-info">{request.customer_location}</div>
                </div>
            )}

            {/* Media */}
            {request.media_url && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Media</div>
                    <div className="request-info">
                        <a href={request.media_url} target="_blank" rel="noopener noreferrer">
                            View Media
                        </a>
                    </div>
                </div>
            )}

            {/* Pinterest Link */}
            {request.pinterest_link && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Pinterest Board</div>
                    <div className="request-info">
                        <a href={request.pinterest_link} target="_blank" rel="noopener noreferrer">
                            View Board
                        </a>
                    </div>
                </div>
            )}

            {/* Coupon Code */}
            {request.coupon_code && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <div className="request-subtype">Coupon Code</div>
                    <div className="request-info">{request.coupon_code}</div>
                </div>
            )}

            {/* Additional Comments */}
            {request.additional_comments && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1'}}>
                    <div className="request-subtype">Additional Comments</div>
                    <div className="request-info" dangerouslySetInnerHTML={{ __html: request.additional_comments }} />
                </div>
            )}

            {/* Inspiration Photos */}
            {filteredPhotos && filteredPhotos.length > 0 && (
                <>
                    <div className="request-subtype" style={{gridColumn: '1 / -1'}}>
                        Inspiration Photos
                    </div>
                    <div className="photo-grid scroll-container" style={{gridColumn: '1 / -1'}}>
                        {filteredPhotos.map((photo, index) => {
                            const publicUrl = getPublicUrl(photo.file_path);
                            return (
                                <div className="photo-grid-item" key={index} onClick={() => handlePhotoClick(photo)}>
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
            )}
        </div>
    );

    const renderRequestDetails = () => {
        const type = getRequestType();
        console.log('renderRequestDetails - type:', type); // Add this debug log
        console.log('renderRequestDetails - request:', request); // Add this debug log
        
        switch (type) {
            case 'beauty_requests':
                return renderBeautyRequest();
            case 'photography_requests':
                return renderPhotographyRequest();
            case 'dj_requests':
                return renderDJRequest();
            case 'catering_requests':
                return renderCateringRequest();
            case 'florist_requests':
                console.log('Rendering florist request...'); // Add this debug log
                return renderFloristRequest();
            case 'videography_requests':
                return renderVideographyRequest();
            default:
                console.log('Falling back to default render...'); // Add this debug log
                return renderDefaultRequest();
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

    const getTimeDifference = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInDays < 7) return 'New';
        return `${diffInDays}d ago`;
    };

    const getDateDistance = (date) => {
        const now = new Date();
        const eventDate = new Date(date);
        const diffInDays = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));
        
        if (diffInDays < 0) return 'Past event';
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Tomorrow';
        return '';
    };

    const isNew = (createdAt) => {
        if (!createdAt) return false;
        const now = new Date();
        const created = new Date(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return diffInDays < 7;
    };

    const checkPromotion = (createdAt) => {
        if (!createdAt) return null;

        // Parse PostgreSQL timestamp string to get UTC milliseconds
        const createdParts = createdAt.split(/[^0-9]/);
        const year = parseInt(createdParts[0]);
        const month = parseInt(createdParts[1]) - 1; // months are 0-based
        const day = parseInt(createdParts[2]);
        const hour = parseInt(createdParts[3]);
        const minute = parseInt(createdParts[4]);
        const second = parseInt(createdParts[5]);
        const millisecond = parseInt(createdParts[6].substr(0, 3));

        const created = Date.UTC(year, month, day, hour, minute, second, millisecond);
        const now = Date.now();

        // Date comparison in local time (this part works fine)
        const localCreated = new Date(createdAt);
        const createdDate = localCreated.toLocaleDateString('en-CA');
        const specialDates = ['2025-01-11', '2025-01-25'];

        // Debug logging
        console.log('Raw createdAt:', createdAt);
        console.log('Parsed created UTC:', new Date(created).toISOString());
        console.log('Now:', new Date(now).toISOString());
        console.log('Created parts:', { year, month, day, hour, minute, second, millisecond });

        if (!specialDates.includes(createdDate)) {
            return null;
        }

        // Get milliseconds since creation
        const msSinceCreation = now - created;
        const minutesSinceCreation = msSinceCreation / (1000 * 60);

        console.log('Milliseconds since creation:', msSinceCreation);
        console.log('Minutes since creation:', minutesSinceCreation);

        // Check time windows
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

    useEffect(() => {
        const fetchPhotos = async () => {
            const type = getRequestType();
            
            if (!request?.id) return;

            let photos = [];
            let error;

            switch (type) {
                case 'photography_requests':
                    ({ data: photos, error } = await supabase
                        .from('event_photos')
                        .select('*')
                        .eq('request_id', request.id));
                    break;

                case 'videography_requests':
                    ({ data: photos, error } = await supabase
                        .from('videography_photos')
                        .select('*')
                        .eq('request_id', request.id));
                    break;

                case 'florist_requests':
                    ({ data: photos, error } = await supabase
                        .from('florist_photos')
                        .select('*')
                        .eq('request_id', request.id));
                    break;

                case 'beauty_requests':
                    ({ data: photos, error } = await supabase
                        .from('beauty_photos')
                        .select('*')
                        .eq('request_id', request.id));
                    break;
            }

            if (error) {
                console.error(`Error fetching ${type} photos:`, error);
                return;
            }

            setFilteredPhotos(photos || []);
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

    return (
        <div className="request-display text-center mb-4">
            {console.log('Final render - RequestType:', getRequestType())}
            {console.log('Final render - Request:', request)}
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
{/* Add this modal */}
{selectedPhoto && (
    <div className="modal-overlay" onClick={handleCloseModal}>
        <div className="modal-content-photo" onClick={e => e.stopPropagation()}>
            <button 
                className="remove-photo-button"
                style={{ position: 'absolute', right: '10px', top: '10px' }}
                onClick={handleCloseModal}
            >
                X
            </button>
            <img 
                src={getPublicUrl(selectedPhoto.file_path) || selectedPhoto.photo_url} 
                alt="Full size" 
                style={{ maxWidth: '100%', maxHeight: '90vh' }}
            />
        </div>
    </div>
)}
        </div>
    );
}

export default RequestDisplay;

