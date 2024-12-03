import React from 'react';

function LocationDetails({ formData, setLocationDetails, nextStep, prevStep }) {
    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        if (name === "tbdLocation") {
            setLocationDetails({
                ...formData,
                location: checked ? "TBD" : "",
                tbdLocation: checked,
            });
        } else {
            setLocationDetails({ ...formData, [name]: value });
        }
    };

    return (
        <div className="form-container">
            <h2>Location Details</h2>
            <form>
                <div className="form-group">
                    <label>Location</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="form-control"
                        disabled={formData.tbdLocation}
                        required={!formData.tbdLocation}
                    />
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

export default LocationDetails;