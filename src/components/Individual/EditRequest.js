import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function EditRequest() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({

        // Regular request fields
        service_type: '',
        service_title: '',
        service_description: '',
        service_date: '',
        end_date: '',

        // Photography request fields
        event_title: '',
        event_type: '',
        event_description: '',
        start_date: '',
        num_people: '',
        duration: '',
        indoor_outdoor: '',
        extras: {},
        date_type: '',
        date_flexibility: '',
        date_timeframe: '',
        start_time: '',
        end_time: '',
        start_time_unknown: false,
        end_time_unknown: false,
        second_photographer: '',
        second_photographer_unknown: false,
        duration_unknown: false,
        num_people_unknown: false,
        style_preferences: {},
        deliverables: {},
        wedding_details: {},
        additional_info: '',
        pinterest_link: '',

        // DJ request fields
        event_type: '',
        event_title: '',
        date_flexibility: '',
        start_date: '',
        end_date: '',
        date_timeframe: '',
        start_time: '',
        end_time: '',
        event_duration: '',
        num_people: '',
        indoor_outdoor: '',
        music_preferences: {},
        special_songs: { playlists: '', requests: '' },
        equipment_needed: '',
        additional_services: [],
        special_requests: '',  // Changed from additional_info to special_requests
        budget_range: '',

        // Beauty request fields
        serviceType: '',
        hairstyle_preferences: '',
        hair_length_type: '',
        extensions_needed: '',
        trial_session_hair: '',
        makeup_style_preferences: '',
        skin_type_concerns: '',
        preferred_products_allergies: '',
        lashes_included: '',
        trial_session_makeup: '',
        group_discount_inquiry: '',
        on_site_service_needed: '',
        specific_time_needed: '',
        specific_time: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequest = async () => {
            const tableMap = {
                'photography': 'photography_requests',
                'dj': 'dj_requests',
                'catering': 'catering_requests',
                'beauty': 'beauty_requests',
                'videography': 'videography_requests',
                'florist': 'florist_requests',
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
                    navigate('/my-requests'); // Redirect to requests list
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
                navigate('/my-requests'); // Redirect to requests list
            }
        };

        fetchRequest();
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
            'regular': 'requests'
        };
        const table = tableMap[type] || 'requests';

        let updateData = { ...formData };

        // Convert JSON objects to strings for photography requests
        if (type === 'photography') {
            updateData = {
                ...updateData,
                style_preferences: JSON.stringify(formData.style_preferences),
                deliverables: JSON.stringify(formData.deliverables),
                wedding_details: JSON.stringify(formData.wedding_details)
            };
        }

        if (type === 'beauty') {
            updateData = {
                ...formData,
                event_type: formData.event_type,
                service_type: formData.service_type,
                date_flexibility: formData.date_flexibility,
                start_date: formData.start_date,
                end_date: formData.end_date,
                date_timeframe: formData.date_timeframe,
                specific_time_needed: formData.specific_time_needed === 'yes',
                specific_time: formData.specific_time,
                num_people: formData.num_people ? parseInt(formData.num_people) : null,
                hairstyle_preferences: formData.hairstyle_preferences,
                hair_length_type: formData.hair_length_type,
                extensions_needed: formData.extensions_needed,
                trial_session_hair: formData.trial_session_hair,
                makeup_style_preferences: formData.makeup_style_preferences,
                skin_type_concerns: formData.skin_type_concerns,
                preferred_products_allergies: formData.preferred_products_allergies,
                lashes_included: formData.lashes_included,
                trial_session_makeup: formData.trial_session_makeup,
                group_discount_inquiry: formData.group_discount_inquiry,
                on_site_service_needed: formData.on_site_service_needed,
                pinterest_link: formData.pinterest_link,
                price_range: formData.price_range,
                location: formData.location,
                additional_comments: formData.additional_comments
            };
        }

        if (type === 'florist') {
            updateData = {
                ...updateData,
                floral_arrangements: JSON.stringify(formData.floral_arrangements),
                flower_preferences: JSON.stringify(formData.flower_preferences),
                additional_services: JSON.stringify(formData.additional_services),
                colors: JSON.stringify(formData.colors),
                location: formData.location,
                price_range: formData.price_range,
                event_type: formData.event_type,
                event_title: formData.event_title,
                date_flexibility: formData.date_flexibility,
                start_date: formData.start_date,
                end_date: formData.end_date,
                date_timeframe: formData.date_timeframe,
                specific_time_needed: formData.specific_time_needed === 'yes',
                specific_time: formData.specific_time,
                pinterest_link: formData.pinterest_link,
                additional_info: formData.additional_info
            };
        }

        if (type === 'catering') {
            updateData = {
                ...updateData,
                food_preferences: JSON.stringify(formData.food_preferences),
                dining_items: JSON.stringify(formData.dining_items),
                setup_cleanup: formData.setup_cleanup,
                food_service_type: formData.food_service_type,
                serving_staff: formData.serving_staff,
                dining_items_notes: formData.dining_items_notes,
                special_requests: formData.special_requests,
                additional_info: formData.additional_info,
                budget_range: formData.price_range,
                equipment_needed: formData.equipment_needed,
                equipment_notes: formData.equipment_notes,
                location: formData.location,
                event_type: formData.event_type,
                event_title: formData.event_title,
                date_flexibility: formData.date_flexibility,
                start_date: formData.start_date,
                end_date: formData.end_date,
                date_timeframe: formData.date_timeframe
            };
        }

        const { error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', id);

        if (error) {
            setError('Failed to update request');
            console.error(error);
        } else {
            navigate('/bids');
        }
    };

    if (!formData) return <div className="container mt-5">Loading...</div>;

    return (
        <div className="container px-3 px-md-5" style={{ minHeight: "80vh" }}>
            <div className="Sign-Up-Page-Header">Edit Request</div>
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit} className="mb-5">
                {type === 'photography' && (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Event Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_title"
                                value={formData.event_title}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Event Type</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_type"
                                value={formData.event_type}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-control"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="custom-input-container">
                            <label htmlFor="priceRange" className="form-label">
                                Budget Range
                            </label>
                            <select
                                name="priceRange"
                                value={formData.price_range}
                                onChange={handleInputChange}
                                className="form-control custom-select"
                            >
                                <option value="">Select Budget Range</option>
                                <option value="0-1000">Under $1,000</option>
                                <option value="1000-2000">$1,000 - $2,000</option>
                                <option value="2000-3000">$2,000 - $3,000</option>
                                <option value="3000-4000">$3,000 - $4,000</option>
                                <option value="4000-5000">$4,000 - $5,000</option>
                                <option value="5000+">$5,000+</option>
                            </select>

                        </div>
                        <div className="mb-3">
                            <label className="form-label">Number of People</label>
                            <input
                                type="number"
                                className="form-control"
                                name="num_people"
                                value={formData.num_people}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Duration (hours)</label>
                            <input
                                type="number"
                                className="form-control"
                                name="duration"
                                value={formData.duration}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Indoor/Outdoor</label>
                            <select
                                className="form-control"
                                name="indoor_outdoor"
                                value={formData.indoor_outdoor}
                                onChange={handleInputChange}
                            >
                                <option value="">Select...</option>
                                <option value="indoor">Indoor</option>
                                <option value="outdoor">Outdoor</option>
                                <option value="both">Both</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Date Flexibility</label>
                            <select
                                className="form-control"
                                name="date_flexibility"
                                value={formData.date_flexibility}
                                onChange={handleInputChange}
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                                <option value="flexible">I'm Flexible</option>
                            </select>
                        </div>
                        {formData.date_flexibility === 'specific' && (
                            <div className="mb-3">
                                <label className="form-label">Event Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}
                        {formData.date_flexibility === 'range' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Earliest Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Latest Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        )}
                        {formData.date_flexibility === 'flexible' && (
                            <div className="mb-3">
                                <label className="form-label">Preferred Timeframe</label>
                                <select
                                    className="form-control"
                                    name="date_timeframe"
                                    value={formData.date_timeframe}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select timeframe</option>
                                    <option value="3months">Within 3 months</option>
                                    <option value="6months">Within 6 months</option>
                                    <option value="1year">Within 1 year</option>
                                    <option value="more">More than 1 year</option>
                                </select>
                            </div>
                        )}
                        <div className="mb-3">
                            <label className="form-label">Start Time</label>
                            <input
                                type="time"
                                className="form-control"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleInputChange}
                                disabled={formData.start_time_unknown}
                            />
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="start_time_unknown"
                                    checked={formData.start_time_unknown}
                                    onChange={handleCheckboxChange}
                                />
                                <label className="form-check-label">Not sure</label>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">End Time</label>
                            <input
                                type="time"
                                className="form-control"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleInputChange}
                                disabled={formData.end_time_unknown}
                            />
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="end_time_unknown"
                                    checked={formData.end_time_unknown}
                                    onChange={handleCheckboxChange}
                                />
                                <label className="form-check-label">Not sure</label>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Second Photographer</label>
                            <select
                                className="form-control"
                                name="second_photographer"
                                value={formData.second_photographer}
                                onChange={handleInputChange}
                            >
                                <option value="">Select</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                <option value="undecided">Let photographer recommend</option>
                            </select>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="second_photographer_unknown"
                                    checked={formData.second_photographer_unknown}
                                    onChange={handleCheckboxChange}
                                />
                                <label className="form-check-label">Not sure</label>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Style Preferences</label>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="style_preferences"
                                    value="brightAiry"
                                    checked={formData.style_preferences.brightAiry || false}
                                    onChange={(e) => handleJsonChange('style_preferences', 'brightAiry', e.target.checked)}
                                />
                                <label className="form-check-label">Bright & Airy</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="style_preferences"
                                    value="darkMoody"
                                    checked={formData.style_preferences.darkMoody || false}
                                    onChange={(e) => handleJsonChange('style_preferences', 'darkMoody', e.target.checked)}
                                />
                                <label className="form-check-label">Dark & Moody</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="style_preferences"
                                    value="filmEmulation"
                                    checked={formData.style_preferences.filmEmulation || false}
                                    onChange={(e) => handleJsonChange('style_preferences', 'filmEmulation', e.target.checked)}
                                />
                                <label className="form-check-label">Film-Like</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="style_preferences"
                                    value="traditional"
                                    checked={formData.style_preferences.traditional || false}
                                    onChange={(e) => handleJsonChange('style_preferences', 'traditional', e.target.checked)}
                                />
                                <label className="form-check-label">Traditional/Classic</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="style_preferences"
                                    value="documentary"
                                    checked={formData.style_preferences.documentary || false}
                                    onChange={(e) => handleJsonChange('style_preferences', 'documentary', e.target.checked)}
                                />
                                <label className="form-check-label">Documentary/Candid</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="style_preferences"
                                    value="artistic"
                                    checked={formData.style_preferences.artistic || false}
                                    onChange={(e) => handleJsonChange('style_preferences', 'artistic', e.target.checked)}
                                />
                                <label className="form-check-label">Artistic/Creative</label>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Deliverables</label>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="deliverables"
                                    value="digitalFiles"
                                    checked={formData.deliverables.digitalFiles || false}
                                    onChange={(e) => handleJsonChange('deliverables', 'digitalFiles', e.target.checked)}
                                />
                                <label className="form-check-label">Digital Files</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="deliverables"
                                    value="printRelease"
                                    checked={formData.deliverables.printRelease || false}
                                    onChange={(e) => handleJsonChange('deliverables', 'printRelease', e.target.checked)}
                                />
                                <label className="form-check-label">Print Release</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="deliverables"
                                    value="weddingAlbum"
                                    checked={formData.deliverables.weddingAlbum || false}
                                    onChange={(e) => handleJsonChange('deliverables', 'weddingAlbum', e.target.checked)}
                                />
                                <label className="form-check-label">Wedding Album</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="deliverables"
                                    value="prints"
                                    checked={formData.deliverables.prints || false}
                                    onChange={(e) => handleJsonChange('deliverables', 'prints', e.target.checked)}
                                />
                                <label className="form-check-label">Professional Prints</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="deliverables"
                                    value="rawFiles"
                                    checked={formData.deliverables.rawFiles || false}
                                    onChange={(e) => handleJsonChange('deliverables', 'rawFiles', e.target.checked)}
                                />
                                <label className="form-check-label">RAW Files</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="deliverables"
                                    value="engagement"
                                    checked={formData.deliverables.engagement || false}
                                    onChange={(e) => handleJsonChange('deliverables', 'engagement', e.target.checked)}
                                />
                                <label className="form-check-label">Engagement Session</label>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Wedding Details</label>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="wedding_details"
                                    value="preCeremony"
                                    checked={formData.wedding_details.preCeremony || false}
                                    onChange={(e) => handleJsonChange('wedding_details', 'preCeremony', e.target.checked)}
                                />
                                <label className="form-check-label">Pre-Ceremony</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="wedding_details"
                                    value="ceremony"
                                    checked={formData.wedding_details.ceremony || false}
                                    onChange={(e) => handleJsonChange('wedding_details', 'ceremony', e.target.checked)}
                                />
                                <label className="form-check-label">Ceremony</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="wedding_details"
                                    value="reception"
                                    checked={formData.wedding_details.reception || false}
                                    onChange={(e) => handleJsonChange('wedding_details', 'reception', e.target.checked)}
                                />
                                <label className="form-check-label">Reception</label>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Pinterest Link</label>
                            <input
                                type="url"
                                className="form-control"
                                name="pinterest_link"
                                value={formData.pinterest_link}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Additional Info</label>
                            <ReactQuill
                                theme="snow"
                                value={formData.additional_info || ''}
                                onChange={(content) => setFormData(prev => ({
                                    ...prev,
                                    additional_info: content
                                }))}
                            />
                        </div>
                    </>
                )}

                {type === 'dj' && (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Event Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_title"
                                value={formData.event_title}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Event Type</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_type"
                                value={formData.event_type}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-control"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Special Requests</label>
                            <ReactQuill
                                value={formData.special_requests}
                                onChange={(value) => setFormData(prev => ({ ...prev, special_requests: value }))}
                                modules={{
                                    toolbar: [
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                        ['link', 'image'],
                                        ['clean']
                                    ]
                                }}
                            />
                        </div>
                        <div className="custom-input-container">
                            <label htmlFor="priceRange" className="form-label">
                                Budget Range
                            </label>
                            <select
                                name="priceRange"
                                value={formData.budget_range}
                                onChange={handleInputChange}
                                className="form-control custom-select"
                            >
                                <option value="">Select Budget Range</option>
                                <option value="0-1000">$0 - $1,000</option>
                                <option value="1000-2000">$1,000 - $2,000</option>
                                <option value="2000-3000">$2,000 - $3,000</option>
                                <option value="3000-4000">$3,000 - $4,000</option>
                                <option value="4000-5000">$4,000 - $5,000</option>
                                <option value="5000+">$5,000+</option>
                            </select>

                        </div>
                        <div className="mb-3">
                            <label className="form-label">Date Flexibility</label>
                            <select
                                className="form-control"
                                name="date_flexibility"
                                value={formData.date_flexibility}
                                onChange={handleInputChange}
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                                <option value="flexible">I'm Flexible</option>
                            </select>
                        </div>
                        {formData.date_flexibility === 'specific' && (
                            <div className="mb-3">
                                <label className="form-label">Event Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}
                        {formData.date_flexibility === 'range' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Earliest Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Latest Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        )}
                        {formData.date_flexibility === 'flexible' && (
                            <div className="mb-3">
                                <label className="form-label">Preferred Timeframe</label>
                                <select
                                    className="form-control"
                                    name="date_timeframe"
                                    value={formData.date_timeframe}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select timeframe</option>
                                    <option value="3months">Within 3 months</option>
                                    <option value="6months">Within 6 months</option>
                                    <option value="1year">Within 1 year</option>
                                    <option value="more">More than 1 year</option>
                                </select>
                            </div>
                        )}
                        <div className="mb-3">
                            <label className="form-label">Start Time</label>
                            <input
                                type="time"
                                className="form-control"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">End Time</label>
                            <input
                                type="time"
                                className="form-control"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Duration (hours)</label>
                            <input
                                type="number"
                                className="form-control"
                                name="event_duration"
                                value={formData.event_duration}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Estimated Guests</label>
                            <input
                                type="number"
                                className="form-control"
                                name="num_people"
                                value={formData.estimated_guests}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Indoor/Outdoor</label>
                            <select
                                className="form-control"
                                name="indoor_outdoor"
                                value={formData.indoor_outdoor}
                                onChange={handleInputChange}
                            >
                                <option value="">Select...</option>
                                <option value="indoor">Indoor</option>
                                <option value="outdoor">Outdoor</option>
                                <option value="both">Both</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Music Preferences</label>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="top40"
                                    checked={formData.music_preferences.top40 || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                top40: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">Top 40</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="hiphop"
                                    checked={formData.music_preferences.hiphop || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                hiphop: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">Hip Hop</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="house"
                                    checked={formData.music_preferences.house || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                house: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">House</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="latin"
                                    checked={formData.music_preferences.latin || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                latin: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">Latin</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="rock"
                                    checked={formData.music_preferences.rock || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                rock: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">Rock</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="classics"
                                    checked={formData.music_preferences.classics || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                classics: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">Classics</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="country"
                                    checked={formData.music_preferences.country || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                country: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">Country</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="jazz"
                                    checked={formData.music_preferences.jazz || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                jazz: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">Jazz</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="rb"
                                    checked={formData.music_preferences.rb || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                rb: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">R&B</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="edm"
                                    checked={formData.music_preferences.edm || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                edm: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">EDM</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="pop"
                                    checked={formData.music_preferences.pop || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                pop: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">Pop</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="music_preferences"
                                    value="international"
                                    checked={formData.music_preferences.international || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'music_preferences',
                                            value: {
                                                ...formData.music_preferences,
                                                international: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <label className="form-check-label">International</label>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Special Songs</label>
                            <div className="mb-3">
                                <label className="form-label">Playlists</label>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.special_songs.playlist || ''}
                                    onChange={(content) => handleSpecialSongsChange('playlist', content)}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Requests</label>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.special_songs.requests || ''}
                                    onChange={(content) => handleSpecialSongsChange('requests', content)}
                                />
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Equipment Needed</label>
                            <select
                                className="form-control"
                                name="equipment_needed"
                                value={formData.equipment_needed}
                                onChange={handleInputChange}
                            >
                                <option value="venueProvided">The venue provides sound and lighting equipment</option>
                                <option value="djBringsAll">The DJ needs to bring all equipment</option>
                                <option value="djBringsSome">The DJ needs to bring some equipment</option>
                                <option value="unknown">I'm not sure about the equipment requirements</option>
                            </select>
                        </div>
                        {formData.equipment_needed === 'djBringsSome' && (
                            <div className="mb-3">
                                <label className="form-label">Equipment Details</label>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.equipment_notes || ''}
                                    onChange={(content) => setFormData(prev => ({
                                        ...prev,
                                        equipment_notes: content
                                    }))}
                                />
                            </div>
                        )}
                        <div className="mb-3">
                            <label className="form-label">Additional Services</label>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="additional_services"
                                    value="mcServices"
                                    checked={formData.additional_services.includes('mcServices')}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'additional_services',
                                            value: e.target.checked
                                                ? [...formData.additional_services, 'mcServices']
                                                : formData.additional_services.filter(service => service !== 'mcServices')
                                        }
                                    })}
                                />
                                <label className="form-check-label">🎤 MC Services</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="additional_services"
                                    value="liveMixing"
                                    checked={formData.additional_services.includes('liveMixing')}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'additional_services',
                                            value: e.target.checked
                                                ? [...formData.additional_services, 'liveMixing']
                                                : formData.additional_services.filter(service => service !== 'liveMixing')
                                        }
                                    })}
                                />
                                <label className="form-check-label">🎶 Live Mixing</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="additional_services"
                                    value="lighting"
                                    checked={formData.additional_services.includes('lighting')}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'additional_services',
                                            value: e.target.checked
                                                ? [...formData.additional_services, 'lighting']
                                                : formData.additional_services.filter(service => service !== 'lighting')
                                        }
                                    })}
                                />
                                <label className="form-check-label">🏮 Uplighting</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="additional_services"
                                    value="fogMachine"
                                    checked={formData.additional_services.includes('fogMachine')}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'additional_services',
                                            value: e.target.checked
                                                ? [...formData.additional_services, 'fogMachine']
                                                : formData.additional_services.filter(service => service !== 'fogMachine')
                                        }
                                    })}
                                />
                                <label className="form-check-label">🌫️ Fog Machine</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="additional_services"
                                    value="specialFx"
                                    checked={formData.additional_services.includes('specialFx')}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'additional_services',
                                            value: e.target.checked
                                                ? [...formData.additional_services, 'specialFx']
                                                : formData.additional_services.filter(service => service !== 'specialFx')
                                        }
                                    })}
                                />
                                <label className="form-check-label">🎇 Special FX</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="additional_services"
                                    value="photoBooth"
                                    checked={formData.additional_services.includes('photoBooth')}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'additional_services',
                                            value: e.target.checked
                                                ? [...formData.additional_services, 'photoBooth']
                                                : formData.additional_services.filter(service => service !== 'photoBooth')
                                        }
                                    })}
                                />
                                <label className="form-check-label">📸 Photo Booth</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="additional_services"
                                    value="videoRecording"
                                    checked={formData.additional_services.includes('videoRecording')}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'additional_services',
                                            value: e.target.checked
                                                ? [...formData.additional_services, 'videoRecording']
                                                : formData.additional_services.filter(service => service !== 'videoRecording')
                                        }
                                    })}
                                />
                                <label className="form-check-label">🎥 Event Recording</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="additional_services"
                                    value="other"
                                    checked={formData.additional_services.includes('other')}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'additional_services',
                                            value: e.target.checked
                                                ? [...formData.additional_services, 'other']
                                                : formData.additional_services.filter(service => service !== 'other')
                                        }
                                    })}
                                />
                                <label className="form-check-label">Other</label>
                            </div>
                        </div>

                    </>
                )}

                {type === 'catering' && (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Event Type</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_type"
                                value={formData.event_type}
                                onChange={handleInputChange}
                            />
                        </div>
                        
                        <div className="mb-3">
                            <label className="form-label">Event Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-control"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Budget Range</label>
                            <select
                                className="form-control"
                                name="budget_range"
                                value={formData.budget_range}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Budget Range</option>
                                <option value="0-1000">$0 - $1,000</option>
                                <option value="1000-2000">$1,000 - $2,000</option>
                                <option value="2000-3000">$2,000 - $3,000</option>
                                <option value="3000-4000">$3,000 - $4,000</option>
                                <option value="4000-5000">$4,000 - $5,000</option>
                                <option value="5000+">$5,000+</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Date Flexibility</label>
                            <select
                                className="form-control"
                                name="date_flexibility"
                                value={formData.date_flexibility}
                                onChange={handleInputChange}
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                                <option value="flexible">I'm Flexible</option>
                            </select>
                        </div>

                        {formData.date_flexibility === 'specific' && (
                            <div className="mb-3">
                                <label className="form-label">Event Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}

                        {formData.date_flexibility === 'range' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        )}

                        {formData.date_flexibility === 'flexible' && (
                            <div className="mb-3">
                                <label className="form-label">Preferred Timeframe</label>
                                <select
                                    className="form-control"
                                    name="date_timeframe"
                                    value={formData.date_timeframe}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select timeframe</option>
                                    <option value="3months">Within 3 months</option>
                                    <option value="6months">Within 6 months</option>
                                    <option value="1year">Within 1 year</option>
                                    <option value="more">More than 1 year</option>
                                </select>
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label">Start Time</label>
                            <input
                                type="time"
                                className="form-control"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">End Time</label>
                            <input
                                type="time"
                                className="form-control"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Estimated Guests</label>
                            <input
                                type="number"
                                className="form-control"
                                name="num_people"
                                value={formData.estimated_guests}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Indoor/Outdoor</label>
                            <select
                                className="form-control"
                                name="indoor_outdoor"
                                value={formData.indoor_outdoor}
                                onChange={handleInputChange}
                            >
                                <option value="">Select...</option>
                                <option value="indoor">Indoor</option>
                                <option value="outdoor">Outdoor</option>
                                <option value="both">Both</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Setup & Cleanup</label>
                            <select
                                className="form-control"
                                name="setup_cleanup"
                                value={formData.setup_cleanup}
                                onChange={handleInputChange}
                            >
                                <option value="">Select...</option>
                                <option value="setupOnly">Setup Only</option>
                                <option value="cleanupOnly">Cleanup Only</option>
                                <option value="both">Both Setup & Cleanup</option>
                                <option value="neither">Neither</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Serving Staff</label>
                            <select
                                className="form-control"
                                name="serving_staff"
                                value={formData.serving_staff}
                                onChange={handleInputChange}
                            >
                                <option value="">Select...</option>
                                <option value="fullService">Full Service Staff</option>
                                <option value="partialService">Partial Service</option>
                                <option value="noService">No Staff Needed</option>
                                <option value="unsure">Not Sure</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Dinnerware, Utensils & Linens</label>
                            <select
                                className="form-control"
                                name="dining_items"
                                value={formData.dining_items}
                                onChange={handleInputChange}
                            >
                                <option value="">Select...</option>
                                <option value="provided">Provided by Caterer</option>
                                <option value="notProvided">Not Needed</option>
                                <option value="partial">Partial (Specify Below)</option>
                            </select>
                        </div>

                        {formData.dining_items === 'partial' && (
                            <div className="mb-3">
                                <label className="form-label">Dining Items Details</label>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.dining_items_notes || ''}
                                    onChange={(content) => handleInputChange({
                                        target: {
                                            name: 'dining_items_notes',
                                            value: content
                                        }
                                    })}
                                />
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label">Food Service Type</label>
                            <select
                                className="form-control"
                                name="food_service_type"
                                value={formData.food_service_type}
                                onChange={handleInputChange}
                            >
                                <option value="">Select...</option>
                                <option value="onSite">Cooking On-Site</option>
                                <option value="delivered">Delivered Ready-to-Serve</option>
                                <option value="both">Combination</option>
                                <option value="flexible">Flexible</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Kitchen Equipment</label>
                            <select
                                className="form-control"
                                name="equipment_needed"
                                value={formData.equipment_needed}
                                onChange={handleInputChange}
                            >
                                <option value="">Select...</option>
                                <option value="The venue provides kitchen equipment">The venue provides kitchen equipment</option>
                                <option value="The caterer needs to bring all equipment">The caterer needs to bring all equipment</option>
                                <option value="The caterer needs to bring some equipment">The caterer needs to bring some equipment</option>
                                <option value="Equipment requirements to be discussed">Not sure about equipment requirements</option>
                            </select>
                        </div>

                        {formData.equipment_needed === 'catererBringsSome' && (
                            <div className="mb-3">
                                <label className="form-label">Equipment Details</label>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.equipment_notes || ''}
                                    onChange={(content) => handleInputChange({
                                        target: {
                                            name: 'equipment_notes',
                                            value: content
                                        }
                                    })}
                                />
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label">Food Style Preferences</label>
                            <div className="form-check-group">
                                {['american', 'mexican', 'italian', 'chinese', 'japanese',
                                    'thai', 'korean', 'vietnamese', 'indian', 'mediterranean',
                                    'greek', 'french', 'spanish', 'caribbean', 'cajunCreole',
                                    'hawaiian', 'middleEastern', 'turkish', 'persian', 'african',
                                    'brazilian', 'argentinian', 'peruvian', 'filipino', 'german',
                                    'russian', 'easternEuropean', 'veganPlantBased', 'bbqSmoked',
                                    'fusion'].map(cuisine => (
                                    <div key={cuisine} className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={formData.food_preferences?.[cuisine] || false}
                                            onChange={(e) => handleJsonChange('food_preferences', cuisine, e.target.checked)}
                                        />
                                        <label className="form-check-label">
                                            {cuisine.charAt(0).toUpperCase() + cuisine.slice(1).replace(/([A-Z])/g, ' $1')}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Special Requests</label>
                            <ReactQuill
                                theme="snow"
                                value={formData.special_requests || ''}
                                onChange={(content) => handleInputChange({
                                    target: {
                                        name: 'special_requests',
                                        value: content
                                    }
                                })}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Additional Information</label>
                            <ReactQuill
                                theme="snow"
                                value={formData.additional_info || ''}
                                onChange={(content) => handleInputChange({
                                    target: {
                                        name: 'additional_info',
                                        value: content
                                    }
                                })}
                            />
                        </div>
                    </>
                )}

                {type === 'beauty' && (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_title"
                                value={formData.event_title}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-control"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="custom-input-container">
                            <label htmlFor="priceRange" className="form-label">
                                Budget Range
                            </label>
                            <select
                                name="priceRange"
                                value={formData.price_range}
                                onChange={handleInputChange}
                                className="form-control custom-select"
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

                        </div>
                        <div className="mb-3">
                            <label className="form-label">Service Type</label>
                            <select
                                className="form-control"
                                name="service_type"
                                value={formData.service_type}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Service Type</option>
                                <option value="both">Both Hair and Makeup</option>
                                <option value="hair">Hair Only</option>
                                <option value="makeup">Makeup Only</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Event Type</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_type"
                                value={formData.event_type}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Date Flexibility</label>
                            <select
                                className="form-control"
                                name="date_flexibility"
                                value={formData.date_flexibility}
                                onChange={handleInputChange}
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                                <option value="flexible">I'm Flexible</option>
                            </select>
                        </div>

                        {formData.date_flexibility === 'specific' && (
                            <div className="mb-3">
                                <label className="form-label">Event Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}

                        {formData.date_flexibility === 'range' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        )}
                        {formData.date_flexibility === 'flexible' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Preferred Timeframe</label>
                                    <select
                                        className="form-control"
                                        name="date_timeframe"
                                        value={formData.date_timeframe}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select timeframe</option>
                                        <option value="3months">Within 3 months</option>
                                        <option value="6months">Within 6 months</option>
                                        <option value="1year">Within 1 year</option>
                                        <option value="more">More than 1 year</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="mb-3">
                                    <label className="form-label">Specific Time Needed</label>
                                    <select
                                        className="form-control"
                                        name="specific_time_needed"
                                        value={formData.specific_time_needed}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>

                                {formData.specific_time_needed === 'yes' && (
                                    <div className="mb-3">
                                        <label className="form-label">Specific Time</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            name="specific_time"
                                            value={formData.specific_time}
                                            onChange={handleInputChange}
                                        />
                                    </div>
        )}


                        <div className="mb-3">
                            <label className="form-label">Number of People</label>
                            <input
                                type="number"
                                className="form-control"
                                name="num_people"
                                value={formData.num_people}
                                onChange={handleInputChange}
                            />
                        </div>

                        {(formData.service_type === 'both' || formData.service_type === 'hair') && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Hairstyle Preferences</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="hairstyle_preferences"
                                        value={formData.hairstyle_preferences}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Hair Length & Type</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="hair_length_type"
                                        value={formData.hair_length_type}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="extensions_needed"
                                            checked={formData.extensions_needed === 'yes'}
                                            onChange={(e) => handleInputChange({
                                                target: {
                                                    name: 'extensions_needed',
                                                    value: e.target.checked ? 'yes' : 'no'
                                                }
                                            })}
                                        />
                                        <label className="form-check-label">Extensions Needed</label>
                                    </div>
                                </div>

                                <div className="mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="trial_session_hair"
                                        checked={formData.trial_session_hair === 'yes'}
                                        onChange={(e) => handleInputChange({
                                            target: {
                                                name: 'trial_session_hair',
                                                value: e.target.checked ? 'yes' : 'no'
                                            }
                                        })}
                                    />
                                    <label className="form-check-label">Trial Session for Hair</label>
                                </div>
                            </div>
                            </>
                        )}

                        {(formData.service_type === 'both' || formData.service_type === 'makeup') && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Makeup Style Preferences</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="makeup_style_preferences"
                                        value={formData.makeup_style_preferences}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Skin Type & Concerns</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="skin_type_concerns"
                                        value={formData.skin_type_concerns}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Preferred Products or Allergies</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="preferred_products_allergies"
                                        value={formData.preferred_products_allergies}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="lashes_included"
                                            checked={formData.lashes_included === 'yes'}
                                            onChange={(e) => handleInputChange({
                                                target: {
                                                    name: 'lashes_included',
                                                    value: e.target.checked ? 'yes' : 'no'
                                                }
                                            })}
                                        />
                                        <label className="form-check-label">Lashes Included</label>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="trial_session_makeup"
                                            checked={formData.trial_session_makeup === 'yes'}
                                            onChange={(e) => handleInputChange({
                                                target: {
                                                    name: 'trial_session_makeup',
                                                    value: e.target.checked ? 'yes' : 'no'
                                                }
                                            })}
                                        />
                                        <label className="form-check-label">Trial Session for Makeup</label>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="mb-3">
                            <label className="form-label">Group Discount Inquiry</label>
                            <select
                                className="form-control"
                                name="group_discount_inquiry"
                                value={formData.group_discount_inquiry}
                                onChange={handleInputChange}
                            >
                                <option value="">Select</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">On-Site Service Needed</label>
                            <select
                                className="form-control"
                                name="on_site_service_needed"
                                value={formData.on_site_service_needed}
                                onChange={handleInputChange}
                            >
                                <option value="">Select</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Pinterest Link</label>
                            <input
                                type="url"
                                className="form-control"
                                name="pinterest_link"
                                value={formData.pinterest_link}
                                onChange={handleInputChange}
                            />
                        </div>
                    </>
                )}

                {type === 'florist' && (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Event Type</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_type"
                                value={formData.event_type}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Event Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_title"
                                value={formData.event_title}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-control"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Budget Range</label>
                            <select
                                className="form-control"
                                name="price_range"
                                value={formData.price_range}
                                onChange={handleInputChange}
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
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Date Flexibility</label>
                            <select
                                className="form-control"
                                name="date_flexibility"
                                value={formData.date_flexibility}
                                onChange={handleInputChange}
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                                <option value="flexible">I'm Flexible</option>
                            </select>
                        </div>

                        {formData.date_flexibility === 'specific' && (
                            <div className="mb-3">
                                <label className="form-label">Event Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}

                        {formData.date_flexibility === 'range' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Earliest Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Latest Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        )}

                        {formData.date_flexibility === 'flexible' && (
                            <div className="mb-3">
                                <label className="form-label">Preferred Timeframe</label>
                                <select
                                    className="form-control"
                                    name="date_timeframe"
                                    value={formData.date_timeframe}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select timeframe</option>
                                    <option value="3months">Within 3 months</option>
                                    <option value="6months">Within 6 months</option>
                                    <option value="1year">Within 1 year</option>
                                    <option value="more">More than 1 year</option>
                                </select>
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label">Specific Time Needed</label>
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    name="specific_time_needed"
                                    checked={formData.specific_time_needed || false}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'specific_time_needed',
                                            value: e.target.checked
                                        }
                                    })}
                                />
                                <label className="form-check-label">I need a specific time</label>
                            </div>
                        </div>

                        {formData.specific_time_needed === true && (
                            <div className="mb-3">
                                <label className="form-label">Specific Time</label>
                                <input
                                    type="time"
                                    className="form-control"
                                    name="specific_time"
                                    value={formData.specific_time}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}

                        {/* Floral Arrangements Section */}
                        <div className="mb-3">
                            <label className="form-label">Floral Arrangements</label>
                            {[
                                { id: 'bridalBouquet', label: 'Bridal bouquet' },
                                { id: 'bridesmaidBouquets', label: 'Bridesmaid bouquets' },
                                { id: 'boutonnieres', label: 'Boutonnieres' },
                                { id: 'corsages', label: 'Corsages' },
                                { id: 'centerpieces', label: 'Centerpieces' },
                                { id: 'ceremonyArchFlowers', label: 'Ceremony arch flowers' },
                                { id: 'aisleDecorations', label: 'Aisle decorations' },
                                { id: 'floralInstallations', label: 'Floral installations' },
                                { id: 'cakeFlowers', label: 'Cake flowers' },
                                { id: 'loosePetals', label: 'Loose petals' }
                            ].map(item => (
                                <div key={item.id} className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={formData.floral_arrangements?.[item.id] || false}
                                        onChange={(e) => handleJsonChange('floral_arrangements', item.id, e.target.checked)}
                                    />
                                    <label className="form-check-label">{item.label}</label>
                                    {formData.floral_arrangements?.[item.id] && item.id !== 'loosePetals' && (
                                        <input
                                            type="number"
                                            className="form-control mt-2"
                                            value={formData.floral_arrangements[`${item.id}Quantity`] || ''}
                                            onChange={(e) => handleJsonChange('floral_arrangements', `${item.id}Quantity`, e.target.value)}
                                            placeholder="Quantity"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Additional Services Section */}
                        <div className="mb-3">
                            <label className="form-label">Additional Services</label>
                            {[
                                { id: 'setupAndTakedown', label: 'Setup and takedown' },
                                { id: 'delivery', label: 'Delivery' },
                                { id: 'floralPreservation', label: 'Floral preservation' }
                            ].map(service => (
                                <div key={service.id} className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={formData.additional_services?.[service.id] || false}
                                        onChange={(e) => handleJsonChange('additional_services', service.id, e.target.checked)}
                                    />
                                    <label className="form-check-label">{service.label}</label>
                                </div>
                            ))}
                        </div>

                        {/* Color Preferences Section */}
                        <div className="mb-3">
                            <label className="form-label">Color Preferences</label>
                            {[
                                'Red', 'Pink', 'Orange', 'Yellow', 'Green',
                                'Blue', 'Purple', 'White', 'Black', 'Gray', 'Brown'
                            ].map(color => (
                                <div key={color} className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={formData.colors?.includes(color) || false}
                                        onChange={(e) => {
                                            const newColors = e.target.checked
                                                ? [...(formData.colors || []), color]
                                                : (formData.colors || []).filter(c => c !== color);
                                            setFormData(prev => ({
                                                ...prev,
                                                colors: newColors
                                            }));
                                        }}
                                    />
                                    <label className="form-check-label">{color}</label>
                                </div>
                            ))}
                        </div>

                        {/* Flower Types Section */}
                        <div className="mb-3">
                            <label className="form-label">Flower Preferences</label>
                            {[
                                { id: 'roses', label: 'Roses' },
                                { id: 'peonies', label: 'Peonies' },
                                { id: 'hydrangeas', label: 'Hydrangeas' },
                                { id: 'lilies', label: 'Lilies' },
                                { id: 'tulips', label: 'Tulips' },
                                { id: 'orchids', label: 'Orchids' },
                                { id: 'daisies', label: 'Daisies' },
                                { id: 'ranunculus', label: 'Ranunculus' },
                                { id: 'anemones', label: 'Anemones' },
                                { id: 'scabiosa', label: 'Scabiosa' },
                                { id: 'eucalyptus', label: 'Eucalyptus' },
                                { id: 'sunflowers', label: 'Sunflowers' },
                                { id: 'babysBreath', label: "Baby's Breath" },
                                { id: 'lavender', label: 'Lavender' },
                                { id: 'dahlia', label: 'Dahlia' },
                                { id: 'zinnias', label: 'Zinnias' },
                                { id: 'protea', label: 'Protea' },
                                { id: 'amaranthus', label: 'Amaranthus' },
                                { id: 'chrysanthemums', label: 'Chrysanthemums' },
                                { id: 'ruscus', label: 'Ruscus' },
                                { id: 'ivy', label: 'Ivy' },
                                { id: 'ferns', label: 'Ferns' }
                            ].map(flower => (
                                <div key={flower.id} className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={formData.flower_preferences?.[flower.id] || false}
                                        onChange={(e) => handleJsonChange('flower_preferences', flower.id, e.target.checked)}
                                    />
                                    <label className="form-check-label">{flower.label}</label>
                                </div>
                            ))}
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Pinterest Link</label>
                            <input
                                type="url"
                                className="form-control"
                                name="pinterest_link"
                                value={formData.pinterest_link}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Additional Information</label>
                            <ReactQuill
                                theme="snow"
                                value={formData.additional_comments || ''}
                                onChange={(content) => handleInputChange({
                                    target: {
                                        name: 'additional_comments',
                                        value: content
                                    }
                                })}
                            />
                        </div>
                    </>
                )}

                {type === 'videography' && (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Event Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_title"
                                value={formData.event_title}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Event Type</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_type"
                                value={formData.event_type}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-control"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Time of Day</label>
                            <input
                                type="text"
                                className="form-control"
                                name="time_of_day"
                                value={formData.time_of_day}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Number of People</label>
                            <input
                                type="number"
                                className="form-control"
                                name="num_people"
                                value={formData.num_people}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Duration (hours)</label>
                            <input
                                type="number"
                                className="form-control"
                                name="duration"
                                value={formData.duration}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Indoor/Outdoor</label>
                            <select
                                className="form-control"
                                name="indoor_outdoor"
                                value={formData.indoor_outdoor}
                                onChange={handleInputChange}
                            >
                                <option value="">Select...</option>
                                <option value="indoor">Indoor</option>
                                <option value="outdoor">Outdoor</option>
                                <option value="both">Both</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Second Photographer</label>
                            <select
                                className="form-control"
                                name="second_photographer"
                                value={formData.second_photographer}
                                onChange={handleInputChange}
                            >
                                <option value="">Select</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                                <option value="undecided">Let photographer recommend</option>
                            </select>
                        </div>

                        {/* Existing videography fields */}
                        <div className="mb-3">
                            <label className="form-label">Budget Range</label>
                            <select
                                className="form-control"
                                name="price_range"
                                value={formData.price_range}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Budget Range</option>
                                <option value="0-1000">$0 - $1,000</option>
                                <option value="1000-2000">$1,000 - $2,000</option>
                                <option value="2000-3000">$2,000 - $3,000</option>
                                <option value="3000-4000">$3,000 - $4,000</option>
                                <option value="4000-5000">$4,000 - $5,000</option>
                                <option value="5000+">$5,000+</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Additional Information</label>
                            <ReactQuill
                                theme="snow"
                                value={formData.additional_comments || ''}
                                onChange={(content) => handleInputChange({
                                    target: {
                                        name: 'additional_comments',
                                        value: content
                                    }
                                })}
                            />
                        </div>

                        {/* Add this new coverage section */}
                        <div className="mb-3">
                            <label className="form-label">Coverage Options</label>
                            <div className="form-check-group">
                                {[
                                    { key: 'preCeremony', label: 'Pre-Ceremony' },
                                    { key: 'ceremony', label: 'Ceremony' },
                                    { key: 'luncheon', label: 'Luncheon' },
                                    { key: 'reception', label: 'Reception' },

                                ].map(({ key, label }) => (
                                    <div key={key} className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={formData.coverage?.[key] || false}
                                            onChange={(e) => {
                                                const newCoverage = {
                                                    ...formData.coverage,
                                                    [key]: e.target.checked
                                                };
                                                setFormData(prev => ({
                                                    ...prev,
                                                    coverage: newCoverage
                                                }));
                                            }}
                                        />
                                        <label className="form-check-label">{label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {type === 'regular' && (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Service Type</label>
                            <input
                                type="text"
                                className="form-control"
                                name="service_type"
                                value={formData.service_type}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Service Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="service_title"
                                value={formData.service_title}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Service Description</label>
                            <ReactQuill
                                theme="snow"
                                value={formData.service_description || ''}
                                onChange={(content) => handleInputChange({
                                    target: {
                                        name: 'service_description',
                                        value: content
                                    }
                                })}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Service Date</label>
                            <input
                                type="date"
                                className="form-control"
                                name="service_date"
                                value={formData.service_date}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                className="form-control"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Additional Comments</label>
                            <ReactQuill
                                theme="snow"
                                value={formData.additional_comments || ''}
                                onChange={(content) => handleInputChange({
                                    target: {
                                        name: 'additional_comments',
                                        value: content
                                    }
                                })}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-control"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Budget Range</label>
                            <select
                                className="form-control"
                                name="price_range"
                                value={formData.price_range}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Budget Range</option>
                                <option value="0-1000">Under $1,000</option>
                                <option value="1000-2000">$1,000 - $2,000</option>
                                <option value="2000-3000">$2,000 - $3,000</option>
                                <option value="3000-4000">$3,000 - $4,000</option>
                                <option value="4000-5000">$4,000 - $5,000</option>
                                <option value="5000+">$5,000+</option>
                            </select>
                        </div>
                    </>
                )}

                <div className="d-flex gap-2 mt-4">
                    <button type="submit" className="btn-primary" style={{width: '100%'}}>Save Changes</button>
                    <button type="button" className="btn-secondary" style={{width: '100%'}} onClick={() => navigate('/bids')}>Cancel</button>
                </div>
            </form>
        </div>
    );
}

export default EditRequest;