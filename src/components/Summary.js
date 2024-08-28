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
            <h2>Summary</h2>
            <p><strong>Event Type:</strong> {eventType}</p>
            <p>Location: {eventDetails.location}</p>
            <p>{eventDetails.dateType === 'range' && 'Start'} Date: {eventDetails.startDate}</p>
            {eventDetails.dateType === 'range' && <p>End Date: {eventDetails.endDate}</p>}
            <p>Time of Day: {eventDetails.timeOfDay}</p>
            <p>Number of People: {eventDetails.numberOfPeople}</p>
            <p>Duration (in hours): {eventDetails.duration}</p>
            <p>Indoor/Outdoor: {eventDetails.indoorOutdoor}</p>
            <p>Additional Comments: {eventDetails.additionalComments}</p>
            {/* Display other details */}
            <button className="btn btn-secondary mt-4" onClick={() => navigate('/event-details')}>Edit</button>
            <button className="btn btn-primary mt-4" onClick={handleSubmit}>Submit</button>
        </div>
    );
}

export default Summary;
