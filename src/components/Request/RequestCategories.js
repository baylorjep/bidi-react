import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RequestCategories() {
    const navigate = useNavigate();
    const [category, setCategory] = useState('');

    const categories = [
        'Photography',
        'Videography',
        'DJ Services',
        'Hair and Makeup Artist',
        'Florist',
        'Catering',
        'Event Planner',
        'Wedding Planner',
        'Other'
    ];

    const handleSelection = () => {
        // Store both the service type and specific category
        const isMediaService = category === 'photography' || category === 'videography';
        const serviceType = isMediaService ? 'photography' : 'general';
        
        // Store in localStorage
        localStorage.setItem('serviceType', serviceType);
        localStorage.setItem('specificService', category);
        
        // Store in request form data
        const requestFormData = JSON.parse(localStorage.getItem('requestFormData') || '{}');
        localStorage.setItem('requestFormData', JSON.stringify({
            ...requestFormData,
            serviceType: serviceType,
            specificService: category
        }));
        
        if (isMediaService) {
            navigate('/select-event', { 
                state: { 
                    serviceType,
                    specificService: category 
                } 
            });
        } else {
            navigate('/request-form', { 
                state: { 
                    category,
                    serviceType,
                    specificService: category
                } 
            });
        }
    };


    const handleBack = () => {
        navigate('/createaccount');  // Adjust the route for going back
    };

    return (
        <div style={{display:'flex', flexDirection:'row', gap:'64px', justifyContent:'center', alignItems:'center',height:'85vh'}}>

            <div className="request-form-container-details">
                <div className="request-form-header" style={{marginTop:'20px'}}>What would you like to get done today?</div>
                <div className="Sign-Up-Page-Subheader" style={{marginTop:'20px', marginBottom:'20px'}}>Please select one</div>
                
                {/* Grid Container for Category Buttons */}
                <div className="event-grid-container">
                    {categories.map((cat, index) => (
                        <button
                            key={index}
                            className={`selector-buttons ${category === cat.toLowerCase() ? 'selected-event' : ''}`}
                            onClick={() => setCategory(cat.toLowerCase())}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="form-button-container">
                    <button className="request-form-back-and-foward-btn" onClick={handleBack}>
                        Back
                    </button>
                    <button
                        className={`request-form-back-and-foward-btn ${category ? 'selected-border' : ''}`}
                        onClick={handleSelection}
                        disabled={!category}
                        style={{
                            color: !category ? "#808080" : "white", // Gray text when disabled, white when enabled
                            cursor: !category ? "not-allowed" : "pointer", // Not-allowed cursor when disabled
                        }}
                    >
                        Next
                    </button>

                </div>
            </div>
        
        </div>
    );
}

export default RequestCategories;