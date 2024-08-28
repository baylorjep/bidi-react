import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../src/supabaseClient';

function Summary({ eventType, eventDetails }) {
    const navigate = useNavigate();

    const handleSubmit = async () => {
        // Insert the request into the photography_requests table
        const { error } = await supabase
            .from('photography_requests')
            .insert([
                {
                    event_title: eventDetails.eventTitle,
                    event_type: eventType,
                    date_type: eventDetails.dateType,
                    start_date: eventDetails.startDate,
                    end_date: eventDetails.endDate,
                    time_of_day: eventDetails.timeOfDay,
                    location: eventDetails.location,
                    num_people: eventDetails.numPeople,
                    duration: eventDetails.duration,
                    indoor_outdoor: eventDetails.indoorOutdoor,
                    additional_comments: eventDetails.additionalComments,
                    extras: eventDetails.extras
                },
            ]);

        if (error) {
            console.error('Error submitting request:', error.message);
        } else {
            navigate('/success-request');
        }
    };

    return (
        <div className="container">
            <h2>{eventDetails.eventTitle} Summary</h2>
            <p><strong>Event Type:</strong> {eventType}</p>
            <p><strong>Location:</strong> {eventDetails.location}</p>
            <p><strong>{eventDetails.dateType === 'range' && 'Start'} Date:</strong> {eventDetails.startDate}</p>
            {eventDetails.dateType === 'range' && <p><strong>End Date:</strong> {eventDetails.endDate}</p>}
            <p><strong>Time of Day:</strong> {eventDetails.timeOfDay}</p>
            <p><strong>Number of People:</strong> {eventDetails.numberOfPeople}</p>
            <p><strong>Duration (in hours):</strong> {eventDetails.duration}</p>
            <p><strong>Indoor/Outdoor:</strong> {eventDetails.indoorOutdoor}</p>
            <p><strong>Additional Comments:</strong> {eventDetails.additionalComments}</p>
            {/* Display other details */}
            <button className="btn btn-secondary mt-4" onClick={() => navigate('/event-details')}>Edit</button>
            <button className="btn btn-primary mt-4" onClick={handleSubmit}>Submit</button>
        </div>
    );
}

export default Summary;
