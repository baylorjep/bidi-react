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

    return (
        <div className="container">
            <h2 className="PageHeader">What are you doing?</h2>
            <div className="list-group">
                {eventOptions.map((event, index) => (
                    <button
                        key={index}
                        className={`list-group-item list-group-item-action ${selectedEvent === event ? 'selected-event' : ''}`}
                        onClick={() => handleSelect(event)}
                    >
                        {event}
                    </button>
                ))}
            </div>
            <button className="btn btn-secondary mt-4" onClick={handleNext} disabled={!selectedEvent}>
                Next
            </button>
        </div>
    );
}

export default SelectEvent;
