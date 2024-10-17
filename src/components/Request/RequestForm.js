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
    const navigate = useNavigate(); // Use useNavigate hook

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
            .insert([{
                user_id: user ? user.id : null,
                customer_email: formData.customerEmail,
                service_title: formData.serviceTitle,
                location: formData.location,
                service_category: formData.serviceCategory,
                service_description: formData.serviceDescription,
                service_date: formData.serviceDate,
                price_range: formData.priceRange,
                additional_comments: formData.additionalComments,
            }]);

        if (error) {
            setErrorMessage(`Error submitting request: ${error.message}`);
        } else {
            navigate('/success-request'); // Redirect to submission success page
        }
    };

    const handleBack = () => {
        navigate('/request-categories'); // Navigate to the previous page
    };

    return (
        <div className="request-form-container  align-items-center justify-content-center">
            <div>
                <div className="mb-5 mb-lg-0 text-center">
                    <div className="Sign-Up-Page-Header">Tell us more about what you need done</div>
                    <div className='submit-form-2nd-header'>Your details guide us in making the perfect connection</div>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-floating request-form mb-3">
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
                    
                    <div className="form-floating request-form mb-3">
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
                    <div className="form-floating request-form mb-3">
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
                        <label htmlFor="location">Zip Code</label>
                    </div>
                    <div className="form-floating request-form mb-3">
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
                    <div className="form-floating request-form mb-3">
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
                        <label htmlFor="priceRange">What's Your Budget?</label>
                    </div>
                    <div className="form-floating request-form mb-3">
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
                    <div className="form-button-container-submit">
                        <button onClick={handleBack} className="btn btn-primary form-button" style={{ marginBottom: '20px' }}>
                            Back
                        </button>
                        <button type="submit" className="btn btn-secondary form-button" style={{ marginBottom: '20px' }}>
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RequestForm;
