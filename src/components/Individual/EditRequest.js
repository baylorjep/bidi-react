import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FaTrash } from 'react-icons/fa';
import LoadingSpinner from '../LoadingSpinner';

function EditRequest() {
    const location = useLocation();
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(() => {
        // If request is passed via location.state, use it as initial form data
        if (location.state && location.state.request) {
            return { ...location.state.request };
        }
        // Otherwise, use default blank schema
        return {
            service_type: '',
            service_title: '',
            service_description: '',
            service_date: '',
            end_date: '',
            event_title: '',
            event_type: '',
            location: '',
            price_range: '',
            budget_range: '',
            coupon_code: '',
            pinterest_link: '',
            media_url: '',
            additional_info: '',
            additional_comments: '',
            // Add any other fields that exist in the requests table schema
        };
    });
    const [error, setError] = useState('');
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef();

    useEffect(() => {
        const fetchRequest = async () => {
            const tableMap = {
                'photography': 'photography_requests',
                'dj': 'dj_requests',
                'catering': 'catering_requests',
                'beauty': 'beauty_requests',
                'videography': 'videography_requests',
                'florist': 'florist_requests',
                'wedding_planning': 'wedding_planning_requests',
                'regular': 'requests'
            };
            const table = tableMap[type] || 'requests';
            
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .eq('id', id);

                if (error) {
                    throw error;
                }

                if (!data || data.length === 0) {
                    setError('Request not found');
                    navigate(-1
                
                    ); // Redirect to requests list
                    return;
                }

                // Format dates for input field
                const formattedData = {
                    ...data[0],
                    service_date: data[0].service_date?.split('T')[0],
                    end_date: data[0].end_date?.split('T')[0],
                    start_date: data[0].start_date?.split('T')[0],
                };
                
                // Parse JSON strings if they exist
                if (type === 'photography') {
                    formattedData.style_preferences = typeof data[0].style_preferences === 'string' 
                        ? JSON.parse(data[0].style_preferences)
                        : data[0].style_preferences || {};
                    formattedData.deliverables = typeof data[0].deliverables === 'string'
                        ? JSON.parse(data[0].deliverables)
                        : data[0].deliverables || {};
                    formattedData.wedding_details = typeof data[0].wedding_details === 'string'
                        ? JSON.parse(data[0].wedding_details)
                        : data[0].wedding_details || {};
                } else if (type === 'florist') {
                    formattedData.floral_arrangements = typeof data[0].floral_arrangements === 'string'
                        ? JSON.parse(data[0].floral_arrangements)
                        : data[0].floral_arrangements || {};
                    formattedData.flower_preferences = typeof data[0].flower_preferences === 'string'
                        ? JSON.parse(data[0].flower_preferences)
                        : data[0].flower_preferences || {};
                    formattedData.additional_services = typeof data[0].additional_services === 'string'
                        ? JSON.parse(data[0].additional_services)
                        : data[0].additional_services || {};
                    formattedData.colors = typeof data[0].colors === 'string'
                        ? JSON.parse(data[0].colors)
                        : data[0].colors || [];
                } else if (type === 'catering') {
                    formattedData.food_preferences = typeof data[0].food_preferences === 'string' 
                        ? JSON.parse(data[0].food_preferences)
                        : data[0].food_preferences || {};
                    formattedData.title = data[0].title || '';
                    // Don't parse these as JSON, just use the values directly
                    formattedData.dining_items = data[0].dining_items || null;
                    formattedData.setup_cleanup = data[0].setup_cleanup || null;
                    formattedData.food_service_type = data[0].food_service_type || null;
                    formattedData.serving_staff = data[0].serving_staff || null;
                }
                
                // Only set special_songs for DJ requests
                if (type === 'dj') {
                    formattedData.special_songs = data[0].special_songs || { playlists: '', requests: '' };
                }
                
                setFormData(formattedData);
            } catch (error) {
                console.error('Error fetching request:', error);
                setError('Failed to fetch request. Please try again later.');
                navigate(-1); // Redirect to requests list
            }
        };

        fetchRequest();

        // Fetch photos for this request (all types via service_photos)
        const fetchPhotos = async () => {
            let requestId = id;
            let requestType = type;
            // For all types, fetch from service_photos
            const { data, error } = await supabase
                .from('service_photos')
                .select('*')
                .eq('request_id', requestId);
            if (!error && data) {
                setPhotos(data);
            }
        };
        fetchPhotos();
    }, [id, type, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSpecialSongsChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            special_songs: {
                ...prev.special_songs,
                [field]: value
            }
        }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleJsonChange = (field, key, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [key]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const tableMap = {
            'photography': 'photography_requests',
            'dj': 'dj_requests',
            'catering': 'catering_requests',
            'beauty': 'beauty_requests',
            'videography': 'videography_requests',
            'florist': 'florist_requests',
            'wedding_planning': 'wedding_planning_requests',
            'regular': 'requests'
        };
        const table = tableMap[type] || 'requests';

        let updateData = { ...formData };

        // Convert JSON objects to strings for specific request types
        if (type === 'photography') {
            updateData = {
                ...updateData,
                style_preferences: JSON.stringify(formData.style_preferences),
                deliverables: JSON.stringify(formData.deliverables),
                wedding_details: JSON.stringify(formData.wedding_details)
            };
        } else if (type === 'florist') {
            updateData = {
                ...updateData,
                floral_arrangements: JSON.stringify(formData.floral_arrangements),
                flower_preferences: JSON.stringify(formData.flower_preferences),
                additional_services: JSON.stringify(formData.additional_services),
                colors: JSON.stringify(formData.colors)
            };
        } else if (type === 'catering') {
            updateData = {
                ...updateData,
                food_preferences: JSON.stringify(formData.food_preferences),
                special_requests: JSON.stringify(formData.special_requests),
                additional_services: JSON.stringify(formData.additional_services)
            };
        } else if (type === 'dj') {
            updateData = {
                ...updateData,
                music_preferences: JSON.stringify(formData.music_preferences),
                special_songs: JSON.stringify(formData.special_songs),
                additional_services: formData.additional_services
            };
        } else if (type === 'wedding_planning') {
            updateData = {
                ...updateData,
                vendor_preferences: JSON.stringify(formData.vendor_preferences),
                additional_events: JSON.stringify(formData.additional_events)
            };
        }

        // Handle boolean fields
        if (type === 'beauty' || type === 'florist') {
            updateData.specific_time_needed = formData.specific_time_needed === 'yes';
        }

        // Handle date fields
        if (updateData.start_date) {
            updateData.start_date = new Date(updateData.start_date).toISOString().split('T')[0];
        }
        if (updateData.end_date) {
            updateData.end_date = new Date(updateData.end_date).toISOString().split('T')[0];
        }

        const { error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', id);

        if (error) {
            setError('Failed to update request');
            console.error(error);
        } else {
            navigate(-1);
        }
    };

    // Photo upload handler
    const handlePhotoUpload = async (e) => {
        const files = e.target.files;
        if (!files || !files.length) return;
        setUploading(true);
        try {
            // Get user id from formData or supabase.auth
            let userId = formData.user_id;
            if (!userId && supabase.auth.getUser) {
                const { data: userData } = await supabase.auth.getUser();
                userId = userData?.user?.id;
            }
            if (!userId) throw new Error('User not authenticated');
            const requestId = id;
            const uploadedPhotos = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const filePath = `${userId}/${requestId}/${Date.now()}_${i}.${fileExt}`;
                // Upload to request-media bucket
                const { error: uploadError } = await supabase.storage
                    .from('request-media')
                    .upload(filePath, file, { upsert: false });
                if (uploadError) throw uploadError;
                // Get public URL
                const { data: publicUrlData, error: urlError } = supabase.storage
                    .from('request-media')
                    .getPublicUrl(filePath);
                if (urlError) throw urlError;
                const publicURL = publicUrlData?.publicUrl;
                // Insert into service_photos
                const { data: photoData, error: insertError } = await supabase
                    .from('service_photos')
                    .insert([
                        {
                            user_id: userId,
                            request_id: requestId,
                            photo_url: publicURL,
                            file_path: filePath
                        }
                    ])
                    .select();
                if (insertError) throw insertError;
                uploadedPhotos.push(photoData?.[0]);
            }
            setPhotos(prev => [...prev, ...uploadedPhotos]);
        } catch (err) {
            setError('Photo upload failed.');
            console.error('Photo upload error:', err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Remove photo handler
    const handleRemovePhoto = async (photoId, filePath) => {
        setUploading(true);
        try {
            // Remove from storage
            const { error: storageError } = await supabase.storage
                .from('request-media')
                .remove([filePath]);
            if (storageError) throw storageError;
            // Remove from service_photos
            const { error: dbError } = await supabase
                .from('service_photos')
                .delete()
                .eq('id', photoId);
            if (dbError) throw dbError;
            setPhotos(prev => prev.filter(p => p.id !== photoId));
        } catch (err) {
            setError('Failed to remove photo.');
        } finally {
            setUploading(false);
        }
    };

    if (!formData) return (
        <div className="container mt-5">
            <LoadingSpinner variant="ring" color="#ff008a" text="Loading request details..." />
        </div>
    );

    return (
        <div className="bids-page" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <div className="section-title" style={{marginBottom: 8}}>Edit Request</div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit} className="mb-5">
                {/* Basic Information Section */}
                <div className="form-grid">
                    <div className="wedding-details-container">
                        <div className="photo-options-header">Basic Information</div>
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="event_title"
                                value={formData.event_title}
                                onChange={handleInputChange}
                                className="custom-input"
                                placeholder="Enter event title"
                            />
                            <label className="custom-label">Event Title</label>
                        </div>
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="event_type"
                                value={formData.event_type}
                                onChange={handleInputChange}
                                className="custom-input"
                                placeholder="Enter event type"
                            />
                            <label className="custom-label">Event Type</label>
                        </div>
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="custom-input"
                                placeholder="Enter location"
                            />
                            <label className="custom-label">Location</label>
                        </div>
                        <div className="custom-input-container">
                            <select
                                name="price_range"
                                value={formData.price_range}
                                onChange={handleInputChange}
                                className="custom-input"
                            >
                                <option value="">Select Budget Range</option>
                                <option value="0-1000">Under $1,000</option>
                                <option value="1000-2000">$1,000 - $2,000</option>
                                <option value="2000-3000">$2,000 - $3,000</option>
                                <option value="3000-4000">$3,000 - $4,000</option>
                                <option value="4000-5000">$4,000 - $5,000</option>
                                <option value="5000+">$5,000+</option>
                            </select>
                            <label className="custom-label">Budget Range</label>
                        </div>
                    </div>
                </div>

                {/* Date & Time Section */}
                <div className="form-grid">
                    <div className="wedding-details-container">
                        <div className="photo-options-header">Date & Time</div>
                        <div className="custom-input-container">
                            <select
                                name="date_flexibility"
                                value={formData.date_flexibility}
                                onChange={handleInputChange}
                                className="custom-input"
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                                <option value="flexible">I'm Flexible</option>
                            </select>
                            <label className="custom-label">Date Flexibility</label>
                        </div>

                        {formData.date_flexibility === 'specific' && (
                            <div className="custom-input-container">
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                />
                                <label className="custom-label">Event Date</label>
                            </div>
                        )}

                        {formData.date_flexibility === 'range' && (
                            <>
                                <div className="custom-input-container">
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        className="custom-input"
                                    />
                                    <label className="custom-label">Start Date</label>
                                </div>
                                <div className="custom-input-container">
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                        className="custom-input"
                                    />
                                    <label className="custom-label">End Date</label>
                                </div>
                            </>
                        )}

                        {formData.date_flexibility === 'flexible' && (
                            <div className="custom-input-container">
                                <select
                                    name="date_timeframe"
                                    value={formData.date_timeframe}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select timeframe</option>
                                    <option value="3months">Within 3 months</option>
                                    <option value="6months">Within 6 months</option>
                                    <option value="1year">Within 1 year</option>
                                    <option value="more">More than 1 year</option>
                                </select>
                                <label className="custom-label">Preferred Timeframe</label>
                            </div>
                        )}

                        <div className="custom-input-container">
                            <input
                                type="time"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleInputChange}
                                className="custom-input"
                            />
                            <label className="custom-label">Start Time</label>
                        </div>
                        <div className="custom-input-container">
                            <input
                                type="time"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleInputChange}
                                className="custom-input"
                            />
                            <label className="custom-label">End Time</label>
                        </div>
                    </div>
                </div>

                {/* Photography Specific Section */}
                {type === 'photography' && (
                    <div className="form-grid">
                        <div className="wedding-details-container">
                            <div className="photo-options-header">Photography Details</div>
                            
                            <div className="custom-input-container">
                                <div className="input-with-unknown">
                                    <input
                                        type="number"
                                        name="num_people"
                                        value={formData.num_people}
                                        onChange={handleInputChange}
                                        className="custom-input"
                                        min="1"
                                    />
                                    <label className="unknown-checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={formData.num_people_unknown}
                                            onChange={handleCheckboxChange}
                                            name="num_people_unknown"
                                        />
                                        <span className="unknown-checkbox-label">Not sure</span>
                                    </label>
                                </div>
                                <label className="custom-label">Number of People</label>
                            </div>

                            <div className="custom-input-container">
                                <div className="input-with-unknown">
                                    <input
                                        type="number"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        className="custom-input"
                                        min="1"
                                    />
                                    <label className="unknown-checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={formData.duration_unknown}
                                            onChange={handleCheckboxChange}
                                            name="duration_unknown"
                                        />
                                        <span className="unknown-checkbox-label">Not sure</span>
                                    </label>
                                </div>
                                <label className="custom-label">Duration (hours)</label>
                            </div>

                            <div className="custom-input-container">
                                <select
                                    name="indoor_outdoor"
                                    value={formData.indoor_outdoor}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select...</option>
                                    <option value="indoor">Indoor</option>
                                    <option value="outdoor">Outdoor</option>
                                    <option value="both">Both</option>
                                </select>
                                <label className="custom-label">Indoor/Outdoor</label>
                            </div>

                            <div className="custom-input-container">
                                <select
                                    name="second_photographer"
                                    value={formData.second_photographer}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="undecided">Let photographer recommend</option>
                                </select>
                                <label className="custom-label">Second Photographer</label>
                            </div>

                            {/* Style Preferences */}
                            <div className="wedding-photo-options">
                                <div className="photo-options-header">Style Preferences</div>
                                <div className="photo-options-grid">
                                    {[
                                        { key: 'brightAiry', label: 'Bright & Airy' },
                                        { key: 'darkMoody', label: 'Dark & Moody' },
                                        { key: 'filmEmulation', label: 'Film-Like' },
                                        { key: 'traditional', label: 'Traditional/Classic' },
                                        { key: 'documentary', label: 'Documentary/Candid' },
                                        { key: 'artistic', label: 'Artistic/Creative' }
                                    ].map(style => (
                                        <div key={style.key} className="photo-option-item">
                                            <input
                                                type="checkbox"
                                                id={style.key}
                                                checked={formData.style_preferences?.[style.key] || false}
                                                onChange={(e) => handleJsonChange('style_preferences', style.key, e.target.checked)}
                                            />
                                            <label htmlFor={style.key}>{style.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Deliverables */}
                            <div className="wedding-photo-options">
                                <div className="photo-options-header">Deliverables</div>
                                <div className="photo-options-grid">
                                    {[
                                        { key: 'digitalFiles', label: 'Digital Files' },
                                        { key: 'printRelease', label: 'Print Release' },
                                        { key: 'weddingAlbum', label: 'Wedding Album' },
                                        { key: 'prints', label: 'Professional Prints' },
                                        { key: 'rawFiles', label: 'RAW Files' },
                                        { key: 'engagement', label: 'Engagement Session' }
                                    ].map(item => (
                                        <div key={item.key} className="photo-option-item">
                                            <input
                                                type="checkbox"
                                                id={item.key}
                                                checked={formData.deliverables?.[item.key] || false}
                                                onChange={(e) => handleJsonChange('deliverables', item.key, e.target.checked)}
                                            />
                                            <label htmlFor={item.key}>{item.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Wedding Details */}
                            <div className="wedding-photo-options">
                                <div className="photo-options-header">Wedding Details</div>
                                <div className="photo-options-grid">
                                    {[
                                        { key: 'preCeremony', label: 'Pre-Ceremony' },
                                        { key: 'ceremony', label: 'Ceremony' },
                                        { key: 'reception', label: 'Reception' }
                                    ].map(item => (
                                        <div key={item.key} className="photo-option-item">
                                            <input
                                                type="checkbox"
                                                id={item.key}
                                                checked={formData.wedding_details?.[item.key] || false}
                                                onChange={(e) => handleJsonChange('wedding_details', item.key, e.target.checked)}
                                            />
                                            <label htmlFor={item.key}>{item.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Photo Upload Section */}
                            <div className="photo-upload-section">
                                <div className="custom-input-container">
                                    <input
                                        type="url"
                                        name="pinterest_link"
                                        value={formData.pinterest_link}
                                        onChange={handleInputChange}
                                        className="custom-input"
                                        placeholder="Paste your Pinterest board link here"
                                    />
                                    <label className="custom-label">Inspo</label>
                                </div>

                                <div className="photo-upload-instructions">
                                    <p style={{ color: "gray", fontSize:'16px' }}>You can also upload photos to help us understand your vision. Click or drag and drop photos below.</p>
                                </div>

                                <div className="photo-preview-container">
                                    {(!photos || photos.length === 0) ? (
                                        <div
                                            className="photo-upload-box"
                                            onClick={() => document.getElementById("file-input").click()}
                                        >
                                            <input
                                                type="file"
                                                id="file-input"
                                                multiple
                                                onChange={handlePhotoUpload}
                                                style={{ display: "none" }}
                                            />
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="54"
                                                height="45"
                                                viewBox="0 0 54 45"
                                                fill="none"
                                            >
                                                <path
                                                    d="M40.6939 15.6916C40.7126 15.6915 40.7313 15.6915 40.75 15.6915C46.9632 15.6915 52 20.2889 52 25.9601C52 31.2456 47.6249 35.5984 42 36.166M40.6939 15.6916C40.731 15.3158 40.75 14.9352 40.75 14.5505C40.75 7.61906 34.5939 2 27 2C19.8081 2 13.9058 7.03987 13.3011 13.4614M40.6939 15.6916C40.4383 18.2803 39.3216 20.6423 37.6071 22.5372M13.3011 13.4614C6.95995 14.0121 2 18.8869 2 24.8191C2 30.339 6.2944 34.9433 12 36.0004M13.3011 13.4614C13.6956 13.4271 14.0956 13.4096 14.5 13.4096C17.3146 13.4096 19.9119 14.2586 22.0012 15.6915"
                                                    stroke="#141B34"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M27 24.7783L27 43.0002M27 24.7783C25.2494 24.7783 21.9788 29.3208 20.75 30.4727M27 24.7783C28.7506 24.7783 32.0212 29.3208 33.25 30.4727"
                                                    stroke="#141B34"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <div className="photo-upload-text">
                                                Drag & Drop to Upload or Click to Browse
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="photo-grid">
                                                {photos.map(photo => (
                                                    <div key={photo.id} className="photo-grid-item">
                                                        <img
                                                            src={photo.photo_url}
                                                            alt="Inspiration"
                                                            className="photo-grid-image"
                                                        />
                                                        <button
                                                            className="remove-photo-button"
                                                            onClick={() => handleRemovePhoto(photo.id, photo.file_path)}
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ textAlign: "center", marginTop: "20px" }}>
                                                <button
                                                    onClick={() => document.getElementById("file-input-more").click()}
                                                    className="add-more-photos-btn"
                                                >
                                                    <input
                                                        type="file"
                                                        id="file-input-more"
                                                        multiple
                                                        onChange={handlePhotoUpload}
                                                        style={{ display: "none" }}
                                                    />
                                                    <span className="add-more-text">Add More Photos</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="custom-input-container">
                                <ReactQuill
                                    value={formData.additional_info || ''}
                                    onChange={(content) => setFormData(prev => ({
                                        ...prev,
                                        additional_info: content
                                    }))}
                                    placeholder="Any special requests or additional information photographers should know..."
                                />
                                <label className="custom-label">Additional Information</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Florist Specific Section */}
                {type === 'florist' && (
                    <div className="form-grid">
                        <div className="wedding-details-container">
                            <div className="photo-options-header">Florist Details</div>
                            
                            <div className="custom-input-container">
                                <div className="input-with-unknown">
                                    <input
                                        type="number"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleInputChange}
                                        className="custom-input"
                                        min="1"
                                    />
                                    <label className="unknown-checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={formData.budget_unknown}
                                            onChange={handleCheckboxChange}
                                            name="budget_unknown"
                                        />
                                        <span className="unknown-checkbox-label">Not sure</span>
                                    </label>
                                </div>
                                <label className="custom-label">Budget</label>
                            </div>

                            <div className="wedding-photo-options">
                                <div className="photo-options-header">Floral Arrangements Needed</div>
                                <div className="photo-options-grid">
                                    {[
                                        { key: 'bridalBouquet', label: 'Bridal Bouquet' },
                                        { key: 'bridesmaidBouquets', label: 'Bridesmaid Bouquets' },
                                        { key: 'boutonnieres', label: 'Boutonnieres' },
                                        { key: 'centerpieces', label: 'Centerpieces' },
                                        { key: 'ceremonyArch', label: 'Ceremony Arch' },
                                        { key: 'aisleDecor', label: 'Aisle Decor' },
                                        { key: 'altarArrangements', label: 'Altar Arrangements' }
                                    ].map(item => (
                                        <div key={item.key} className="photo-option-item">
                                            <input
                                                type="checkbox"
                                                id={item.key}
                                                checked={formData.floral_arrangements?.[item.key] || false}
                                                onChange={(e) => handleJsonChange('floral_arrangements', item.key, e.target.checked)}
                                            />
                                            <label htmlFor={item.key}>{item.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="wedding-photo-options">
                                <div className="photo-options-header">Flower Preferences</div>
                                <div className="photo-options-grid">
                                    {[
                                        { key: 'roses', label: 'Roses' },
                                        { key: 'peonies', label: 'Peonies' },
                                        { key: 'lilies', label: 'Lilies' },
                                        { key: 'tulips', label: 'Tulips' },
                                        { key: 'hydrangeas', label: 'Hydrangeas' },
                                        { key: 'orchids', label: 'Orchids' }
                                    ].map(item => (
                                        <div key={item.key} className="photo-option-item">
                                            <input
                                                type="checkbox"
                                                id={item.key}
                                                checked={formData.flower_preferences?.[item.key] || false}
                                                onChange={(e) => handleJsonChange('flower_preferences', item.key, e.target.checked)}
                                            />
                                            <label htmlFor={item.key}>{item.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="custom-input-container">
                                <input
                                    type="text"
                                    name="color_scheme"
                                    value={formData.color_scheme}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                    placeholder="Enter color scheme"
                                />
                                <label className="custom-label">Color Scheme</label>
                            </div>

                            <div className="custom-input-container">
                                <ReactQuill
                                    value={formData.additional_info || ''}
                                    onChange={(content) => setFormData(prev => ({
                                        ...prev,
                                        additional_info: content
                                    }))}
                                    placeholder="Any specific floral arrangements or additional information..."
                                />
                                <label className="custom-label">Additional Information</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Catering Specific Section */}
                {type === 'catering' && (
                    <div className="form-grid">
                        <div className="wedding-details-container">
                            <div className="photo-options-header">Catering Details</div>
                            <div className="custom-input-container">
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                    placeholder="Enter catering request title"
                                />
                                <label className="custom-label">Title</label>
                            </div>
                            <div className="custom-input-container">
                                <div className="input-with-unknown">
                                    <input
                                        type="number"
                                        name="estimated_guests"
                                        value={formData.estimated_guests}
                                        onChange={handleInputChange}
                                        className="custom-input"
                                        min="1"
                                    />
                                    <label className="unknown-checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={formData.guest_count_unknown}
                                            onChange={handleCheckboxChange}
                                            name="guest_count_unknown"
                                        />
                                        <span className="unknown-checkbox-label">Not sure</span>
                                    </label>
                                </div>
                                <label className="custom-label">Expected Guest Count</label>
                            </div>

                            <div className="custom-input-container">
                                <input
                                    type="number"
                                    name="event_duration"
                                    value={formData.event_duration}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                    min="1"
                                />
                                <label className="custom-label">Event Duration (hours)</label>
                            </div>

                            <div className="custom-input-container">
                                <input
                                    type="text"
                                    name="dietary_restrictions"
                                    value={formData.dietary_restrictions}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                    placeholder="List any dietary restrictions"
                                />
                                <label className="custom-label">Dietary Restrictions</label>
                            </div>

                            <div className="custom-input-container">
                                <input
                                    type="text"
                                    name="other_dietary_details"
                                    value={formData.other_dietary_details}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                    placeholder="Any other dietary details"
                                />
                                <label className="custom-label">Other Dietary Details</label>
                            </div>

                            <div className="custom-input-container">
                                <input
                                    type="text"
                                    name="equipment_notes"
                                    value={formData.equipment_notes}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                    placeholder="Any specific equipment requirements"
                                />
                                <label className="custom-label">Equipment Notes</label>
                            </div>

                            <div className="custom-input-container">
                                <input
                                    type="text"
                                    name="dining_items_notes"
                                    value={formData.dining_items_notes}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                    placeholder="Notes about dining items"
                                />
                                <label className="custom-label">Dining Items Notes</label>
                            </div>

                            <div className="wedding-photo-options">
                                <div className="photo-options-header">Food Preferences</div>
                                <div className="photo-options-grid">
                                    {[
                                        { key: 'vegetarian', label: 'Vegetarian' },
                                        { key: 'vegan', label: 'Vegan' },
                                        { key: 'glutenFree', label: 'Gluten-Free' },
                                        { key: 'kosher', label: 'Kosher' },
                                        { key: 'halal', label: 'Halal' },
                                        { key: 'dairyFree', label: 'Dairy-Free' }
                                    ].map(item => (
                                        <div key={item.key} className="photo-option-item">
                                            <input
                                                type="checkbox"
                                                id={item.key}
                                                checked={formData.food_preferences?.[item.key] || false}
                                                onChange={(e) => handleJsonChange('food_preferences', item.key, e.target.checked)}
                                            />
                                            <label htmlFor={item.key}>{item.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="custom-input-container">
                                <select
                                    name="service_type"
                                    value={formData.service_type}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select Service Type</option>
                                    <option value="buffet">Buffet</option>
                                    <option value="plated">Plated</option>
                                    <option value="family">Family Style</option>
                                    <option value="cocktail">Cocktail Style</option>
                                </select>
                                <label className="custom-label">Service Type</label>
                            </div>

                            <div className="custom-input-container">
                                <ReactQuill
                                    value={formData.additional_info || ''}
                                    onChange={(content) => setFormData(prev => ({
                                        ...prev,
                                        additional_info: content
                                    }))}
                                    placeholder="Any specific dietary requirements or additional information..."
                                />
                                <label className="custom-label">Additional Information</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Wedding Planning Specific Section */}
                {type === 'wedding_planning' && (
                    <div className="form-grid">
                        <div className="wedding-details-container">
                            <div className="photo-options-header">Wedding Planning Details</div>
                            
                            <div className="custom-input-container">
                                <select
                                    name="planning_level"
                                    value={formData.planning_level}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select Planning Level</option>
                                    <option value="full">Full Planning</option>
                                    <option value="partial">Partial Planning</option>
                                    <option value="dayOf">Day-of Coordination</option>
                                </select>
                                <label className="custom-label">Planning Level</label>
                            </div>

                            <div className="custom-input-container">
                                <select
                                    name="venue_status"
                                    value={formData.venue_status}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select Venue Status</option>
                                    <option value="booked">Venue Booked</option>
                                    <option value="shortlisted">Venue Shortlisted</option>
                                    <option value="searching">Still Searching</option>
                                </select>
                                <label className="custom-label">Venue Status</label>
                            </div>

                            <div className="custom-input-container">
                                <input
                                    type="text"
                                    name="wedding_style"
                                    value={formData.wedding_style}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                    placeholder="Describe your wedding style"
                                />
                                <label className="custom-label">Wedding Style</label>
                            </div>

                            <div className="custom-input-container">
                                <input
                                    type="text"
                                    name="theme_preferences"
                                    value={formData.theme_preferences}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                    placeholder="Describe your theme preferences"
                                />
                                <label className="custom-label">Theme Preferences</label>
                            </div>

                            <div className="custom-input-container">
                                <select
                                    name="experience_level"
                                    value={formData.experience_level}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select Experience Level</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="experienced">Experienced</option>
                                </select>
                                <label className="custom-label">Experience Level</label>
                            </div>

                            <div className="custom-input-container">
                                <select
                                    name="communication_style"
                                    value={formData.communication_style}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select Communication Style</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="both">Both</option>
                                </select>
                                <label className="custom-label">Communication Style</label>
                            </div>

                            <div className="custom-input-container">
                                <select
                                    name="planner_budget"
                                    value={formData.planner_budget}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select Planner Budget</option>
                                    <option value="0-1000">Under $1,000</option>
                                    <option value="1000-2000">$1,000 - $2,000</option>
                                    <option value="2000-3000">$2,000 - $3,000</option>
                                    <option value="3000+">$3,000+</option>
                                </select>
                                <label className="custom-label">Planner Budget</label>
                            </div>

                            <div className="wedding-photo-options">
                                <div className="photo-options-header">Services Needed</div>
                                <div className="photo-options-grid">
                                    {[
                                        { key: 'vendorCoordination', label: 'Vendor Coordination' },
                                        { key: 'timelineCreation', label: 'Timeline Creation' },
                                        { key: 'budgetManagement', label: 'Budget Management' },
                                        { key: 'venueSelection', label: 'Venue Selection' },
                                        { key: 'designConsultation', label: 'Design Consultation' },
                                        { key: 'rehearsalCoordination', label: 'Rehearsal Coordination' }
                                    ].map(item => (
                                        <div key={item.key} className="photo-option-item">
                                            <input
                                                type="checkbox"
                                                id={item.key}
                                                checked={formData.services_needed?.[item.key] || false}
                                                onChange={(e) => handleJsonChange('services_needed', item.key, e.target.checked)}
                                            />
                                            <label htmlFor={item.key}>{item.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="custom-input-container">
                                <ReactQuill
                                    value={formData.additional_info || ''}
                                    onChange={(content) => setFormData(prev => ({
                                        ...prev,
                                        additional_info: content
                                    }))}
                                    placeholder="Any specific requirements or additional information..."
                                />
                                <label className="custom-label">Additional Information</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Videography Specific Section */}
                {type === 'videography' && (
                    <div className="form-grid">
                        <div className="wedding-details-container">
                            <div className="photo-options-header">Videography Details</div>
                            
                            <div className="custom-input-container">
                                <div className="input-with-unknown">
                                    <input
                                        type="number"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        className="custom-input"
                                        min="1"
                                    />
                                    <label className="unknown-checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={formData.duration_unknown}
                                            onChange={handleCheckboxChange}
                                            name="duration_unknown"
                                        />
                                        <span className="unknown-checkbox-label">Not sure</span>
                                    </label>
                                </div>
                                <label className="custom-label">Duration (hours)</label>
                            </div>

                            <div className="custom-input-container">
                                <select
                                    name="date_type"
                                    value={formData.date_type}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select Date Type</option>
                                    <option value="specific">Specific Date</option>
                                    <option value="range">Date Range</option>
                                    <option value="flexible">Flexible</option>
                                </select>
                                <label className="custom-label">Date Type</label>
                            </div>

                            <div className="wedding-photo-options">
                                <div className="photo-options-header">Coverage Needed</div>
                                <div className="photo-options-grid">
                                    {[
                                        { key: 'preCeremony', label: 'Pre-Ceremony' },
                                        { key: 'ceremony', label: 'Ceremony' },
                                        { key: 'reception', label: 'Reception' },
                                        { key: 'highlights', label: 'Highlights' },
                                        { key: 'fullLength', label: 'Full Length' },
                                        { key: 'trailer', label: 'Trailer' }
                                    ].map(item => (
                                        <div key={item.key} className="photo-option-item">
                                            <input
                                                type="checkbox"
                                                id={item.key}
                                                checked={formData.coverage?.[item.key] || false}
                                                onChange={(e) => handleJsonChange('coverage', item.key, e.target.checked)}
                                            />
                                            <label htmlFor={item.key}>{item.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="custom-input-container">
                                <select
                                    name="style"
                                    value={formData.style}
                                    onChange={handleInputChange}
                                    className="custom-input"
                                >
                                    <option value="">Select Style</option>
                                    <option value="cinematic">Cinematic</option>
                                    <option value="documentary">Documentary</option>
                                    <option value="traditional">Traditional</option>
                                    <option value="modern">Modern</option>
                                </select>
                                <label className="custom-label">Video Style</label>
                            </div>

                            <div className="custom-input-container">
                                <ReactQuill
                                    value={formData.additional_info || ''}
                                    onChange={(content) => setFormData(prev => ({
                                        ...prev,
                                        additional_info: content
                                    }))}
                                    placeholder="Any specific shots or additional information..."
                                />
                                <label className="custom-label">Additional Information</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo Upload Section for Requests */}
                {(type === 'requests' || type === 'regular') && (
                    <div className="photo-upload-section">
                        <label htmlFor="photo-upload">Upload Photos</label>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            disabled={uploading}
                        />
                        {uploading && (
                            <div className="d-flex align-items-center">
                                <LoadingSpinner variant="clip" color="white" size={16} />
                                <span className="ms-2">Uploading...</span>
                            </div>
                        )}
                        <div className="photo-preview-grid">
                            {photos && photos.length > 0 && photos.map(photo => (
                                <div key={photo.id || photo.file_path} className="photo-preview-item">
                                    <img
                                        src={photo.file_path ? `${process.env.REACT_APP_SUPABASE_STORAGE_URL || ''}/${photo.file_path}` : photo.url}
                                        alt="Request Photo"
                                        style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 8 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePhoto(photo.id, photo.file_path)}
                                        style={{ marginTop: 4, color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="request-actions d-flex gap-2 mt-4" style={{ maxWidth: 700, margin: '0 auto' }}>
                    <button type="submit" className="btn-edit">
                        Save Changes
                    </button>
                    <button type="button" className="btn-toggle" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditRequest;