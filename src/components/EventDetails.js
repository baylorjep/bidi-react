import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function EventDetails({ eventType, setEventDetails }) {
    const [details, setDetails] = useState({
        eventTitle: '',
        location: '',
        dateType: 'specific',
        startDate: '',
        endDate: null,
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
        console.log(details);
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
                {/* Event Title */}
                <div className="form-group">
                    <label>Event Title</label>
                    <input
                        type="text"
                        name="eventTitle"
                        value={details.eventTitle}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                {/* Location */}
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

                {/* Date Type (Specific Date or Date Range) */}
                <div className="form-group">
                    <label>Date Type</label>
                    <select
                        name="dateType"
                        value={details.dateType}
                        onChange={handleChange}
                        className="form-control"
                    >
                        <option value="specific">Specific Date</option>
                        <option value="range">Date Range</option>
                    </select>
                </div>

                {/* Start Date */}
                <div className="form-group">
                    <label>{details.dateType === 'range' && 'Start'} Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={details.startDate}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                {/* End Date (only show if dateType is range) */}
                {details.dateType === 'range' && (
                    <div className="form-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={details.endDate}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                )}

                {/* Time of Day */}
                <div className="form-group">
                    <label>Time of Day</label>
                    <input
                        type="time"
                        name="timeOfDay"
                        value={details.timeOfDay}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                {/* Number of People */}
                <div className="form-group">
                    <label>Number of People</label>
                    <input
                        type="number"
                        name="numPeople"
                        value={details.numPeople}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                {/* Duration */}
                <div className="form-group">
                    <label>Duration (in hours)</label>
                    <input
                        type="number"
                        name="duration"
                        value={details.duration}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                {/* Indoor or Outdoor */}
                <div className="form-group">
                    <label>Indoor/Outdoor</label>
                    <select
                        name="indoorOutdoor"
                        value={details.indoorOutdoor}
                        onChange={handleChange}
                        className="form-control"
                    >
                        <option value="">Select</option>
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                    </select>
                </div>

                {/* Additional Comments */}
                <div className="form-group">
                    <label>Additional Comments</label>
                    <textarea
                        name="additionalComments"
                        value={details.additionalComments}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                <button className="btn btn-primary mt-4" type="submit">Next</button>
            </form>
        </div>
    );
}

export default EventDetails;
