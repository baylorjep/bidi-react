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
                    <button className="request-form-back-and-foward-btn" onClick={handleBack}>
                        Back
                    </button>
                    <button
                        className={`request-form-back-and-foward-btn ${selectedEvent ? 'selected-border' : ''}`}
                        onClick={handleNext}
                        disabled={!selectedEvent}
                        style={{
                            color: !selectedEvent ? "#808080" : "white", // Gray text when disabled, white when enabled
                            cursor: !selectedEvent ? "not-allowed" : "pointer", // Not-allowed cursor when disabled
                        }}
                    >
                        Next

                    </button>
                </div>
            </div>
        </div>
    );
}

export default SelectEvent;