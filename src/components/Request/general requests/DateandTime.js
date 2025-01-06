import React, { useState } from 'react';

function DateAndTime({ formData, setDateDetails, nextStep, prevStep }) {
    const [dateOption, setDateOption] = useState(formData.dateType || 'specific');

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        const updatedData = name === "tbdDate" 
            ? {
                ...formData,
                startDate: checked ? "TBD" : "",
                endDate: checked ? "TBD" : "",
                tbdDate: checked,
                dateType: 'TBD',
            }
            : { ...formData, [name]: value };
            
        setDateDetails(updatedData);
        // Save to localStorage
        localStorage.setItem('requestFormData', JSON.stringify(updatedData));
    };

    const handleDateOptionChange = (e) => {
        const selectedOption = e.target.value;
        setDateOption(selectedOption);
        setDateDetails({ ...formData, dateType: selectedOption });
    };

    return (
        <div className='request-form-overall-container'>
        <div className='request-form-status-container'>
            <div className='status-bar-container'>
            <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                01
                </div>
                <svg width="25px" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>
                
                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                02
                </div>
                <svg width="25px"  xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>

                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                03
                </div>
                <svg width="25px"  xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>

                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                04
                </div>
                <svg width="25px" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>

                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                05
                </div>
                
            </div>
            <div className='status-text-container'>
                <div className='status-text'>Service Details</div>
                <div className='status-text'>Personal Details</div>
                <div className='status-text'>Add Photos</div>
                <div className='status-text'>Review</div>
                <div className='status-text'>Submit</div>
            </div>
        </div>
        <div className="request-form-container-details" style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            <div className="request-form-header" style={{marginTop:'40px'}}>Date and Time Details</div>
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
                    <label className='custom-label'>Date Type</label>
                </div>

                {dateOption === 'specific' && !formData.tbdDate && (
                    <div className="custom-input-container">
                        
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate || ""}
                            onChange={handleChange}
                            className="custom-input"
                        />
                        <label className='custom-label'>Specific Date</label>
                    </div>
                )}

                {dateOption === 'range' && !formData.tbdDate && (
                    <>
                        <div className="custom-input-container">
                            
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate || ""}
                                onChange={handleChange}
                                className="custom-input"
                            />
                            <label className='custom-label'>Start Date</label>
                        </div>
                        <div className="custom-input-container">
                            
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate || ""}
                                onChange={handleChange}
                                className="custom-input"
                            />
                            <label className='custom-label'>End Date</label>
                        </div>
                    </>
                )}

                <div className="custom-input-container">
                    
                    <input
                        type="time"
                        name="timeOfDay"
                        value={formData.timeOfDay || ""}
                        onChange={handleChange}
                        className="custom-input"
                        disabled={formData.tbdDate}
                    />
                    <label className='custom-label'>Time of Day</label>
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

            <div className="form-button-container">
                <button 
                    type="button" 
                    onClick={prevStep}
                    className="request-form-back-and-foward-btn"
                    style={{color:"black"}}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                    </svg>
                    Back
                </button>
                <button
                    className="request-form-back-and-foward-btn"
                    onClick={nextStep}
                    style={{color:'black'}}
                >
                    Next
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="black"
                        
                    >
                        <path d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z" />
                    </svg>
                </button>
            </div>

        </div>
    </div>

    );
}

export default DateAndTime;