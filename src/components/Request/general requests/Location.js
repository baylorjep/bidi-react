import React from 'react';

function LocationDetails({ formData, setLocationDetails, nextStep, prevStep }) {
    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        const updatedData = name === "tbdLocation" 
            ? {
                ...formData,
                location: checked ? "TBD" : "",
                tbdLocation: checked,
            }
            : { ...formData, [name]: value };

        setLocationDetails(updatedData);
        // Save to localStorage
        localStorage.setItem('requestFormData', JSON.stringify(updatedData));
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
            <div className="request-form-header" style={{marginTop:'40px'}}>Location Details</div>
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
                    <label className='custom-label'>Location</label>
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
                    style={{
                        color:'black',}}
                        
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