import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import { useNavigate } from 'react-router-dom';

function RequestForm() {
    const [formData, setFormData] = useState({
        serviceTitle: '',
        location: '',
        serviceCategory: '',
        serviceDescription: '',
        serviceDate: '',
        priceRange: '',
        additionalComments: '',
    });
    const [user, setUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setUser(data.session.user);
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    customerEmail: data.session.user.email,
                }));
            }
        };

        fetchUser();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { error } = await supabase
            .from('requests')
            .insert([
                {
                    user_id: user ? user.id : null,
                    customer_email: formData.customerEmail, // Use the logged-in user's email
                    service_title: formData.serviceTitle,
                    location: formData.location,
                    service_category: formData.serviceCategory,
                    service_description: formData.serviceDescription,
                    service_date: formData.serviceDate,
                    price_range: formData.priceRange,
                    additional_comments: formData.additionalComments,
                },
            ]);

        if (error) {
            setErrorMessage(`Error submitting request: ${error.message}`);
        } else {
            navigate('/success-request'); // Redirect to submission success page
        }
    };

    return (
        <div className='mobile-container'>
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div>
                <div className="mb-5 mb-lg-0 text-center">
                    <h1 className="PageHeader">What do you want done today?</h1>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="serviceTitle"
                            name="serviceTitle"
                            type="text"
                            placeholder="Title of Service"
                            value={formData.serviceTitle}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="serviceTitle">Title of Service</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="location"
                            name="location"
                            type="text"
                            placeholder="Address"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="location">Address</label>
                    </div>
                    <div className="form-floating mb-3">
                        <select
                            className="form-control"
                            id="serviceCategory"
                            name="serviceCategory"
                            value={formData.serviceCategory}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a category...</option>
                            <option value="cleaning">Home Cleaning</option>
                            <option value="photography">Photo Shoot</option>
                            <option value="landscaping">Landscaping</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="electrical">Electrical</option>
                            <option value="moving">Moving</option>
                            <option value="other">Other</option>
                        </select>
                        <label htmlFor="serviceCategory">Service Category</label>
                    </div>
                    <div className="form-floating mb-3">
                        <textarea
                            className="form-control"
                            id="serviceDescription"
                            name="serviceDescription"
                            placeholder="Description of Service"
                            value={formData.serviceDescription}
                            onChange={handleChange}
                            required
                            style={{ height: '10rem' }}
                        ></textarea>
                        <label htmlFor="serviceDescription">Description of Service</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="serviceDate"
                            name="serviceDate"
                            type="date"
                            value={formData.serviceDate}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="serviceDate">Date of Service</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="priceRange"
                            name="priceRange"
                            type="text"
                            placeholder="Expected Price Range"
                            value={formData.priceRange}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="priceRange">Expected Price Range</label>
                    </div>
                    <div className="form-floating mb-3">
                        <textarea
                            className="form-control"
                            id="additionalComments"
                            name="additionalComments"
                            placeholder="Additional Comments"
                            value={formData.additionalComments}
                            onChange={handleChange}
                            style={{ height: '5rem' }}
                        ></textarea>
                        <label htmlFor="additionalComments">Additional Comments</label>
                    </div>
                    <div className="d-grid">
                        <button type="submit" className="btn btn-secondary" style={{ marginBottom: '20px' }}>Submit Request</button>
                    </div>
                </form>
            </div>
        </div>
        </div>
    );
}

export default RequestForm;
