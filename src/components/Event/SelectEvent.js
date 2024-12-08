import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SelectEvent({ setEventType }) {
    const [selectedEvent, setSelectedEvent] = useState('');
    const navigate = useNavigate();

    const eventOptions = [
        'Family',
        'Wedding',
        'Engagement',
        'Couples Session',
        'Individual / Headshots',
        'Large Group / Event',
        'Product',
        'Maternity',
        'Newborn',
        'Boudoir Session',
        'Videographer'
    ];

    const handleSelect = (event) => {
        setSelectedEvent(event);
        setEventType(event);
    };

    const handleNext = () => {
        if (selectedEvent) {
            navigate('/event-details');  // Navigate to the next stage
        }
    };

    const handleBack = () => {
        navigate('/request-categories');  // Adjust the route for going back
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
                <div className='status-text'>Service Details</div>
                <div className='status-text'>Personal Details</div>
                <div className='status-text'>Add Photos</div>
                <div className='status-text'>Review</div>
                <div className='status-text'>Submit</div>
            </div>
        </div>
        <div className="request-form-container-details" style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            <div className="request-form-header" style={{marginTop:'40px'}}>What would you like to get done today? </div>
            <div style={{margin:"Sign-Up-Page-Subheader"}}>Please select one</div>
            {/* Grid Container for Event Buttons */}
            <div className="event-grid-container" >
                {eventOptions.map((event, index) => (
                    <button
                        key={index}
                        className={`selector-buttons ${selectedEvent === event ? 'selected-event' : ''}`}
                        onClick={() => handleSelect(event)}
                    >
                        {event}
                    </button>
                ))}
            </div>

            <div className="form-button-container">
                <button className="request-form-back-and-foward-btn" onClick={handleBack} style={{color:"black"}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                    </svg>
                    Back
                </button>
                <button
                    className={`request-form-back-and-foward-btn ${selectedEvent ? 'selected-border' : ''}`}
                    onClick={handleNext}
                    disabled={!selectedEvent}
                >
                    Next
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={selectedEvent ? "black" : "gray"}  // Set to gray if no event is selected
                    >
                        <path d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z" />
                    </svg>
                </button>
            </div>

        </div>
    </div>
    );
}

export default SelectEvent;
