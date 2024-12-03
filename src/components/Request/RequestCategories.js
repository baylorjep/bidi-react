import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RequestCategories() {
    const navigate = useNavigate();
    const [category, setCategory] = useState('');

    const handleSelection = () => {
        if (category === 'photography') {
            navigate(`/select-event`);
        } else {
            navigate(`/request-form`, { state: { category } }); // Pass category in state
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="mobile-container">
                <div className="mb-5 mb-lg-0 text-center">
                    <h1 className="Sign-Up-Page-Header" style={{ marginTop: '160px' }}>What kind of service do you need?</h1>
                    <div className="mt-4">
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="form-select create-account-form form-select-lg mb-3 custom-select"
                        >
                            <option value="" disabled hidden>Select a service</option>
                            <option value="photography">Photography/Videography</option>
                            <option value="dj-services">DJ Services</option>
                            <option value="cakes">Cakes</option>
                            <option value="hair-and-makeup-artist">Hair and Makeup Artist</option>
                            <option value="catering">Catering</option>
                            <option value="event/wedding-planner">Event/Wedding Planner</option>
                            <option value="Florist">Florist</option>
                            <option value="Venue">Venue</option>
                            <option value="other">Other</option>
                        </select>
                        <button 
                            onClick={handleSelection} 
                            className="btn btn-secondary btn-lg w-100"
                            disabled={!category}
                        >
                            Continue
                        </button>
                    </div>
                    <h1 className="Sign-Up-Page-Header" style={{ marginTop: '80px' }}>
                        Need Help Figuring Out What You Need?
                    </h1>
                    <button 
                        className="btn btn-secondary btn-lg w-100"
                        onClick={() => {
                            const isWindows = navigator.userAgent.includes('Windows');
                            if (isWindows) {
                                window.open('https://calendly.com/weston-burnett19/meetingwithweston', '_blank');
                            } else {
                                window.location.href = 'tel:+13852169587';
                            }
                        }}
                    ><i className="fas fa-phone-alt me-2" style={{rotate:'90deg'}}></i>
                        Schedule a Free Consultation Call
                    </button>


                </div>
            </div>
        </div>
    );
}

export default RequestCategories;