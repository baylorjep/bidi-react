import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

function ServiceDetails({ formData, setServiceDetails, nextStep, currentStep }) {
    const navigate = useNavigate();
    const [isFormValid, setIsFormValid] = useState(false);
    const [requestType, setRequestType] = useState('');

    useEffect(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        const type = savedForm.requestType || '';
        setRequestType(type.charAt(0).toUpperCase() + type.slice(1));
    }, []);

    const handleChange = (e) => {
        const updatedData = { ...formData, [e.target.name]: e.target.value };
        setServiceDetails(updatedData);
        localStorage.setItem('requestFormData', JSON.stringify(updatedData));
    };

    useEffect(() => {
        const isValid = formData.serviceTitle && formData.description && formData.budget;
        setIsFormValid(isValid);
    }, [formData]);

    return (
        <div className="request-form-overall-container">
            <div className="request-form-status-container">
                <div className="status-bar-container">
                    {Array.from({ length: 5 }, (_, index) => (
                        <React.Fragment key={index}>
                            <div
                                className={`status-check-container ${
                                    index + 1 === currentStep
                                        ? 'active'
                                        : index + 1 < currentStep
                                        ? 'completed'
                                        : ''
                                }`}
                            >
                                {`0${index + 1}`}
                            </div>
                            {index < 4 && (
                                <div
                                    className={`status-line ${
                                        index + 1 < currentStep ? 'completed' : ''
                                    }`}
                                ></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="status-text-container">
                    {['Service Details', 'Personal Details', 'Add Photos', 'Review', 'Submit'].map(
                        (text, index) => (
                            <div
                                className={`status-text ${
                                    index + 1 === currentStep ? 'active' : ''
                                }`}
                                key={index}
                            >
                                {text}
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="request-form-container-details" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="request-form-header" style={{ marginTop: '40px' }}>
                    {requestType} Details
                </div>
                <div className="form-container">
                    <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                        <div className="custom-input-container">
                            <input
                                className="custom-input"
                                id="serviceTitle"
                                name="serviceTitle"
                                type="text"
                                placeholder="Title of Service"
                                value={formData.serviceTitle}
                                onChange={handleChange}
                                required
                            />
                            <label className="custom-label">Service Title</label>
                        </div>
                        <div className="custom-input-container">
                            <textarea
                                name="description"
                                type="text"
                                value={formData.description || ''}
                                onChange={handleChange}
                                className="custom-input"
                            ></textarea>
                            <label className="custom-label">Description</label>
                        </div>
                        <div className="custom-input-container">
                            <select
                                name="budget"
                                value={formData.budget || ''}
                                onChange={handleChange}
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
                            <label htmlFor="price_range" className="custom-label">
                                Budget
                            </label>
                        </div>
                    </form>
                </div>

                <div className="form-button-container">
                    <button
                        type="button"
                        onClick={() => navigate('/request-categories')}
                        className="request-form-back-and-foward-btn"
                    >

                        Back
                    </button>
                    <button
                        className="request-form-back-and-foward-btn"
                        onClick={() => isFormValid && nextStep()}
                        disabled={!isFormValid}
                        style={{
                            color: isFormValid ? 'white' : '#999',
                            cursor: isFormValid ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Next

                    </button>
                </div>
            </div>
        </div>
    );
}

export default ServiceDetails;