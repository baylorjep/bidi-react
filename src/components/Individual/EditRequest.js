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
        extras: {}
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequest = async () => {
            const table = type === 'photography' ? 'photography_requests' : 'requests';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const table = type === 'photography' ? 'photography_requests' : 'requests';
        const updateData = type === 'photography' 
            ? {
                event_title: formData.event_title,
                event_type: formData.event_type,
                event_description: formData.event_description,
                location: formData.location,
                start_date: formData.start_date,
                end_date: formData.end_date,
                time_of_day: formData.time_of_day,
                num_people: formData.num_people,
                duration: formData.duration,
                indoor_outdoor: formData.indoor_outdoor,
                price_range: formData.price_range,
                additional_comments: formData.additional_comments,
                extras: formData.extras
            }
            : {
                service_title: formData.service_title,
                service_type: formData.service_type,
                service_description: formData.service_description,
                location: formData.location,
                service_date: formData.service_date,
                end_date: formData.end_date,
                time_of_day: formData.time_of_day,
                price_range: formData.price_range,
                additional_comments: formData.additional_comments
            };

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
                {type === 'photography' ? (
                    // Photography Request Fields
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
                            <label className="form-label">Event Description</label>
                            <textarea
                                className="form-control"
                                name="event_description"
                                value={formData.event_description}
                                onChange={handleInputChange}
                                rows="5"
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
                    </>
                ) : (
                    // Regular Request Fields
                    <>
                        <div className="mb-3">
                            <label className="form-label">Service Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="service_title"
                                value={formData.service_title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Service Type</label>
                            <input
                                type="text"
                                className="form-control"
                                name="service_type"
                                value={formData.service_type}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Service Description</label>
                            <textarea
                                className="form-control"
                                name="service_description"
                                value={formData.service_description}
                                onChange={handleInputChange}
                                rows="5"
                                required
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
                    <label className="form-label">Date</label>
                    <input
                        type="date"
                        className="form-control"
                        name={type === 'photography' ? 'start_date' : 'service_date'}
                        value={type === 'photography' ? formData.start_date : formData.service_date}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">End Date (Optional)</label>
                    <input
                        type="date"
                        className="form-control"
                        name="end_date"
                        value={formData.end_date || ''}
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
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Budget</label>
                    <select
                        name="price_range"
                        value={formData.price_range || ''}
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
                <button 
                        type="button" 
                        className="btn-primary"
                        onClick={() => navigate('/my-requests')}
                        style={{width: '100%'}}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="btn-secondary" >
                        Save Changes
                    </button>

                </div>
            </form>
        </div>
    );
}

export default EditRequest;
