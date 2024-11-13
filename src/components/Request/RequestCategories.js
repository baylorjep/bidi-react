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
        <div style={{display:'flex', flexDirection:'row', gap:'64px', justifyContent:'center', alignItems:'center',height:'85vh'}}>
                    <div className='request-form-status-container'>
            <div className='status-bar-container'>
            <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                01
                </div>
                <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>
                
                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                02
                </div>
                <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>

                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                03
                </div>
                <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>

                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                04
                </div>
                <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>

                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                05
                </div>
                
            </div>
            <div className='status-text-container'>
                <div className='status-text'>Type of Service</div>
                <div className='status-text'>Service Details</div>
                <div className='status-text'>Add Photos</div>
                <div className='status-text'>Personal Details</div>
                <div className='status-text'>Submit</div>
            </div>
        </div>
            <div className="request-form-container-details">
    
                <h1 className="request-form-header">What kind of service do you need?</h1>
                <div className="mt-4">
                    <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="form-select form-select-lg mb-3 custom-select"
                        style={{minWidth:"600px"}}
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
                        disabled={!category}
                    >
                        Continue
                    </button>
                </div>
            </div>
        
        </div>
    );
}

export default RequestCategories;