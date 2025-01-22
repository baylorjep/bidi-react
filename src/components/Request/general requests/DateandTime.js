import React, { useState } from 'react';

function DateAndTime({ formData, setDateDetails, nextStep, prevStep, currentStep }) {
    const [dateOption, setDateOption] = useState(formData.dateType || 'specific');

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        const updatedData =
            name === 'tbdDate'
                ? {
                      ...formData,
                      startDate: checked ? 'TBD' : '',
                      endDate: checked ? 'TBD' : '',
                      tbdDate: checked,
                      dateType: 'TBD',
                  }
                : { ...formData, [name]: value };

        setDateDetails(updatedData);
        localStorage.setItem('requestFormData', JSON.stringify(updatedData));
    };

    const handleDateOptionChange = (e) => {
        const selectedOption = e.target.value;
        setDateOption(selectedOption);
        setDateDetails({ ...formData, dateType: selectedOption });
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
                    Date and Time Details
                </div>
                <div className="form-container">
                    <form>
                        <div className="custom-input-container">
                            <select
                                value={dateOption}
                                onChange={handleDateOptionChange}
                                className="custom-input"
                                disabled={formData.tbdDate}
                            >
                                <option value="specific">Specific Date</option>
                                <option value="range">Date Range</option>
                            </select>
                            <label className="custom-label">Date Type</label>
                        </div>

                        {dateOption === 'specific' && !formData.tbdDate && (
                            <div className="custom-input-container">
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate || ''}
                                    onChange={handleChange}
                                    className="custom-input"
                                />
                                <label className="custom-label">Specific Date</label>
                            </div>
                        )}

                        {dateOption === 'range' && !formData.tbdDate && (
                            <>
                                <div className="custom-input-container">
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate || ''}
                                        onChange={handleChange}
                                        className="custom-input"
                                    />
                                    <label className="custom-label">Start Date</label>
                                </div>
                                <div className="custom-input-container">
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate || ''}
                                        onChange={handleChange}
                                        className="custom-input"
                                    />
                                    <label className="custom-label">End Date</label>
                                </div>
                            </>
                        )}

                        <div className="custom-input-container">
                            <input
                                type="time"
                                name="timeOfDay"
                                value={formData.timeOfDay || ''}
                                onChange={handleChange}
                                className="custom-input"
                                disabled={formData.tbdDate}
                            />
                            <label className="custom-label">Time of Day</label>
                        </div>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="tbdDate"
                                    checked={formData.tbdDate || false}
                                    onChange={handleChange}
                                />
                                Date Not Yet Determined (TBD)
                            </label>
                        </div>
                    </form>
                </div>

                <div className="form-button-container">
                    <button
                        type="button"
                        onClick={prevStep}
                        className="request-form-back-and-foward-btn"

                    >

                        Back
                    </button>
                    <button
                        className="request-form-back-and-foward-btn"
                        onClick={nextStep}
                    >
                        Next

                    </button>
                </div>
            </div>
        </div>
    );
}

export default DateAndTime;