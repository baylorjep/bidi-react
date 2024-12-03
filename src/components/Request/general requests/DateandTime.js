import React, { useState } from 'react';

function DateAndTime({ formData, setDateDetails, nextStep, prevStep }) {
    const [dateOption, setDateOption] = useState(formData.dateType || 'specific');

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        if (name === "tbdDate") {
            setDateDetails({
                ...formData,
                startDate: checked ? "TBD" : "",
                endDate: checked ? "TBD" : "",
                tbdDate: checked,
                dateType: 'TBD',
            });
        } else {
            setDateDetails({ ...formData, [name]: value });
        }
    };

    const handleDateOptionChange = (e) => {
        const selectedOption = e.target.value;
        setDateOption(selectedOption);
        setDateDetails({ ...formData, dateType: selectedOption });
    };

    return (
        <div className="form-container">
            <h2>Date and Time Details</h2>
            <form>
                
                <div className="form-group">
                    <label>Date Type</label>
                    <select
                        value={dateOption}
                        onChange={handleDateOptionChange}
                        className="form-control"
                        disabled={formData.tbdDate}
                    >
                        <option value="specific">Specific Date</option>
                        <option value="range">Date Range</option>
                    </select>
                </div>

                {dateOption === 'specific' && !formData.tbdDate && (
                    <div className="form-group">
                        <label>Specific Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate || ""}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                )}

                {dateOption === 'range' && !formData.tbdDate && (
                    <>
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate || ""}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate || ""}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>
                    </>
                )}

                <div className="form-group">
                    <label>Time of Day</label>
                    <input
                        type="time"
                        name="timeOfDay"
                        value={formData.timeOfDay || ""}
                        onChange={handleChange}
                        className="form-control"
                        disabled={formData.tbdDate}
                    />
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

                <div className="form-button-container">
                    <button type="button" onClick={prevStep} className="btn btn-primary mt-3">Back</button>
                    <button type="button" onClick={nextStep} className="btn btn-secondary mt-3">Next</button>
                </div>
            </form>
            <div style={{display:'flex',justifyContent:'center',flexDirection:'column', alignItems:'center'}   }>
            <h1 className="Sign-Up-Page-Header" style={{ marginTop: '40px' }}>
                        Need Help Figuring Out What You Need?
                    </h1>
                    <button 
                        className="btn btn-secondary btn-lg"
                        style={{marginBottom:'20px', maxWidth:'400px'}}
                        onClick={() => {
                            const isWindows = navigator.userAgent.includes('Windows');
                            if (isWindows) {
                                window.open('https://calendly.com/weston-burnett19/meetingwithweston', '_blank');
                            } else {
                                window.location.href = 'tel:+13852169587';
                            }
                        }}
                    >   <i className="fas fa-phone-alt me-2" style={{rotate:'90deg'}}></i>
                        Schedule a Free Consultation Call
                    </button>

            </div>
        </div>
    );
}

export default DateAndTime;