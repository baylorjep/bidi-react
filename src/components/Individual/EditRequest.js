import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function EditRequest() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        // Common fields
        location: '',
        price_range: '',
        time_of_day: '',
        additional_comments: '',

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
        start_time: '',
        end_time: '',
        duration: '',
        num_people: '',
        indoor_outdoor: '',
        music_preferences: {},
        special_songs: { playlists: '', requests: '' },
        equipment_needed: '',
        additional_services: [],
        additional_info: '',
        price_range: '',

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
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                setError('Failed to fetch request');
                console.error(error);
            } else {
                // Format dates for input field
                const formattedData = {
                    ...data,
                    service_date: data.service_date?.split('T')[0],
                    end_date: data.end_date?.split('T')[0],
                    start_date: data.start_date?.split('T')[0],
                    special_songs: data.special_songs || { playlists: '', requests: '' }
                };
                setFormData(formattedData);
            }
        };

        fetchRequest();
    }, [id, type]);

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

        const { error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', id);

        if (error) {
            setError('Failed to update request');
            console.error(error);
        } else {
            navigate('/my-requests');
        }
    };

    if (!formData) return <div className="container mt-5">Loading...</div>;

    return (
        <div className="container px-5 mt-5">
            <h2 className="Sign-Up-Page-Header mb-4">Edit Request</h2>
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
                                required
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
                                required
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
                                required
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
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Indoor/Outdoor</label>
                            <select
                                className="form-control"
                                name="indoor_outdoor"
                                value={formData.indoor_outdoor}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select...</option>
                                <option value="Indoor">Indoor</option>
                                <option value="Outdoor">Outdoor</option>
                                <option value="Both">Both</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Date Type</label>
                            <select
                                className="form-control"
                                name="date_type"
                                value={formData.date_type}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                                <option value="flexible">I'm Flexible</option>
                            </select>
                        </div>
                        {formData.date_type === 'specific' && (
                            <div className="mb-3">
                                <label className="form-label">Event Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        )}
                        {formData.date_type === 'range' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Earliest Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        required
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
                                        required
                                    />
                                </div>
                            </>
                        )}
                        {formData.date_type === 'flexible' && (
                            <div className="mb-3">
                                <label className="form-label">Preferred Timeframe</label>
                                <select
                                    className="form-control"
                                    name="date_timeframe"
                                    value={formData.date_timeframe}
                                    onChange={handleInputChange}
                                    required
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
                                required
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
                                required
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
                                required
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
                                    value="postCeremony"
                                    checked={formData.wedding_details.postCeremony || false}
                                    onChange={(e) => handleJsonChange('wedding_details', 'postCeremony', e.target.checked)}
                                />
                                <label className="form-check-label">Post-Ceremony</label>
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
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="wedding_details"
                                    value="other"
                                    checked={formData.wedding_details.other || false}
                                    onChange={(e) => handleJsonChange('wedding_details', 'other', e.target.checked)}
                                />
                                <label className="form-check-label">Other</label>
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
                            <label className="form-label">Event Type</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_type"
                                value={formData.event_type}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Event Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="event_title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Date Flexibility</label>
                            <select
                                className="form-control"
                                name="date_flexibility"
                                value={formData.date_flexibility}
                                onChange={handleInputChange}
                                required
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
                                    required
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
                                        required
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
                                        required
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
                                    required
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
                                required
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
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Duration (hours)</label>
                            <input
                                type="number"
                                className="form-control"
                                name="duration"
                                value={formData.event_duration}
                                onChange={handleInputChange}
                                required
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
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Indoor/Outdoor</label>
                            <select
                                className="form-control"
                                name="indoor_outdoor"
                                value={formData.indoor_outdoor}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select...</option>
                                <option value="Indoor">Indoor</option>
                                <option value="Outdoor">Outdoor</option>
                                <option value="Both">Both</option>
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
                                required
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
                        <div className="mb-3">
                            <label className="form-label">Special Requests</label>
                            <ReactQuill
                                theme="snow"
                                value={formData.special_requests || ''}
                                onChange={(content) => setFormData(prev => ({
                                    ...prev,
                                    additional_info: content
                                }))}
                            />
                        </div>
                    </>
                )}

                {type === 'catering' && (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Catering Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="catering_title"
                                value={formData.catering_title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Catering Description</label>
                            <textarea
                                className="form-control"
                                name="catering_description"
                                value={formData.catering_description}
                                onChange={handleInputChange}
                                rows="5"
                                required
                            />
                        </div>
                    </>
                )}

                {type === 'beauty' && (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Service Type</label>
                            <select
                                className="form-control"
                                name="service_type"
                                value={formData.service_type}
                                onChange={handleInputChange}
                                required
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
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Date Flexibility</label>
                            <select
                                className="form-control"
                                name="date_flexibility"
                                value={formData.date_flexibility}
                                onChange={handleInputChange}
                                required
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
                                    required
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
                                        required
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
                                        required
                                    />
                                </div>
                            </>
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
                                    <label className="form-label">Extensions Needed</label>
                                    <select
                                        className="form-control"
                                        name="extensions_needed"
                                        value={formData.extensions_needed}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Trial Session for Hair</label>
                                    <select
                                        className="form-control"
                                        name="trial_session_hair"
                                        value={formData.trial_session_hair}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
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
                                    <label className="form-label">Lashes Included</label>
                                    <select
                                        className="form-control"
                                        name="lashes_included"
                                        value={formData.lashes_included}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Trial Session for Makeup</label>
                                    <select
                                        className="form-control"
                                        name="trial_session_makeup"
                                        value={formData.trial_session_makeup}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
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

                {/* Common Fields */}
                <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Budget</label>
                    <select
                        name="price_range"
                        value={formData.price_range || formData.budget_range || ''}
                        onChange={handleInputChange}
                        className="form-control"
                        required
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
                </div>
                <div className="mb-3">
                    <label className="form-label">Additional Comments</label>
                    <ReactQuill
                        theme="snow"
                        value={formData.additional_comments || ''}
                        onChange={(content) => setFormData(prev => ({
                            ...prev,
                            additional_comments: content
                        }))}
                    />
                </div>

                <div className="d-flex gap-2 mt-4">
                    <button type="submit" className="btn-primary" style={{width: '100%'}}>Save Changes</button>
                    <button type="button" className="btn-secondary" style={{width: '100%'}} onClick={() => navigate('/my-requests')}>Cancel</button>
                </div>
            </form>
        </div>
    );
}

export default EditRequest;