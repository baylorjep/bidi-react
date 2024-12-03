import React from 'react';
import { useNavigate } from 'react-router-dom';


function ServiceDetails({ formData, setServiceDetails, nextStep }) {
    const navigate = useNavigate();

    const handleChange = (e) => {
        setServiceDetails({ ...formData, [e.target.name]: e.target.value });
    };

    // Capitalize category name with spaces instead of hyphens
    const formattedCategory = formData.category
        ? formData.category.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
        : '';

    return (
        <div className="form-container">
            <h2>{formattedCategory} Details</h2>
            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                <div className="form-group">
                    <label>Service Title</label>
                    <input
                        type="text"
                        name="serviceTitle"
                        value={formData.serviceTitle || ""}
                        onChange={handleChange}
                        className="form-control"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={handleChange}
                        className="form-control"
                    ></textarea>
                </div>
                <div className="form-group">
                    <label>Budget</label>
                    <input
                        type="text"
                        name="budget"
                        value={formData.budget || ""}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                <div className="form-button-container">
                    <button type="button" onClick={() => navigate('/request-categories')} className="btn btn-primary mt-3">Back</button>
                    <button type="submit" className="btn btn-secondary mt-3">
                        Next
                    </button>
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

export default ServiceDetails;