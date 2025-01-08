import React from 'react';

function LocationDetails({ formData, setLocationDetails, nextStep, prevStep, currentStep }) {
    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        const updatedData =
            name === 'tbdLocation'
                ? {
                      ...formData,
                      location: checked ? 'TBD' : '',
                      tbdLocation: checked,
                  }
                : { ...formData, [name]: value };

        setLocationDetails(updatedData);
        // Save to localStorage
        localStorage.setItem('requestFormData', JSON.stringify(updatedData));
    };

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
            <div
                className="request-form-container-details"
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
                <div className="request-form-header" style={{ marginTop: '40px' }}>
                    Location Details
                </div>
                <div className="form-container">
                    <form>
                        <div className="custom-input-container">
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="custom-input"
                                disabled={formData.tbdLocation}
                                required={!formData.tbdLocation}
                            />
                            <label className="custom-label">Location</label>
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="tbdLocation"
                                    checked={formData.tbdLocation || false}
                                    onChange={handleChange}
                                />
                                Location Not Yet Determined (TBD)
                            </label>
                        </div>
                    </form>
                </div>

                <div className="form-button-container">
                    <button
                        type="button"
                        onClick={prevStep}
                        className="request-form-back-and-foward-btn"
                        style={{ color: 'black' }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z"
                                fill="black"
                            />
                        </svg>
                        Back
                    </button>
                    <button
                        className="request-form-back-and-foward-btn"
                        onClick={nextStep}
                        style={{
                            color: 'black',
                        }}
                    >
                        Next
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                        >
                            <path d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LocationDetails;