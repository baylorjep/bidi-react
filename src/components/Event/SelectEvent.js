import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SelectEvent({ setEventType, currentStep }) {
    const [selectedEvent, setSelectedEvent] = useState('');
    const navigate = useNavigate();

    const eventOptions = [
        'Wedding',
        'Engagement',
        'Couples Session',
        'Family',
        'Videographer',
        'Individual / Headshots',
        'Large Group / Event',
        'Product',
        'Maternity',
        'Newborn',
        'Boudoir Session',
    ];

    const handleSelect = (event) => {
        setSelectedEvent(event);
        setEventType(event);
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        localStorage.setItem('photographyRequest', JSON.stringify({
            ...savedForm,
            eventType: event
        }));
    };

    const handleNext = () => {
        if (!selectedEvent) {
            alert('Please select an event type to continue');
            return;
        }
        navigate('/event-details');
    };

    const handleBack = () => {
        navigate('/request-categories'); // Adjust the route for going back
    };

    return (
        <div className='request-form-overall-container'>
            <div className='request-form-status-container'>
                <div className='status-bar-container'>
                    {Array.from({ length: 5 }, (_, index) => (
                        <React.Fragment key={index}>
                            <div
                                className={`status-check-container ${
                                    index + 1 === currentStep
                                        ? 'active'
                                        : index + 1 < currentStep
                                        ? 'completed'
                                        : ''
                                }`}
                            >
                                {`0${index + 1}`}
                            </div>
                            {index < 4 && (
                                <div
                                    className={`status-line ${
                                        index + 1 < currentStep ? 'completed' : ''
                                    }`}
                                ></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className='status-text-container'>
                    {['Service Details', 'Personal Details', 'Add Photos', 'Review', 'Submit'].map(
                        (text, index) => (
                            <div
                                className={`status-text ${
                                    index + 1 === currentStep ? 'active' : ''
                                }`}
                                key={index}
                            >
                                {text}
                            </div>
                        )
                    )}
                </div>
            </div>
            <div className="request-form-container-details" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="request-form-header" style={{ marginTop: '40px' }}>What would you like to get done today? </div>
                <div className="Sign-Up-Page-Subheader">Please select one</div>
                {/* Grid Container for Event Buttons */}
                <div className="event-grid-container">
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
                    <button className="request-form-back-and-foward-btn" onClick={handleBack} style={{ color: "black" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black" />
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
                            fill={selectedEvent ? "black" : "gray"} // Set to gray if no event is selected
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