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
                            <input
                                type="text"
                                name="budget"
                                value={formData.budget || ''}
                                onChange={handleChange}
                                className="custom-input"
                            />
                            <label className="custom-label">Budget</label>
                        </div>
                    </form>
                </div>

                <div className="form-button-container">
                    <button
                        type="button"
                        onClick={() => navigate('/request-categories')}
                        className="request-form-back-and-foward-btn"
                        style={{ color: 'black' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z"
                                fill="black"
                            />
                        </svg>
                        Back
                    </button>
                    <button
                        className="request-form-back-and-foward-btn"
                        onClick={() => isFormValid && nextStep()}
                        disabled={!isFormValid}
                        style={{
                            color: isFormValid ? 'black' : '#999',
                            cursor: isFormValid ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Next
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill={isFormValid ? 'black' : '#999'}
                        >
                            <path
                                d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ServiceDetails;