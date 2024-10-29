import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RequestCategories() {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleSelection = () => {
        if (selectedCategory === 'photography') {
            navigate(`/select-event`);
        } else {
            navigate(`/request`);
        }
    };

    

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="mobile-container">
                <div className="mb-5 mb-lg-0 text-center">
                    <h1 className="Sign-Up-Page-Header" style={{ marginTop: '160px' }}>What kind of service do you need?</h1>
                    <div className="mt-4">
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="form-select create-account-form form-select-lg mb-3 custom-select "
                        >
                            <option value="" disabled hidden>Select a service</option>
                            <option value="photography">Photography/Videography</option>
                            <option value="dj-services">DJ Services</option>
                            <option value="cakes">Cakes</option>
                            <option value="hair-and-makeup-artist">Hair and Makeup Artist</option>
                            <option value="catering">Catering</option>
                            <option value="event/wedding-planner">Event/Wedding Planner</option>
                            <option value="cleaning">Cleaning</option>
                            <option value="other">Other</option>
                        </select>
                        <button 
                            onClick={handleSelection} 
                            className="btn btn-secondary btn-lg w-100"
                            disabled={!selectedCategory}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RequestCategories;
