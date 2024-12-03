import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SelectEvent({ setEventType }) {
    const [selectedEvent, setSelectedEvent] = useState('');
    const navigate = useNavigate();

    const eventOptions = [
        'Family Photos Session',
        'Wedding Photos',
        'Engagement Photos',
        'Couples Session',
        'Individual/Headshots',
        'Large Group/Event Photos',
        'Product Photos',
        'Maternity Photos',
        'Newborn Photos',
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
        <div className="container">
            <h2 className="Sign-Up-Page-Header" style={{marginTop:"80px"}}>What are you doing?</h2>
            <div className="list-group" style={{margin:'16px 56px'}}>
                {eventOptions.map((event, index) => (
                    <button
                        key={index}
                        className={`list-group-item list-group-item-action ${selectedEvent === event ? 'selected-event' : ''}`}
                        onClick={() => handleSelect(event)}
                    >
                        {event}
                    </button>
                ))}
                <div className='form-button-container'>
                <button className="btn btn-primary mt-4" onClick={handleBack}>
                    Back
                </button>
                <button className="btn btn-secondary mt-4" onClick={handleNext} disabled={!selectedEvent}>
                    Next
                </button>
            </div>
            </div>
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
                    >   
                    <i className="fas fa-phone-alt me-2" style={{rotate:'90deg'}}></i>
                        Schedule a Free Consultation Call
                    </button>

            </div>
            
        </div>
    );
}

export default SelectEvent;
