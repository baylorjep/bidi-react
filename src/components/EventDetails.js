import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function EventDetails({ eventType, setEventDetails }) {
    const [details, setDetails] = useState({
        location: '',
        dateType: 'specific',
        startDate: '',
        endDate: '',
        timeOfDay: '',
        numPeople: '',
        duration: '',
        indoorOutdoor: '',
        additionalComments: '',
        extras: {}
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setEventDetails(details);
        navigate('/summary');  // Navigate to the summary stage
    };

    return (
        <div className="container">
            <h2>{eventType} Details</h2>
            <form onSubmit={handleSubmit}>
                {/* Form fields here... */}
                <div className="form-group">
                    <label>Location</label>
                    <input
                        type="text"
                        name="location"
                        value={details.location}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                {/* Include other fields for date, time, etc. */}
                <button className="btn btn-primary mt-4" type="submit">Next</button>
            </form>
        </div>
    );
}

export default EventDetails;
