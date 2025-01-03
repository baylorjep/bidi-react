import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RequestCategories() {
    const navigate = useNavigate();
    const [category, setCategory] = useState('');

    const handleSelection = () => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        
        if (category === 'photography') {
            localStorage.setItem('photographyRequest', JSON.stringify({
                ...savedForm,
                serviceType: category
            }));
            navigate('/select-event');
        } else {
            localStorage.setItem('photographyRequest', JSON.stringify({
                ...savedForm,
                requestType: category
            }));
            navigate('/request-form', { state: { category } });
        }
    };

    const handleBack = () => {
        navigate('/createaccount');  // Adjust the route for going back
    };

    return (
        <div style={{display:'flex', flexDirection:'row', gap:'64px', justifyContent:'center', alignItems:'center',height:'85vh'}}>

            <div className="request-form-container-details">
                <div className="request-form-header" style={{marginTop:'120px'}}>What would you like to get done today?</div>
                <div style={{marginTop:'40px'}}>
                    <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="form-select form-select-lg "
                        style={{minWidth:"360px"}}
                    >
                        <option value="" disabled hidden>Select a service</option>
                        <option value="photography">Photography/Videography</option>
                        <option value="dj-services">DJ Services</option>
                        <option value="hair-and-makeup-artist">Hair and Makeup Artist</option>
                        <option value="florist">Florist</option>
                        <option value="catering">Catering</option>
                        <option value="event/wedding-planner">Event/Wedding Planner</option>    
                        <option value="other">Other</option>
                    </select>
                    
                </div>
                <div className="form-button-container">
                    <button className="request-form-back-and-foward-btn" onClick={handleBack} style={{ color: "black" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black" />
                        </svg>
                        Back
                    </button>
                    <button
                        className={`request-form-back-and-foward-btn ${category ? 'selected-border' : ''}`}
                        onClick={handleSelection}
                        disabled={!category}
                        style={{
                            color: !category ? "#808080" : "black", // Gray text when disabled, white when enabled
                            cursor: !category ? "not-allowed" : "pointer", // Not-allowed cursor when disabled
                        }}
                    >
                        Next
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z"
                                fill={!category ? "#808080" : "black"} // Gray arrow when disabled, white arrow when enabled

                            />
                        </svg>
                    </button>

                </div>
            </div>
        
        </div>
    );
}

export default RequestCategories;