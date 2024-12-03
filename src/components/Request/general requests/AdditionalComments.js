import React from 'react';

function AdditionalComments({ formData, setAdditionalComments, nextStep, prevStep }) {
    const handleChange = (e) => {
        setAdditionalComments({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="form-container">
            <h2>Additional Comments</h2>
            <form>
                <div className="form-group">
                    <label>Comments (optional)</label>
                    <textarea
                        name="additionalComments"
                        value={formData.additionalComments || ""}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Enter any additional information or special requests here."
                    ></textarea>
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

export default AdditionalComments;