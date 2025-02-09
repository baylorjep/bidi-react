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
        'Florist',  // Added Florist
        'Catering',
        'Wedding Planner',
        'Venue',
        'Cake',
        'Spray Tan',
        'Other'
    ];

    const handleSelection = () => {
        // Store in localStorage
        localStorage.setItem('serviceType', category);
        localStorage.setItem('specificService', category);
        
        // Store in request form data
        const requestFormData = JSON.parse(localStorage.getItem('requestFormData') || '{}');
        localStorage.setItem('requestFormData', JSON.stringify({
            ...requestFormData,
            serviceType: category,
            specificService: category
        }));
        
        // Dynamic navigation based on category
        const dedicatedFormCategories = ['photography', 'videography', 'dj services', 'hair and makeup artist', 'florist']; // Added 'florist'
        if (dedicatedFormCategories.includes(category)) {
            // Convert category names to route paths
            const routeMap = {
                'photography': 'photography',
                'videography': 'videography',
                'dj services': 'dj',
                'hair and makeup artist': 'beauty',
                'florist': 'florist'  // Added 'florist'
            };
            const routePath = routeMap[category];
            navigate(`/request/${routePath}`);
        } else {
            navigate('/request-form', { 
                state: { 
                    category,
                    serviceType: category,
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
                            backgroundColor: !category ? "#9F8AB3" : "#a328f4", // Lighter purple when disabled
                            cursor: !category ? "not-allowed" : "pointer",
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